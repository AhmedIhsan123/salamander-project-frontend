# Salamander Project

A tool for analysing videos of lizards moving on a flat surface. It binarizes each frame based on a target color and threshold, then finds the centroid of the largest contiguous mass (the lizard).

---

## Team Members

- Elvin Hrytsyuk
- Ahmed Ihsan
- Jacob Gerken

---

## Backend Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/Elvin-code-dev/centroid-finder.git
    cd centroid-finder
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure environment variables**

    Create a `.env` file in the **project root** (one level above `server/`). The server loads it from `../.env` relative to `server/index.js`.

    | Variable     | Required | Description                                                                          |
    |--------------|----------|--------------------------------------------------------------------------------------|
    | `PORT`       | No       | Port the server listens on. Defaults to `3000`.                                      |
    | `VIDEOS_DIR` | Yes      | Path to the videos directory, relative to `server/`. E.g. `../videos`               |
    | `JAR_PATH`   | Yes      | Path to the processor JAR, relative to `server/`. E.g. `../target/videoprocessor.jar` |

    Example `.env`:

    ```env
    PORT=3000
    VIDEOS_DIR=../videos
    JAR_PATH=../target/videoprocessor.jar
    ```

4. **Start the backend**

    ```bash
    node server/index.js
    ```

    The server will be available at `http://localhost:3000` (or your configured `PORT`).

---

## Frontend Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/AhmedIhsan123/salamander-project-frontend.git
    cd salamander-project-frontend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start the frontend**

    ```bash
    npm run dev
    ```
---

## Color Palette

**Core greens:**

- green-950 — #052e16
- green-900 — #14532d
- green-800 — #166534
- green-600 — #16a34a
- green-500 — #22c55e
- green-400 — #4ade80
- green-100 — #dcfce7
- green-50  — #f0fdf4

**Accents:**

- red-400   — #f87171
- amber-400 — #fbbf24

---

## Video Cropping Instructions

The video cropping feature allows for the currently previewed image to be resized to fit the desired framing

1. **Select a video to preview**

    Upload and select a video to be cropped.

2. **Select the crop button**

    Once on the video preview page, select the button labeled "Select crop" to begin cropping

3. **Highlight the desired crop**

    The crop must be drawn on the non-binarized video preview. Once drawn a green box indicates the current crop selected.
