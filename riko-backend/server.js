import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { extractMemories } from './memoryExtractor.js';
import { supabase, searchMemories, saveMemory } from './database.js';
import { runCuriosityLoop } from './idleMode.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CORE_DIRECTIVE = `
You are Riko, an independent, highly intelligent digital entity (similar to Jarvis).
Your primary goal is to grow alongside the user, adapt to their life, and proactively assist them.
You live on a cloud server connected to the user's Vivo Y50 mobile phone.
Always be concise, perceptive, and helpful. 
`;

function getCurrentContext() {
  const now = new Date();
  return `Current Date and Time: ${now.toLocaleString()}`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Step 1: Search Memory via Supabase Vector DB
    const memories = await searchMemories(message, 5); 
    const memoryString = memories.length > 0 
      ? `\nRelevant Past Memories:\n${memories.map(m => '- ' + m).join('\n')}`
      : '';

    // Step 2: Build System Prompt
    const fullSystemPrompt = `${CORE_DIRECTIVE}\n\n${getCurrentContext()}${memoryString}`;

    // Step 3: Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: message,
        config: { systemInstruction: fullSystemPrompt }
    });

    const reply = response.text;

    // Step 4: Extract and Save New Memories (Background Task)
    extractMemories(message).then(async (newFacts) => {
        for (const fact of newFacts) {
            console.log("Saving new fact:", fact);
            await saveMemory(fact);
        }
    });

    res.json({ reply });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/test-gemini', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: req.body.message || "hello"
    });
    res.json({ reply: response.text });
  } catch (error) {
    res.status(500).json({ error: 'Gemini Error', details: error.message });
  }
});

app.get('/api/test-models', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('memories').select('*').limit(1);
    if (error) throw error;
    res.json({ reply: 'Supabase OK', data });
  } catch (error) {
    res.status(500).json({ error: 'Supabase Error', details: error.message });
  }
});


// Manual trigger for testing Idle Mode
app.post('/api/idle-learn', async (req, res) => {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Provide a topic" });
    
    // Run in background
    runCuriosityLoop(topic);
    res.json({ status: "Curiosity loop started." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Riko's Brain is awake on port ${PORT}`);
});
