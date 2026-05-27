import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getCartItemsCount } from "#/data/cart";
import { signOut } from "#/lib/auth-client";
import { Route as RootRoute } from "@/routes/__root";

export const cartCountQueryKey = ["cart-count"] as const;

export default function Header() {
	const { session } = RootRoute.useRouteContext();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const router = useRouter();

	const navigate = useNavigate();

	const { data: cartSummary } = useQuery({
		queryKey: cartCountQueryKey,
		queryFn: () => getCartItemsCount(),
		staleTime: 0,
		refetchInterval: 60_000, // every minute (60_000 ms) refetch the cart
	});

	const itemCount = cartSummary?.count ?? 0;
	const total = cartSummary?.total ?? 0;

	const handleLogout = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: async () => {
					await router.invalidate(); // Re-run __root beforeLoad to refresh the global session
					navigate({ to: "/" }); // Redirect to home
					setIsUserMenuOpen(false); // Close dropdown
					toast.success("Logged out successfully.", {
						description: "You will be redirected to the home page.",
					});
				},
			},
		});
	};

	return (
		<header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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
					</nav>
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/cart"
						className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
					>
						<span>Cart</span>

						<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
							{itemCount}
						</span>

						<span className="hidden text-[11px] font-medium text-slate-500 sm:inline">
							${total.toFixed(2)}
						</span>
					</Link>

					{session ? (
						<div className="relative">
							<button
								type="button"
								onClick={() => setIsUserMenuOpen((current) => !current)}
								className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
								aria-label="Open user menu"
							>
								<User size={18} />
							</button>

							{isUserMenuOpen && (
								<div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
									<div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
										<p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
											{session.user.name}
										</p>
										<p className="truncate text-xs text-slate-500">
											{session.user.email}
										</p>
									</div>

									<Link
										to="/profile"
										onClick={() => setIsUserMenuOpen(false)}
										className="mt-2 block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
									>
										Profile
									</Link>
									<Link
										to="/orders"
										onClick={() => setIsUserMenuOpen(false)}
										className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
									>
										My Orders
									</Link>
									{session?.user.role === "admin" && (
										<>
											<Link
												to="/products/create-product"
												onClick={() => setIsUserMenuOpen(false)}
												className="mt-2 block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
											>
												Create Product
											</Link>
											<Link
												to="/products/manage-products"
												onClick={() => setIsUserMenuOpen(false)}
												className="mt-2 block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
											>
												Manage Products
											</Link>
											<Link
												to="/orders/manage-orders"
												onClick={() => setIsUserMenuOpen(false)}
												className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
											>
												Manage Orders
											</Link>
										</>
									)}
									<button
										type="button"
										onClick={() => {
											handleLogout();
										}}
										className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
									>
										Log out
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="flex items-center gap-2">
							<Link
								to="/sign-in"
								className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
							>
								Login
							</Link>

							<Link
								to="/sign-up"
								className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-slate-900"
							>
								Sign Up
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
