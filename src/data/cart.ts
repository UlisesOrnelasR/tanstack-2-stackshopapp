import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { cartItems, products } from "#/db/schema";

export const addToCart = createServerFn({ method: "POST" })
	.inputValidator((data: { productId: string }) => data)
	.handler(async ({ data }) => {
		const { db } = await import("@/db");
		try {
			const [existing] = await db
				.select()
				.from(cartItems)
				.where(eq(cartItems.productId, data.productId))
				.limit(1);

			if (existing) {
				await db
					.update(cartItems)
					.set({ quantity: existing.quantity + 1, updatedAt: new Date() })
					.where(eq(cartItems.id, existing.id));
			} else {
				await db.insert(cartItems).values({ productId: data.productId });
			}
		} catch (error) {
			console.error("Error adding to cart:", error);
			throw error;
		}
	});

export const fetchCartItems = createServerFn({ method: "GET" }).handler(
	async () => {
		const { db } = await import("@/db");
		try {
			// innerJoin returns rows shaped as: { cart_items: {...}, products: {...} }
			const rows = await db
				.select()
				.from(cartItems)
				.innerJoin(products, eq(cartItems.productId, products.id));

			// Flatten each joined row into a single object for the client
			return rows.map((row) => {
				const cartItem = row.cart_items;
				const product = row.products;

				return {
					id: cartItem.id,
					name: product.name,
					price: product.price,
					quantity: cartItem.quantity,
					image: product.image,
					inventory: product.inventory,
				};
			});
		} catch (error) {
			console.error("Error fetching cart items:", error);
			return [];
		}
	},
);
