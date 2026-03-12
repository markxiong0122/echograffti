import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Lazy-init clients to avoid build-time errors when env vars are absent
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const ai = getAI();

    const { prompt, latitude, longitude, creator } = await request.json();

    if (!prompt || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "prompt, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const styledPrompt = `isolated graffiti sticker / spray-paint tag only, no wall, no room, no background, transparent background, cutout decal style, paint drips, gritty spray texture, no readable text, no letters: "${prompt}"`;

const result = await ai.images.generate({
  model: "gpt-image-1",
  prompt: styledPrompt,
  size: "1024x1024",
  background: "transparent",
  output_format: "png",
  quality: "medium",
});

const imageData = result.data?.[0]?.b64_json;
if (!imageData) {
  return NextResponse.json(
    { error: "No image data returned from AI" },
    { status: 502 }
  );
}
const mimeType = "image/png";

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${crypto.randomUUID()}.png`;
    const buffer = Buffer.from(imageData, "base64");

    const { error: uploadError } = await supabase.storage
      .from("graffiti-images")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("graffiti-images")
      .getPublicUrl(fileName);

    // Insert graffiti record
    const { data: graffiti, error: insertError } = await supabase
      .from("graffiti")
      .insert([
        {
          prompt,
          image_url: urlData.publicUrl,
          latitude,
          longitude,
          creator: creator || "Anonymous",
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save graffiti" },
        { status: 500 }
      );
    }

    return NextResponse.json(graffiti);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
