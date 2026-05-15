import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db"; // your drizzle instance

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg", // or "mysql", "sqlite"
	}),
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "user",
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	plugins: [tanstackStartCookies()],
});
