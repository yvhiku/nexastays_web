"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const SPEEDS = [1, 1.5, 2] as const;
const WAVEFORM = [
  7, 13, 9, 18, 11, 15, 8, 20, 12, 17, 9, 14, 7, 19, 11, 16, 8, 13, 10,
  18, 9, 15, 7, 12,
];

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function VoiceMessagePlayer({
  src,
  isOwn,
  durationMs,
}: {
  src: string;
  isOwn?: boolean;
  durationMs?: number | null;
}) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState((durationMs ?? 0) / 1000);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [ready, setReady] = useState(Boolean(durationMs));
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const activeBars = Math.round(progress * WAVEFORM.length);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const cycleSpeed = () => {
    const index = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(index + 1) % SPEEDS.length]);
  };

  const accessibleTime = useMemo(
    () => `${formatDuration(currentTime)} / ${formatDuration(duration)}`,
    [currentTime, duration],
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-[340px] items-center gap-3 rounded-messaging-bubble border px-4 py-3 shadow-messaging-1",
        isOwn
          ? "rounded-ee-[8px] border-nexa-primary/30 bg-[linear-gradient(145deg,#f47f9b,#e8507a_48%,#c93861)] text-white"
          : "rounded-es-[8px] border-nexa-line/75 bg-[linear-gradient(145deg,#fff,#f8f0f3)] text-nexa-ink",
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || duration);
          setReady(true);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={() => void togglePlayback()}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-[background-color,transform] duration-150 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2",
          isOwn
            ? "bg-white text-nexa-primary hover:bg-white/90 focus-visible:ring-white/70"
            : "bg-nexa-primary text-white hover:bg-nexa-primary-dark focus-visible:ring-nexa-primary/40",
        )}
        aria-label={
          playing
            ? t("inbox.phase13.pauseVoice")
            : t("inbox.phase13.playVoice")
        }
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" aria-hidden />
        ) : (
          <Play className="ms-0.5 h-4 w-4 fill-current" aria-hidden />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="relative flex h-7 items-center gap-0.5" aria-hidden>
          {WAVEFORM.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={cn(
                "min-w-0 flex-1 rounded-full transition-colors duration-150",
                index < activeBars
                  ? isOwn
                    ? "bg-white"
                    : "bg-nexa-primary"
                  : isOwn
                    ? "bg-white/35"
                    : "bg-nexa-primary/20",
                !ready && "animate-pulse motion-reduce:animate-none",
              )}
              style={{ height }}
            />
          ))}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setCurrentTime(next);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={t("inbox.phase13.voicePosition")}
            aria-valuetext={accessibleTime}
          />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums opacity-75">
          <span>{formatDuration(currentTime || duration)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={cn(
              "min-h-7 rounded-full px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2",
              isOwn
                ? "hover:bg-white/15 focus-visible:ring-white/50"
                : "hover:bg-nexa-primary-soft focus-visible:ring-nexa-primary/35",
            )}
            aria-label={t("inbox.phase13.playbackSpeed").replace(
              "{speed}",
              String(speed),
            )}
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}
