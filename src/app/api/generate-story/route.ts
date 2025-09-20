import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

import { type NextRequest, NextResponse } from "next/server"

import { GAME_PROMPTS } from "@/lib/prompts"
import { GAME_CONFIG } from "@/lib/consts"
import type { GenerateHistoryRequest } from "@/lib/types"


export async function POST(req: NextRequest) {
    try {
        const { userMessage, conversationHistory, isStart }: GenerateHistoryRequest = await req.json()

        let prompt = GAME_PROMPTS.INITIAL_STORY

        if (!isStart) {
            const historyText = conversationHistory.map(
                (message) => `${message.role}: ${message.content}`
            ).join("\n")

            prompt = GAME_PROMPTS.CONTINUE_STORY(historyText, userMessage)
        }

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY || "",
        })

        const { text } = await generateText({
            model: google("gemini-2.0-flash-lite-001"),
            prompt
        })

        const [story, imageDescription] = text.split(GAME_CONFIG.IMAGE.SEPARATOR)

        const cleanHistory = story.trim()
        const cleanImageDescription = imageDescription.trim()

        return NextResponse.json({ story: cleanHistory, imageDescription: cleanImageDescription })
    } catch (error) {
        console.error("Error generating story:", error)
        return NextResponse.json({ error: "Error generating story" }, { status: 500 })
    }
}