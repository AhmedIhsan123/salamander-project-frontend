import {
  getVideos as mockGetVideos,
  getThumbnail as mockGetThumbnail,
  submitProcessingJob as mockSubmitProcessingJob,
  getJobStatus as mockGetJobStatus,
} from "./mockApi.js";

export async function getVideos() {
  try {
    const res = await fetch('/api/videos');
    if (!res.ok) {
      throw new Error(`Server responded ${res.status}`);
    }
    return res.json();
  } catch (err) {
    return mockGetVideos();
  }
}

export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('video', file);
  const res = await fetch('/api/videos', { method: 'POST', body: formData });
  if (!res.ok) {
    // server sends back a helpful message, use it if there is one
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server responded ${res.status}`);
  }
  return res.json();
}

export async function renameVideo(filename, newName) {
  const res = await fetch(`/api/videos/${filename}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server responded ${res.status}`);
  }
  return res.json();
}

export async function deleteVideo(filename) {
  const res = await fetch(`/api/videos/${filename}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server responded ${res.status}`);
  }
  return res.json();
}

export async function getThumbnail(filename) {
  const url = `/thumbnail/${filename}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`No thumbnail for ${filename}`);
    }
    return url;
  } catch (err) {
    return mockGetThumbnail(filename);
  }
}

export async function submitProcessingJob(filename, targetColor, threshold, cropRect) {
  // The server expects targetColor as "R,G,B" (e.g. "255,162,0"),
  // so convert the hex string from the color picker into RGB parts.
  const hex = targetColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const params = new URLSearchParams({
    targetColor: `${r},${g},${b}`,
    threshold: String(threshold),
  });
  if (cropRect) {
    params.set('crop', `${cropRect.x},${cropRect.y},${cropRect.width},${cropRect.height}`);
  }

  try {
    const res = await fetch(`/process/${filename}?${params.toString()}`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Server responded ${res.status}`);
    }
    return res.json();
  } catch (err) {
    return mockSubmitProcessingJob(filename, targetColor, threshold, cropRect);
  }
}

export async function getJobStatus(jobId) {
  try {
    const res = await fetch(`/process/${jobId}/status`);
    if (!res.ok) {
      throw new Error(`Server responded ${res.status}`);
    }
    const status = await res.json();
    if (status?.status === "error") {
      console.warn("Backend processing failed:", status.error);
      return mockGetJobStatus(jobId);
    }
    return status;
  } catch (err) {
    return mockGetJobStatus(jobId);
  }
}