import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { UI_MESSAGES } from "@/lib/consts";

interface GameInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (
    data: { text?: string; files?: unknown[] },
    e?: React.FormEvent<HTMLFormElement>,
  ) => void;
}

export function GameInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: GameInputProps) {
  const isInputEmpty = input.trim().length === 0;
  const isSubmitDisabled = isInputEmpty || isLoading;

  return (
    <PromptInput onSubmit={onSubmit} className="relative pr-8">
      <PromptInputTextarea
        value={input}
        onChange={onInputChange}
        placeholder={UI_MESSAGES.PLACEHOLDERS.INPUT}
        disabled={isLoading}
      />

      <PromptInputSubmit
        disabled={isSubmitDisabled}
        className="absolute bottom-2 right-2"
      />
    </PromptInput>
  );
}
