import { NextResponse } from "next/server";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";
import { GAME_CONFIG } from "@/lib/consts";

// Initialize the Text-to-Speech client
// We explicitly pass the API Key to support the user's environment if GOOGLE_APPLICATION_CREDENTIALS is not set
const client = new TextToSpeechClient({
  apiKey: process.env.GEMINI_API_KEY, // Reuse the existing key variable
});

// Helper for type safety
type GenerateAudioRequest = {
  text: string;
};

export async function POST(request: Request) {
  try {
    const { text }: GenerateAudioRequest = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceName = GAME_CONFIG.AUDIO.VOICE || "es-ES-Neural2-A";
    const languageCode = voiceName.substring(0, 5); // e.g. "es-ES"

    const requestPayload: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text: text },
      voice: {
        languageCode: languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
      },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(requestPayload);

    if (!response.audioContent) {
      return NextResponse.json(
        { error: "No audio content received" },
        { status: 500 }
      );
    }

    // Return as base64 encoded string
    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString("base64");

    // Formatted for our frontend hooks
    const response_data = {
        base64Data: audioBase64,
        mimeType: "audio/mpeg"
    };

    return NextResponse.json({ audio: response_data });

  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      { error: "Error generating audio", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
