/**
 * Service for interacting with Google Gemini API
 * Used for OCR and text extraction from poetry photos/docs
 */

const GEMINI_API_KEY = "AIzaSyB3EcF1BTN2KXQWfsdq0GOEIXz2qZAd_Ws";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const digitalizePoetry = async (file) => {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = "Digitaliza el texto de esta imagen o documento. Si es una poesía, mantén el formato original con sus versos y estrofas. Devuelve solo el texto digitalizado.";

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data.split(',')[1] // Remove prefix
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error al procesar con IA");
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
