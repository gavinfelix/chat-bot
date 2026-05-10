type Options = {
  gap: number;
  height: number;
  padding: number;
  width: number;
};

type Position = {
  left: number;
  top: number;
};

export default function useFloatingMenuPosition({ gap, height, padding, width }: Options) {
  return (anchor: HTMLElement): Position => {
    const rect = anchor.getBoundingClientRect();
    const preferredLeft = rect.left - 12;
    const left = Math.min(preferredLeft, window.innerWidth - width - padding);
    const preferredTop = rect.bottom + gap;
    const availableBottom = window.innerHeight - height - padding;
    const unclampedTop =
      preferredTop + height > window.innerHeight - padding
        ? Math.max(padding, rect.top - height - gap)
        : preferredTop;
    const top = Math.max(padding, Math.min(unclampedTop, Math.max(padding, availableBottom)));

    return {
      top,
      left: Math.max(padding, left),
    };
  };
}
