"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { GameLoader } from "./componentes/game-loader";
import { GameInput } from "./componentes/game-input";
import { GameMessage } from "./componentes/game-message";
import { useZombieGame } from "./hooks/use-zombie-game";

export default function Home() {
  const { messages, isLoading, input, handleInputChange, handleSubmit } =
    useZombieGame();

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

        <div className="max-w-2xl w-full mx-auto pb-4">
          <GameInput
            input={input}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
