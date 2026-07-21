"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 120;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "audio/webm";
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return ".m4a";
  if (mime.includes("ogg")) return ".ogg";
  return ".webm";
}

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef("audio/webm");

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupStream();
      recorderRef.current?.stop();
    };
  }, [cleanupStream, stopTimer]);

  const cancel = useCallback(() => {
    stopTimer();
    chunksRef.current = [];
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
    }
    recorderRef.current = null;
    cleanupStream();
    setRecording(false);
    setSeconds(0);
    setError(null);
  }, [cleanupStream, stopTimer]);

  const stop = useCallback(async (): Promise<File | null> => {
    stopTimer();
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cancel();
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        cleanupStream();
        recorderRef.current = null;
        setRecording(false);
        setSeconds(0);

        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        chunksRef.current = [];
        if (blob.size < 800) {
          setError("Recording too short");
          resolve(null);
          return;
        }

        const ext = extensionForMime(mimeRef.current);
        resolve(
          new File([blob], `voice-note-${Date.now()}${ext}`, {
            type: mimeRef.current.split(";")[0] || "audio/webm",
          }),
        );
      };
      recorder.stop();
    });
  }, [cancel, cleanupStream, stopTimer]);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone not supported");
      return false;
    }
    if (!window.isSecureContext) {
      setError("Microphone requires HTTPS");
      return false;
    }

    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeRef.current = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType: mimeRef.current });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      stopTimer();
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            void stop();
          }
          return next;
        });
      }, 1000);
      return true;
    } catch {
      cleanupStream();
      setError("Microphone permission denied");
      return false;
    }
  }, [cleanupStream, stop, stopTimer]);

  const formatTime = useCallback((total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }, []);

  return {
    recording,
    seconds,
    error,
    start,
    stop,
    cancel,
    formatTime,
    clearError: () => setError(null),
  };
}
