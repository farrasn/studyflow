const express = require('express');
const router = express.Router();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

router.post('/generate', async (req, res) => {
  const { topic, lang } = req.body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ error: 'Topik harus diisi.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[API] GEMINI_API_KEY not found in .env');
    return res.status(500).json({ error: 'API key belum dikonfigurasi di server.' });
  }

  const language = lang === 'en' ? 'English' : 'Indonesian';

  const prompt = `You are a learning roadmap generator. Generate a structured learning roadmap for: "${topic.trim()}".
Return ONLY valid JSON matching this exact structure. No markdown, no code fences, no extra text. No emojis. All content in ${language}.

{
  "id": "topic-slug",
  "title": "Roadmap Title",
  "description": "Brief description",
  "categories": [
    {
      "name": "Category Name",
      "nodes": [
        {
          "id": "unique-id",
          "title": "Node Title",
          "description": "What to learn and why",
          "resources": [{ "name": "Resource", "url": "https://..." }],
          "project": "Practice project idea",
          "estimatedTime": "2 weeks"
        }
      ]
    }
  ]
}

Rules:
- At least 3 categories, each with at least 3 nodes
- Use real, free learning resources (official docs, YouTube, freeCodeCamp)
- Logical learning progression from beginner to advanced
- CRITICAL: If the topic is nonsensical, inappropriate, or unrecognized, DO NOT apologize or output an error. You MUST fallback to generating a roadmap about "Basic Research Skills" or "General Knowledge", and you MUST still strictly follow the exact JSON structure above. Never break the JSON format.`;

  console.log(`[API] Generating roadmap for: "${topic}" (${language})`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[API] Gemini returned ${response.status}:`, errBody);
      return res.status(502).json({ 
        error: `Gemini API error (${response.status}). Coba lagi.` 
      });
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates.length) {
      console.error('[API] No candidates in response:', JSON.stringify(data));
      return res.status(502).json({ error: 'Gemini tidak mengembalikan hasil. Coba topik lain.' });
    }

    let text = data.candidates[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[API] Empty text in candidate:', JSON.stringify(data.candidates[0]));
      return res.status(502).json({ error: 'Respons kosong dari Gemini. Coba lagi.' });
    }

    // Clean markdown fences if present
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    }

    let roadmap;
    try {
      roadmap = JSON.parse(text);
    } catch (parseErr) {
      console.error('[API] JSON parse failed:', parseErr.message);
      console.error('[API] Raw text:', text.substring(0, 200));
      return res.status(502).json({ error: 'Format respons tidak valid. Coba lagi.' });
    }

    // Validate structure
    if (!roadmap.categories || !Array.isArray(roadmap.categories) || !roadmap.categories.length) {
      console.error('[API] Invalid roadmap structure - no categories');
      return res.status(502).json({ error: 'Struktur roadmap tidak valid. Coba lagi.' });
    }

    console.log(`[API] Success! "${roadmap.title}" - ${roadmap.categories.length} categories`);
    return res.json(roadmap);

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error('[API] Request timed out after 90s');
      return res.status(504).json({ error: 'Request timeout. Gemini terlalu lama merespons, coba lagi.' });
    }
    console.error('[API] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
