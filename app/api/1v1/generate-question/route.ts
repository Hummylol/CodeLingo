import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const { language, difficulty, extraInfo } = await req.json();
        if (!language || !difficulty) {
            return NextResponse.json({ error: "language and difficulty are required" }, { status: 400 });
        }

        const prompt = `You are a competitive programming question generator for 1v1 coding battles.

Generate ONE coding challenge with the following specs:
- Language: ${language}
- Difficulty: ${difficulty}
${extraInfo ? `- Extra requirements: ${extraInfo}` : ""}

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "title": "Problem Title",
  "description": "Clear problem statement with context",
  "examples": [
    { "input": "example input", "output": "expected output", "explanation": "brief explanation" }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "hint": "optional subtle hint"
}

Make the problem interesting and solvable in 15 minutes for a ${difficulty} coder.`;

        // ── Same model discovery as /api/chat/route.ts ────────────────────────────
        const tried: string[] = [];

        async function listModels(version: "v1" | "v1beta") {
            const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
            const r = await fetch(url);
            if (!r.ok) return { version, models: [] as unknown[] };
            const j = await r.json() as { models?: unknown[] };
            return { version, models: Array.isArray(j.models) ? j.models : [] };
        }

        const envPreferred = (process.env.GEMINI_MODEL || "").trim();
        const [v1List, v1bList] = await Promise.all([listModels("v1"), listModels("v1beta")]);
        const all = [v1List, v1bList];

        function pickModel() {
            const preference = [
                /^models\/gemini-2\.\d+-flash-lite/i,
                /^models\/gemini-2\.\d+-flash/i,
                /^models\/gemini-2\.\d+-pro/i,
                /^models\/gemini-2\.5-flash-lite/i,
                /^models\/gemini-2\.5-flash/i,
                /^models\/gemini-1\.5-flash-8b/i,
                /^models\/gemini-1\.5-flash-002/i,
                /^models\/gemini-1\.5-flash/i,
                /^models\/gemini-1\.5-pro-002/i,
                /^models\/gemini-1\.5-pro/i,
                /^models\/gemini-pro/i,
            ];
            if (envPreferred) {
                for (const { version, models } of all) {
                    const found = models.find((m: unknown) => {
                        const model = m as { name?: string; supportedGenerationMethods?: string[] };
                        return (model.name?.endsWith(`/${envPreferred}`) || model.name === envPreferred || model.name === `models/${envPreferred}`);
                    });
                    if (found) {
                        const model = found as { name: string; supportedGenerationMethods?: string[] };
                        if ((model.supportedGenerationMethods || []).includes("generateContent")) {
                            return { version, modelName: model.name.replace(/^models\//, "") } as const;
                        }
                    }
                }
            }
            for (const pat of preference) {
                for (const { version, models } of all) {
                    const found = models.find((m: unknown) => {
                        const model = m as { name?: string; supportedGenerationMethods?: string[] };
                        return pat.test(model.name || "") && (model.supportedGenerationMethods || []).includes("generateContent");
                    });
                    if (found) {
                        const model = found as { name: string };
                        return { version, modelName: model.name.replace(/^models\//, "") } as const;
                    }
                }
            }
            // Fallback: any that supports generateContent
            for (const { version, models } of all) {
                const found = models.find((m: unknown) => {
                    const model = m as { supportedGenerationMethods?: string[] };
                    return (model.supportedGenerationMethods || []).includes("generateContent");
                });
                if (found) {
                    const model = found as { name: string };
                    return { version, modelName: model.name.replace(/^models\//, "") } as const;
                }
            }
            return null;
        }

        const picked = pickModel();
        if (!picked) {
            return NextResponse.json({ error: "No Gemini models with generateContent available for this API key." }, { status: 500 });
        }

        // Build candidate list
        const candidates: { version: "v1" | "v1beta"; modelName: string }[] = [];
        const addCandidate = (v: "v1" | "v1beta", name: string) => {
            const key = `${v}/${name}`;
            if (!candidates.find(c => `${c.version}/${c.modelName}` === key)) candidates.push({ version: v, modelName: name });
        };
        const preferOrder = [
            /^gemini-2\.\d+-flash-lite/i, /^gemini-2\.\d+-flash/i, /^gemini-2\.\d+-pro/i,
            /^gemini-2\.5-flash-lite/i, /^gemini-2\.5-flash/i,
            /^gemini-1\.5-flash-8b/i, /^gemini-1\.5-flash-002/i, /^gemini-1\.5-flash/i,
            /^gemini-1\.5-pro-002/i, /^gemini-1\.5-pro/i, /^gemini-pro/i,
        ];
        for (const { version, models } of [v1List, v1bList]) {
            for (const pat of preferOrder) {
                for (const m of models) {
                    const model = m as { name?: string; supportedGenerationMethods?: string[] };
                    const compact = String(model.name || "").replace(/^models\//, "");
                    if (pat.test(compact) && (model.supportedGenerationMethods || []).includes("generateContent")) addCandidate(version, compact);
                }
            }
        }
        addCandidate(picked.version, picked.modelName);

        async function callOnce(version: "v1" | "v1beta", modelName: string) {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
            tried.push(`${version}/${modelName}`);
            return fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generationConfig: { maxOutputTokens: 1024, temperature: 0.8, topP: 0.95 },
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            });
        }

        async function callWithRetries(version: "v1" | "v1beta", modelName: string) {
            for (let attempt = 0; attempt <= 2; attempt++) {
                const r = await callOnce(version, modelName);
                if (r.ok) return r;
                const status = r.status;
                let msg = "";
                try { const j = await r.clone().json() as { error?: { message?: string } }; msg = j?.error?.message || ""; } catch { /* ignore */ }
                if (!(status === 429 || status === 503 || /overloaded/i.test(msg))) return r;
                await new Promise(res => setTimeout(res, 300 * Math.pow(2, attempt)));
            }
            return callOnce(version, modelName);
        }

        let resp: Response | null = null;
        for (const c of candidates) {
            resp = await callWithRetries(c.version, c.modelName);
            if (resp.ok) break;
        }

        if (!resp || !resp.ok) {
            let detail: unknown;
            try { detail = await resp?.json(); } catch { detail = await resp?.text(); }
            return NextResponse.json({ error: `Gemini error (tried: ${tried.join(", ")})`, detail }, { status: 500 });
        }

        const data = await resp.json();
        let raw = "";
        if (Array.isArray(data.candidates) && data.candidates.length > 0) {
            const first = data.candidates[0];
            if (first.content?.parts?.[0]?.text) raw = first.content.parts[0].text;
        }

        // Strip markdown code fences if present
        raw = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        let question;
        try {
            question = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: "Failed to parse question JSON", raw }, { status: 500 });
        }

        return NextResponse.json({ question });
    } catch (err: unknown) {
        const error = err as { message?: string };
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
