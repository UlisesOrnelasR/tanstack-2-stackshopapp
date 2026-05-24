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

export const uploadProductImage = createServerFn({ method: "POST" })
	.inputValidator((data: { fileBase64: string; fileName: string }) => data)
	.handler(async ({ data }) => {
		// Only admins
		const session = await getSession();
		if (!session || session.user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const { supabase } = await import("@/lib/supabase");

		// Convert base64 → Buffer
		const base64Data = data.fileBase64.split(",")[1] ?? data.fileBase64;
		const buffer = Buffer.from(base64Data, "base64");

		// Fix content type: jpg → jpeg
		const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
		const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

		// Unique name
		const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
		const filePath = `products/${uniqueName}`;

		console.log("Uploading to Supabase Storage:", {
			filePath,
			mimeType,
			bufferSize: buffer.length,
		});

		// Upload to Supabase
		const { error } = await supabase.storage
			.from("product-images")
			.upload(filePath, buffer, {
				contentType: mimeType,
				upsert: false,
			});

		if (error) {
			console.error("Supabase upload error:", error);
			throw new Error(`Upload failed: ${error.message}`);
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from("product-images")
			.getPublicUrl(filePath);

		console.log("Upload success, public URL:", urlData.publicUrl);

		return { url: urlData.publicUrl };
	});
