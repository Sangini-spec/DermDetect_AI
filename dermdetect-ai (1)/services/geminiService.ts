
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ComparisonResult } from '../types';

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


const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeSkinCondition = async (imageFile: File): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(imageFile);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        imagePart,
        { text: 'Please analyze this skin condition.' }
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

  try {
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as AnalysisResult;
    return result;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("The AI returned an unexpected response format. Please try again.");
  }
};

export const compareLesions = async (imageFile1: File, imageFile2: File): Promise<ComparisonResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart1 = await fileToGenerativePart(imageFile1);
    const imagePart2 = await fileToGenerativePart(imageFile2);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as ComparisonResult;
        return result;
    } catch (e) {
        console.error("Failed to parse Gemini comparison response:", response.text);
        throw new Error("The AI returned an unexpected response format for the comparison. Please try again.");
    }
};