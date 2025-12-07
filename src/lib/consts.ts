export const UI_MESSAGES = {
  LOADING: {
    STORY: "Generando historia...",
    IMAGE: "Generando imagen...",
  },
  ERRORS: {
    STORY: "Error al generar la historia. Por favor, intenta de nuevo.",
    IMAGE: "Error al generar la imagen. Por favor, intenta de nuevo.",
    MISING_PROMPT: "Falta el prompt para generar la historia.",
  },
  PLACEHOLDERS: {
    INPUT:
      "Describe que quieres hacer, adónde ir, que examinar o cómo reaccionar...",
  },
};

export const GAME_CONFIG = {
  IMAGE: {
    DEFAULT_PROMPT:
      "A pixel art style image in 16:9 aspect ratio of a post-apocalyptic world with zombies and limited resources, evoking a sense of survival and adventure.",
    SEPARATOR: "IMAGEN:",
  },
  AUDIO: {
    AUTO_PLAY: true,
    // Voces disponibles
    // Male Voices: "es-ES-Chirp3-HD-Algenib", "es-ES-Chirp-HD-D"
    // Female Voices: "es-ES-Chirp-HD-F", "es-ES-Chirp3-HD-Zephyr"
    VOICE: "es-ES-Chirp3-HD-Zephyr",
  },
};
