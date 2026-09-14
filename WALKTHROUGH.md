# AI Photo Studio Walkthrough

This walkthrough takes one photo from import to export. It uses only the controls visible in the studio and calls out where Gemini is involved.

## 1. Start the studio

From the project directory, run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To use AI features, put `GEMINI_API_KEY` in a root `.env` file before starting the server.

The app opens with a sample photo already loaded. You can keep it for a quick test or replace it with your own image.

## 2. Choose an image

Use one of these options in the top-right corner:

- **Sample Photos** opens the built-in image library.
- **Upload** accepts an image file from your computer.
- Drag an image file anywhere over the studio to upload it.

Choosing a new image resets the current adjustments and starts a fresh history stack.

## 3. Make a local edit

The right sidebar contains seven editing modes. Start with **Adjust** and move the light and color sliders. Changes render directly on the canvas in the browser.

Useful starting adjustments:

1. Raise or lower **Exposure** for overall brightness.
2. Use **Highlights** and **Shadows** to recover detail.
3. Adjust **Temperature** for a warmer or cooler mood.
4. Add a small amount of **Sharpness** or **Vignette** for finishing.

Use **Reset Sliders** to return only the adjustment controls to their defaults. The header reset control resets the current adjustment state as well.

## 4. Compare and review

Use the header controls while editing:

- **Split Compare** shows the edited result against the original.
- The zoom controls change the canvas view from 20% to 300%; click the percentage to return to fit scale.
- **Undo** and **Redo** move through the recorded edit history.
- `Cmd/Ctrl + Z` undoes, `Cmd/Ctrl + Y` redoes, and `C` toggles split comparison.

## 5. Try an AI filter

Open **AI Filters** in the sidebar. Select a curated preset or enter a custom style prompt, then choose **Apply AI Style**.

The app sends the current canvas snapshot to `/api/ai/edit-image`. A successful Gemini response becomes the new image and is added to history. Some presets also include local grading adjustments that can be applied if the AI request is unavailable.

Prompt example:

```text
Turn this into warm 1990s flash photography with soft halation and subtle film grain.
```

## 6. Use AI Studio for a smart edit

Open **AI Studio** for two prompt-driven tools:

- **Analyze & Auto-Enhance** asks Gemini for a critique, lighting description, subject detection, and suggested color adjustments. Review the result, then choose **Apply AI Grading**.
- **Generate Edit** sends a direct instruction to Gemini to add, remove, or modify elements in the image.

Prompt example:

```text
Change the sky to a soft pink sunset while preserving the subject and the original composition.
```

## 7. Replace the backdrop

Open **Backdrop** and choose **1-Click AI Background Removal** to isolate the foreground subject. Once a cutout exists, choose a backdrop mode:

- **Transparent** for a transparent PNG-style result.
- **Solid Color** and a color swatch for a clean studio background.
- **Studio Light** and a gradient preset for a stylized backdrop.
- **Bokeh Blur** to blur the original background.

You can also enter a description under **Generate Custom AI Backdrop**. This calls Gemini and places the generated image behind the subject.

Prompt example:

```text
A modern concrete loft with large windows, soft morning light, and a few green plants.
```

## 8. Retouch a selected area

Open **Inpaint**. Adjust **Brush Size**, then paint over the part of the image you want to change. Use **Eraser Mode** or **Clear Mask** to correct the mask.

Enter an instruction and choose **Generative Fill Mask**. The image and mask are sent to `/api/ai/edit-image`, and Gemini replaces only the masked area.

Prompt example:

```text
Remove the person and fill the area with a natural continuation of the background.
```

## 9. Crop and add text

Use **Crop** to select an aspect ratio such as `1:1`, `4:5`, `16:9`, or `9:16`. The same panel includes rotation, straighten, and horizontal or vertical flip controls.

Use **Text** to add a caption or watermark. Type the text, choose **Add Text to Canvas**, and remove an overlay from the list when it is no longer needed.

## 10. Export the finished image

Choose **Export** in the header. In the export dialog:

1. Select PNG, JPEG, or WebP.
2. Choose `0.5x`, `1x`, or `2x` resolution.
3. For JPEG and WebP, set compression quality.
4. Set the filename.
5. Choose **Download File** or **Copy to Clipboard**.

PNG is the best choice when you need transparency. JPEG and WebP are useful when file size matters.

## A quick practice recipe

For a fast first run, select a sample photo, open **Adjust**, raise contrast slightly, switch to **Backdrop**, remove the background, choose **Studio Light**, add a short watermark under **Text**, then export a 1x PNG. This path demonstrates local editing, AI isolation, compositing, overlays, history, and export in one pass.
