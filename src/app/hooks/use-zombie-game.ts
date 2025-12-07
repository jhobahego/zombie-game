import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { GameMessage, GenerateHistoryResponse } from "@/lib/types";
import { GAME_CONFIG } from "@/lib/consts";

export function useZombieGame() {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  const {
    generateAndPlayAudio,
    stopAudio,
    isPlaying,
    isLoading: isAudioLoading,
    setVolume,
  } = useAudioPlayer({
    autoPlay: GAME_CONFIG.AUDIO.AUTO_PLAY,
    volume: 0.7,
  });

  const startGameRef = useRef<(() => Promise<void>) | null>(null);
  const stopAudioRef = useRef<() => void>(() => {});

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setVolume(isMuted ? 0 : 0.7);
  }, [isMuted, setVolume]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const generateImage = useCallback(
    async (messageId: string, description: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imagePrompt: description }),
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
    },
    [],
  );

  const startGame = useCallback(async () => {
    setHasStarted(true);
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

      // Generate audio for the story
      if (data.story) {
        console.log("Generating audio for intro...");
        generateAndPlayAudio(data.story).catch((e) =>
          console.error("Audio generation failed:", e),
        );
      }
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setIsLoading(false);
    }
  }, [generateImage, generateAndPlayAudio]);

  useEffect(() => {
    startGameRef.current = startGame;
  }, [startGame]);

  useEffect(() => {
    stopAudioRef.current = stopAudio;
  }, [stopAudio]);

  useEffect(() => {
    // Cleanup audio on unmount with the latest stop handler
    return () => stopAudioRef.current?.();
  }, []);

  const handleSubmit = async (
    data: { text?: string; files?: unknown[] },
    e?: React.FormEvent<HTMLFormElement>,
  ) => {
    if (e) {
      e.preventDefault();
    }

    const userInput = data.text?.trim();
    if (!userInput || isLoading) return;

    // Stop previous audio when user interrupts or new turn starts
    stopAudio();

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

      // Generate audio for the response
      if (data.story) {
        console.log("Generating audio for response...");
        generateAndPlayAudio(data.story).catch((e) =>
          console.error("Audio generation failed:", e),
        );
      }
    } catch (error) {
      console.error("Error generating story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // State for mute toggle
  // (Moved to top of function for cleaner scope)

  return {
    messages,
    isLoading,
    input,
    hasStarted,
    startGame,
    handleSubmit,
    handleInputChange,
    audio: {
      isPlaying,
      isLoading: isAudioLoading,
      stop: stopAudio,
      isMuted,
      toggleMute,
    },
  };
}
