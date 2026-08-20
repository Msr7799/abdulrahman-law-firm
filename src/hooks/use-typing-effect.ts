"use client";

import { useEffect, useRef, useState } from "react";

type TypingEffectOptions = {
  enabled?: boolean;
  streaming?: boolean;
  charactersPerSecond?: number;
};

export function typingChunkSize(remaining: number, charactersPerSecond = 120) {
  const catchUpMultiplier = remaining > 1600 ? 5 : remaining > 700 ? 3 : remaining > 240 ? 2 : 1;
  return Math.max(1, Math.round((charactersPerSecond / 60) * catchUpMultiplier));
}

/**
 * Smoothly follows a growing text stream without skipping characters when new
 * provider chunks arrive faster than the UI can paint them.
 */
export function useTypingEffect(
  fullText: string,
  { enabled = true, streaming = false, charactersPerSecond = 120 }: TypingEffectOptions = {},
) {
  const [visibleLength, setVisibleLength] = useState(enabled ? 0 : fullText.length);
  const previousTextRef = useRef(fullText);

  useEffect(() => {
    if (!enabled) {
      const frame = window.requestAnimationFrame(() => setVisibleLength(fullText.length));
      previousTextRef.current = fullText;
      return () => window.cancelAnimationFrame(frame);
    }

    const previousText = previousTextRef.current;
    previousTextRef.current = fullText;
    if (!fullText.startsWith(previousText)) {
      const frame = window.requestAnimationFrame(() => setVisibleLength(0));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [enabled, fullText]);

  useEffect(() => {
    if (!enabled || visibleLength >= fullText.length) return;

    const remaining = fullText.length - visibleLength;
    const chunkSize = typingChunkSize(remaining, charactersPerSecond);
    const frame = window.requestAnimationFrame(() => {
      setVisibleLength((current) => Math.min(fullText.length, current + chunkSize));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [charactersPerSecond, enabled, fullText.length, visibleLength]);

  const displayedText = enabled ? fullText.slice(0, visibleLength) : fullText;
  return {
    displayedText,
    visibleLength: enabled ? visibleLength : fullText.length,
    isTyping: enabled && (streaming || visibleLength < fullText.length),
  };
}
