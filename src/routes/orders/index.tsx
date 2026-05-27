import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { getOrdersByUser } from "@/data/orders";

export const Route = createFileRoute("/orders/")({
	beforeLoad: async ({ context }) => {
		const session = context.session;
		if (!session) throw redirect({ to: "/sign-in" });
	},
	loader: async () => getOrdersByUser(),
	component: RouteComponent,
});

const statusStyles = {
	pending:
		"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
	paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function RouteComponent() {
	const orders = Route.useLoaderData();

	if (orders.length === 0) {
		return (
			<div className="mx-auto max-w-3xl py-16">
				<Empty>
					<EmptyHeader>
						<Package size={40} className="mx-auto text-slate-400" />
						<EmptyTitle>No orders yet</EmptyTitle>
						<EmptyDescription>
							Once you complete a purchase, your orders will appear here.
						</EmptyDescription>
					</EmptyHeader>

					<EmptyContent>
						<Link to="/products">
							<Button>Browse products</Button>
						</Link>
					</EmptyContent>
				</Empty>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-semibold">My Orders</h1>
				<p className="text-sm text-slate-600 dark:text-slate-300">
					Your purchase history.
				</p>
			</div>

			<div className="space-y-4">
				{orders.map((order) => (
					<div
						key={order.id}
						className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-950/40"
					>
						<div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
							<div className="flex items-center gap-4 text-sm">
								<span className="text-slate-500">
									{order.createdAt.toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
									})}
								</span>

								<span
									className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}
								>
									{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
								</span>
							</div>

							<span className="text-sm font-semibold">
								${Number(order.total).toFixed(2)}
							</span>
						</div>

						<div className="divide-y divide-slate-100 dark:divide-slate-800">
							{order.items.map((item) => (
								<div
									key={item.id}
									className="flex items-center gap-4 px-5 py-3"
								>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
										<img
											src={item.image}
											alt={item.name}
											className="h-8 w-8 object-contain"
											loading="lazy"
										/>
									</div>

									<div className="flex-1">
										<p className="text-sm font-semibold">{item.name}</p>
										<p className="text-xs text-slate-500">
											Qty: {item.quantity} · ${Number(item.price).toFixed(2)}{" "}
											each
										</p>
									</div>

									<span className="text-sm font-semibold">
										${(Number(item.price) * item.quantity).toFixed(2)}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
