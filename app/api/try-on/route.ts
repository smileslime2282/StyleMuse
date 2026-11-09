import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI is not connected." },
        { status: 503 }
      );
    }

    const form = await req.formData();
    const photo = form.get("photo");
    const hairstyle = String(form.get("hairstyle") || "").trim();

    if (!(photo instanceof File) || !photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid photo." },
        { status: 400 }
      );
    }

    if (photo.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo must be smaller than 8 MB." },
        { status: 413 }
      );
    }

    if (!hairstyle || hairstyle.length > 300) {
      return NextResponse.json(
        { error: "Please select a valid hairstyle." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await photo.arrayBuffer());
    const imageFile = await toFile(bytes, "photo.jpg", {
      type: photo.type,
    });

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await client.images.edit({
      model: "gpt-image-2",
      image: imageFile,
      prompt: `Edit this person's photo to show this hairstyle: ${hairstyle}.

      Create a realistic virtual hairstyle try-on.
      Change only the person's hair.
      Preserve their face, facial features, expression,
      skin tone, identity, clothing and background.
      Make the hairstyle look natural and photorealistic.
      Do not add text or accessories.`,
    });

    const image = result.data?.[0]?.b64_json;

    if (!image) {
      throw new Error("No generated image returned.");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${image}`,
    });
  } catch (error) {
    console.error("StyleMuse try-on failed:", error);

    return NextResponse.json(
      { error: "Virtual Try-On failed. Please try again." },
      { status: 500 }
    );
  }
}
