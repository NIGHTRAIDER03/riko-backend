import { searchWeb } from './search.js';
import { saveMemory } from './database.js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runCuriosityLoop(topic) {
    console.log(`[Idle Mode] Riko is researching: ${topic}`);
    
    // 1. Search the web
    const searchResults = await searchWeb(topic);
    if (searchResults.length === 0) {
        console.log("[Idle Mode] Found nothing interesting.");
        return;
    }

    const combinedText = searchResults.join('\n');

    // 2. Ask Gemini to summarize into a single fact
    const prompt = `
    Based on the following search results about "${topic}", write a single, interesting, concise factual sentence.
    Results:
    ${combinedText}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        const newFact = response.text.trim();
        console.log(`[Idle Mode] Riko learned: ${newFact}`);
        
        // 3. Save to memory
        await saveMemory(newFact);
    } catch (error) {
        console.error("[Idle Mode] Failed to process research.", error);
    }
}
