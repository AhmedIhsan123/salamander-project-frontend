export async function getVideos() {
  const res = await fetch('/api/videos');
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}

export async function getThumbnail(filename) {
  const url = `/thumbnail/${filename}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No thumbnail for ${filename}`);
  }
  return url;
}

export async function submitProcessingJob(filename, targetColor, threshold) {
  // The server expects targetColor as "R,G,B" (e.g. "255,162,0"),
  // so convert the hex string from the color picker into RGB parts.
  const hex = targetColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const rgb = encodeURIComponent(`${r},${g},${b}`);
  const res = await fetch(
    `/process/${filename}?targetColor=${rgb}&threshold=${threshold}`,
    { method: 'POST' }
  );
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`/process/${jobId}/status`);
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}