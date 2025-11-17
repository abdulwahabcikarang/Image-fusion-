import { GoogleGenAI, Type, Modality } from "@google/genai";

// Fix: Per coding guidelines, initialize GoogleGenAI with process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


/**
 * Analyzes a reference image and generates a detailed JSON prompt for its style.
 * @param imageBase64 The base64 encoded reference image.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to a JSON string describing the image style.
 */
export const generatePromptFromImage = async (imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    },
                    {
                        text: "Analyze this image in extreme detail. Create a JSON object describing its artistic style, subject, composition, lighting, color palette, and mood. This JSON will be used as a style guide for another AI to generate a new image."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        style: { type: Type.STRING, description: "e.g., 'photorealistic', 'oil painting', 'anime', 'art deco'" },
                        subject: { type: Type.STRING, description: "A detailed description of the main subject and background elements." },
                        composition: { type: Type.STRING, description: "e.g., 'centered', 'rule of thirds', 'dynamic angle'" },
                        lighting: { type: Type.STRING, description: "e.g., 'soft morning light', 'dramatic backlighting', 'neon glow'" },
                        colors: { type: Type.STRING, description: "Description of the color palette, e.g., 'warm palette with dominant oranges and yellows'." },
                        mood: { type: Type.STRING, description: "The overall mood or feeling, e.g., 'serene', 'nostalgic', 'energetic'." }
                    },
                    required: ["style", "subject", "composition", "lighting", "colors", "mood"]
                }
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating prompt from image:", error);
        throw new Error("Failed to analyze the reference image. The content may have been blocked.");
    }
};

/**
 * Generates four new images by combining a style prompt and a subject image.
 * This method provides the subject image directly to the model to improve facial similarity.
 * @param stylePrompt The detailed JSON prompt describing the desired style.
 * @param subjectImageBase64 The base64 encoded subject image.
 * @param subjectMimeType The MIME type of the subject image.
 * @param aspectRatio The desired aspect ratio for the output images (requested via text prompt).
 * @returns A promise that resolves to an array of base64 encoded strings of the generated images.
 */
export const generateFusedImages = async (
    stylePrompt: string, 
    subjectImageBase64: string, 
    subjectMimeType: string,
    aspectRatio: string
): Promise<string[]> => {

    const finalPrompt = `Instructions:
1.  **Primary Goal:** Recreate the person from the provided image within a new setting.
2.  **Person Replication:** The person's face, body, and clothing must be an EXACT replica of the person in the provided image. DO NOT change their appearance in any way. This is the most important rule.
3.  **New Scene:** Generate a new background and scene that strictly adheres to the style guide below.
4.  **Integration:** Seamlessly blend the person into the new scene, ensuring lighting and shadows on the person match the new environment.
5.  **Aspect Ratio:** The final image must have an aspect ratio of ${aspectRatio}.

**Style Guide (for the new scene):**
${stylePrompt}`;

    const generateSingleImage = async (): Promise<string> => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: subjectImageBase64,
                            mimeType: subjectMimeType,
                        },
                    },
                    {
                        text: finalPrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("Image generation failed, no image data found in response.");
    };

    const imagePromises = [
        generateSingleImage(),
        generateSingleImage(),
        generateSingleImage(),
        generateSingleImage()
    ];
    
    try {
        const base64Images = await Promise.all(imagePromises);
        return base64Images;
    } catch (error) {
        console.error("Error generating final images:", error);
        throw new Error("Failed to generate the final images. The content may have been blocked or the model failed.");
    }
};