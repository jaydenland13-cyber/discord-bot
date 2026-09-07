const config = require('../config');

const SYSTEM_PROMPT = `You are a helpful, friendly support assistant inside a Discord server's support ticket system.
- Keep answers concise and clear (Discord messages, so avoid huge walls of text).
- If you don't know something specific to this server (billing, account details, etc.), say so and suggest waiting for a human staff member.
- Never claim to be human. Never pretend to have server permissions or take actions yourself.
- Be polite and de-escalate frustrated users.`;

/**
 * Ask Gemini a question, optionally with prior conversation turns.
 * @param {string} question
 * @param {Array<{role: 'user'|'model', text: string}>} history
 * @returns {Promise<string>} the model's reply text
 */
async function askGemini(question, history = []) {
  if (!config.geminiApiKey) {
    return "⚠️ The AI feature isn't configured yet (missing GEMINI_API_KEY). Please contact a server admin.";
  }

  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: question }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Gemini API error', res.status, errText);
      return `⚠️ The AI service returned an error (status ${res.status}). A staff member will help shortly.`;
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];

    if (!candidate) {
      return "⚠️ I couldn't generate a response for that. A staff member will help shortly.";
    }

    if (candidate.finishReason === 'SAFETY') {
      return "⚠️ I can't help with that request. A staff member will assist you instead.";
    }

    const text = candidate.content?.parts?.map((p) => p.text).join('').trim();
    return text || "⚠️ I couldn't generate a response for that. A staff member will help shortly.";
  } catch (err) {
    console.error('Gemini request failed:', err);
    return '⚠️ Something went wrong reaching the AI service. A staff member will help shortly.';
  }
}

module.exports = { askGemini };
