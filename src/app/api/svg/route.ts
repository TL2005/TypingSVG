import { NextRequest, NextResponse } from 'next/server';
import { validateParams } from '@/lib/utils';

interface TextLine {
    text: string;
    font: string;
    color: string;
    fontSize: number;
    letterSpacing: number;
    typingSpeed: number;
    deleteSpeed: number;
}

// Helper: returns the numeric y offset (in user units) to apply to the cursor
// relative to the text baseline/center. Positive moves it down, negative moves it up.
function getCursorYOffset(style: string, fontSize: number): number {
    switch (style) {
        case 'underline':
            return fontSize * 0.3;
        case 'block':
            return -fontSize * 0.85;
        case 'blank':
            return 0;
        case 'straight':
        default:
            return -fontSize * 0.85;
    }
}

// Returns the svg rect string (still return the shape with a 'y' attribute — replaced later with animations)
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
                textLines = texts.map(text => ({
                    text,
                    font: params.font,
                    color: params.color,
                    fontSize: params.fontSize,
                    letterSpacing: params.letterSpacing,
                    typingSpeed: params.typingSpeed,
                    deleteSpeed: params.typingSpeed
                }));
            }
        } catch (error) {
            return new NextResponse(JSON.stringify({ error: 'Invalid lines parameter' }), { status: 400 });
        }

        let overallCycleDuration = 0;
        const allTextElements: string[] = [];
        let allCursorAnimations = '';

        const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
        const getGraphemeBaseWidth = (grapheme: string, fontSize: number, fontRatio: number) => {
            const isEmoji = emojiRegex.test(grapheme);
            return isEmoji ? fontSize : fontSize * fontRatio;
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
                const letterSpacingPixels = line.letterSpacing * line.fontSize;
                
                for (const textLine of lines) {
                    let lineWidth = 0;
                    if (textLine.length > 0) {
                        [...textLine].forEach(grapheme => {
                            lineWidth += getGraphemeBaseWidth(grapheme, line.fontSize, params.fontRatio);
                        });
                        lineWidth += (textLine.length - 1) * letterSpacingPixels;
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
                initialX += getGraphemeBaseWidth(firstGrapheme, firstLine.fontSize, params.fontRatio);
            }

            return {
                x: initialX,
                y: textBlockYOffset + (firstLine.fontSize * 1.3 / 2) + cursorYOffset
            };
        };

        let cycleOffset = 0;

        for (let contentIndex = 0; contentIndex < textLines.length; contentIndex++) {
            const line = textLines[contentIndex];
            const content = line.text;
            const lines = content.split('\n');
            const linesAsGraphemes = lines.map(line => [...line]);
            const totalGraphemeCount = linesAsGraphemes.reduce((sum, line) => sum + line.length, 0);

            const lineHeight = line.fontSize * 1.3;
            const letterSpacingPixels = line.letterSpacing * line.fontSize;

            const lineCalculations = linesAsGraphemes.map(textLine => {
                let cumulativeWidth = 0;
                if (textLine.length > 0) {
                    textLine.forEach(grapheme => {
                        cumulativeWidth += getGraphemeBaseWidth(grapheme, line.fontSize, params.fontRatio);
                    });
                    cumulativeWidth += (textLine.length - 1) * letterSpacingPixels;
                }
                return { width: cumulativeWidth };
            });

            const textBlockWidth = Math.max(0, ...lineCalculations.map(lc => lc.width));
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

            for (let i = 0; i < linesAsGraphemes.length; i++) {
                const textLine = linesAsGraphemes[i];
                const lineYCenter = textBlockYOffset + (i * lineHeight) + (lineHeight / 2);
                const lineWidth = lineCalculations[i].width;
                const lineStartX = params.center ? (centerX - (lineWidth / 2)) : textBlockXOffset;

                let currentX = params.center ? 0 : textBlockXOffset;
                let tspanElements = '';

                for (let j = 0; j < textLine.length; j++) {
                    const grapheme = textLine[j];
                    const typingBegin = cycleOffset + cumulativeTypingTime;
                    const typingBeginAttr = params.repeat ? `cycle.begin + ${typingBegin}s` : `${typingBegin}s`;
                    
                    const typingAnimation = `<animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="${typingBeginAttr}" fill="freeze" />`;

                    let deletionAnimation = '';
                    if (deleteAfter && totalGraphemeCount > 0) {
                        const deletionOrderIndex = (totalGraphemeCount - 1 - globalCharIndex);
                        const deletionBegin = deleteStart + (deletionOrderIndex * line.deleteSpeed);
                        const deletionBeginAttr = params.repeat ? `cycle.begin + ${deletionBegin}s` : `${deletionBegin}s`;
                        deletionAnimation = `<animate attributeName="opacity" from="1" to="0" dur="0.01s" begin="${deletionBeginAttr}" fill="freeze" />`;
                    }

                    let hideBlockAnimation = '';
                    if (!deleteAfter) {
                        const hideBegin = cycleOffset + totalTypingDuration + pauseDuration;
                        const hideBeginAttr = params.repeat ? `cycle.begin + ${hideBegin}s` : `${hideBegin}s`;
                        hideBlockAnimation = `<animate attributeName="opacity" to="0" dur="0.01s" begin="${hideBeginAttr}" fill="freeze" />`;
                    }

                    const xForThisGrapheme = params.center ? lineStartX + currentX : currentX;
                    
                    beforeCharX.push(xForThisGrapheme);
                    beforeCharY.push(lineYCenter);
                    tspanElements += `<tspan x="${xForThisGrapheme}" opacity="0">${grapheme}${typingAnimation}${deletionAnimation}${hideBlockAnimation}</tspan>`;

                    const isLastGraphemeOfLine = (j === textLine.length - 1);
                    const graphemeWidth = getGraphemeBaseWidth(grapheme, line.fontSize, params.fontRatio) + (isLastGraphemeOfLine ? 0 : letterSpacingPixels);
                    currentX += graphemeWidth;

                    afterCharX.push(params.center ? lineStartX + currentX : currentX);
                    afterCharY.push(lineYCenter);

                    cumulativeTypingTime += line.typingSpeed;
                    globalCharIndex++;
                }
                
                // Create text element with line-specific styling
                const textStyle = `font-family: '${line.font}', monospace; font-size: ${line.fontSize}px; fill: ${line.color}; letter-spacing: ${line.letterSpacing}em; dominant-baseline: middle;`;
                allTextElements.push(`<text class="text-line-${contentIndex}" y="${lineYCenter}" xml:space="preserve" style="${textStyle}">${tspanElements}</text>`);
            }

            const typingXValues = afterCharX.map(x => (x + cursorXOffset));
            const typingYValues = afterCharY.map(y => (y + cursorYOffset));

            const deletionXValues: number[] = [];
            const deletionYValues: number[] = [];
            if (deleteAfter && totalGraphemeCount > 0) {
                for (let k = totalGraphemeCount - 1; k >= 0; k--) {
                    deletionXValues.push(beforeCharX[k] + cursorXOffset);
                    deletionYValues.push(beforeCharY[k] + cursorYOffset);
                }
            }

            const typingXValuesStr = typingXValues.length ? typingXValues.join(';') : `${textBlockXOffset + cursorXOffset}`;
            const typingYValuesStr = typingYValues.length ? typingYValues.join(';') : `${textBlockYOffset + (lineHeight / 2) + cursorYOffset}`;

            if (typingXValues.length > 0) {
                const typingBeginAttr = params.repeat ? `cycle.begin + ${cycleOffset}s` : `${cycleOffset}s`;
                allCursorAnimations += `<animate attributeName="x" values="${typingXValuesStr}" dur="${totalTypingDuration}s" calcMode="discrete" begin="${typingBeginAttr}" fill="freeze" />`;
                allCursorAnimations += `<animate attributeName="y" values="${typingYValuesStr}" dur="${totalTypingDuration}s" calcMode="discrete" begin="${typingBeginAttr}" fill="freeze" />`;
            }

            if (deleteAfter && deletionXValues.length > 0) {
                const deletionBeginRel = cycleOffset + totalTypingDuration + pauseDuration;
                const deletionBeginAttr = params.repeat ? `cycle.begin + ${deletionBeginRel}s` : `${deletionBeginRel}s`;
                const deletionXValuesStr = deletionXValues.join(';');
                const deletionYValuesStr = deletionYValues.join(';');
                allCursorAnimations += `<animate attributeName="x" values="${deletionXValuesStr}" dur="${totalGraphemeCount * line.deleteSpeed}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze" />`;
                allCursorAnimations += `<animate attributeName="y" values="${deletionYValuesStr}" dur="${totalGraphemeCount * line.deleteSpeed}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze" />`;
            }

            const transitionBegin = cycleOffset + totalTypingDuration + pauseDuration + deletionDuration;
            const transitionBeginAttr = params.repeat ? `cycle.begin + ${transitionBegin}s` : `${transitionBegin}s`;

            const isLast = contentIndex === textLines.length - 1;
            const nextContentIndex = (contentIndex + 1) % textLines.length;

            if (!params.repeat && isLast) {
                const targetCursorPos = calculateInitialCursorPos(textLines, contentIndex, false);
                allCursorAnimations += `<animate attributeName="x" to="${targetCursorPos.x}" dur="0.01s" begin="${transitionBeginAttr}" fill="freeze" />`;
                allCursorAnimations += `<animate attributeName="y" to="${targetCursorPos.y}" dur="0.01s" begin="${transitionBeginAttr}" fill="freeze" />`;
            } else if (!params.repeat && !deleteAfter) {
                const targetCursorPos = calculateInitialCursorPos(textLines, nextContentIndex, false);
                allCursorAnimations += `<animate attributeName="x" to="${targetCursorPos.x}" dur="0.01s" begin="${transitionBeginAttr}" fill="freeze" />`;
                allCursorAnimations += `<animate attributeName="y" to="${targetCursorPos.y}" dur="0.01s" begin="${transitionBeginAttr}" fill="freeze" />`;
            } else if (params.repeat && !deleteAfter) {
                const targetCursorPos = calculateInitialCursorPos(textLines, nextContentIndex, false);
                allCursorAnimations += `<animate attributeName="x" to="${targetCursorPos.x}" dur="0.01s" begin="${transitionBeginAttr}" />`;
                allCursorAnimations += `<animate attributeName="y" to="${targetCursorPos.y}" dur="0.01s" begin="${transitionBeginAttr}" />`;
            } else {
                const targetCursorPos = calculateInitialCursorPos(textLines, nextContentIndex, false);
                allCursorAnimations += `<animate attributeName="x" to="${targetCursorPos.x}" dur="0.01s" begin="${transitionBeginAttr}" />`;
                allCursorAnimations += `<animate attributeName="y" to="${targetCursorPos.y}" dur="0.01s" begin="${transitionBeginAttr}" />`;
            }
            
            cycleOffset += contentCycleDuration;
        }

        overallCycleDuration = cycleOffset;

        // Use the first text line's font size for cursor sizing (or use a default)
        const cursorFontSize = textLines.length > 0 ? textLines[0].fontSize : params.fontSize;
        const cursorColor = textLines.length > 0 ? textLines[0].color : params.color;
        let cursorElement = getCursorSvgShape(params.cursorStyle, cursorColor, cursorFontSize);
        
        if (cursorElement) {
            let visibilityAnimation = '';
            if (params.repeat) {
                const visibilityValues = "hidden; visible; hidden";
                const visibilityKeyTimes = `0; 0.001; 1`;
                visibilityAnimation = `<animate attributeName="visibility" values="${visibilityValues}" keyTimes="${visibilityKeyTimes}" dur="${overallCycleDuration}s" begin="cycle.begin" />`;
            } else {
                visibilityAnimation = `<animate attributeName="visibility" from="hidden" to="visible" dur="0.01s" begin="0s" fill="freeze" /><animate attributeName="visibility" to="hidden" dur="0.01s" begin="${overallCycleDuration}s" fill="freeze" />`;
            }
            
            allCursorAnimations += visibilityAnimation;
            allCursorAnimations += `<animate attributeName="opacity" values="1;0" dur="0.7s" begin="${params.repeat ? 'cycle.begin' : '0s'}" repeatCount="indefinite" />`;
            
            cursorElement = cursorElement.replace('/>', `>${allCursorAnimations}</rect>`);
        }

        const svg = `
            <svg width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="${params.width - 1}" height="${params.height - 1}" fill="${params.backgroundColor}" stroke="${params.border ? '#000' : 'none'}" stroke-width="1" rx="4" />
                <defs>
                    ${params.repeat ? `<animate id="cycle" begin="0s;cycle.end" dur="${overallCycleDuration}s" />` : ''}
                    <clipPath id="master-clip"><rect x="0" y="0" width="${params.width}" height="${params.height}" /></clipPath>
                </defs>
                <g clip-path="url(#master-clip)">${allTextElements.join('')}${cursorElement}</g>
            </svg>
        `;

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