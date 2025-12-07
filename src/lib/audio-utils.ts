import type { GeneratedAudio } from "@/lib/types";

/**
 * Convierte datos de audio base64 a un Blob para reproducción
 */
export function createAudioBlob(audioData: GeneratedAudio): Blob {
  try {
    // Limpiar el base64 (remover prefijos si los hay)
    const cleanBase64 = audioData.base64Data.replace(
      /^data:audio\/[^;]+;base64,/,
      "",
    );

    // Decodificar base64
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Normalizar MIME type para mejor compatibilidad
    let mimeType = audioData.mimeType;
    if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
      mimeType = "audio/mpeg";
    } else if (mimeType.includes("wav")) {
      mimeType = "audio/wav";
    } else if (mimeType.includes("ogg")) {
      mimeType = "audio/ogg";
    }

    console.log("Audio blob created:", {
      originalMimeType: audioData.mimeType,
      normalizedMimeType: mimeType,
      originalSize: audioData.base64Data.length,
      binarySize: bytes.length,
    });

    return new Blob([bytes], { type: mimeType });
  } catch (error) {
    console.error("Error creating audio blob:", error);
    throw new Error(
      `Failed to create audio blob: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Reproduce audio usando Web Audio API (más compatible)
 */
export async function playAudioWithWebAudioAPI(
  audioData: GeneratedAudio,
  options: {
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  } = {},
): Promise<void> {
  try {
    console.log("Using Web Audio API for playback:", {
      mimeType: audioData.mimeType,
      dataLength: audioData.base64Data.length,
    });

    // Crear AudioContext
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();

    // Crear el blob
    const audioBlob = createAudioBlob(audioData);
    const arrayBuffer = await audioBlob.arrayBuffer();

    console.log("Audio buffer created:", {
      byteLength: arrayBuffer.byteLength,
    });

    // Decodificar audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log("Audio decoded successfully:", {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
    });

    // Crear source y conectar
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar volumen
    if (options.volume !== undefined) {
      gainNode.gain.value = Math.max(0, Math.min(1, options.volume));
    }

    // Event listeners
    source.addEventListener("ended", () => {
      console.log("Web Audio playback ended");
      audioContext.close();
      options.onEnd?.();
    });

    // Iniciar reproducción
    console.log("Starting Web Audio playback");
    options.onStart?.();
    source.start(0);
  } catch (error) {
    console.error("Web Audio API error:", error);
    const audioError =
      error instanceof Error ? error : new Error("Web Audio API error");
    options.onError?.(audioError);
    throw audioError;
  }
}

/**
 * Reproduce audio directamente desde datos base64 (con fallback automático a Web Audio API)
 */
export async function playAudioFromBase64(
  audioData: GeneratedAudio,
  options: {
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    forceWebAudio?: boolean;
  } = {},
): Promise<HTMLAudioElement> {
  // Si se fuerza Web Audio API, usar esa función directamente
  if (options.forceWebAudio) {
    await playAudioWithWebAudioAPI(audioData, options);
    // Retornar un audio element dummy para compatibilidad
    return new Audio();
  }

  return new Promise((resolve, reject) => {
    try {
      console.log("Trying HTML Audio element first");
      console.log("Creating audio from base64:", {
        mimeType: audioData.mimeType,
        dataLength: audioData.base64Data.length,
      });

      const audioBlob = createAudioBlob(audioData);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio();

      // Configurar volumen
      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }

      // Event listeners más detallados
      audio.addEventListener("loadstart", () => {
        console.log("Audio load started");
        options.onStart?.();
      });

      audio.addEventListener("loadeddata", () => {
        console.log("Audio data loaded");
      });

      audio.addEventListener("canplay", () => {
        console.log("Audio can play");
        resolve(audio);
      });

      audio.addEventListener("canplaythrough", () => {
        console.log("Audio can play through");
      });

      audio.addEventListener("ended", () => {
        console.log("Audio playback ended");
        URL.revokeObjectURL(audioUrl); // Limpiar memoria
        options.onEnd?.();
      });

      audio.addEventListener("error", async () => {
        console.error("HTML Audio error, trying Web Audio API fallback");
        console.error("Audio error details:", {
          error: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });

        URL.revokeObjectURL(audioUrl); // Limpiar memoria

        try {
          // Intentar con Web Audio API como fallback
          console.log("Falling back to Web Audio API");
          await playAudioWithWebAudioAPI(audioData, {
            ...options,
            onError: (webAudioError) => {
              console.error("Web Audio API also failed:", webAudioError);
              const finalError = new Error(
                `Both HTML Audio and Web Audio API failed. HTML Audio: ${getAudioErrorMessage(audio.error?.code || 0)}, Web Audio: ${webAudioError.message}`,
              );
              options.onError?.(finalError);
              reject(finalError);
            },
          });
          // Si Web Audio API funciona, resolvemos con un audio element dummy
          resolve(new Audio());
        } catch (webAudioError) {
          const finalError = new Error(
            `Both HTML Audio and Web Audio API failed. HTML Audio: ${getAudioErrorMessage(audio.error?.code || 0)}, Web Audio: ${webAudioError instanceof Error ? webAudioError.message : "Unknown error"}`,
          );
          options.onError?.(finalError);
          reject(finalError);
        }
      });

      // Configurar src y cargar
      audio.src = audioUrl;
      audio.load();
    } catch (error) {
      console.error("Error in playAudioFromBase64:", error);
      const audioError =
        error instanceof Error ? error : new Error("Unknown audio error");
      options.onError?.(audioError);
      reject(audioError);
    }
  });
}

/**
 * Convierte códigos de error de audio en mensajes legibles
 */
function getAudioErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 1:
      return "MEDIA_ERR_ABORTED - Playback aborted";
    case 2:
      return "MEDIA_ERR_NETWORK - Network error";
    case 3:
      return "MEDIA_ERR_DECODE - Decode error";
    case 4:
      return "MEDIA_ERR_SRC_NOT_SUPPORTED - Source not supported";
    default:
      return "Unknown error";
  }
}

/**
 * Queue de audio para reproducción secuencial
 */
export class AudioQueue {
  private queue: GeneratedAudio[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(
    private options: {
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Error) => void;
    } = {},
  ) {}

  /**
   * Agregar audio a la cola
   */
  enqueue(audioData: GeneratedAudio) {
    this.queue.push(audioData);

    // Si no está reproduciendo, iniciar automáticamente
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Reproducir siguiente audio en la cola
   */
  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.options.onEnd?.();
      return;
    }

    this.isPlaying = true;
    const nextAudio = this.queue.shift();

    if (!nextAudio) {
      this.isPlaying = false;
      return;
    }

    try {
      this.currentAudio = await playAudioFromBase64(nextAudio, {
        volume: this.options.volume,
        onStart: this.options.onStart,
        onEnd: () => {
          this.playNext(); // Reproducir siguiente automáticamente
        },
        onError: this.options.onError,
      });

      await this.currentAudio.play();
    } catch (error) {
      this.options.onError?.(
        error instanceof Error ? error : new Error("Audio queue error"),
      );
      this.playNext(); // Continuar con el siguiente a pesar del error
    }
  }

  /**
   * Pausar reproducción actual
   */
  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  /**
   * Reanudar reproducción
   */
  resume() {
    if (this.currentAudio?.paused) {
      this.currentAudio.play();
    }
  }

  /**
   * Detener y limpiar cola
   */
  stop() {
    this.queue = [];
    this.isPlaying = false;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.queue.length,
      isPaused: this.currentAudio?.paused ?? false,
    };
  }
}
