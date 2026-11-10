
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI assistant is not configured." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const messages = Array.isArray(body.messages)
      ? body.messages.slice(-12)
      : [];

    const language = String(body.language || "en");

    if (
      messages.length === 0 ||
      messages.some(
        (m: any) =>
          !m ||
          !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" ||
          m.content.length > 1000
      )
    ) {
      return NextResponse.json(
        { error: "Please send a valid message." },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `You are StyleMuse, a friendly professional AI hairstylist. Reply in the user's language (language code: ${language}). Help with hairstyles, hair care, styling techniques and salon communication. Be practical, friendly and concise. Ask one useful follow-up question when needed. Do not identify people in photos, diagnose medical conditions, or recommend dangerous treatments.`,
      input: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      throw new Error("Empty response");
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("StyleMuse chat error:", error);

    return NextResponse.json(
      { error: "The AI stylist could not reply. Please try again." },
      { status: 500 }
    );
  }
}
