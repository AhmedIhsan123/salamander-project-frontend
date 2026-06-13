// Saves jobs in the browser (localStorage) so past runs don't disappear.

const KEY = "salamander-jobs";

function readAll() {
	try {
		return JSON.parse(localStorage.getItem(KEY)) || [];
	} catch {
		return [];
	}
}

// All saved jobs for one video, newest first
export function getJobs(filename) {
	return readAll().filter((j) => j.filename === filename);
}

// All saved jobs across every video, newest first
export function getAllJobs() {
	return readAll();
}

// Add a job, or update it if it already exists
export function saveJob(job) {
	try {
		const all = readAll();
		const i = all.findIndex((j) => j.jobId === job.jobId);
		if (i >= 0) {
			all[i] = { ...all[i], ...job };
		} else {
			all.unshift(job);
		}
		// keep only the 50 most recent
		localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
	} catch {
		// storage unavailable — skip saving
	}
}
