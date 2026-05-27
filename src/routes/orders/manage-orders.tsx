import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getAllOrders, updateOrderStatus } from "@/data/orders";

const statusStyles = {
	pending:
		"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
	paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const Route = createFileRoute("/orders/manage-orders")({
	beforeLoad: async ({ context }) => {
		const session = context.session;
		if (!session) throw redirect({ to: "/sign-in" });
		if (session.user.role !== "admin") throw redirect({ to: "/" });
		return { user: session.user };
	},
	loader: async () => getAllOrders(),
	component: ManageOrdersPage,
});

// ── Component ──
function ManageOrdersPage() {
	const orders = Route.useLoaderData();
	const router = useRouter();

	type OrderData = (typeof orders)[number];

	const [viewingOrder, setViewingOrder] = useState<OrderData | null>(null);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const columns: ColumnDef<OrderData>[] = [
		{
			accessorKey: "createdAt",
			header: "Date",
			cell: ({ row }) => (
				<span className="text-sm text-slate-600 dark:text-slate-300">
					{row.original.createdAt.toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})}
				</span>
			),
		},
		{
			id: "customer",
			header: "Customer",
			cell: ({ row }) => (
				<div>
					<p className="text-sm font-medium">{row.original.user.name}</p>
					<p className="text-xs text-slate-500">{row.original.user.email}</p>
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<span
					className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[row.original.status]}`}
				>
					{row.original.status.charAt(0).toUpperCase() +
						row.original.status.slice(1)}
				</span>
			),
		},
		{
			id: "itemsCount",
			header: "Items",
			cell: ({ row }) => (
				<span className="text-sm">
					{row.original.items.reduce((sum, item) => sum + item.quantity, 0)}
				</span>
			),
		},
		{
			accessorKey: "total",
			header: "Total",
			cell: ({ row }) => (
				<span className="text-sm font-semibold">
					${Number(row.original.total).toFixed(2)}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				<Button
					variant="outline"
					size="sm"
					onClick={() => setViewingOrder(row.original)}
				>
					<Eye size={14} />
				</Button>
			),
		},
	];

	const table = useReactTable({
		data: orders,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="mx-auto max-w-7xl py-8 px-4">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Manage Orders</CardTitle>
						<CardDescription>
							View all customer orders and their details.
						</CardDescription>
					</CardHeader>
				</Card>

				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center text-slate-500"
										>
											No orders found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			{/* Order detail Dialog */}
			<Dialog
				open={viewingOrder !== null}
				onOpenChange={(open) => {
					if (!open) setViewingOrder(null);
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							Order placed on{" "}
							{viewingOrder?.createdAt.toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</DialogDescription>
					</DialogHeader>

					{viewingOrder && (
						<div className="space-y-4">
							<div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
								<p className="text-sm font-medium">{viewingOrder.user.name}</p>
								<p className="text-xs text-slate-500">
									{viewingOrder.user.email}
								</p>
							</div>

							<div className="flex items-center justify-between">
								<Select
									value={viewingOrder.status}
									disabled={updatingId === viewingOrder.id}
									onValueChange={async (value) => {
										setUpdatingId(viewingOrder.id);
										try {
											await updateOrderStatus({
												data: {
													orderId: viewingOrder.id,
													status: value as "pending" | "paid" | "failed",
												},
											});
											toast.success("Order status updated");
											router.invalidate();
											setViewingOrder(null);
										} catch {
											toast.error("Failed to update status");
										}
										setUpdatingId(null);
									}}
								>
									<SelectTrigger className="w-[120px] h-8 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pending">
											<span className="text-yellow-600">Pending</span>
										</SelectItem>
										<SelectItem value="paid">
											<span className="text-green-600">Paid</span>
										</SelectItem>
										<SelectItem value="failed">
											<span className="text-red-600">Failed</span>
										</SelectItem>
									</SelectContent>
								</Select>
								<span className="text-lg font-bold">
									${Number(viewingOrder.total).toFixed(2)}
								</span>
							</div>

							<div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
								{viewingOrder.items.map((item) => (
									<div key={item.id} className="flex items-center gap-3 p-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
											<img
												src={item.image}
												alt={item.name}
												className="h-6 w-6 object-contain"
											/>
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium">{item.name}</p>
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
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
