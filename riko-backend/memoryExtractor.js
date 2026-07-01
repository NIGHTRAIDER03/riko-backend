import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXTRACTOR_PROMPT = `
You are an observational subsystem for Riko, an AI assistant.
Analyze the following user message. Does the user state any facts about themselves, their preferences, their routine, or their environment?
If YES, extract the facts as a concise bulleted list.
If NO, output exactly "NO_NEW_FACTS".
Do not output conversational text.
`;

export async function extractMemories(userMessage) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Message: "${userMessage}"`,
            config: {
                systemInstruction: EXTRACTOR_PROMPT,
                temperature: 0.1
            }
        });
        
        const result = response.text.trim();
        if (result === 'NO_NEW_FACTS' || result === '') {
            return [];
        }
        
        // Parse bullets into an array
        const facts = result.split('\n')
            .map(line => line.replace(/^[-*]\s*/, '').trim())
            .filter(line => line.length > 0);
            
        return facts;
    } catch (error) {
        console.error("Memory Extraction Failed:", error);
        return [];
    }
}
