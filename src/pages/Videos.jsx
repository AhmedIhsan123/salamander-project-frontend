import { useEffect, useRef, useState } from "react";
import { getVideos, getThumbnail, uploadVideo } from "../api.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Videos() {
	const [videos, setVideos] = useState([]);
	const [thumbnails, setThumbnails] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState(null);
	const [dragging, setDragging] = useState(false);
	const fileInputRef = useRef(null);

	async function loadVideos() {
		try {
			const data = await getVideos();
			setVideos(data);

			const thumbnailEntries = await Promise.all(
				data.map(async (filename) => {
					try {
						const thumbnail = await getThumbnail(filename);
						return [filename, thumbnail];
					} catch {
						return [filename, null];
					}
				}),
			);

			setThumbnails(Object.fromEntries(thumbnailEntries));
			setLoading(false);
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	}

	useEffect(() => {
		loadVideos();
	}, []);

	async function handleFiles(files) {
		const file = files?.[0];
		if (!file) return;

		setUploading(true);
		setUploadError(null);
		try {
			await uploadVideo(file);
			// refresh the list so the new video shows
			await loadVideos();  up
		} catch (err) {
			setUploadError(err.message);
		} finally {
			setUploading(false);
		}
	}

	function handleDrop(e) {
		e.preventDefault();
		setDragging(false);
		handleFiles(e.dataTransfer.files);
	}

	if (loading) return <p className="p-4 text-gray-500">Loading...</p>;
	if (error)
		return <p className="p-4 text-red-500">Could not load videos: {error}</p>;

	return (
		<main className="px-6 py-10 max-w-6xl mx-auto">
			<div className="mb-8 pb-4 border-b border-stone-200 flex items-baseline gap-3">
				<h1 className="text-2xl font-[SchoolBell] text-green-800">
					Available Videos
				</h1>
			</div>

			<section aria-label="Upload a video" className="mb-8">
				<div
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={handleDrop}
					className={
						"flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm " +
						"border-2 border-dashed px-6 py-8 text-center transition-colors " +
						(dragging
							? "border-green-600 bg-green-50"
							: "border-stone-300 bg-white hover:border-green-400 hover:bg-stone-50")
					}
				>
					<p className="text-sm font-medium text-stone-700">
						{uploading
							? "Uploading..."
							: "Drag a video here, or click to browse"}
					</p>
					<p className="text-xs text-stone-400">
						.mp4, .mov, .avi, .mkv — max 500 MB
					</p>
					<input
						ref={fileInputRef}
						type="file"
						accept=".mp4,.mov,.avi,.mkv"
						className="hidden"
						onChange={(e) => {
							handleFiles(e.target.files);
							// allows to re-uploading the same file
							e.target.value = ""; 
						}}
					/>
				</div>

				{uploadError && (
					<p className="mt-2 text-sm text-red-500">
						Upload failed: {uploadError}
					</p>
				)}
			</section>

			<section aria-label="Video list">
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 list-none p-0 m-0">
					{videos.map((filename) => (
						<li key={filename}>
							<VideoCard
								filename={filename}
								thumbnail={thumbnails[filename]}
								onChanged={loadVideos}
							/>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
