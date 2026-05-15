import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import type { z } from "zod";
import { getSession } from "#/lib/auth.functions";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, productSchema } from "@/data/products";
import type { BadgeValue, InventoryValue } from "@/db/schema";

export const Route = createFileRoute("/products/create-product")({
	beforeLoad: async () => {
		const session = await getSession();

		if (!session) {
			throw redirect({ to: "/sign-in" });
		}

		if (session.user.role !== "admin") {
			throw redirect({ to: "/" });
		}

		return { user: session.user };
	},
	component: RouteComponent,
});

function fieldValidator(schema: z.ZodTypeAny) {
	return ({ value }: { value: unknown }) => {
		const result = schema.safeParse(value);
		return result.success ? undefined : result.error.issues[0]?.message;
	};
}

function FieldMessage({ error }: { error?: string }) {
	if (!error) return null;
	return <p className="text-sm text-destructive">{error}</p>;
}

function FormField({
	field,
	label,
	children,
}: {
	field: any;
	label: string;
	children: React.ReactNode;
}) {
	const error = field.state.meta.isTouched
		? (field.state.meta.errors[0] as string | undefined)
		: undefined;

	return (
		<div className="space-y-2">
			<Label htmlFor={field.name}>{label}</Label>
			{children}
			<FieldMessage error={error} />
		</div>
	);
}

function RouteComponent() {
	const navigate = useNavigate();
	const router = useRouter();
	const [submitError, setSubmitError] = useState<string | null>(null);
	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			price: "",
			badge: undefined as BadgeValue | undefined,
			image: "",
			inventory: "in-stock" as InventoryValue,
		},
		onSubmit: async ({ value }) => {
			try {
				setSubmitError(null);
				await createProduct({
					data: {
						name: value.name,
						description: value.description,
						price: value.price,
						badge: value.badge,
						image: value.image,
						inventory: value.inventory,
					},
				});
				await router.invalidate({ sync: true });
				navigate({ to: "/products" });
			} catch {
				setSubmitError("Something went wrong. Please try again.");
			}
		},
	});

	return (
		<div className="mx-auto max-w-7xl py-8 px-4">
			<div className="space-y-6">
				<Card>
					<CardHeader className="gap-2">
						<CardTitle className="text-lg">Create Product</CardTitle>
						<CardDescription className="line-clamp-2">
							Fill in the details to add a new product to the catalog.
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardContent>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-6"
						>
							<form.Field
								name="name"
								validators={{
									onChange: fieldValidator(productSchema.shape.name),
								}}
							>
								{(field) => (
									<FormField field={field} label="Product Name *">
										<Input
											type="text"
											id={field.name}
											name={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Enter product name"
											aria-invalid={
												field.state.meta.isTouched && !field.state.meta.isValid
											}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field
								name="description"
								validators={{
									onChange: fieldValidator(productSchema.shape.description),
								}}
							>
								{(field) => (
									<FormField field={field} label="Description *">
										<Textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Enter product description"
											aria-invalid={
												field.state.meta.isTouched && !field.state.meta.isValid
											}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field
								name="price"
								validators={{
									onChange: fieldValidator(productSchema.shape.price),
								}}
							>
								{(field) => (
									<FormField field={field} label="Price *">
										<Input
											type="number"
											id={field.name}
											name={field.name}
											value={field.state.value}
											step="0.01"
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="0.00"
											aria-invalid={
												field.state.meta.isTouched && !field.state.meta.isValid
											}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field
								name="image"
								validators={{
									onChange: fieldValidator(productSchema.shape.image),
								}}
							>
								{(field) => (
									<FormField field={field} label="Image URL *">
										<Input
											type="url"
											id={field.name}
											name={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://example.com/image.jpg"
											aria-invalid={
												field.state.meta.isTouched && !field.state.meta.isValid
											}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field
								name="badge"
								validators={{
									onChange: fieldValidator(productSchema.shape.badge),
								}}
							>
								{(field) => (
									<FormField field={field} label="Badge (optional)">
										<Select
											name={field.name}
											value={field.state.value ?? "none"}
											onValueChange={(value) =>
												field.handleChange(
													value === "none" ? undefined : (value as BadgeValue),
												)
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select badge" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">None</SelectItem>
												<SelectItem value="New">New</SelectItem>
												<SelectItem value="Sale">Sale</SelectItem>
												<SelectItem value="Featured">Featured</SelectItem>
												<SelectItem value="Limited">Limited</SelectItem>
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<form.Field
								name="inventory"
								validators={{
									onChange: fieldValidator(productSchema.shape.inventory),
								}}
							>
								{(field) => (
									<FormField field={field} label="Inventory Status *">
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value as InventoryValue)
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="in-stock">In Stock</SelectItem>
												<SelectItem value="backorder">Backorder</SelectItem>
												<SelectItem value="preorder">Preorder</SelectItem>
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<FieldMessage error={submitError ?? undefined} />

							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<div className="flex gap-4">
										<Button
											type="submit"
											disabled={!canSubmit || isSubmitting}
											className="flex-1"
										>
											{isSubmitting ? "Creating..." : "Create Product"}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => navigate({ to: "/products" })}
										>
											Cancel
										</Button>
									</div>
								)}
							</form.Subscribe>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
