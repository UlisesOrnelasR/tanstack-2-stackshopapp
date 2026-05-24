import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { useState } from "react";
import type { z } from "zod";
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
import {
	createProduct,
	productSchema,
	uploadProductImage,
} from "@/data/products";
import type { BadgeValue, InventoryValue } from "@/db/schema";

export const Route = createFileRoute("/products/create-product")({
	beforeLoad: async ({ context }) => {
		const session = context.session;

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
	const [imagePreview, setImagePreview] = useState<string | null>(null); // ← nuevo
	const [uploading, setUploading] = useState(false); // ← nuevo
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

	async function handleImageSelect(
		e: React.ChangeEvent<HTMLInputElement>,
		field: any,
	) {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			// 👁️ compression
			const compressed = await imageCompression(file, {
				maxSizeMB: 0.5,
				maxWidthOrHeight: 1200,
				useWebWorker: true,
			});

			// 👁️ preview
			const previewUrl = URL.createObjectURL(compressed);
			setImagePreview(previewUrl);

			// 📤 Convert to base 64 and upload
			const reader = new FileReader();
			reader.onload = async () => {
				try {
					const result = await uploadProductImage({
						data: {
							fileBase64: reader.result as string,
							fileName: file.name,
						},
					});
					field.handleChange(result.url);
				} catch (err) {
					setSubmitError("Error uploading image");
					setImagePreview(null);
				} finally {
					setUploading(false);
				}
			};
			reader.readAsDataURL(compressed);
		} catch (err) {
			setSubmitError("Error compressing image");
			setUploading(false);
		}
	}

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

							{/* <form.Field
								name="image"
								validators={{
									onChange: fieldValidator(productSchema.shape.image),
								}}
							>
								{(field) => (
									<FormField field={field} label="Product Image *">
										<Input
											type="file"
											accept="image/*"
											onChange={(e) => handleImageSelect(e, field)}
											disabled={uploading}
										/>
										{uploading && (
											<p className="text-sm text-muted-foreground">
												Compressing and uploading...
											</p>
										)}
										{imagePreview && (
											<img
												src={imagePreview}
												alt="Preview"
												className="mt-2 h-32 w-32 rounded-md object-cover"
											/>
										)}
									</FormField>
								)}
							</form.Field> */}
							<form.Field
								name="image"
								validators={{
									onChange: fieldValidator(productSchema.shape.image),
								}}
							>
								{(field) => (
									<FormField field={field} label="Product Image *">
										<div className="space-y-3">
											<label
												className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors
            ${uploading ? "pointer-events-none opacity-50" : "hover:border-primary/50 hover:bg-muted/50"}`}
											>
												{imagePreview ? (
													<img
														src={imagePreview}
														alt="Preview"
														className="h-36 w-36 rounded-lg object-cover"
													/>
												) : (
													<>
														<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="20"
																height="20"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="1.5"
																strokeLinecap="round"
																strokeLinejoin="round"
																className="text-muted-foreground"
															>
																<title>Upload icon</title>
																<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
																<polyline points="17 8 12 3 7 8" />
																<line x1="12" y1="3" x2="12" y2="15" />
															</svg>
														</div>
														<p className="text-sm text-muted-foreground">
															Click to select an image
														</p>
													</>
												)}
												<input
													type="file"
													accept="image/*"
													onChange={(e) => handleImageSelect(e, field)}
													disabled={uploading}
													className="hidden"
												/>
											</label>

											{uploading && (
												<p className="text-sm text-muted-foreground">
													Compressing and uploading...
												</p>
											)}

											{imagePreview && !uploading && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => {
														setImagePreview(null);
														field.handleChange("");
													}}
												>
													Remove image
												</Button>
											)}
										</div>
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
