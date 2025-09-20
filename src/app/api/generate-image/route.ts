import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

import { type NextRequest, NextResponse } from "next/server"

import { GAME_PROMPTS } from "@/lib/prompts"
import type { GenerateImageRequest } from "@/lib/types"


export async function POST(req: NextRequest) {
    try {
        const { imagePrompt }: GenerateImageRequest = await req.json()

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY || "",
        })

        const prompt = GAME_PROMPTS.GENERATE_IMAGE(imagePrompt)

        const { files } = await generateText({
            model: google("gemini-2.5-flash-image-preview"),
            prompt,
            providerOptions: {
                google: {
                    responseModalities: ["IMAGE"],
                }
            }
        })

        const image = files[0] || null

        return NextResponse.json({ image })
    } catch (error) {
        console.error("Error generating image:", error)
        return NextResponse.json({ error: "Error generating image" }, { status: 500 })
    }
}