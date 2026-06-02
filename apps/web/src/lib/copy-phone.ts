/** 在非 HTTPS（如内网 HTTP）下 Clipboard API 不可用，回退到 execCommand。 */
export async function copyPhone(phone: string): Promise<boolean> {
  if (!phone) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(phone);
      return true;
    }
  } catch {
    // 非安全上下文或权限被拒，走下方回退
  }

  const textarea = document.createElement("textarea");
  textarea.value = phone;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, phone.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  return ok;
}
