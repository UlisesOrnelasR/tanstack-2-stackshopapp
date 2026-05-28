import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { Calendar, Mail, Pencil, Shield, User } from "lucide-react";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, uploadProfileImage } from "@/data/user";

export const Route = createFileRoute("/profile")({
	beforeLoad: async ({ context }) => {
		const session = context.session;
		if (!session) throw redirect({ to: "/sign-in" });
		return { user: session.user };
	},
	component: ProfilePage,
});

function ProfilePage() {
	const { user } = Route.useRouteContext();
	const router = useRouter();

	// Edit dialog state
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		name: "",
	});

	// Image state
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [compressedFile, setCompressedFile] = useState<File | null>(null);

	// Loading state
	const [isSaving, setIsSaving] = useState(false);

	function openEditDialog() {
		setEditForm({
			name: user.name,
		});
		setImagePreview(null);
		setCompressedFile(null);
		setIsEditOpen(true);
	}

	async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const compressed = await imageCompression(file, {
				maxSizeMB: 0.5,
				maxWidthOrHeight: 800,
				useWebWorker: true,
			});
			setCompressedFile(compressed);
			setImagePreview(URL.createObjectURL(compressed));
		} catch {
			console.error("Error compressing image");
		}
	}

	async function handleSave() {
		setIsSaving(true);

		try {
			let imageUrl: string | undefined;

			// Upload image only if a new one was selected
			if (compressedFile) {
				const base64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(compressedFile);
				});

				const { url } = await uploadProfileImage({
					data: {
						fileBase64: base64,
						fileName: compressedFile.name,
					},
				});
				imageUrl = url;
			}

			await updateProfile({
				data: {
					name: editForm.name,
					...(imageUrl ? { image: imageUrl } : {}),
				},
			});

			await router.invalidate();
			setIsEditOpen(false);
			toast.success("Profile updated successfully.");
		} catch {
			toast.error("Failed to update profile. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}

	const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="mx-auto max-w-3xl space-y-6 py-8">
			{/* Page header */}
			<div>
				<h1 className="text-2xl font-semibold">Profile</h1>
				<p className="text-sm text-slate-600 dark:text-slate-300">
					Your account information.
				</p>
			</div>

			{/* Profile card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="space-y-1">
						<CardTitle>Account Details</CardTitle>
						<CardDescription>
							View and manage your profile information.
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={openEditDialog}
						className="gap-2"
					>
						<Pencil size={14} />
						Edit
					</Button>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Avatar + name section */}
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
							{user.image ? (
								<img
									src={user.image}
									alt={user.name}
									className="h-full w-full object-cover"
								/>
							) : (
								<User size={28} className="text-slate-400" />
							)}
						</div>
						<div>
							<p className="text-lg font-semibold text-slate-900 dark:text-white">
								{user.name}
							</p>
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
									user.role === "admin"
										? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
										: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
								}`}
							>
								<Shield size={12} />
								{user.role === "admin" ? "Admin" : "User"}
							</span>
						</div>
					</div>

					{/* Info rows */}
					<div className="divide-y divide-slate-100 rounded-lg border dark:divide-slate-800 dark:border-slate-800">
						<div className="flex items-center gap-3 px-4 py-3">
							<Mail size={16} className="text-slate-400" />
							<div>
								<p className="text-xs text-slate-500">Email</p>
								<p className="text-sm font-medium text-slate-900 dark:text-white">
									{user.email}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3 px-4 py-3">
							<Calendar size={16} className="text-slate-400" />
							<div>
								<p className="text-xs text-slate-500">Member since</p>
								<p className="text-sm font-medium text-slate-900 dark:text-white">
									{memberSince}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3 px-4 py-3">
							<Shield size={16} className="text-slate-400" />
							<div>
								<p className="text-xs text-slate-500">Email verified</p>
								<p className="text-sm font-medium text-slate-900 dark:text-white">
									{user.emailVerified ? "Yes" : "No"}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit Profile</DialogTitle>
						<DialogDescription>
							Update your name and profile picture.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Name field */}
						<div className="space-y-2">
							<Label htmlFor="edit-name">Name</Label>
							<Input
								id="edit-name"
								value={editForm.name}
								onChange={(e) =>
									setEditForm((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								placeholder="Your name"
							/>
						</div>

						{/* Avatar upload field */}
						<div className="space-y-2">
							<Label>Profile Picture</Label>
							<div className="flex items-center gap-4">
								<div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
									{imagePreview ? (
										<img
											src={imagePreview}
											alt="Preview"
											className="h-full w-full object-cover"
										/>
									) : user.image ? (
										<img
											src={user.image}
											alt={user.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<User size={32} className="text-slate-400" />
									)}
								</div>
								<div className="flex flex-col gap-2">
									{!imagePreview && (
										<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-muted">
											Change image
											<input
												type="file"
												accept="image/*"
												onChange={handleImageSelect}
												className="hidden"
											/>
										</label>
									)}
									{imagePreview && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setImagePreview(null);
												setCompressedFile(null);
											}}
										>
											Undo change
										</Button>
									)}
								</div>
							</div>
							<p className="text-xs text-muted-foreground">
								{imagePreview
									? "New image selected — will upload on save."
									: "Leave unchanged to keep the current picture."}
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditOpen(false)}
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
