import type { AnalysisResult, ComparisonResult } from '../types';

/**
 * Utility to convert a File to a raw base64 encoded string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Extract the base64 portion from the Data URL
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error("Failed to parse file into a valid base64 string."));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("File reading error."));
    reader.readAsDataURL(file);
  });
};

/**
 * Calls proxy API route to analyze a single skin lesion image with optional coordinate tags or annotations
 */
export const analyzeSkinCondition = async (
  imageFile: File | string,
  boundingBox?: { x1: number; y1: number; x2: number; y2: number } | null,
  pins?: Array<{ x: number; y: number; label: string }>,
  practitionerNotes?: string
): Promise<AnalysisResult> => {
  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (typeof imageFile === 'string') {
      if (imageFile.startsWith('data:')) {
        const parts = imageFile.split(',');
        base64Data = parts[1];
        const mimePart = parts[0].match(/data:(.*?);/);
        if (mimePart) {
          mimeType = mimePart[1];
        }
      } else {
        base64Data = imageFile;
      }
    } else {
      base64Data = await fileToBase64(imageFile);
      mimeType = imageFile.type;
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: {
          data: base64Data,
          mimeType,
        },
        boundingBox,
        pins,
        practitionerNotes
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status code ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Client error during analyzeSkinCondition:", error);
    throw new Error(error.message || "An unexpected error occurred while communicating with the analysis server. Please try again.");
  }
};

/**
 * Calls proxy API route to compare progression between two lesion images
 */
export const compareLesions = async (imageFile1: File, imageFile2: File): Promise<ComparisonResult> => {
  try {
    const [base64_1, base64_2] = await Promise.all([
      fileToBase64(imageFile1),
      fileToBase64(imageFile2),
    ]);

    const response = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image1: {
          data: base64_1,
          mimeType: imageFile1.type,
        },
        image2: {
          data: base64_2,
          mimeType: imageFile2.type,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status code ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Client error during compareLesions:", error);
    throw new Error(error.message || "An unexpected error occurred while communicating with the comparison server. Please try again.");
  }
};
