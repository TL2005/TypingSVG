import { NextRequest, NextResponse } from "next/server";
import { validateParams } from "@/lib/utils";

interface TextLine {
  text: string;
  font: string;
  color: string;
  fontSize: number;
  letterSpacing: string | number;
  typingSpeed: number;
  deleteSpeed: number;
}

type DeletionBehavior = "stay" | "backspace" | "clear";

/**
 * Parse letter-spacing value and convert to pixels
 * Supports: em, rem, px, %, numbers (treated as em)
 */
function parseLetterSpacing(
  letterSpacing: string | number,
  fontSize: number
): number {
  if (typeof letterSpacing === "number") {
    return letterSpacing * fontSize; // Treat as em
  }

  const value = letterSpacing.toString().trim().toLowerCase();

  // Extract numeric value and unit
  const match = value.match(/^([+-]?\d*\.?\d+)(em|rem|px|%)?$/);
  if (!match) {
    // Handle special values
    if (value === "normal") return 0;
    if (value === "inherit") return 0;
    // Default to 0 for invalid values
    return 0;
  }

  const numValue = parseFloat(match[1]);
  const unit = match[2] || "em"; // Default to em if no unit

  switch (unit) {
    case "em":
      return numValue * fontSize;
    case "rem":
      return numValue * 16; // Assume 16px root font size
    case "px":
      return numValue;
    case "%":
      return (numValue / 100) * fontSize;
    default:
      return numValue * fontSize; // Fallback to em
  }
}

// Helper: returns the numeric y offset (in user units) to apply to the cursor
// relative to the text baseline/center. Positive moves it down, negative moves it up.
function getCursorYOffset(style: string, fontSize: number): number {
  switch (style) {
    case "underline":
      return fontSize * 0.45;
    case "block":
      return -fontSize * 0.85;
    case "blank":
      return 0;
    case "straight":
    default:
      return -fontSize * 0.75;
  }
}

// Returns the svg rect string (still return the shape with a 'y' attribute – replaced later with animations)
function getCursorSvgShape(
  style: string,
  color: string,
  fontSize: number
): string {
  const yPos = getCursorYOffset(style, fontSize);
  switch (style) {
    case "underline":
      return `<rect y="${yPos}" width="${
        fontSize * 0.6
      }" height="3" fill="${color}" visibility="hidden"/>`;
    case "block":
      return `<rect y="${yPos}" width="${fontSize * 0.6}" height="${
        fontSize * 1.2
      }" fill="${color}" visibility="hidden"/>`;
    case "blank":
      return "";
    case "straight":
    default:
      return `<rect y="${yPos}" width="2.5" height="${
        fontSize * 1.2
      }" fill="${color}" visibility="hidden"/>`;
  }
}

/**
 * Fetch Google Font CSS and convert font URLs to base64 data URIs
 */
async function fetchGoogleFontCSS(
  fontFamily: string,
  weight: string = "400",
  text: string = ""
): Promise<string> {
  try {
    const url = `https://fonts.googleapis.com/css2?${new URLSearchParams({
      family: `${fontFamily}:wght@${weight}`,
      text: text,
      display: "fallback",
    })}`;

    // Fetch the CSS
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Font CSS: ${response.status}`);
    }

    let css = await response.text();

    // Find all font file URLs and convert them to base64 data URIs
    const urlRegex =
      /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)\s+format\(['"]([^'"]+)['"]\)/g;
    const matches = [...css.matchAll(urlRegex)];

    for (const match of matches) {
      const [fullMatch, fontUrl, fontFormat] = match;

      try {
        // Fetch the font file
        const fontResponse = await fetch(fontUrl);
        if (fontResponse.ok) {
          const fontBuffer = await fontResponse.arrayBuffer();
          const base64Font = Buffer.from(fontBuffer).toString("base64");
          const dataUri = `data:font/${fontFormat};base64,${base64Font}`;

          // Replace the original URL with the data URI
          css = css.replace(fontUrl, dataUri);
        }
      } catch (fontError) {
        console.warn(`Failed to fetch font file: ${fontUrl}`, fontError);
      }
    }

    return css;
  } catch (error) {
    console.warn(`Failed to fetch Google Font: ${fontFamily}`, error);
    return "";
  }
}

/**
 * Get unique fonts from text lines and fetch their CSS
 */
async function getGoogleFontsCSS(textLines: TextLine[]): Promise<string> {
  const uniqueFonts = new Map<string, string>();
  let allText = "";

  // Collect unique fonts and all text
  for (const line of textLines) {
    if (!uniqueFonts.has(line.font)) {
      uniqueFonts.set(line.font, "400"); // Default weight
    }
    allText += line.text;
  }

  // Remove duplicates from text for optimization
  const uniqueChars = [...new Set(allText)].join("");

  const fontPromises = Array.from(uniqueFonts.entries()).map(
    ([fontFamily, weight]) =>
      fetchGoogleFontCSS(fontFamily, weight, uniqueChars)
  );

  const fontCSSArray = await Promise.all(fontPromises);
  return fontCSSArray.filter((css) => css.length > 0).join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { searchParams } = url;
    const params = validateParams(searchParams);

    // Get deletion behavior from URL parameters - with backward compatibility
    let deletionBehavior: DeletionBehavior = "backspace"; // default
    const deletionParam = searchParams.get("deletionBehavior");
    const deleteAfterParam = searchParams.get("deleteAfter"); // legacy parameter

    if (
      deletionParam &&
      ["stay", "backspace", "clear"].includes(deletionParam)
    ) {
      deletionBehavior = deletionParam as DeletionBehavior;
    } else if (deleteAfterParam !== null) {
      // Handle legacy deleteAfter parameter
      deletionBehavior = deleteAfterParam === "true" ? "backspace" : "stay";
    }

    // Parse text lines data
    let textLines: TextLine[];
    try {
      const linesParam = searchParams.get("lines");
      if (linesParam) {
        textLines = JSON.parse(linesParam) as TextLine[];
      } else {
        // Fallback to old format for backward compatibility
        const texts = params.text.split(";");
        textLines = texts.map((text) => ({
          text,
          font: params.font,
          color: params.color,
          fontSize: params.fontSize,
          letterSpacing: params.letterSpacing,
          typingSpeed: params.typingSpeed,
          deleteSpeed: params.typingSpeed,
        }));
      }
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid lines parameter" }),
        { status: 400 }
      );
    }

    // Fetch Google Fonts CSS
    const googleFontsCSS = await getGoogleFontsCSS(textLines);

    // Formatter to trim decimals and remove trailing zeros
    const fmt = (n: number) => {
      const s = Number(n.toFixed(3)); // keep up to 3 decimals
      return s % 1 === 0 ? s.toFixed(0) : s.toString();
    };

    let overallCycleDuration = 0;
    const allTextElements: string[] = [];
    let allCursorAnimations = "";

    const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

    /**
     * Get character width with better handling for emojis and monospace
     */
    const getGraphemeWidth = (
      grapheme: string,
      fontSize: number,
      fontRatio: number,
      isLastChar: boolean,
      letterSpacingPx: number
    ): { charWidth: number; totalWidth: number } => {
      const isEmoji = emojiRegex.test(grapheme);
      if (isEmoji) {
        const charWidth = fontSize;
        const totalWidth = charWidth + (isLastChar ? 0 : letterSpacingPx);
        return { charWidth, totalWidth };
      }

      // Heuristic-based advance width estimation for proportional fonts.
      const veryWideChars = /[MW]/;
      const wideChars = /[O@#%&<>]/;
      const narrowChars = /[ilI,.;!:'"`\|\/\(\)\[\]{}?]/;
      const upper = /[A-Z]/;
      const digit = /[0-9]/;
      const punctuation = /[-_=+\*~^]/;

      // base multiplier derived from fontRatio but allow adjustments
      let multiplier = fontRatio;

      if (upper.test(grapheme)) {
        multiplier *= 1.0;
      } else if (digit.test(grapheme)) {
        multiplier *= 0.9;
      } else if (punctuation.test(grapheme)) {
        multiplier *= 0.7;
      } else if (veryWideChars.test(grapheme)) {
        multiplier *= 1.35;
      } else if (wideChars.test(grapheme)) {
        multiplier *= 1.1;
      } else if (narrowChars.test(grapheme)) {
        multiplier *= 1;
      } else {
        multiplier *= 1.0;
      }

      // compute width and enforce a sensible minimum advance to prevent overlap
      const charWidth = Math.max(fontSize * multiplier, fontSize * 0.25);
      const totalWidth = charWidth + (isLastChar ? 0 : letterSpacingPx);

      return { charWidth, totalWidth };
    };

    /**
     * Calculate the total dimensions of all text lines for proper centering
     */
    function calculateTotalTextDimensions(
      textLines: TextLine[],
      fontRatio: number,
      deletionBehavior: DeletionBehavior
    ) {
      let totalHeight = 0;
      let maxWidth = 0;

      for (const line of textLines) {
        const content = line.text;
        const lines = content.split("\n");
        const lineHeight = line.fontSize * 1.3;
        const letterSpacingPx = parseLetterSpacing(
          line.letterSpacing,
          line.fontSize
        );

        for (const textLine of lines) {
          let lineWidth = 0;
          if (textLine.length > 0) {
            const graphemes = [...textLine];
            graphemes.forEach((grapheme, idx) => {
              const isLastChar = idx === graphemes.length - 1;
              const { totalWidth } = getGraphemeWidth(
                grapheme,
                line.fontSize,
                fontRatio,
                isLastChar,
                letterSpacingPx
              );
              lineWidth += totalWidth;
            });
          }
          maxWidth = Math.max(maxWidth, lineWidth);
        }

        // For 'stay' behavior, accumulate height. For others, use max height
        if (deletionBehavior === "stay") {
          totalHeight += lines.length * lineHeight;
        } else {
          totalHeight = Math.max(totalHeight, lines.length * lineHeight);
        }
      }

      return { totalWidth: maxWidth, totalHeight };
    }

    // Calculate total dimensions for proper centering when using 'stay' behavior
    const totalDimensions = calculateTotalTextDimensions(
      textLines,
      params.fontRatio,
      deletionBehavior
    );
    const globalTextBlockYOffset = params.vCenter
      ? (params.height - totalDimensions.totalHeight) / 2
      : 10;
    const globalTextBlockXOffset = params.center
      ? (params.width - totalDimensions.totalWidth) / 2
      : 15;

    // compute pause duration once (seconds) and use grapheme-aware counting
    const pauseDuration =
      (Number(searchParams.get("pause")) || params.pause) / 1000;

    // total time (relative to cycle.begin) after which ALL lines have finished typing,
    // INCLUDING the pause after the last line. Use grapheme-aware count.
    const allLinesTypingDuration = textLines.reduce((total, tl) => {
      const tlGraphemeCount = [...tl.text].length;
      return total + tlGraphemeCount * tl.typingSpeed + pauseDuration;
    }, 0);

    let cycleOffset = 0;
    let accumulatedHeight = 0; // Track cumulative height for 'stay' behavior

    for (
      let contentIndex = 0;
      contentIndex < textLines.length;
      contentIndex++
    ) {
      const line = textLines[contentIndex];
      const content = line.text;
      const lines = content.split("\n");
      const linesAsGraphemes = lines.map((ln) => [...ln]);
      const totalGraphemeCount = linesAsGraphemes.reduce(
        (sum, ln) => sum + ln.length,
        0
      );

      const lineHeight = line.fontSize * 1.3;
      const letterSpacingPx = parseLetterSpacing(
        line.letterSpacing,
        line.fontSize
      );

      const lineCalculations = linesAsGraphemes.map((textLine) => {
        let cumulativeWidth = 0;
        if (textLine.length > 0) {
          textLine.forEach((grapheme, idx) => {
            const isLastChar = idx === textLine.length - 1;
            const { totalWidth } = getGraphemeWidth(
              grapheme,
              line.fontSize,
              params.fontRatio,
              isLastChar,
              letterSpacingPx
            );
            cumulativeWidth += totalWidth;
          });
        }
        return { width: cumulativeWidth };
      });

      const textBlockWidth = Math.max(
        0,
        ...lineCalculations.map((lc) => lc.width)
      );
      const textBlockHeight = lines.length * lineHeight;

      // Calculate positioning based on deletion behavior
      let textBlockYOffset: number;
      let textBlockXOffset: number;

      if (deletionBehavior === "stay") {
        // For 'stay', use global positioning with accumulated height
        textBlockYOffset = globalTextBlockYOffset + accumulatedHeight;
        textBlockXOffset = params.center
          ? (params.width - textBlockWidth) / 2
          : globalTextBlockXOffset;
      } else {
        // For 'backspace' and 'clear', each line uses the same position
        textBlockYOffset = params.vCenter
          ? (params.height - textBlockHeight) / 2
          : 10;
        textBlockXOffset = params.center
          ? (params.width - textBlockWidth) / 2
          : 15;
      }

      const totalTypingDuration = totalGraphemeCount * line.typingSpeed;

      // Calculate deletion duration based on behavior
      let deletionDuration = 0;
      if (deletionBehavior === "backspace") {
        deletionDuration = totalGraphemeCount * line.deleteSpeed;
      } else if (deletionBehavior === "clear") {
        deletionDuration = 0.01; // Instant clear
      }
      // For 'stay', deletionDuration remains 0

      // contentCycleDuration already includes one pause per content chunk (including last chunk)
      const contentCycleDuration =
        totalTypingDuration + pauseDuration + deletionDuration;

      let cumulativeTypingTime = 0;
      const afterCharX: number[] = [];
      const afterCharY: number[] = [];
      const beforeCharX: number[] = [];
      const beforeCharY: number[] = [];

      const centerX = params.width / 2;
      const cursorYOffset = getCursorYOffset(params.cursorStyle, line.fontSize);
      const cursorXOffset = line.fontSize * 0.12;

      const deleteStart = cycleOffset + totalTypingDuration + pauseDuration;
      let globalCharIndex = 0;

      // For each visual line inside this content block
      for (let i = 0; i < linesAsGraphemes.length; i++) {
        const textLine = linesAsGraphemes[i];
        const lineYCenter = textBlockYOffset + i * lineHeight + lineHeight / 2;
        const lineWidth = lineCalculations[i].width;
        const lineStartX = params.center
          ? centerX - lineWidth / 2
          : textBlockXOffset;

        let currentX = 0; // relative offset used for computing x position per grapheme
        let tspanElements = "";

        for (let j = 0; j < textLine.length; j++) {
          const grapheme = textLine[j];
          const typingBegin = cycleOffset + cumulativeTypingTime;
          const typingBeginAttr = params.repeat
            ? `cycle.begin + ${fmt(typingBegin)}s`
            : `${fmt(typingBegin)}s`;

          let typingAnimation = "";
          if (params.repeat && deletionBehavior === "stay") {
            // Reset at the very start of each cycle, then show at its scheduled time + epsilon.
            const resetAnim = `<animate attributeName="opacity" to="0" dur="0s" begin="cycle.begin" fill="freeze"/>`;
            const showBegin = `cycle.begin + ${fmt(typingBegin + 0.001)}s`; // tiny offset to avoid tie
            const showAnim = `<animate attributeName="opacity" values="0;1" dur="0.01s" begin="${showBegin}" fill="freeze"/>`;
            typingAnimation = resetAnim + showAnim;
          } else {
            typingAnimation = `<animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="${typingBeginAttr}" fill="freeze"/>`;
          }

          let deletionAnimation = "";
          let hideAnimation = "";

          // Handle different deletion behaviors
          if (deletionBehavior === "backspace" && totalGraphemeCount > 0) {
            // Character-by-character deletion (original behavior)
            const deletionOrderIndex = totalGraphemeCount - 1 - globalCharIndex;
            const deletionBegin =
              deleteStart + deletionOrderIndex * line.deleteSpeed;
            const deletionBeginAttr = params.repeat
              ? `cycle.begin + ${fmt(deletionBegin)}s`
              : `${fmt(deletionBegin)}s`;
            deletionAnimation = `<animate attributeName="opacity" from="1" to="0" dur="0.01s" begin="${deletionBeginAttr}" fill="freeze"/>`;
          } else if (deletionBehavior === "clear") {
            // Instant clear all text at once
            const clearBegin = deleteStart;
            const clearBeginAttr = params.repeat
              ? `cycle.begin + ${fmt(clearBegin)}s`
              : `${fmt(clearBegin)}s`;
            deletionAnimation = `<animate attributeName="opacity" from="1" to="0" dur="0.01s" begin="${clearBeginAttr}" fill="freeze"/>`;
          } else if (deletionBehavior === "stay") {
            // Text stays visible - only hide at the very end of ALL cycles for repeat mode
            if (params.repeat) {
              // Use precomputed allLinesTypingDuration (already includes pause after last line)
              const hideBeginAttr = `cycle.begin + ${fmt(
                allLinesTypingDuration
              )}s`;
              hideAnimation = `<animate attributeName="opacity" to="0" dur="0.01s" begin="${hideBeginAttr}" fill="freeze"/>`;
            }
            // For non-repeat mode with 'stay', text remains visible permanently
          }

          const isLastGraphemeOfLine = j === textLine.length - 1;
          const { charWidth, totalWidth } = getGraphemeWidth(
            grapheme,
            line.fontSize,
            params.fontRatio,
            isLastGraphemeOfLine,
            letterSpacingPx
          );

          const xForThisGrapheme = fmt(lineStartX + currentX);
          tspanElements += `<tspan x="${xForThisGrapheme}" opacity="0">${grapheme}${typingAnimation}${deletionAnimation}${hideAnimation}</tspan>`;

          beforeCharX.push(lineStartX + currentX);
          beforeCharY.push(lineYCenter);

          currentX += totalWidth;

          afterCharX.push(lineStartX + currentX);
          afterCharY.push(lineYCenter);

          cumulativeTypingTime += line.typingSpeed;
          globalCharIndex++;
        }

        // Create text element with proper letter-spacing CSS value
        const letterSpacingCSS =
          typeof line.letterSpacing === "number"
            ? `${line.letterSpacing}em`
            : line.letterSpacing.toString();

        const textStyle = `font-family:'${line.font}',monospace;font-size:${fmt(
          line.fontSize
        )}px;fill:${line.color};letter-spacing:${letterSpacingCSS};`;
        allTextElements.push(
          `<text class="text-common" y="${fmt(
            lineYCenter
          )}" xml:space="preserve" style="${textStyle}">${tspanElements}</text>`
        );
      }

      // Cursor typing animation values (after each typed grapheme)
      const typingXValues = afterCharX.map((x) => fmt(x + cursorXOffset));
      const typingYValues = afterCharY.map((y) => fmt(y + cursorYOffset));

      // Handle cursor animations based on deletion behavior
      if (typingXValues.length > 0) {
        const typingBeginAttr = params.repeat
          ? `cycle.begin + ${fmt(cycleOffset)}s`
          : `${fmt(cycleOffset)}s`;
        allCursorAnimations += `<animate attributeName="x" values="${typingXValues.join(
          ";"
        )}" dur="${fmt(
          totalTypingDuration
        )}s" calcMode="discrete" begin="${typingBeginAttr}" fill="freeze"/>`;
        allCursorAnimations += `<animate attributeName="y" values="${typingYValues.join(
          ";"
        )}" dur="${fmt(
          totalTypingDuration
        )}s" calcMode="discrete" begin="${typingBeginAttr}" fill="freeze"/>`;
      }

      // Deletion cursor animations
      if (deletionBehavior === "backspace" && totalGraphemeCount > 0) {
        // Character-by-character deletion cursor movement
        const deletionXValues: string[] = [];
        const deletionYValues: string[] = [];

        for (let k = totalGraphemeCount - 1; k >= 0; k--) {
          deletionXValues.push(fmt(beforeCharX[k] + cursorXOffset));
          deletionYValues.push(fmt(beforeCharY[k] + cursorYOffset));
        }

        const deletionBeginRel =
          cycleOffset + totalTypingDuration + pauseDuration;
        const deletionBeginAttr = params.repeat
          ? `cycle.begin + ${fmt(deletionBeginRel)}s`
          : `${fmt(deletionBeginRel)}s`;
        allCursorAnimations += `<animate attributeName="x" values="${deletionXValues.join(
          ";"
        )}" dur="${fmt(
          totalGraphemeCount * line.deleteSpeed
        )}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze"/>`;
        allCursorAnimations += `<animate attributeName="y" values="${deletionYValues.join(
          ";"
        )}" dur="${fmt(
          totalGraphemeCount * line.deleteSpeed
        )}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze"/>`;
      } else if (deletionBehavior === "clear" && totalGraphemeCount > 0) {
        // For instant clear, move cursor to beginning immediately
        const clearBeginRel = cycleOffset + totalTypingDuration + pauseDuration;
        const clearBeginAttr = params.repeat
          ? `cycle.begin + ${fmt(clearBeginRel)}s`
          : `${fmt(clearBeginRel)}s`;
        allCursorAnimations += `<animate attributeName="x" to="${fmt(
          beforeCharX[0] + cursorXOffset
        )}" dur="0.01s" begin="${clearBeginAttr}" fill="freeze"/>`;
        allCursorAnimations += `<animate attributeName="y" to="${fmt(
          beforeCharY[0] + cursorYOffset
        )}" dur="0.01s" begin="${clearBeginAttr}" fill="freeze"/>`;
      }

      // Transition to next line cursor position
      if (deletionBehavior !== "stay" || contentIndex < textLines.length - 1) {
        const transitionBegin =
          cycleOffset + totalTypingDuration + pauseDuration + deletionDuration;
        const transitionBeginAttr = params.repeat
          ? `cycle.begin + ${fmt(transitionBegin)}s`
          : `${fmt(transitionBegin)}s`;

        const isLast = contentIndex === textLines.length - 1;
        const nextContentIndex = (contentIndex + 1) % textLines.length;

        if (!isLast || params.repeat) {
          // Calculate next cursor position based on deletion behavior
          let targetCursorPos;

          if (deletionBehavior === "stay") {
            if (isLast && params.repeat) {
              // Reset to beginning for repeat - use global positioning
              targetCursorPos = {
                x: globalTextBlockXOffset + cursorXOffset,
                y:
                  globalTextBlockYOffset +
                  (textLines[0].fontSize * 1.3) / 2 +
                  getCursorYOffset(params.cursorStyle, textLines[0].fontSize),
              };
            } else {
              // Move to next line below current content - use global positioning
              const nextLine = textLines[nextContentIndex];
              const nextLineHeight = nextLine.fontSize * 1.3;
              targetCursorPos = {
                x: globalTextBlockXOffset + cursorXOffset,
                y:
                  textBlockYOffset +
                  textBlockHeight +
                  nextLineHeight / 2 +
                  getCursorYOffset(params.cursorStyle, nextLine.fontSize),
              };
            }
          } else {
            // For 'backspace' and 'clear', cursor returns to same position or moves to next line
            const nextLine = textLines[nextContentIndex];
            const nextTextBlockHeight =
              nextLine.text.split("\n").length * nextLine.fontSize * 1.3;
            const nextTextBlockYOffset = params.vCenter
              ? (params.height - nextTextBlockHeight) / 2
              : 10;

            targetCursorPos = {
              x: (params.center ? params.width / 2 : 15) + cursorXOffset,
              y:
                nextTextBlockYOffset +
                (nextLine.fontSize * 1.3) / 2 +
                getCursorYOffset(params.cursorStyle, nextLine.fontSize),
            };
          }

          allCursorAnimations += `<animate attributeName="x" to="${fmt(
            targetCursorPos.x
          )}" dur="0.01s" begin="${transitionBeginAttr}" ${
            params.repeat ? "" : 'fill="freeze"'
          } />`;
          allCursorAnimations += `<animate attributeName="y" to="${fmt(
            targetCursorPos.y
          )}" dur="0.01s" begin="${transitionBeginAttr}" ${
            params.repeat ? "" : 'fill="freeze"'
          } />`;
        }
      }

      cycleOffset += contentCycleDuration;

      // Update accumulated height for 'stay' behavior
      if (deletionBehavior === "stay") {
        accumulatedHeight += textBlockHeight;
      }
    }

    overallCycleDuration = cycleOffset || 0;

    // If repeating & stay, hide cursor when all text hides (allLinesTypingDuration includes last pause)
    let repeatHideBegin: number | null = null;
    if (params.repeat && deletionBehavior === "stay") {
      repeatHideBegin = allLinesTypingDuration;
    }

    // small offset to avoid tie ordering issues for cursor visibility & blink
    const visibilityStartOffset = 0.002; // 2ms

    // Use the first text line's font size for cursor sizing
    const cursorFontSize =
      textLines.length > 0 ? textLines[0].fontSize : params.fontSize;
    const cursorColor =
      textLines.length > 0 ? textLines[0].color : params.color;
    let cursorElement = getCursorSvgShape(
      params.cursorStyle,
      cursorColor,
      cursorFontSize
    );

    if (cursorElement) {
      let visibilityAnimation = "";
      if (params.repeat) {
        // For repeat mode, reveal slightly after cycle.begin, then hide at allLinesTypingDuration if stay
        visibilityAnimation += `<animate attributeName="visibility" from="hidden" to="visible" dur="0.01s" begin="cycle.begin + ${fmt(
          visibilityStartOffset
        )}s" fill="freeze"/>`;

        if (deletionBehavior === "stay" && repeatHideBegin !== null) {
          // Hide cursor when all text hides (use the same hide time computed earlier)
          visibilityAnimation += `<animate attributeName="visibility" to="hidden" dur="0.01s" begin="cycle.begin + ${fmt(
            repeatHideBegin
          )}s" fill="freeze"/>`;
        } else {
          // Fallback behavior (if not 'stay'), keep previous cycle-wide pattern
          // Start it slightly after cycle.begin to avoid ordering ties.
          visibilityAnimation = `<animate attributeName="visibility" values="hidden;visible;hidden" keyTimes="0;0.001;1" dur="${fmt(
            overallCycleDuration
          )}s" begin="cycle.begin + ${fmt(visibilityStartOffset)}s"/>`;
        }
      } else {
        // non-repeat: reveal immediately and hide based on deletion behavior
        if (deletionBehavior === "stay") {
          // For 'stay', cursor remains visible after typing is complete
          visibilityAnimation = `<animate attributeName="visibility" from="hidden" to="visible" dur="0.01s" begin="0s" fill="freeze"/>`;
        } else {
          // For other behaviors, hide at the end
          visibilityAnimation = `<animate attributeName="visibility" from="hidden" to="visible" dur="0.01s" begin="0s" fill="freeze"/><animate attributeName="visibility" to="hidden" dur="0.01s" begin="${fmt(
            overallCycleDuration
          )}s" fill="freeze"/>`;
        }
      }

      allCursorAnimations += visibilityAnimation;

      // Cursor blink animation - adjust based on deletion behavior
      if (deletionBehavior === "stay" && !params.repeat) {
        // For 'stay' non-repeat, cursor blinks continuously after all typing is done
        const blinkStart = overallCycleDuration;
        allCursorAnimations += `<animate attributeName="opacity" values="1;0;1" dur="1.4s" begin="${fmt(
          blinkStart
        )}s" repeatCount="indefinite"/>`;
      } else {
        // Standard blinking during the animation
        // If repeating, start blink slightly after cycle.begin to avoid tie with visibility reset
        const blinkBegin = params.repeat
          ? `cycle.begin + ${fmt(visibilityStartOffset)}s`
          : "0s";
        allCursorAnimations += `<animate attributeName="opacity" values="1;0" dur="0.7s" begin="${blinkBegin}" repeatCount="indefinite"/>`;
      }

      // inject animations into the rect
      cursorElement = cursorElement.replace(
        "/>",
        `>${allCursorAnimations}</rect>`
      );
    } else {
      cursorElement = "";
    }

    // Build CSS styles including Google Fonts
    const stylesCSS = `
      ${googleFontsCSS}
      .text-common { 
        dominant-baseline: middle; 
        text-rendering: optimizeLegibility;
        shape-rendering: geometricPrecision;
      }
    `;

    // Build final SVG
    const svg = `<svg width="${fmt(params.width)}" height="${fmt(
      params.height
    )}" viewBox="0 0 ${fmt(params.width)} ${fmt(
      params.height
    )}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${fmt(params.width - 1)}" height="${fmt(
      params.height - 1
    )}" fill="${params.backgroundColor}" stroke="${
      params.border ? "#000" : "none"
    }" stroke-width="1" rx="4"/>
  <defs>
    ${
      params.repeat
        ? `<animate id="cycle" begin="0s;cycle.end" dur="${fmt(
            overallCycleDuration
          )}s"/>`
        : ""
    }
    <clipPath id="master-clip"><rect x="0" y="0" width="${fmt(
      params.width
    )}" height="${fmt(params.height)}"/></clipPath>
    <style type="text/css"><![CDATA[
${stylesCSS.trim()}
    ]]></style>
  </defs>
  <g clip-path="url(#master-clip)">
    ${allTextElements.join("")}
    ${cursorElement}
  </g>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }
    return new NextResponse(
      JSON.stringify({ error: "An unknown error occurred" }),
      { status: 500 }
    );
  }
}
