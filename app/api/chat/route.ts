import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const { messages, languageId, eli5, topic } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrefix = `You are a helpful coding tutor inside a mobile app.\n` +
      `Keep answers concise and actionable.\n` +
      (languageId ? `Learner is studying ${languageId}.\n` : "") +
      (topic ? `The current topic is: ${topic}.\n` : "") +
      (eli5 ? `EXPLAIN LIKE I'M FIVE: Use simple analogies, avoid jargon, short sentences.\n` : "") +
      `If code is needed, keep snippets short.`;

    const tried: string[] = [];

    async function listModels(version: "v1" | "v1beta") {
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
      const r = await fetch(url);
      if (!r.ok) return { version, models: [] as any[] };
      const j = await r.json();
      return { version, models: Array.isArray(j.models) ? j.models : [] };
    }

    // Discover available models and pick a supported one
    const envPreferred = (process.env.GEMINI_MODEL || "").trim();
    const [v1List, v1bList] = await Promise.all([listModels("v1"), listModels("v1beta")]);
    const all = [v1List, v1bList];

    function pickModel() {
      const preference = [
        // Prefer 2.x lightweight first
        /^models\/gemini-2\.\d+-flash-lite/i,
        /^models\/gemini-2\.\d+-flash/i,
        /^models\/gemini-2\.\d+-pro/i,
        /^models\/gemini-2\.5-flash-lite/i,
        /^models\/gemini-2\.5-flash/i,
        // Legacy ordering
        /^models\/gemini-1\.5-flash-8b/i,
        /^models\/gemini-1\.5-flash-002/i,
        /^models\/gemini-1\.5-flash/i,
        /^models\/gemini-1\.5-pro-002/i,
        /^models\/gemini-1\.5-pro/i,
        /^models\/gemini-pro/i,
      ];

      // If envPreferred is set, try to find it first in either list
      if (envPreferred) {
        for (const { version, models } of all) {
          const found = models.find((m: any) => m.name?.endsWith(`/${envPreferred}`) || m.name === envPreferred || m.name === `models/${envPreferred}`);
          if (found && (found.supportedGenerationMethods || []).includes("generateContent")) {
            return { version, modelName: found.name.replace(/^models\//, "") } as const;
          }
        }
      }

      // Otherwise pick the first preferred pattern that supports generateContent
      for (const { version, models } of all) {
        for (const pat of preference) {
          const found = models.find((m: any) => pat.test(m.name) && (m.supportedGenerationMethods || []).includes("generateContent"));
          if (found) return { version, modelName: found.name.replace(/^models\//, "") } as const;
        }
      }

      // Fallback: any that supports generateContent
      for (const { version, models } of all) {
        const found = models.find((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"));
        if (found) return { version, modelName: found.name.replace(/^models\//, "") } as const;
      }
      return null;
    }

    const picked = pickModel();
    if (!picked) {
      return NextResponse.json({ error: "No Gemini models with generateContent available for this API key." }, { status: 500 });
    }

    // Build ordered candidate list prioritizing lighter/faster models first
    const candidates: { version: "v1" | "v1beta"; modelName: string }[] = [];
    const addCandidate = (v: "v1" | "v1beta", name: string) => {
      const key = `${v}/${name}`;
      if (!candidates.find(c => `${c.version}/${c.modelName}` === key)) candidates.push({ version: v, modelName: name });
    };
    // From lists, collect by preference
    const preferOrder = [
      /^gemini-2\.\d+-flash-lite/i,
      /^gemini-2\.\d+-flash/i,
      /^gemini-2\.\d+-pro/i,
      /^gemini-2\.5-flash-lite/i,
      /^gemini-2\.5-flash/i,
      /^gemini-1\.5-flash-8b/i,
      /^gemini-1\.5-flash-002/i,
      /^gemini-1\.5-flash/i,
      /^gemini-1\.5-pro-002/i,
      /^gemini-1\.5-pro/i,
      /^gemini-pro/i,
    ];
    for (const { version, models } of [v1List, v1bList]) {
      for (const pat of preferOrder) {
        for (const m of models) {
          const compact = String(m.name || '').replace(/^models\//, '');
          if (pat.test(compact) && (m.supportedGenerationMethods || []).includes("generateContent")) addCandidate(version as any, compact);
        }
      }
    }
    // Ensure picked is first
    addCandidate(picked.version, picked.modelName);

    async function callOnce(version: "v1" | "v1beta", modelName: string) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
      tried.push(`${version}/${modelName}`);
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: { maxOutputTokens: 512, temperature: 0.2, topP: 0.9 },
          contents: [
            { role: "user", parts: [{ text: systemPrefix }] },
            ...messages.map((m: ChatMessage) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          ]
        }),
      });
      return r;
    }

    async function callWithRetries(version: "v1" | "v1beta", modelName: string) {
      const maxRetries = 2;
      let attempt = 0;
      while (attempt <= maxRetries) {
        const r = await callOnce(version, modelName);
        if (r.ok) return r;
        // Check overloaded conditions
        const status = r.status;
        let msg = "";
        try { const j = await r.clone().json(); msg = j?.error?.message || j?.message || ""; } catch { try { msg = await r.clone().text(); } catch { msg = ""; } }
        const overloaded = status === 429 || status === 503 || /overloaded/i.test(msg);
        if (!overloaded) return r;
        // Backoff
        const waitMs = 300 * Math.pow(2, attempt);
        await new Promise(res => setTimeout(res, waitMs));
        attempt += 1;
      }
      return callOnce(version, modelName);
    }

    // Try candidates until one succeeds
    let resp: Response | null = null;
    for (const c of candidates) {
      resp = await callWithRetries(c.version, c.modelName);
      if (resp.ok) break;
    }

    if (!resp || !resp.ok) {
      let detail: any;
      try { detail = await resp?.json(); } catch { detail = await resp?.text(); }
      const message = detail?.error?.message || detail?.message || `Gemini error (tried ${tried.join(", ")})`;
      return NextResponse.json({ error: message, detail }, { status: 500 });
    }

    const data = await resp.json();
    // Safe parse
    let assistantText = "Sorry, could not generate a response.";
    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      const first = data.candidates[0];
      if (first.content && Array.isArray(first.content.parts) && first.content.parts.length > 0) {
        assistantText = first.content.parts[0].text ?? assistantText;
      }
    }

    return NextResponse.json({ message: { role: "assistant", content: assistantText } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
