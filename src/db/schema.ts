import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

const badgeValues = ["New", "Sale", "Featured", "Limited"] as const;
const inventoryValues = ["in-stock", "backorder", "preorder"] as const;
const roleValues = ["admin", "user"] as const;

export const roleEnum = pgEnum("role", roleValues);

export type RoleValue = (typeof roleValues)[number];

export const badgeEnum = pgEnum("badge", badgeValues);
export const inventoryEnum = pgEnum("inventory", inventoryValues);

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 256 }).notNull(),
	description: text("description").notNull(),
	price: numeric("price", { precision: 10, scale: 2 }).notNull(),
	badge: badgeEnum("badge"),
	rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
	reviews: integer("reviews").notNull().default(0),
	image: varchar("image", { length: 512 }).notNull(),
	inventory: inventoryEnum("inventory").notNull().default("in-stock"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProductSelect = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;

// Cart items table - stores items in user's cart
export const cartItems = pgTable("cart_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	quantity: integer("quantity").notNull().default(1),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CartItemSelect = typeof cartItems.$inferSelect &
	typeof products.$inferSelect;

export type CartItemInsert = typeof cartItems.$inferInsert;

// Export enum value types inferred from the enum definitions
export type BadgeValue = (typeof badgeValues)[number];
export type InventoryValue = (typeof inventoryValues)[number];

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),

	role: roleEnum("role").notNull().default("user"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
