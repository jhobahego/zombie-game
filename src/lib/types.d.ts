export interface GameMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    image?: string;
    imageLoading?: boolean;
}

export interface GeneratedImage {
    base64Data: string;
    mediaType: string;
    uint8ArrayData: Uint8Array;
}

interface ConversationHistory {
    role: "user" | "assistant";
    content: string;
}

export interface GenerateHistoryRequest {
    userMessage: string;
    conversationHistory: ConversationHistory[];
    isStart: boolean;
}

export interface GenerateHistoryResponse {
    story: string;
    imageDescription: string;
}