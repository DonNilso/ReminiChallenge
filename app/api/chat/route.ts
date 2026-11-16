export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional: free-text chat replies from a real model via OpenRouter.
 * Only used when OPENROUTER_API_KEY is set; otherwise the prototype uses its scripted
 * replies. The model only writes the reply text; draft changes stay scripted.
 */
export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return Response.json({ reply: null, source: "script" });

  let body: { message?: string; context?: { look?: string; format?: string; photos?: number } };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad JSON" }, { status: 400 });
  }
  const message = String(body.message ?? "").slice(0, 500);
  if (!message) return Response.json({ reply: null, source: "script" });
  const ctx = body.context ?? {};

  const system = [
    "You are the assistant inside Remini Creator Studio, a mobile app that turns the user's own photos into ready-to-post content.",
    `Current draft: a ${ctx.format ?? "carousel"} in the "${ctx.look ?? "golden hour"}" aesthetic with ${ctx.photos ?? 6} of the user's photos.`,
    "Reply in one or two short, friendly sentences, like a stylish friend. No markdown, no lists.",
    "You can't post for the user; they post it themselves. Suggest concrete changes they can ask for (warmer, moodier, fewer photos, a Reel, another look).",
  ].join(" ");

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return Response.json({ reply: null, source: "script", error: `upstream ${res.status}` });
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = j.choices?.[0]?.message?.content?.trim();
    return Response.json({ reply: reply || null, source: reply ? "model" : "script" });
  } catch {
    return Response.json({ reply: null, source: "script" });
  }
}
