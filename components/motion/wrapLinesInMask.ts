/**
 * Wraps each SplitType line element in a span.st-mask (overflow:hidden).
 * Creates the clip effect so text emerges from behind the line boundary
 * instead of floating in from below.
 *
 * Call immediately after new SplitType(...), before GSAP animates the lines.
 * SplitType.revert() restores the original innerHTML, cleaning up masks automatically.
 */
export function wrapLinesInMask(lines: Element[]): void {
  lines.forEach((line) => {
    const mask = document.createElement('span')
    mask.className = 'st-mask'
    line.parentNode?.insertBefore(mask, line)
    mask.appendChild(line)
  })
}
