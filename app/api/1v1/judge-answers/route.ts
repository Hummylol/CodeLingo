import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Hard deterministic pre-scorer.
 * Returns a maximum score cap for a given answer [0-100].
 * The AI score will be clamped to min(aiScore, cap).
 *
 * Cap rules:
 *  0  – cheating marker, empty, or pure gibberish (<20 chars with no code tokens)
 *  15 – answer that has no recognisable programming keywords at all
 *  50 – answer that is very short (< 50 meaningful chars after trimming)
 * 100 – normal answer (let the AI decide)
 */
function determinisitcScoreCap(answer: string): number {
    const trimmed = (answer ?? "").trim();

    // Cheating-detected marker injected by the tab-out enforcement
    if (trimmed.startsWith("// CHEATING DETECTED")) return 0;

    // Completely empty
    if (trimmed.length === 0) return 0;

    // Pure gibberish: very short and contains no code-like characters
    // Code typically has at least one of: brackets, operators, keywords, semicolons
    const hasCodeTokens = /[{}()\[\];=><+\-*/\\|&!~^%@#]/.test(trimmed) ||
        /\b(if|else|for|while|return|def|function|class|import|var|let|const|int|string|void|public|private|true|false|null|undefined|print|cout|scanf|printf)\b/i.test(trimmed);

    if (!hasCodeTokens) {
        // No code tokens at all: if also very short, it's definitely garbage
        if (trimmed.length < 30) return 0;
        // Longer text without code – might be pseudocode, but still poor
        return 10;
    }

    // Has code tokens but very short (incomplete snippet, not a real solution)
    if (trimmed.length < 50) return 15;

    // Seems like actual code, let the AI judge properly
    return 100;
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
        }

        const { question, hostAnswer, hostTime, guestAnswer, guestTime } = await req.json();
        if (!question || !hostAnswer || !guestAnswer) {
            return NextResponse.json({ error: "question, hostAnswer, guestAnswer are required" }, { status: 400 });
        }

        // ── Pre-score cap: deterministic pass before the AI ────────────────────
        const hostCap = determinisitcScoreCap(hostAnswer);
        const guestCap = determinisitcScoreCap(guestAnswer);

        const hostMins = Math.floor((hostTime ?? 0) / 60);
        const hostSecs = (hostTime ?? 0) % 60;
        const guestMins = Math.floor((guestTime ?? 0) / 60);
        const guestSecs = (guestTime ?? 0) % 60;

        const prompt = `You are a fair and strict competitive programming judge evaluating two players in a 1v1 coding battle.

## Problem
${question.title}
${question.description}

## Player 1 (Host) Answer
Time taken: ${hostMins}m ${hostSecs}s
\`\`\`
${hostAnswer}
\`\`\`

## Player 2 (Guest) Answer
Time taken: ${guestMins}m ${guestSecs}s
\`\`\`
${guestAnswer}
\`\`\`

## Your Task
Evaluate both answers on a scale from 0 to 100 based on:
1. Correctness (does it solve the problem correctly?)
2. Code quality (is it clean, readable, well-structured?)
3. Time complexity (is the algorithm efficient?)
4. Time taken (faster submission is a tiebreaker when answers are equal)

## STRICT SCORING RULES - IMPORTANT
- If the code is just gibberish (e.g., "abcd", random letters), empty, or uncompilable, the score MUST be 0.
- If the code has major syntax errors or entirely misses the logic, the score MUST be between 0-10.
- If the code is a very poor or incomplete attempt, it MUST score below 30.
- Only award >70 points if the solution is structurally complete, compiles, and logically solves the problem.
- Do NOT be lenient. Be a harsh, uncompromising judge. If it's a completely wrong answer, give it a 0.

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "winner": "host",
  "hostScore": 85,
  "guestScore": 70,
  "reasoning": "2-3 sentence explanation of your decision",
  "hostFeedback": "specific feedback on host's solution",
  "guestFeedback": "specific feedback on guest's solution"
}

winner must be exactly one of: "host", "guest", or "tie".`;

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
                    generationConfig: { maxOutputTokens: 1024, temperature: 0.1, topP: 0.9 },
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

        raw = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        let verdict;
        try {
            verdict = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: "Failed to parse verdict JSON", raw }, { status: 500 });
        }

        // ── Post-process: clamp AI scores with our deterministic caps ──────────
        const rawHostScore = typeof verdict.hostScore === "number" ? verdict.hostScore : 0;
        const rawGuestScore = typeof verdict.guestScore === "number" ? verdict.guestScore : 0;

        const clampedHostScore = Math.min(rawHostScore, hostCap);
        const clampedGuestScore = Math.min(rawGuestScore, guestCap);

        // Recalculate winner based on clamped scores
        let recalculatedWinner: "host" | "guest" | "tie";
        if (clampedHostScore > clampedGuestScore) recalculatedWinner = "host";
        else if (clampedGuestScore > clampedHostScore) recalculatedWinner = "guest";
        else recalculatedWinner = "tie";

        // Override caps feedback when answer is clearly invalid
        const hostFeedback = hostCap === 0
            ? (verdict.hostFeedback || "") + " [Score overridden to 0: answer is empty, gibberish, or cheating was detected.]"
            : verdict.hostFeedback;
        const guestFeedback = guestCap === 0
            ? (verdict.guestFeedback || "") + " [Score overridden to 0: answer is empty, gibberish, or cheating was detected.]"
            : verdict.guestFeedback;

        verdict = {
            ...verdict,
            hostScore: clampedHostScore,
            guestScore: clampedGuestScore,
            winner: recalculatedWinner,
            hostFeedback,
            guestFeedback,
        };

        return NextResponse.json({ verdict });
    } catch (err: unknown) {
        const error = err as { message?: string };
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
