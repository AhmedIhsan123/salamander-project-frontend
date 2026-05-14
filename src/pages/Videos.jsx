import { useEffect, useState } from "react";
import { getVideos, getThumbnail } from "../mockApi.js";
import { Link } from "react-router-dom";

export default function Videos() {
	const [videos, setVideos] = useState([]);
	const [thumbnails, setThumbnails] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		getVideos()
			.then(async (data) => {
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
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	if (loading) return <p className="p-4 text-gray-500">Loading...</p>;
	if (error)
		return <p className="p-4 text-red-500">Could not load videos: {error}</p>;

	return (
		<main className="px-6 py-8 max-w-6xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Available Videos</h1>

			<section aria-label="Video list">
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 list-none p-0">
					{videos.map((filename) => (
						<li key={filename}>
							<Link
								to={`/preview/${filename}`}
								className="group flex flex-col rounded-lg border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-green-500"
								aria-label={`Watch ${filename}`}
							>
								<figure className="m-0">
									{thumbnails[filename] ? (
										<img
											src={thumbnails[filename]}
											alt=""
											className="w-full aspect-video object-cover block"
										/>
									) : (
										<div
											className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
											aria-hidden="true"
										>
											No Preview
										</div>
									)}
									<figcaption className="px-3 py-2 text-sm font-medium truncate group-hover:text-green-600 transition-colors">
										{filename}
									</figcaption>
								</figure>
							</Link>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
