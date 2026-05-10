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
			const cart = await db
				.select()
				.from(cartItems)
				.innerJoin(products, eq(cartItems.productId, products.id));

			console.log("---cart--- on server", cart);

			return cart.map(({ cart_items, products: product }) => ({
				id: cart_items.id,
				name: product.name,
				price: product.price,
				quantity: cart_items.quantity,
				image: product.image,
				inventory: product.inventory,
			}));
		} catch (error) {
			console.error("Error getting all products: ", error);
			return [];
		}
	},
);
