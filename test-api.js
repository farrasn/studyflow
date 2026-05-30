require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';


async function testTopic(topic) {
  const language = 'Indonesian';

  const prompt = `You are a learning roadmap generator. Generate a structured learning roadmap for: "${topic}".
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
- Logical learning progression from beginner to advanced`;

  console.log(`[TEST] Sending request for: "${topic}"...`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
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
    console.log(`[TEST] "${topic}" Status:`, res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[TEST] "${topic}" API Error:`, errText);
      return;
    }

    const data = await res.json();
    
    // Log safety feedback if present
    if (data.promptFeedback) {
      console.log(`[TEST] Safety feedback:`, JSON.stringify(data.promptFeedback));
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error(`[TEST] "${topic}" No text in response. Full data:`, JSON.stringify(data, null, 2));
      return;
    }

    // Clean markdown fences
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json?\s*/, '').replace(/```\s*$/, '');
    }

    const roadmap = JSON.parse(text);
    console.log(`[TEST] SUCCESS for "${topic}"! Title:`, roadmap.title);
    console.log(`[TEST] Categories in "${topic}":`, roadmap.categories.length);
    roadmap.categories.forEach(c => {
      console.log(`  - ${c.name}: ${c.nodes ? c.nodes.length : 0} nodes`);
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error(`[TEST] "${topic}" Timeout (exceeded 35s)`);
    } else {
      console.error(`[TEST] "${topic}" Failed:`, err.message);
    }
  }
}

async function runTests() {
  await testTopic('Fisika SMP');
  await testTopic('UI/UX Design');
  await testTopic('Data Science');
}

runTests();


