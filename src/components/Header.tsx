import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { getCartItemsCount } from "#/data/cart";
import { getSession } from "#/lib/auth.functions";

export const cartCountQueryKey = ["cart-count"] as const;
export const sessionQueryKey = ["session"] as const;

export default function Header() {
	const { data: session } = useQuery({
		queryKey: sessionQueryKey,
		queryFn: () => getSession(),
	});

	const { data: cartSummary } = useQuery({
		queryKey: cartCountQueryKey,
		queryFn: () => getCartItemsCount(),
		staleTime: 0,
	});

	const itemCount = cartSummary?.count ?? 0;
	const total = cartSummary?.total ?? 0;

	return (
		<header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
			<div className="mx-auto max-w-6xl px-4 py-3 items-center justify-between flex">
				<div className="flex items-center gap-3">
					<Link to="/" className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-800">
							<ShoppingBag size={20} />
						</div>

						<div className="flex flex-col">
							<span className="text-sm font-semibold text-slate-900 dark:text-white">
								StartShop
							</span>
						</div>
					</Link>

					<nav className="hidden items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 sm:flex">
						<Link
							to="/"
							className="rounded-lg px-3 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							Home
						</Link>
						<Link
							to="/products"
							className="rounded-lg px-3 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							Products
						</Link>
						{session?.user.role === "admin" && (
							<Link to="/products/create-product">Create Product</Link>
						)}
					</nav>
				</div>
				<div className="flex items-center gap-2">
					<Link
						to="/cart"
						className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
					>
						<span>Cart</span>
						<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 text-[11px] font-bold text-white">
							{itemCount}
						</span>
						<span className="hidden text-[11px] font-medium text-slate-500 sm:inline">
							${total.toFixed(2)}
						</span>
					</Link>
				</div>
			</div>
		</header>
	);
}
