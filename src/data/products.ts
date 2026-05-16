import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "#/lib/auth.functions";
import { type ProductSelect, products } from "@/db/schema";

export const getAllProducts = createServerFn({ method: "GET" }).handler(
	async () => {
		const { db } = await import("@/db");
		try {
			const allProducts = await db.select().from(products);
			return allProducts;
		} catch (error) {
			console.error("Error getting all products: ", error);
			return [];
		}
	},
);

export const getRecommendedProducts = createServerFn({ method: "GET" }).handler(
	async () => {
		const { db } = await import("@/db");
		try {
			const recommendedProducts = await db.select().from(products).limit(3);
			return recommendedProducts;
		} catch (error) {
			console.error("Error getting recommended products: ", error);
			return [];
		}
	},
);

const idSchema = z.string();

export const getProductById = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data }) => {
		const { db } = await import("@/db");
		const id = idSchema.parse(data);

		const product = await db
			.select()
			.from(products)
			.where(eq(products.id, id))
			.limit(1);

		return product[0] ?? null;
	});

export const productSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	price: z
		.string()
		.refine((val) => !isNaN(Number(val)), "Price must be a number"),
	badge: z.enum(["New", "Sale", "Featured", "Limited"]).nullable().optional(),
	image: z
		.string()
		.url("Image must be a valid URL")
		.max(512, "Image must be 512 chars or less"),
	inventory: z.enum(["in-stock", "backorder", "preorder"]),
});

export const createProduct = createServerFn({ method: "POST" })
	.inputValidator((data: z.infer<typeof productSchema>) =>
		productSchema.parse(data),
	)
	.handler(async ({ data }): Promise<ProductSelect> => {
		const session = await getSession();
		if (!session) {
			throw new Error("Unauthorized");
		}

		if (session.user.role !== "admin") {
			throw new Error("Forbidden");
		}
		const { db } = await import("@/db");
		const result = await db
			.insert(products)
			.values({ ...data, badge: data.badge ?? null })
			.returning();
		const product = result[0];
		if (!product) {
			throw new Error(
				"Failed to create product: no product returned from database",
			);
		}
		return product;
	});
