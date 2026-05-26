import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { orderItems, orders } from "#/db/schema";
import { getSession } from "#/lib/auth.functions";

// Fetch all orders for the logged-in user (newest first)
export const getOrdersByUser = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await getSession();
		if (!session) {
			throw new Error("Unauthorized");
		}

		const { db } = await import("@/db");

		// Get all orders for this user, newest first
		const userOrders = await db
			.select()
			.from(orders)
			.where(eq(orders.userId, session.user.id))
			.orderBy(desc(orders.createdAt));

		if (userOrders.length === 0) return [];

		// For each order, fetch its items
		const ordersWithItems = await Promise.all(
			userOrders.map(async (order) => {
				const items = await db
					.select()
					.from(orderItems)
					.where(eq(orderItems.orderId, order.id));

				return {
					id: order.id,
					status: order.status,
					total: order.total,
					createdAt: order.createdAt,
					items: items.map((item) => ({
						id: item.id,
						name: item.name,
						price: item.price,
						quantity: item.quantity,
						image: item.image,
					})),
				};
			}),
		);

		return ordersWithItems;
	},
);

// Fetch a single order by ID (verifies ownership)
export const getOrderById = createServerFn({ method: "GET" })
	.inputValidator((data: { orderId: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session) {
			throw new Error("Unauthorized");
		}

		const { db } = await import("@/db");

		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, data.orderId))
			.limit(1);

		if (!order) {
			throw new Error("Order not found");
		}

		// Verify the order belongs to the logged-in user
		if (order.userId !== session.user.id) {
			throw new Error("Forbidden");
		}

		const items = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id));

		return {
			id: order.id,
			status: order.status,
			total: order.total,
			createdAt: order.createdAt,
			stripeSessionId: order.stripeSessionId,
			items: items.map((item) => ({
				id: item.id,
				name: item.name,
				price: item.price,
				quantity: item.quantity,
				image: item.image,
			})),
		};
	});
