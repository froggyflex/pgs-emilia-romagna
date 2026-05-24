"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function MainEventSoundtrack({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    async function startAudio() {
      const audio = audioRef.current;
      if (!audio || hasStartedRef.current) return;

      try {
        audio.volume = 0.5;
        await audio.play();
        setIsPlaying(true);
        hasStartedRef.current = true;
        setHasStarted(true);
      } catch {
        setIsPlaying(false);
      }
    }

    function startFromInteraction() {
      void startAudio();
    }

    startAudio();

    window.addEventListener("pointerdown", startFromInteraction, { once: true });
    window.addEventListener("keydown", startFromInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", startFromInteraction);
      window.removeEventListener("keydown", startFromInteraction);
      const audio = audioRef.current;
      audio?.pause();
    };
  }, []);

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      hasStartedRef.current = true;
      setHasStarted(true);
      return;
    }

    audio.volume = 0.5;
    await audio.play();
    hasStartedRef.current = true;
    setHasStarted(true);
    setIsPlaying(true);
  }

  return (
    <div className="soundtrack-player" aria-label="Audio evento">
      <audio ref={audioRef} src={src} loop preload="auto" autoPlay />
      <div className="soundtrack-status">
        <Volume2 size={17} />
        <span>Soundtrack</span>
      </div>
      <button className="ghost-button soundtrack-toggle" type="button" onClick={toggleAudio}>
        {isPlaying ? <Pause size={17} /> : <Play size={17} />}
        {isPlaying ? "Pausa" : hasStarted ? "Riprendi" : "Avvia"}
      </button>
    </div>
  );
}
