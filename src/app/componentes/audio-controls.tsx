"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Volume2, VolumeX, Square, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onStop: () => void;
  className?: string;
}

export function AudioControls({
  isPlaying,
  isLoading,
  isMuted,
  onToggleMute,
  onStop,
  className,
}: AudioControlsProps) {
  if (!isPlaying && !isLoading) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
        className
      )}
    >
      <div className="flex items-center gap-2 mr-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {isLoading ? "Generando audio..." : "Narrando..."}
        </span>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-muted"
        onClick={onToggleMute}
        title={isMuted ? "Activar sonido" : "Silenciar"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Volume2 className="h-4 w-4 text-foreground" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
        onClick={onStop}
        title="Detener narración"
      >
        <Square className="h-3 w-3 fill-current" />
      </Button>
    </div>
  );
}
