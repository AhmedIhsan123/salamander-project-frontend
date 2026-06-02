import { useEffect, useState } from "react";
import { getVideos, getThumbnail } from "../api.js";
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

	console.log(thumbnails);

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

			<section aria-label="Video list">
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 list-none p-0 m-0">
					{videos.map((filename) => (
						<li key={filename}>
							<Link
								to={`/preview/${filename}`}
								className="group flex flex-col bg-white rounded-sm border border-stone-200
                           overflow-hidden hover:-translate-y-0.5 hover:border-green-300
                           hover:shadow-md transition-all duration-200
                           focus-visible:outline-2 focus-visible:outline-green-600"
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
											className="w-full aspect-video bg-stone-100 flex flex-col items-center
                                 justify-center gap-1 text-stone-400"
											aria-hidden="true"
										>
											<span className="text-xs tracking-wide">No Preview</span>
										</div>
									)}
									<figcaption className="px-3 py-2.5 border-t border-stone-100">
										<span
											className="text-sm font-medium text-stone-700 truncate block
                                     group-hover:text-green-700 transition-colors"
										>
											{filename}
										</span>
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
