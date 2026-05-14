import { useEffect, useState } from "react";
import { getVideos } from "../mockApi.js";
import { Link, useParams } from "react-router-dom";

export default function Videos() {
	const [videos, setVideos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		getVideos()
			.then((data) => {
				setVideos(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	// Showing error or loading
	if (loading) return <p>Loading...</p>;
	if (error) return <p>Could not load videos: {error}</p>;

	return (
		<div>
			<h1>Available Videos</h1>

			<ul>
				{videos.map((filename) => (
					<li key={filename}>
						<Link to={`/preview/${filename}`}>{filename}</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
