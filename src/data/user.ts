// src/data/user.ts
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth.functions";

export const uploadProfileImage = createServerFn({ method: "POST" })
	.inputValidator((data: { fileBase64: string; fileName: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session) throw new Error("Unauthorized");

		const { supabase } = await import("@/lib/supabase");

		// Convert base64 → Buffer
		const base64Data = data.fileBase64.split(",")[1] ?? data.fileBase64;
		const buffer = Buffer.from(base64Data, "base64");

		// Fix content type: jpg → jpeg
		const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
		const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

		// Unique name
		const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
		const filePath = `avatars/${uniqueName}`;

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

		return { url: urlData.publicUrl };
	});

export const updateProfile = createServerFn({ method: "POST" })
	.inputValidator((data: { name?: string; image?: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session) throw new Error("Unauthorized");

		const { db } = await import("@/db");
		const { user } = await import("@/db/schema");

		const updateData: Record<string, unknown> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.image !== undefined) updateData.image = data.image;

		const result = await db
			.update(user)
			.set(updateData)
			.where(eq(user.id, session.user.id))
			.returning();

		const updated = result[0];
		if (!updated) throw new Error("User not found");
		return updated;
	});
