import { useSyncExternalStore } from "react";

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

/** 修饰键 + 字母，如 Mac 的 ⌘F、Windows 的 Ctrl+F */
export function formatModShortcut(key: string): string {
  const letter = key.length === 1 ? key.toUpperCase() : key;
  return isMacPlatform() ? `⌘${letter}` : `Ctrl+${letter}`;
}

export function useModShortcut(key: string): string {
  const letter = key.length === 1 ? key.toUpperCase() : key;
  return useSyncExternalStore(
    () => () => {},
    () => formatModShortcut(key),
    () => `Ctrl+${letter}`,
  );
}
