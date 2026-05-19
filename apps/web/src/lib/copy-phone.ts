export async function copyPhone(phone: string): Promise<void> {
  await navigator.clipboard.writeText(phone);
}
