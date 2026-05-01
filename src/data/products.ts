import { eq } from "drizzle-orm";
import { products } from "#/db/schema";
import { db } from "@/db";

export async function getAllProducts() {
	try {
		const allProducts = await db.select().from(products);
		return allProducts;
	} catch (error) {
		console.error("Error getting all products: ", error);
		return [];
	}
}

export async function getRecommendedProducts() {
	try {
		const recommendedProducts = await db.select().from(products).limit(3);
		return recommendedProducts;
	} catch (error) {
		console.error("Error getting recommended products: ", error);
		return [];
	}
}

export async function getProductById(id: string) {
	try {
		const product = await db
			.select()
			.from(products)
			.where(eq(products.id, id))
			.limit(1);
		return product[0];
	} catch (error) {
		console.error("Error getting recommended products: ", error);
		return [];
	}
}
