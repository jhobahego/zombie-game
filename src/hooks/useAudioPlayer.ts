import { useState, useRef, useCallback } from "react";
import type { GeneratedAudio } from "@/lib/types";
import { AudioQueue, playAudioFromBase64 } from "@/lib/audio-utils";

interface UseAudioPlayerOptions {
  volume?: number;
  autoPlay?: boolean;
  useQueue?: boolean;
}

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentAudio: HTMLAudioElement | null;
  volume: number;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    volume: initialVolume = 0.7,
    autoPlay = false,
    useQueue = false,
  } = options;

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    currentAudio: null,
    volume: initialVolume,
  });

  const audioQueueRef = useRef<AudioQueue | null>(null);

  // Inicializar queue si es necesario
  if (useQueue && !audioQueueRef.current) {
    audioQueueRef.current = new AudioQueue({
      volume: state.volume,
      onStart: () => {
        setState((prev) => ({ ...prev, isPlaying: true, error: null }));
      },
      onEnd: () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      },
      onError: (error) => {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isPlaying: false,
        }));
      },
    });
  }

  const playAudio = useCallback(
    async (audioData: GeneratedAudio) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (useQueue && audioQueueRef.current) {
          // Usar cola de audio
          audioQueueRef.current.enqueue(audioData);
          setState((prev) => ({ ...prev, isLoading: false }));
        } else {
          // Reproducción directa
          const audio = await playAudioFromBase64(audioData, {
            volume: state.volume,
            onStart: () => {
              setState((prev) => ({
                ...prev,
                isPlaying: true,
                isLoading: false,
              }));
            },
            onEnd: () => {
              setState((prev) => ({
                ...prev,
                isPlaying: false,
                currentAudio: null,
              }));
            },
            onError: (error) => {
              setState((prev) => ({
                ...prev,
                error: error.message,
                isPlaying: false,
                isLoading: false,
                currentAudio: null,
              }));
            },
          });

          setState((prev) => ({ ...prev, currentAudio: audio }));

          if (autoPlay) {
            await audio.play();
          }
        }
      } catch (error) {
        console.error("Error in playAudio:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Error al reproducir audio",
          isLoading: false,
          isPlaying: false,
        }));
      }
    },
    [state.volume, autoPlay, useQueue],
  );

  const pauseAudio = useCallback(() => {
    if (useQueue && audioQueueRef.current) {
      audioQueueRef.current.pause();
    } else if (state.currentAudio && !state.currentAudio.paused) {
      state.currentAudio.pause();
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [state.currentAudio, useQueue]);

  const resumeAudio = useCallback(() => {
    if (useQueue && audioQueueRef.current) {
      audioQueueRef.current.resume();
    } else if (state.currentAudio?.paused) {
      state.currentAudio.play();
    }
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, [state.currentAudio, useQueue]);

  const stopAudio = useCallback(() => {
    if (useQueue && audioQueueRef.current) {
      audioQueueRef.current.stop();
    } else if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio.currentTime = 0;
    }
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentAudio: null,
    }));
  }, [state.currentAudio, useQueue]);

  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));

      if (state.currentAudio) {
        state.currentAudio.volume = clampedVolume;
      }

      setState((prev) => ({ ...prev, volume: clampedVolume }));
    },
    [state.currentAudio],
  );

  const generateAndPlayAudio = useCallback(
    async (text: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/generate-audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Error al generar audio");
        }

        const data = await response.json();
        await playAudio(data.audio);
      } catch (error) {
        console.error("Error in generateAndPlayAudio:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Error al generar audio",
          isLoading: false,
        }));
      }
    },
    [playAudio],
  );

  return {
    // Estado
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    error: state.error,
    volume: state.volume,

    // Funciones de control
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    setVolume,
    generateAndPlayAudio,

    // Estado de la cola (si se usa)
    queueStatus: useQueue ? audioQueueRef.current?.getStatus() : null,
  };
}
