import { GoogleGenAI } from "@google/genai";

// Initialize AI with the API key from environment variables
// Fallback to avoid crash on load if key is missing
const apiKey = process.env.API_KEY || 'dummy_key';
const ai = new GoogleGenAI({ apiKey });

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 * 
 * @param base64Image The base64 string of the image to edit (can include data URI prefix).
 * @param prompt The text prompt describing the edit.
 * @returns A Promise resolving to the base64 string of the generated image (including data URI prefix), or null if generation fails.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  // 1. Prepare Data: Clean base64 string and extract MIME type
  // Handle cases with or without "data:image/xyz;base64," prefix
  let base64Data = base64Image;
  let mimeType = 'image/jpeg'; // Default

  if (base64Image.includes(',')) {
    const parts = base64Image.split(',');
    base64Data = parts[1];

    // Extract mime type from header "data:image/png;base64"
    const header = parts[0];
    const match = header.match(/:(.*?);/);
    if (match) {
      mimeType = match[1];
    }
  }

  try {
    // 2. Call API
    // Using gemini-2.5-flash-image for editing tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // 3. Extract Image Result
    // The response may contain multiple parts, we scan for the image part.
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedMimeType = part.inlineData.mimeType || 'image/png';
          const generatedBase64 = part.inlineData.data;
          return `data:${generatedMimeType};base64,${generatedBase64}`;
        }
      }
    }

    console.warn("Gemini response did not contain an inline image.");
    return null;

  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};