"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { GameLoader } from "./componentes/game-loader";
import { GameInput } from "./componentes/game-input";
import { GameMessage } from "./componentes/game-message";
import { AudioControls } from "./componentes/audio-controls";
import { useZombieGame } from "./hooks/use-zombie-game";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
    messages,
    isLoading,
    input,
    hasStarted,
    startGame,
    handleInputChange,
    handleSubmit,
    audio,
  } = useZombieGame();

  if (!hasStarted) {
    return (
      <div className="font-sans h-screen mx-auto overflow-hidden bg-gradient-to-t from-[var(--color-gradient-principal)] to-[var(--color-gradient-secondary)] flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-4xl font-bold text-white mb-8 tracking-wider">
            ZOMBIE SURVIVAL
          </h1>
          <p className="text-gray-300 max-w-md mx-auto mb-8">
            Prepárate para una aventura interactiva donde tus decisiones
            determinarán tu destino. ¿Podrás sobrevivir?
          </p>
          <Button
            onClick={startGame}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-xl rounded-none border-2 border-red-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
          >
            COMENZAR AVENTURA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans h-screen mx-auto overflow-hidden bg-gradient-to-t from-[var(--color-gradient-principal)] to-[var(--color-gradient-secondary)]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent className="max-w-xl mx-auto">
            {messages.map((message) => (
              <GameMessage key={message.id} message={message} />
            ))}
            {isLoading && <GameLoader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="max-w-2xl w-full mx-auto pb-4 relative">
          {/* Audio Controls overlaid or positioned appropriately */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
            <AudioControls
              isPlaying={audio.isPlaying}
              isLoading={audio.isLoading}
              isMuted={audio.isMuted}
              onToggleMute={audio.toggleMute}
              onStop={audio.stop}
            />
          </div>

          <div className="mt-4">
            <GameInput
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
