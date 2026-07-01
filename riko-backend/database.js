import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder';
export const supabase = createClient(supabaseUrl, supabaseKey);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate Embedding using Gemini
export async function getEmbedding(text) {
    try {
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text
        });
        return response.embeddings[0].values;
    } catch (error) {
        console.error("Embedding Failed:", error);
        return null;
    }
}

export async function saveMemory(factText) {
    const embedding = await getEmbedding(factText);
    if (!embedding) return;

    const { error } = await supabase
        .from('memories')
        .insert({ content: factText, embedding: embedding });
        
    if (error) console.error("Error saving memory:", error);
}

export async function searchMemories(queryText, limit = 5) {
    const queryEmbedding = await getEmbedding(queryText);
    if (!queryEmbedding) return [];

    // Supabase RPC call for pgvector match_memories function
    const { data, error } = await supabase.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
    });

    if (error) {
        console.error("Error searching memories:", error);
        return [];
    }
    return data.map(row => row.content);
}
