# AI Photo Studio

AI Photo Studio is a browser-based photo editor built with React, TypeScript, Vite, Tailwind CSS, and an Express server. It combines non-destructive canvas editing with optional Gemini-powered image generation, retouching, background removal, and photo analysis.

## Features

- Import an image by upload, drag and drop, or the built-in sample library.
- Adjust exposure, brightness, contrast, highlights, shadows, saturation, temperature, tint, hue, sharpness, blur, vignette, grain, sepia, grayscale, and inversion.
- Apply AI style presets or describe a custom style with a text prompt.
- Ask Gemini to analyze an image and suggest professional color adjustments.
- Remove a background with AI, with a local cutout fallback when the AI request is unavailable.
- Replace the background with transparency, a solid color, a studio gradient, bokeh blur, or a generated backdrop.
- Paint a mask and use generative inpainting to remove or replace selected areas.
- Crop to common aspect ratios, rotate, straighten, and flip horizontally or vertically.
- Add text captions and watermarks.
- Compare before and after, zoom the canvas, and use undo/redo history.
- Export as PNG, JPEG, or WebP at 0.5x, 1x, or 2x resolution, or copy a PNG to the clipboard.

## Requirements

- Node.js 20 or newer is recommended.
- npm
- A Gemini API key is required for the Gemini AI tools. Basic local adjustments, sample images, and export do not require a key.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   The key is only read by the server. Do not commit `.env` or expose the key in client-side code.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in a browser.

The development command starts the Express server and mounts Vite in middleware mode. Changes to the React source are served through Vite during development.

## Production Build

Build the client and bundle the server:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The production server serves the Vite output from `dist/` on port `3000`. Set `NODE_ENV=production` when starting in a production environment.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run build` | Build the client and bundle the server |
| `npm start` | Run the production server from `dist/server.cjs` |
| `npm run clean` | Remove generated build output |

## AI API Routes

The Express server exposes these routes:

- `GET /api/health` checks server status and whether `GEMINI_API_KEY` is present.
- `POST /api/ai/edit-image` handles AI filters, custom edits, and masked inpainting.
- `POST /api/ai/remove-background` generates a subject-isolated image.
- `POST /api/ai/analyze-enhance` returns structured colorist recommendations.
- `POST /api/ai/generate-background` creates a custom photographic backdrop.

AI requests send image data as base64 data URLs. The server accepts JSON bodies up to 50 MB to support high-resolution images.

## Project Structure

```text
src/
  App.tsx                    Application state and feature handlers
  types.ts                   Shared editing and UI types
  components/
    Header.tsx               Upload, history, comparison, zoom, and export controls
    CanvasArea.tsx           Main canvas viewport and inpaint/crop interactions
    Sidebar.tsx              Editing tabs and controls
    ExportModal.tsx          Format, scale, quality, and download controls
    AIEnhanceModal.tsx       AI colorist results and suggested adjustments
    SamplePickerModal.tsx    Built-in sample image selector
  data/
    aiFilters.ts             Curated AI filter presets
    sampleImages.ts          Sample image metadata
  utils/
    canvasEngine.ts          Canvas compositing and local image processing
server.ts                    Express API and Vite integration
```

## Notes

- Local slider edits are rendered in the browser with the canvas engine.
- AI-generated images are returned from the server as data URLs and added to the editor history.
- If the AI background-removal request fails, the app attempts a local color-based cutout.
- Clipboard export depends on browser clipboard permissions and support for `ClipboardItem`.
- The server currently listens on port `3000`; update `PORT` in `server.ts` if another port is needed.
