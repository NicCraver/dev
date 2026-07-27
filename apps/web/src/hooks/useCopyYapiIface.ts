import { useCallback, useEffect, useRef, useState } from "react";

import { copyIfaceDetails } from "@/lib/yapi-copy-iface";
import type { Category, IfaceItem } from "@/lib/yapi-types";

const FEEDBACK_MS = 1400;

export function useCopyYapiIface(getCachedDetail?: (id: string) => IfaceItem | undefined) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyingKey, setCopyingKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const copyIface = useCallback(
    async (iface: IfaceItem, cat?: Category | null, key = "doc") => {
      const copyKey = `${iface.id}:${key}`;
      setCopyingKey(copyKey);
      try {
        const ok = await copyIfaceDetails(iface, cat, getCachedDetail);
        if (!ok) return;
        setCopiedKey(copyKey);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopiedKey(null), FEEDBACK_MS);
      } finally {
        setCopyingKey(null);
      }
    },
    [getCachedDetail],
  );

  const isCopied = useCallback(
    (ifaceId: string, key = "doc") => copiedKey === `${ifaceId}:${key}`,
    [copiedKey],
  );
  const isCopying = useCallback(
    (ifaceId: string, key = "doc") => copyingKey === `${ifaceId}:${key}`,
    [copyingKey],
  );

  return { copyIface, isCopied, isCopying };
}
