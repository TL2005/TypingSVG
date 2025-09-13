import { NextRequest, NextResponse } from 'next/server';
import { validateParams } from '@/lib/utils';

interface TextLine {
  text: string;
  font: string;
  color: string;
  fontSize: number;
  letterSpacing: string | number;
  typingSpeed: number;
  deleteSpeed: number;
}

/**
 * Parse letter-spacing value and convert to pixels
 * Supports: em, rem, px, %, numbers (treated as em)
 */
function parseLetterSpacing(letterSpacing: string | number, fontSize: number): number {
  if (typeof letterSpacing === 'number') {
    return letterSpacing * fontSize; // Treat as em
  }
  
  const value = letterSpacing.toString().trim().toLowerCase();
  
  // Extract numeric value and unit
  const match = value.match(/^([+-]?\d*\.?\d+)(em|rem|px|%)?$/);
  if (!match) {
    // Handle special values
    if (value === 'normal') return 0;
    if (value === 'inherit') return 0;
    // Default to 0 for invalid values
    return 0;
  }
  
  const numValue = parseFloat(match[1]);
  const unit = match[2] || 'em'; // Default to em if no unit
  
  switch (unit) {
    case 'em':
      return numValue * fontSize;
    case 'rem':
      return numValue * 16; // Assume 16px root font size
    case 'px':
      return numValue;
    case '%':
      return (numValue / 100) * fontSize;
    default:
      return numValue * fontSize; // Fallback to em
  }
}

// Helper: returns the numeric y offset (in user units) to apply to the cursor
// relative to the text baseline/center. Positive moves it down, negative moves it up.
function getCursorYOffset(style: string, fontSize: number): number {
  switch (style) {
    case 'underline':
      return fontSize * 0.45;
    case 'block':
      return -fontSize * 0.85;
    case 'blank':
      return 0;
    case 'straight':
    default:
      return -fontSize * 0.75;
  }
}

// Returns the svg rect string (still return the shape with a 'y' attribute – replaced later with animations)
function getCursorSvgShape(style: string, color: string, fontSize: number): string {
  const yPos = getCursorYOffset(style, fontSize);
  switch (style) {
    case 'underline':
      return `<rect y="${yPos}" width="${fontSize * 0.6}" height="3" fill="${color}" visibility="hidden"/>`;
    case 'block':
      return `<rect y="${yPos}" width="${fontSize * 0.6}" height="${fontSize * 1.2}" fill="${color}" visibility="hidden"/>`;
    case 'blank':
      return '';
    case 'straight':
    default:
      return `<rect y="${yPos}" width="2.5" height="${fontSize * 1.2}" fill="${color}" visibility="hidden"/>`;
  }
}

/**
 * Fetch Google Font CSS and convert font URLs to base64 data URIs
 */
async function fetchGoogleFontCSS(fontFamily: string, weight: string = '400', text: string = ''): Promise<string> {
  try {
    const url = `https://fonts.googleapis.com/css2?${new URLSearchParams({
      family: `${fontFamily}:wght@${weight}`,
      text: text,
      display: 'fallback'
    })}`;

    // Fetch the CSS
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Font CSS: ${response.status}`);
    }

    let css = await response.text();

    // Find all font file URLs and convert them to base64 data URIs
    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)\s+format\(['"]([^'"]+)['"]\)/g;
    const matches = [...css.matchAll(urlRegex)];

    for (const match of matches) {
      const [fullMatch, fontUrl, fontFormat] = match;
      
      try {
        // Fetch the font file
        const fontResponse = await fetch(fontUrl);
        if (fontResponse.ok) {
          const fontBuffer = await fontResponse.arrayBuffer();
          const base64Font = Buffer.from(fontBuffer).toString('base64');
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
    return '';
  }
}

/**
 * Get unique fonts from text lines and fetch their CSS
 */
async function getGoogleFontsCSS(textLines: TextLine[]): Promise<string> {
  const uniqueFonts = new Map<string, string>();
  let allText = '';

  // Collect unique fonts and all text
  for (const line of textLines) {
    if (!uniqueFonts.has(line.font)) {
      uniqueFonts.set(line.font, '400'); // Default weight
    }
    allText += line.text;
  }

  // Remove duplicates from text for optimization
  const uniqueChars = [...new Set(allText)].join('');

  const fontPromises = Array.from(uniqueFonts.entries()).map(([fontFamily, weight]) =>
    fetchGoogleFontCSS(fontFamily, weight, uniqueChars)
  );

  const fontCSSArray = await Promise.all(fontPromises);
  return fontCSSArray.filter(css => css.length > 0).join('\n');
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { searchParams } = url;
    const params = validateParams(searchParams);

    const deleteAfter = searchParams.get('deleteAfter') === 'true';

    // Parse text lines data
    let textLines: TextLine[];
    try {
      const linesParam = searchParams.get('lines');
      if (linesParam) {
        textLines = JSON.parse(linesParam) as TextLine[];
      } else {
        // Fallback to old format for backward compatibility
        const texts = params.text.split(';');
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
      return new NextResponse(JSON.stringify({ error: 'Invalid lines parameter' }), { status: 400 });
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
    let allCursorAnimations = '';

    const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
    
    /**
     * Get character width with better handling for emojis and monospace
     */
    const getGraphemeWidth = (grapheme: string, fontSize: number, fontRatio: number, isLastChar: boolean, letterSpacingPx: number): { charWidth: number; totalWidth: number } => {
      const isEmoji = emojiRegex.test(grapheme);
      if (isEmoji) {
        const charWidth = fontSize;
        const totalWidth = charWidth + (isLastChar ? 0 : letterSpacingPx);
        return { charWidth, totalWidth };
      }


      // Heuristic-based advance width estimation for proportional fonts.
      // We avoid relying on a single fixed ratio 
      // and instead bias by character shape so capitals & wide glyphs don't overlap.
      const veryWideChars = /[MW]/;                      // “M”, “W” (broad caps)
      const wideChars     = /[O@#%&<>]/;               // “O” and selected symbols
      const narrowChars   = /[ilI,.;!:\'\"`\|\/\(\)\[\]{}?]/;  // “i, l, I” and thin marks (.,;:!)
      const upper         = /[A-Z]/;                    // uppercase letters
      const digit         = /[0-9]/;                    // digits
      const punctuation   = /[-_=+\*~^]/;               // other punctuation (unchanged)


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

    const calculateInitialCursorPos = (textLines: TextLine[], contentIndex: number, afterFirstLetter: boolean) => {
      let totalHeight = 0;
      let maxWidth = 0;

      // Calculate text block dimensions
      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        const content = line.text;
        const lines = content.split('\n');
        const lineHeight = line.fontSize * 1.3;
        const letterSpacingPx = parseLetterSpacing(line.letterSpacing, line.fontSize);

        for (const textLine of lines) {
          let lineWidth = 0;
          if (textLine.length > 0) {
            const graphemes = [...textLine];
            graphemes.forEach((grapheme, idx) => {
              const isLastChar = idx === graphemes.length - 1;
              const { totalWidth } = getGraphemeWidth(grapheme, line.fontSize, params.fontRatio, isLastChar, letterSpacingPx);
              lineWidth += totalWidth;
            });
          }
          maxWidth = Math.max(maxWidth, lineWidth);
          totalHeight += lineHeight;
        }
      }

      const textBlockYOffset = params.vCenter ? (params.height - totalHeight) / 2 : 10;
      const textBlockXOffset = params.center ? (params.width - maxWidth) / 2 : 15;

      // Get the first line's font size for cursor positioning
      const firstLine = textLines[contentIndex];
      const cursorXOffset = firstLine.fontSize * 0.12;
      const cursorYOffset = getCursorYOffset(params.cursorStyle, firstLine.fontSize);

      let initialX = textBlockXOffset + cursorXOffset;

      if (afterFirstLetter && firstLine.text.length > 0) {
        const firstGrapheme = [...firstLine.text][0];
        const letterSpacingPx = parseLetterSpacing(firstLine.letterSpacing, firstLine.fontSize);
        const { charWidth } = getGraphemeWidth(firstGrapheme, firstLine.fontSize, params.fontRatio, false, letterSpacingPx);
        initialX += charWidth;
      }

      return {
        x: initialX,
        y: textBlockYOffset + firstLine.fontSize * 1.3 / 2 + cursorYOffset,
      };
    };

    let cycleOffset = 0;

    for (let contentIndex = 0; contentIndex < textLines.length; contentIndex++) {
      const line = textLines[contentIndex];
      const content = line.text;
      const lines = content.split('\n');
      const linesAsGraphemes = lines.map((ln) => [...ln]);
      const totalGraphemeCount = linesAsGraphemes.reduce((sum, ln) => sum + ln.length, 0);

      const lineHeight = line.fontSize * 1.3;
      const letterSpacingPx = parseLetterSpacing(line.letterSpacing, line.fontSize);

      const lineCalculations = linesAsGraphemes.map((textLine) => {
        let cumulativeWidth = 0;
        if (textLine.length > 0) {
          textLine.forEach((grapheme, idx) => {
            const isLastChar = idx === textLine.length - 1;
            const { totalWidth } = getGraphemeWidth(grapheme, line.fontSize, params.fontRatio, isLastChar, letterSpacingPx);
            cumulativeWidth += totalWidth;
          });
        }
        return { width: cumulativeWidth };
      });

      const textBlockWidth = Math.max(0, ...lineCalculations.map((lc) => lc.width));
      const textBlockHeight = lines.length * lineHeight;

      // Calculate positioning for this content block
      const textBlockYOffset = params.vCenter ? (params.height - textBlockHeight) / 2 : 10;
      const textBlockXOffset = params.center ? (params.width - textBlockWidth) / 2 : 15;

      const totalTypingDuration = totalGraphemeCount * line.typingSpeed;
      const pauseDuration = (Number(searchParams.get('pause')) || params.pause) / 1000;
      const deletionDuration = deleteAfter ? totalGraphemeCount * line.deleteSpeed : 0;

      let contentCycleDuration = totalTypingDuration + pauseDuration + deletionDuration;
      if (params.repeat && textLines.length === 1 && !deleteAfter) {
        contentCycleDuration += pauseDuration;
      }

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
        const lineStartX = params.center ? centerX - lineWidth / 2 : textBlockXOffset;

        let currentX = 0; // relative offset used for computing x position per grapheme
        let tspanElements = '';

        for (let j = 0; j < textLine.length; j++) {
          const grapheme = textLine[j];
          const typingBegin = cycleOffset + cumulativeTypingTime;
          const typingBeginAttr = params.repeat ? `cycle.begin + ${fmt(typingBegin)}s` : `${fmt(typingBegin)}s`;

          const typingAnimation = `<animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="${typingBeginAttr}" fill="freeze"/>`;

          let deletionAnimation = '';
          if (deleteAfter && totalGraphemeCount > 0) {
            const deletionOrderIndex = totalGraphemeCount - 1 - globalCharIndex;
            const deletionBegin = deleteStart + deletionOrderIndex * line.deleteSpeed;
            const deletionBeginAttr = params.repeat ? `cycle.begin + ${fmt(deletionBegin)}s` : `${fmt(deletionBegin)}s`;
            deletionAnimation = `<animate attributeName="opacity" from="1" to="0" dur="0.01s" begin="${deletionBeginAttr}" fill="freeze"/>`;
          }

          let hideBlockAnimation = '';
          if (!deleteAfter) {
            const hideBegin = cycleOffset + totalTypingDuration + pauseDuration;
            const hideBeginAttr = params.repeat ? `cycle.begin + ${fmt(hideBegin)}s` : `${fmt(hideBegin)}s`;
            hideBlockAnimation = `<animate attributeName="opacity" to="0" dur="0.01s" begin="${hideBeginAttr}" fill="freeze"/>`;
          }

          const isLastGraphemeOfLine = j === textLine.length - 1;
          const { charWidth, totalWidth } = getGraphemeWidth(grapheme, line.fontSize, params.fontRatio, isLastGraphemeOfLine, letterSpacingPx);

          const xForThisGrapheme = fmt(lineStartX + currentX);
          tspanElements += `<tspan x="${xForThisGrapheme}" opacity="0">${grapheme}${typingAnimation}${deletionAnimation}${hideBlockAnimation}</tspan>`;

          beforeCharX.push(lineStartX + currentX);
          beforeCharY.push(lineYCenter);

          currentX += totalWidth;

          afterCharX.push(lineStartX + currentX);
          afterCharY.push(lineYCenter);

          cumulativeTypingTime += line.typingSpeed;
          globalCharIndex++;
        }

        // Create text element with proper letter-spacing CSS value
        const letterSpacingCSS = typeof line.letterSpacing === 'number' ? 
          `${line.letterSpacing}em` : 
          line.letterSpacing.toString();
        
        const textStyle = `font-family:'${line.font}',monospace;font-size:${fmt(line.fontSize)}px;fill:${line.color};letter-spacing:${letterSpacingCSS};`;
        // Use a small common class for baseline & space to reduce repetition structurally
        allTextElements.push(`<text class="text-common" y="${fmt(lineYCenter)}" xml:space="preserve" style="${textStyle}">${tspanElements}</text>`);
      }

      // cursor typing animation values (after each typed grapheme)
      const typingXValues = afterCharX.map((x) => fmt(x + cursorXOffset));
      const typingYValues = afterCharY.map((y) => fmt(y + cursorYOffset));

      // deletion order (reverse of beforeCharX)
      const deletionXValues: string[] = [];
      const deletionYValues: string[] = [];
      if (deleteAfter && totalGraphemeCount > 0) {
        for (let k = totalGraphemeCount - 1; k >= 0; k--) {
          deletionXValues.push(fmt(beforeCharX[k] + cursorXOffset));
          deletionYValues.push(fmt(beforeCharY[k] + cursorYOffset));
        }
      }

      if (typingXValues.length > 0) {
        const typingBeginAttr = params.repeat ? `cycle.begin + ${fmt(cycleOffset)}s` : `${fmt(cycleOffset)}s`;
        allCursorAnimations += `<animate attributeName="x" values="${typingXValues.join(';')}" dur="${fmt(
          totalTypingDuration,
        )}s" calcMode="discrete" begin="${typingBeginAttr}" fill="freeze"/>`;
        allCursorAnimations += `<animate attributeName="y" values="${typingYValues.join(';')}" dur="${fmt(
          totalTypingDuration,
        )}s" calcMode="discrete" begin="${typingBeginAttr}" fill="freeze"/>`;
      }

      if (deleteAfter && deletionXValues.length > 0) {
        const deletionBeginRel = cycleOffset + totalTypingDuration + pauseDuration;
        const deletionBeginAttr = params.repeat ? `cycle.begin + ${fmt(deletionBeginRel)}s` : `${fmt(deletionBeginRel)}s`;
        allCursorAnimations += `<animate attributeName="x" values="${deletionXValues.join(';')}" dur="${fmt(
          totalGraphemeCount * line.deleteSpeed,
        )}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze"/>`;
        allCursorAnimations += `<animate attributeName="y" values="${deletionYValues.join(';')}" dur="${fmt(
          totalGraphemeCount * line.deleteSpeed,
        )}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze"/>`;
      }

      const transitionBegin = cycleOffset + totalTypingDuration + pauseDuration + deletionDuration;
      const transitionBeginAttr = params.repeat ? `cycle.begin + ${fmt(transitionBegin)}s` : `${fmt(transitionBegin)}s`;

      const isLast = contentIndex === textLines.length - 1;
      const nextContentIndex = (contentIndex + 1) % textLines.length;

      // In all branches we set cursor to the computed next start -- keep consistent behavior
      const targetCursorPos = calculateInitialCursorPos(textLines, nextContentIndex, false);
      allCursorAnimations += `<animate attributeName="x" to="${fmt(targetCursorPos.x)}" dur="0.01s" begin="${transitionBeginAttr}" ${params.repeat ? '' : 'fill="freeze"'} />`;
      allCursorAnimations += `<animate attributeName="y" to="${fmt(targetCursorPos.y)}" dur="0.01s" begin="${transitionBeginAttr}" ${params.repeat ? '' : 'fill="freeze"'} />`;

      cycleOffset += contentCycleDuration;
    }

    overallCycleDuration = cycleOffset || 0;

    // Use the first text line's font size for cursor sizing (or use a default)
    const cursorFontSize = textLines.length > 0 ? textLines[0].fontSize : params.fontSize;
    const cursorColor = textLines.length > 0 ? textLines[0].color : params.color;
    let cursorElement = getCursorSvgShape(params.cursorStyle, cursorColor, cursorFontSize);

    if (cursorElement) {
      let visibilityAnimation = '';
      if (params.repeat) {
        const visibilityValues = 'hidden;visible;hidden';
        const visibilityKeyTimes = '0;0.001;1';
        visibilityAnimation = `<animate attributeName="visibility" values="${visibilityValues}" keyTimes="${visibilityKeyTimes}" dur="${fmt(
          overallCycleDuration,
        )}s" begin="cycle.begin"/>`;
      } else {
        // non-repeat: reveal immediately and hide at the end
        visibilityAnimation = `<animate attributeName="visibility" from="hidden" to="visible" dur="0.01s" begin="0s" fill="freeze"/><animate attributeName="visibility" to="hidden" dur="0.01s" begin="${fmt(
          overallCycleDuration,
        )}s" fill="freeze"/>`;
      }

      allCursorAnimations += visibilityAnimation;
      allCursorAnimations += `<animate attributeName="opacity" values="1;0" dur="0.7s" begin="${params.repeat ? 'cycle.begin' : '0s'}" repeatCount="indefinite"/>`;

      // inject animations into the rect (replace self-closing with a full element)
      cursorElement = cursorElement.replace('/>', `>${allCursorAnimations}</rect>`);
    } else {
      // if blank cursor, ensure cursorElement is empty string
      cursorElement = '';
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

    // Build final SVG: include embedded Google Fonts CSS
    const svg = `<svg width="${fmt(params.width)}" height="${fmt(params.height)}" viewBox="0 0 ${fmt(
      params.width,
    )} ${fmt(params.height)}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${fmt(params.width - 1)}" height="${fmt(params.height - 1)}" fill="${params.backgroundColor}" stroke="${
      params.border ? '#000' : 'none'
    }" stroke-width="1" rx="4"/>
  <defs>
    ${params.repeat ? `<animate id="cycle" begin="0s;cycle.end" dur="${fmt(overallCycleDuration)}s"/>` : ''}
    <clipPath id="master-clip"><rect x="0" y="0" width="${fmt(params.width)}" height="${fmt(params.height)}"/></clipPath>
    <style type="text/css"><![CDATA[
${stylesCSS.trim()}
    ]]></style>
  </defs>
  <g clip-path="url(#master-clip)">
    ${allTextElements.join('')}
    ${cursorElement}
  </g>
</svg>`;

    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new NextResponse(JSON.stringify({ error: 'An unknown error occurred' }), { status: 500 });
  }
}