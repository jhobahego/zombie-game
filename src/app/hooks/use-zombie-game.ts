import { useState, useEffect } from "react";

import type { GameMessage, GenerateHistoryResponse } from "@/lib/types";

export function useZombieGame() {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isStart: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data: GenerateHistoryResponse = await response.json();

      const messageid = crypto.randomUUID();

      const newMessage: GameMessage = {
        id: messageid,
        role: "assistant",
        content: data.story,
        imageLoading: true,
      };

      setMessages([newMessage]);
      generateImage(messageid, data.imageDescription);
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async (messageId: string, description: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const imageData = await response.json();

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, image: imageData.image, imageLoading: false };
          }

          return msg;
        }),
      );
    } catch (error) {
      console.error("Error generating image:", error);

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, imageLoading: false };
          }

          return msg;
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    data: { text?: string; files?: unknown[] },
    e?: React.FormEvent<HTMLFormElement>,
  ) => {
    if (e) {
      e.preventDefault();
    }

    const userInput = data.text?.trim();
    if (!userInput || isLoading) return;

    const userMessage: GameMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userInput,
    };

    const newMessages = [...messages, userMessage];

    setIsLoading(true);
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: userInput,
          conversationHistory: newMessages,
          isStart: false,
        }),
      });

      console.log({ response });
      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data: GenerateHistoryResponse = await response.json();

      const messageid = crypto.randomUUID();

      const assistantMessage: GameMessage = {
        id: messageid,
        role: "assistant",
        content: data.story,
        imageLoading: true,
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      generateImage(messageid, data.imageDescription);
    } catch (error) {
      console.error("Error generating story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return {
    messages,
    isLoading,
    input,
    handleSubmit,
    handleInputChange,
  };
}
