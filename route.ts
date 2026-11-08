import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI is not connected yet. Add OPENAI_API_KEY to your server environment and restart the app." }, { status: 503 });
    }
    const form = await req.formData();
    const photo = form.get("photo");
    const profileRaw = form.get("profile");
    const language = String(form.get("language") || "en");
    if (!(photo instanceof File) || !photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload a valid image." }, { status: 400 });
    }
    if (photo.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Please use an image smaller than 8 MB." }, { status: 413 });
    }
    const profile = JSON.parse(String(profileRaw || "{}"));
    const bytes = Buffer.from(await photo.arrayBuffer());
    const dataUrl = `data:${photo.type};base64,${bytes.toString("base64")}`;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: `You are StyleMuse, a thoughtful and inclusive hair-styling assistant. Analyze only visible, relevant hair and styling attributes; do not identify the person, infer age, ethnicity, health, personality, or other sensitive traits. Do not claim exact biometric measurements. Face-shape observations are tentative, explain uncertainty, and never frame one face shape as better. User profile: ${JSON.stringify(profile)}. Respond in language code "${language}". Recommend one achievable hairstyle, explain why it may work, give 4-6 safe at-home styling steps, list 3-5 tools/products, and write a concise salon request. Adapt to hair texture, density, length and time budget. Include heat protection when heat tools are suggested; don't recommend chemical treatments. Return ONLY valid JSON with keys hairstyle, summary, why, steps (array), tools (array), salon_request. Keep wording encouraging, specific and practical.` },
          { type: "input_image", image_url: dataUrl, detail: "high" }
        ]
      }]
    });
    const text = response.output_text || "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("StyleMuse analysis failed", err);
    return NextResponse.json({ error: "Analysis failed. Please try another clear photo." }, { status: 500 });
  }
}
