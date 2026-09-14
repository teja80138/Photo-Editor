import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit for high-resolution base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialize Gemini client to avoid crashes if GEMINI_API_KEY is not yet populated
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Utility: Clean base64 data url to raw base64 and mime type
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  // Default fallback if raw base64 was passed
  return { mimeType: "image/png", base64: dataUrl };
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Edit / Transform Image Route
// Supports prompt-based editing, style filters, generative fill, etc.
app.post("/api/ai/edit-image", async (req, res) => {
  try {
    const { image, prompt, maskImage, model = "gemini-3.1-flash-image-preview" } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: "Image data is required" });
    }
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt description is required" });
    }

    const ai = getGeminiClient();
    const { mimeType, base64 } = parseDataUrl(image);

    const parts: any[] = [
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ];

    if (maskImage) {
      const maskParsed = parseDataUrl(maskImage);
      parts.push({
        inlineData: {
          mimeType: maskParsed.mimeType,
          data: maskParsed.base64,
        },
      });
      parts.push({
        text: `The second image is a binary mask where white indicates the exact region to modify. Instruction: ${prompt}. Preserve all unmasked regions with photorealistic fidelity.`,
      });
    } else {
      parts.push({
        text: `${prompt}. High quality, photorealistic, maintain subject anatomy and composition integrity. Return the edited image.`,
      });
    }

    // Attempt generation with requested model, fallback to gemini-3.1-flash-image or lite if needed
    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: { parts },
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${model} failed, attempting gemini-3.1-flash-image:`, primaryErr?.message);
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: { parts },
      });
    }

    let outputImageUrl: string | null = null;
    let outputText: string = "";

    const candidates = response.candidates || [];
    if (candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const outMime = part.inlineData.mimeType || "image/png";
          outputImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          outputText += part.text;
        }
      }
    }

    if (!outputImageUrl) {
      return res.status(500).json({
        success: false,
        error: outputText || "AI model did not return an image part. Please refine your prompt.",
      });
    }

    return res.json({
      success: true,
      image: outputImageUrl,
      notes: outputText,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/edit-image:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during AI image processing.",
    });
  }
});

// AI Background Removal Route
app.post("/api/ai/remove-background", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "Image data is required" });
    }

    const ai = getGeminiClient();
    const { mimeType, base64 } = parseDataUrl(image);

    const prompt =
      "Segment the foreground subject(s) cleanly from this image. Remove all background completely and replace the background with a pure solid high-contrast chroma green #00FF00 or pure solid white #FFFFFF background. Ensure subject edges, hair details, and silhouettes are razor sharp with no shadows on the background.";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          { text: prompt },
        ],
      },
    });

    let outputImageUrl: string | null = null;
    const candidates = response.candidates || [];
    if (candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const outMime = part.inlineData.mimeType || "image/png";
          outputImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!outputImageUrl) {
      return res.status(500).json({
        success: false,
        error: "Could not isolate subject from background with AI.",
      });
    }

    return res.json({
      success: true,
      image: outputImageUrl,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/remove-background:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Background removal error",
    });
  }
});

// AI Smart Analysis & Auto-Enhance Route
// Uses gemini-3.8-flash for deep color grading analysis & smart adjustments
app.post("/api/ai/analyze-enhance", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "Image data is required" });
    }

    const ai = getGeminiClient();
    const { mimeType, base64 } = parseDataUrl(image);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          {
            text: "You are a world-class professional photo retoucher and colorist. Analyze this image in detail (histogram, exposure, dynamic range, color temperature, skin tones or scenery, contrast balance). Recommend optimal slider adjustments (-100 to 100 range, 0 being neutral) to make this image look professional, balanced, and visually stunning. Provide a concise critique and bulleted enhancement suggestions.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brightness: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            contrast: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            exposure: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            highlights: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            shadows: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            saturation: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            vibrance: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100" },
            temperature: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100 (warm/cool)" },
            tint: { type: Type.NUMBER, description: "Recommended adjustment -100 to 100 (tint)" },
            sharpness: { type: Type.NUMBER, description: "Recommended adjustment 0 to 100" },
            vignette: { type: Type.NUMBER, description: "Recommended adjustment 0 to 100" },
            critique: { type: Type.STRING, description: "Professional visual evaluation of the photo" },
            lightingCondition: { type: Type.STRING, description: "e.g. Backlit, Golden Hour, Overcast, Studio Hard Light" },
            primarySubjects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Identified subjects or focal points",
            },
            keyRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key creative suggestions for the creator",
            },
          },
          required: [
            "brightness",
            "contrast",
            "exposure",
            "highlights",
            "shadows",
            "saturation",
            "vibrance",
            "temperature",
            "tint",
            "sharpness",
            "vignette",
            "critique",
            "lightingCondition",
            "primarySubjects",
            "keyRecommendations",
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      success: true,
      analysis: parsedJson,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/analyze-enhance:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Auto-enhance analysis error",
    });
  }
});

// AI Generate Background or Custom Concept Route
app.post("/api/ai/generate-background", async (req, res) => {
  try {
    const { prompt, aspectRatio = "16:9" } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [
          {
            text: `Professional high-end photography background backdrop: ${prompt}. Photorealistic, studio lighting, depth of field bokeh, clean composition suitable as photo backdrop.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let outputImageUrl: string | null = null;
    const candidates = response.candidates || [];
    if (candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const outMime = part.inlineData.mimeType || "image/png";
          outputImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!outputImageUrl) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate background image.",
      });
    }

    return res.json({
      success: true,
      image: outputImageUrl,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/generate-background:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Background generation error",
    });
  }
});

// Setup Vite middleware for development, and static file serving for production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Photo Studio server running on port ${PORT}`);
  });
}

start();
