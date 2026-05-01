import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";

export const getAllProducts = createServerFn({ method: "GET" }).handler(
	async () => {
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
		const id = idSchema.parse(data);

		const product = await db
			.select()
			.from(products)
			.where(eq(products.id, id))
			.limit(1);

		return product[0] ?? null;
	});
