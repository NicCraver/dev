/** HTTP 非安全上下文下 crypto.randomUUID 不可用，启动时补齐 */
if (
  typeof globalThis.crypto !== "undefined" &&
  typeof globalThis.crypto.randomUUID !== "function"
) {
  globalThis.crypto.randomUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.trunc(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
}
