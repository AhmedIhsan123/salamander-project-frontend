import { useState } from "react";
import { Link } from "react-router-dom";
import { renameVideo, deleteVideo } from "../api.js";
import { useToast } from "./Toast.jsx";

// A single video tile with a "manage" menu for rename and delete.
// onChanged() tells the parent to refresh the list after a change.
export default function VideoCard({ filename, thumbnail, onChanged }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(filename);
	const [busy, setBusy] = useState(false);
	const toast = useToast();

	async function handleRename() {
		const trimmed = name.trim();
		if (!trimmed || trimmed === filename) {
			setRenaming(false);
			return;
		}
		setBusy(true);
		try {
			await renameVideo(filename, trimmed);
			toast("Video renamed", "success");
			onChanged();
		} catch (err) {
			toast(`Could not rename: ${err.message}`, "error");
		} finally {
			setBusy(false);
			setRenaming(false);
		}
	}

	async function handleDelete() {
		if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
		setBusy(true);
		try {
			await deleteVideo(filename);
			toast("Video deleted", "success");
			onChanged();
		} catch (err) {
			toast(`Could not delete: ${err.message}`, "error");
			setBusy(false);
		}
	}

	return (
		<div className="group relative flex flex-col bg-white rounded-sm border border-stone-200 overflow-hidden transition-all duration-200 hover:border-green-300 hover:shadow-md">
			{/* Manage menu button (top-right) */}
			<div className="absolute right-2 top-2 z-10">
				<button
					type="button"
					onClick={() => setMenuOpen((o) => !o)}
					disabled={busy}
					aria-label="Manage video"
					className="rounded bg-white/90 px-2 py-0.5 text-stone-600 shadow-sm
					           hover:bg-white hover:text-green-700"
				>
					⋯
				</button>
				{menuOpen && (
					<div
						className="absolute right-0 mt-1 w-32 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-md"
						onMouseLeave={() => setMenuOpen(false)}
					>
						<button
							type="button"
							onClick={() => {
								setRenaming(true);
								setMenuOpen(false);
							}}
							className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
						>
							Rename
						</button>
						<button
							type="button"
							onClick={() => {
								setMenuOpen(false);
								handleDelete();
							}}
							className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
						>
							Delete
						</button>
					</div>
				)}
			</div>

			<Link to={`/preview/${filename}`} aria-label={`Open ${filename}`}>
				{thumbnail ? (
					<img
						src={thumbnail}
						alt=""
						className="w-full aspect-video object-cover block"
					/>
				) : (
					<div className="w-full aspect-video bg-stone-100 flex items-center justify-center text-stone-400">
						<span className="text-xs tracking-wide">No Preview</span>
					</div>
				)}
			</Link>

			<div className="px-3 py-2.5 border-t border-stone-100">
				{renaming ? (
					<input
						autoFocus
						value={name}
						disabled={busy}
						onChange={(e) => setName(e.target.value)}
						onBlur={handleRename}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleRename();
							if (e.key === "Escape") {
								setName(filename);
								setRenaming(false);
							}
						}}
						className="w-full rounded-sm border border-green-300 px-2 py-1 text-sm
						           focus:outline-none focus:ring-1 focus:ring-green-500"
					/>
				) : (
					<Link
						to={`/preview/${filename}`}
						className="block truncate text-sm font-medium text-stone-700 hover:text-green-700 transition-colors"
					>
						{filename}
					</Link>
				)}
			</div>
		</div>
	);
}
