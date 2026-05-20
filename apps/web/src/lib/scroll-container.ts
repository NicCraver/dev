/** 工具页卡片顶与滚动容器顶之间的留白（与 scroll-mt-4 一致） */
export const TOOL_SECTION_SCROLL_PADDING = 16;

/** 计算元素在滚动容器内的 scrollTop，使元素顶边与容器顶边对齐 */
export function getScrollTopToAlignTop(root: HTMLElement, el: HTMLElement): number {
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return root.scrollTop + (elRect.top - rootRect.top);
}

export function scrollElementToTop(
  root: HTMLElement,
  el: HTMLElement,
  options?: { behavior?: ScrollBehavior; paddingTop?: number },
): void {
  const paddingTop = options?.paddingTop ?? 0;
  const top = Math.max(0, getScrollTopToAlignTop(root, el) - paddingTop);
  root.scrollTo({ top, behavior: options?.behavior ?? "instant" });
}

/** smooth 滚动结束后再校正，避免子像素 / snap 导致标题未贴顶 */
export function scrollElementToTopSmooth(root: HTMLElement, el: HTMLElement, paddingTop = 0): void {
  scrollElementToTop(root, el, { behavior: "smooth", paddingTop });

  const correct = () => {
    const delta = el.getBoundingClientRect().top - root.getBoundingClientRect().top - paddingTop;
    if (Math.abs(delta) > 1) {
      root.scrollTop += delta;
    }
  };

  window.setTimeout(correct, 450);
  window.setTimeout(correct, 700);
}
