import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a specialized AI assistant for dermatology. Your task is to analyze images of skin conditions.
Provide a potential identification, a confidence level, a brief description, and helpful, safe next steps.
Your response must be in JSON format according to the provided schema.

Under no circumstances should you ever suggest or prescribe any specific medications, treatments, or drugs.
Instead, your recommendations MUST focus on three areas:
1. Detailed, non-medical care and lifestyle tips (e.g., 'Keep the area clean and dry', 'Avoid scratching', 'Consider using a gentle, hypoallergenic moisturizer', 'Maintain a balanced diet rich in antioxidants to support skin health').
2. When to see a doctor (e.g., 'Consult a professional if the condition worsens, becomes painful, or shows signs of infection').
3. A list of relevant questions the user could ask their doctor to facilitate a productive consultation (e.g., 'What are the potential treatment options?', 'Are there any lifestyle changes I should make?').

CRITICAL: You MUST always include the following disclaimer as the last item in the recommendations array: "This is not a medical diagnosis. Always consult a qualified dermatologist for an accurate diagnosis and treatment plan."
The confidence level should be a string like "High", "Medium", or "Low".`;

const COMPARISON_SYSTEM_INSTRUCTION = `You are a specialized AI assistant for dermatology. Your task is to compare two images of the same skin lesion taken at different times.
Analyze the differences in size, color, shape, and texture.
Provide a summary of changes, key observations, an updated condition assessment, and a safe recommendation.
After your analysis, explicitly state the most likely name for the condition based on the comparison.
The recommendation MUST NOT be medical advice or a prescription. It should be a general next step.
CRITICAL: You MUST strongly advise the user to consult a qualified dermatologist to discuss any observed changes. This comparison is not a substitute for professional medical follow-up. Your response must be in JSON format according to the provided schema.`;

// Helper to instantiate Gemini Client lazily or check key availability safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing large JSON bodies for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // End point: Analyze skin condition
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, boundingBox, pins, practitionerNotes } = req.body;
      if (!image || !image.data || !image.mimeType) {
        res.status(400).json({ error: "Missing image data or mimeType in request body." });
        return;
      }

      const ai = getGeminiClient();
      const imagePart = {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        }
      };

      let promptText = "Please analyze this skin condition macroscopic photo.";
      if (boundingBox || (pins && pins.length > 0) || practitionerNotes) {
        promptText += "\n\nThe clinician/patient has marked the following spatial coordinates and provided notes to isolate the target tissue:";
        if (boundingBox) {
          promptText += `\n- Bounding Box ROI (Region of Interest): The target lesion is located within the rectangle from (${boundingBox.x1.toFixed(1)}%, ${boundingBox.y1.toFixed(1)}%) to (${boundingBox.x2.toFixed(1)}%, ${boundingBox.y2.toFixed(1)}%) of the image frame.`;
        }
        if (pins && pins.length > 0) {
          promptText += "\n- Suspicious Feature Point Markers:";
          pins.forEach((pin: any, idx: number) => {
            promptText += `\n  Pin ${idx + 1} located at coordinates (${pin.x.toFixed(1)}%, ${pin.y.toFixed(1)}%) of the image is annotated as: "${pin.label}"`;
          });
        }
        if (practitionerNotes) {
          promptText += `\n- Accompanying Practitioner Notes: "${practitionerNotes}"`;
        }
        promptText += "\n\nPlease focus your vision analysis primarily on the specified visual targets, while keeping the full image context in mind.";
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          parts: [
            imagePart,
            { text: promptText }
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conditionName: { type: Type.STRING, description: "The most likely name of the skin condition." },
              confidence: { type: Type.STRING, description: "Confidence level (e.g., High, Medium, Low)." },
              description: { type: Type.STRING, description: "A brief, easy-to-understand description of the condition." },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of safe, general recommendations or next steps as per the system instruction."
              },
            },
            required: ["conditionName", "confidence", "description", "recommendations"],
          }
        },
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Error during skin analysis:", error);
      res.status(500).json({ error: error.message || "Internal server error during skin analysis." });
    }
  });

  // End point: Compare lesion progression
  app.post("/api/compare", async (req, res) => {
    try {
      const { image1, image2 } = req.body;
      if (!image1 || !image1.data || !image1.mimeType || !image2 || !image2.data || !image2.mimeType) {
        res.status(400).json({ error: "Missing image1 or image2 data in request body." });
        return;
      }

      const ai = getGeminiClient();
      const imagePart1 = {
        inlineData: {
          data: image1.data,
          mimeType: image1.mimeType,
        }
      };
      const imagePart2 = {
        inlineData: {
          data: image2.data,
          mimeType: image2.mimeType,
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          parts: [
            { text: 'This is the first image (before):' },
            imagePart1,
            { text: 'This is the second image (after):' },
            imagePart2,
            { text: 'Please compare these two images of the same skin lesion and analyze the changes over time.' }
          ],
        },
        config: {
          systemInstruction: COMPARISON_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              changeSummary: { type: Type.STRING, description: "A summary of the overall change (e.g., 'Shows signs of improvement', 'Appears to have worsened')." },
              keyObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of specific visual changes observed between the two images."
              },
              recommendation: { type: Type.STRING, description: "A safe, general recommendation based on the observed changes, as per system instruction." },
              updatedConditionAssessment: { type: Type.STRING, description: "A conclusive, updated assessment of the condition based on the changes observed (e.g., 'Condition appears stable', 'Signs of resolution', 'Worsening of condition noted')." },
              postComparisonCondition: { type: Type.STRING, description: "The most likely name of the skin condition after comparing both images." },
            },
            required: ["changeSummary", "keyObservations", "recommendation", "updatedConditionAssessment", "postComparisonCondition"],
          }
        },
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Error during lesion comparison:", error);
      res.status(500).json({ error: error.message || "Internal server error during lesion comparison." });
    }
  });

  // Serve static UI assets or mount Vite hot-reload middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DermDetect AI Server actively listening on port ${PORT}`);
  });
}

startServer();
