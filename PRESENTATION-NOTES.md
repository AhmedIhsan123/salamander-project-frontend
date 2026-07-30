# Salamander Tracker — Presentation Study Guide

This is YOUR project, with simple wording. Read it once and you'll be solid.

---

## 1. The 30-second pitch (memorize this one)

> "We built a web app that tracks anything with a distinct color in a video — like a salamander in the woods. Upload a video, pick the color you want to follow, hit go, and you get a heatmap of where it spent its time, a path of how it moved, charts of its speed and position, and a CSV of the raw data. The frontend is React with Vite. The backend is a Node/Express server that runs a Java program for the actual frame-by-frame analysis."

If they ask you ANYTHING and you forget the answer, you can fall back on parts of this and look smart.

---

## 2. The stack — what tools you used and why

- **React 19** — for the UI. Lets us build the app out of reusable components.
- **Vite** — the dev server. Way faster than Create React App. Also handles the proxy to the backend.
- **React Router** — for the pages (Home, Videos, Preview). URL changes, no full page reload.
- **Tailwind CSS** — utility classes for styling (`bg-stone-50`, `flex`, etc). Faster than writing CSS files.
- **Recharts** — the chart library for the speed/x-y graphs in the analytics panel.
- **localStorage** — keeps your past run history in the browser even after you close the tab.
- **Express (Node)** — the backend server. Lists videos, handles uploads, kicks off processing jobs.
- **Java JAR (videoprocessor.jar)** — the actual color tracking. Reads video frames with JCodec, finds the centroid (center) of the target color in each frame, writes a CSV.

**If asked "why React?":** component reusability, hooks make state easy, hot reload during development, big community.

**If asked "why Vite over Create React App?":** Vite is much faster on startup and has built-in proxy support which we needed to talk to the backend.

---

## 3. File-by-file — what each thing does (in your own words)

### Top level
- **`vite.config.js`** — Vite's config. Has the proxy setup that forwards `/api`, `/thumbnail`, `/process`, `/results`, and `/videos` (file requests only) to the backend on port 3000.
- **`main.jsx`** — the entry point. Wraps the whole app in the Router and the ToastProvider.
- **`App.jsx`** — the top-level layout. Has the navbar (Salamander Tracker title + nav links + the "N processing" badge) and the React Router routes.
- **`index.css`** — global styles (just Tailwind setup and the SchoolBell font).

### Pages (`src/pages/`)
- **`Home.jsx`** — landing page. Generalized copy ("track anything with a distinct color"), a Browse Videos button, 3-step how-it-works section, and a list of your recent runs.
- **`Videos.jsx`** — the videos list. Drag-and-drop upload zone at the top, video cards in a grid (each with thumbnail + rename/delete menu).
- **`Preview.jsx`** — the BIG one. Picks a video, shows it side-by-side with a live binarized view, lets you pick a target color, drag a crop region, adjust threshold, kick off processing, and see results below.

### Components (`src/components/`)
- **`VideoCard.jsx`** — one tile in the videos grid. Shows thumbnail + filename + a ⋯ menu for rename/delete.
- **`Toast.jsx`** — the little notification popups in the corner ("Upload successful", "Failed to delete", etc). Uses React Context so any component can pop one up.
- **`ResultsPanel.jsx`** — shows the state of the current run: "processing", "error", or "done". When done: a summary, a download CSV button, and the analytics panel.
- **`RunAnalytics.jsx`** — the analytics panel you added at the end. 5 tabs: Heatmap, Motion Path, Speed, X & Y over time, Stats. Plus a synchronized time scrubber that controls all of them at once.

### Other (`src/`)
- **`api.js`** — every function that talks to the backend. `getVideos`, `uploadVideo`, `renameVideo`, `deleteVideo`, `getThumbnail`, `submitProcessingJob`, `getJobStatus`. Each one uses `fetch()`.
- **`jobStore.js`** — saves your jobs in `localStorage` so they survive page refreshes. Keeps the last 50.
- **`mockApi.js`** — fallback fake data for when the backend isn't running (so the frontend doesn't fully break in dev).

---

## 4. The most important React concepts you used

This is a React class. They WILL ask about hooks. Practice these:

### `useState`
> "useState gives a component its own memory. Whenever the value changes, React re-renders the component to show the new value."

Examples in your app:
- `Preview.jsx` has like 10 of these: `color`, `tolerance`, `videoReady`, `job`, `submitting`, etc.
- `Videos.jsx` has `videos`, `thumbnails`, `loading`, `uploading`, `dragging`.

### `useEffect`
> "useEffect runs side effects after the component renders — like fetching data from the server, polling, or setting up timers. You give it a dependency array so it only re-runs when those values change."

Examples:
- `App.jsx` polls `countProcessing()` every 2 seconds to keep the navbar badge fresh — that's a `setInterval` inside useEffect.
- `Videos.jsx` fetches the video list on mount with an empty `[]` dependency array (runs once).
- `Preview.jsx` polls the job status every couple seconds while a job is running.
- `ResultsPanel.jsx` fetches the CSV when a job finishes (effect depends on `job.status` and `job.result`).

### `useRef`
> "useRef gives you a stable reference to a DOM element or any value that should persist between renders without causing a re-render when it changes."

Examples:
- `Preview.jsx` uses refs for the `<video>` element, the visible `<canvas>`, and a hidden canvas that holds raw frames for the color picker.
- `RunAnalytics.jsx` uses refs for the heatmap and path canvases.
- The big thing: you can call `videoRef.current.currentTime = 5` to jump the video to 5 seconds. That's how the analytics scrubber seeks the video.

### `useMemo`
> "useMemo caches an expensive calculation so it doesn't re-run on every render."

Used in `RunAnalytics.jsx` to parse the CSV rows into chart data only when rows actually change.

### `useContext` (you built one!)
> "Context lets a value be available to any component in the tree without passing it through every level as a prop."

Your `Toast.jsx` uses `createContext` so any component can call `useToast()` and pop a notification without prop drilling.

### Custom hooks
- `useToast()` — a custom hook you wrote (one line: `useContext(ToastContext)`).

---

## 5. Likely questions + how to answer

### "Walk us through what happens when a user processes a video."

1. User picks a video on `/videos`, clicks one, lands on `/preview/:filename`.
2. The Preview page loads the video element pointed at `/videos/<filename>` (proxied to backend).
3. User clicks on the binarized canvas to pick a target color, or types one in. Drags the threshold slider.
4. User can optionally drag a crop rectangle to focus on one area.
5. Hits "Start Processing". Frontend calls `submitProcessingJob` in `api.js`, which POSTs to `/process/:filename?targetColor=R,G,B&threshold=N&crop=...`.
6. Backend (Express) returns a `{ jobId }` immediately. The Java JAR runs in the background.
7. Frontend saves the job to `jobStore` (localStorage) and starts polling `/process/:jobId/status` every couple seconds.
8. When status flips to `done`, `ResultsPanel` fetches the CSV from `/results/<jobId>.csv` and shows the analytics panel.

### "Why split the frontend and backend?"

> "Browsers can't run Java directly, and the heavy frame-by-frame analysis needs to happen in Java (JCodec library handles video decoding). Express in the middle is light — it just lists files, accepts uploads, and shells out to Java. The frontend just talks to the Express HTTP API. This way the React app stays simple and the heavy lifting happens server-side."

### "How does the live binarized preview work?"

> "Every animation frame (using requestAnimationFrame) we draw the current video frame onto a hidden canvas. Then we loop through every pixel, calculate the Euclidean color distance from the target color, and write white if it's under the threshold, black if it's over. The result goes into the visible canvas. It runs in real time while the video plays."

### "What's the centroid?"

> "If you binarize a frame, you get a bunch of white pixels (the target color) and black pixels (everything else). The centroid is the average X and Y of the white pixels — basically the middle of where your target is in that frame. We do that for every frame and write x,y,time to a CSV."

### "Why is the binarized view live? Doesn't that re-run the Java code?"

> "No — the live preview is a quick approximation we do in JavaScript on the browser. It just helps the user dial in the right color and threshold before they commit to running the real Java analysis. The Java side is slower but more accurate."

### "Why do you use localStorage for jobs?"

> "So your past runs survive a page refresh. The server has the actual CSV files in `/results/`, but the browser remembers which jobs you ran, what color/threshold you used, and whether they're still processing. If we used React state alone, refreshing would wipe everything."

### "Tell us about the analytics panel."

> "After a job finishes, we parse the CSV into x/y/time points. Then we built 5 synchronized views with React tabs:
> - **Heatmap** — colored hotspots showing where the centroid spent the most time (canvas-based for speed).
> - **Motion Path** — the actual path traced through the frame, colored by time.
> - **Speed** — a Recharts area chart of pixels-per-second over time.
> - **X & Y over time** — two lines showing horizontal and vertical position separately.
> - **Stats** — cards with total distance, avg speed, peak speed, % stationary, etc.
>
> All five share a `hoverIdx` state — hover any chart and the same moment lights up everywhere. There's also a time scrubber that controls all of them AND seeks the source video. Click anywhere on the heatmap → the video jumps to that exact moment."

### "What was the hardest part?"

Pick one of these — they're all real:
- "Getting the Java JAR to build and the backend to talk to it. Maven on Windows wasn't fun."
- "There was a sneaky proxy conflict — `/videos` is both a React Router page route AND the URL for video files on the backend. I had to write a custom proxy bypass that only forwards requests with file extensions."
- "The color picker math — clicking on the displayed canvas had to map to the original full-resolution video pixels. Had to handle object-cover crop math at first."

### "What would you do next?"

> "Wire up the AI summary feature — send the CSV to Claude/an LLM and get back a paragraph describing the motion. Multi-video comparison would be cool too. And recording a demo GIF for the README."

---

## 6. Speaking tips

- **Start with the demo, not the code.** Open the app, upload a video, click around, show the analytics. Let it speak for itself first. THEN walk through the code.
- **Have your terminals open before the meeting.** Backend `node index.js` running on 3000, frontend `npm run dev` running on 5173. One less thing to fumble with.
- **When you don't know something, say:** "I worked more on [the part you DID work on] — Ahmed/Jake handled that side, but I think it works by..." You don't have to know every line.
- **If they ask about Java code:** redirect — "That's the JAR side, my main contributions were the frontend. We used JCodec for video decoding and a DFS-based group finder to find the centroid clusters."
- **Show the heatmap.** It's the most visually impressive thing. Click around on it to seek the video — that demos a TON in 5 seconds.
- **Show the side-by-side preview with the live binarized view.** Drag the threshold slider. Watch their faces.

---

## 7. Quick concept refresher

### How the proxy works (the `/videos` thing)
The frontend dev server runs on port 5173. Backend on 3000. When the React app says `fetch('/api/videos')`, Vite catches that and forwards it to `http://localhost:3000/api/videos`. Without the proxy, the browser would block it as a cross-origin request.

For `/videos`, we made it smart — if the URL has a file extension (`/videos/ensantina.mp4`) it goes to the backend. If it's bare (`/videos`), it stays in the React app so React Router can render the Videos page.

### How polling works
"Polling" = asking the server "are you done yet?" over and over until it says yes. We do this for job status because the Java processing can take a while. We use `setInterval` inside a useEffect to ask every 2 seconds, and we `clearInterval` in the effect's cleanup function so it stops when the component unmounts.

### Why use refs and not state for the video element?
State triggers re-renders. The video DOM element doesn't need that — it just needs to exist and respond to `.currentTime = 5`. Refs give us a handle to the DOM node without re-rendering when it changes.

---

## 8. If they really grill you

If they ask something you have NO idea about:
- "Honestly, that part was Ahmed's/Jake's area, but my understanding is..."
- "Good question — let me think. I know it works because [thing you observed], but I'd have to dig back in the code to give you a precise answer."
- "I focused most on the frontend, so I'm less sharp on that side. What I CAN walk you through is..."

That's WAY better than making something up.

---

## You got this. 🦎

You actually built this thing. You merged a feature branch. You handled merge conflicts. You debugged a video player going black. You picked Recharts over D3 for a reason. You built five synchronized chart views. None of that is fake — they'll ask easy stuff, you'll answer it like the dev you are.
