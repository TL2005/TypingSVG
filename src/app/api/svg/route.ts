import { NextRequest, NextResponse } from 'next/server';
import { validateParams } from '@/lib/utils';

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
        const deleteSpeed = Number(searchParams.get('deleteSpeed')) || params.typingSpeed;

        const contents = params.text.split(';');
        let overallCycleDuration = 0;
        const allTextElements: string[] = [];
        let allCursorAnimations = '';

        const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
        const getGraphemeBaseWidth = (grapheme: string) => {
            const isEmoji = emojiRegex.test(grapheme);
            return isEmoji ? params.fontSize : params.fontSize * params.fontRatio;
        };

        const calculateInitialCursorPos = (content: string, afterFirstLetter: boolean) => {
            const lines = content.split('\n');
            const lineHeight = params.fontSize * 1.3;
            const letterSpacingPixels = params.letterSpacing * params.fontSize;

            const lineCalculations = lines.map(line => {
                let cumulativeWidth = 0;
                if (line.length > 0) {
                    [...line].forEach(grapheme => cumulativeWidth += getGraphemeBaseWidth(grapheme));
                    cumulativeWidth += (line.length - 1) * letterSpacingPixels;
                }
                return { width: cumulativeWidth };
            });

            const textBlockWidth = Math.max(0, ...lineCalculations.map(lc => lc.width));
            const textBlockHeight = lines.length * lineHeight;
            const textBlockYOffset = params.vCenter ? (params.height - textBlockHeight) / 2 : 10;
            const textBlockXOffset = params.center ? (params.width - textBlockWidth) / 2 : 15;
            
            const cursorXOffset = params.fontSize * 0.12;
            const cursorYOffset = getCursorYOffset(params.cursorStyle, params.fontSize);

            let initialX = textBlockXOffset + cursorXOffset;

            if (afterFirstLetter) {
                const firstLine = lines[0];
                if (firstLine && firstLine.length > 0) {
                    const firstGrapheme = [...firstLine][0];
                    initialX += getGraphemeBaseWidth(firstGrapheme);
                }
            }

            return {
                x: initialX,
                y: textBlockYOffset + (lineHeight / 2) + cursorYOffset
            };
        };

        let cycleOffset = 0;

        for (const content of contents) {
            const lines = content.split('\n');
            const linesAsGraphemes = lines.map(line => [...line]);
            const totalGraphemeCount = linesAsGraphemes.reduce((sum, line) => sum + line.length, 0);

            const lineHeight = params.fontSize * 1.3;
            const letterSpacingPixels = params.letterSpacing * params.fontSize;

            const lineCalculations = linesAsGraphemes.map(line => {
                let cumulativeWidth = 0;
                if (line.length > 0) {
                    line.forEach(grapheme => cumulativeWidth += getGraphemeBaseWidth(grapheme));
                    cumulativeWidth += (line.length - 1) * letterSpacingPixels;
                }
                return { width: cumulativeWidth };
            });

            const textBlockWidth = Math.max(0, ...lineCalculations.map(lc => lc.width));
            const textBlockHeight = lines.length * lineHeight;
            const textBlockYOffset = params.vCenter ? (params.height - textBlockHeight) / 2 : 10;
            const textBlockXOffset = params.center ? (params.width - textBlockWidth) / 2 : 15;

            const totalTypingDuration = totalGraphemeCount * params.typingSpeed;
            // If not deleting, the content duration does not include deletion time
            let contentCycleDuration = totalTypingDuration + params.pause / 1000 + (deleteAfter ? totalGraphemeCount * deleteSpeed : 0);
            if (params.repeat && contents.length === 1 && !deleteAfter) {
                contentCycleDuration += (params.pause / 1000);
            }

            let cumulativeTypingTime = 0;
            const afterCharX: number[] = [];
            const afterCharY: number[] = [];
            const beforeCharX: number[] = [];
            const beforeCharY: number[] = [];
            
            const centerX = params.width / 2;
            const cursorYOffset = getCursorYOffset(params.cursorStyle, params.fontSize);
            const cursorXOffset = params.fontSize * 0.12;

            const deleteStart = cycleOffset + totalTypingDuration + params.pause / 1000;
            let globalCharIndex = 0;

            for (let i = 0; i < linesAsGraphemes.length; i++) {
                const line = linesAsGraphemes[i];
                const lineYCenter = textBlockYOffset + (i * lineHeight) + (lineHeight / 2);
                const lineWidth = lineCalculations[i].width;
                const lineStartX = params.center ? (centerX - (lineWidth / 2)) : textBlockXOffset;

                let currentX = params.center ? 0 : textBlockXOffset;
                let tspanElements = '';

                for (let j = 0; j < line.length; j++) {
                    const grapheme = line[j];
                    const typingBegin = cycleOffset + cumulativeTypingTime;
                    const typingBeginAttr = params.repeat ? `cycle.begin + ${typingBegin}s` : `${typingBegin}s`;
                    
                    const typingAnimation = `<animate attributeName="opacity" from="0" to="1" dur="0.01s" begin="${typingBeginAttr}" fill="freeze" />`;

                    let deletionAnimation = '';
                    if (deleteAfter && totalGraphemeCount > 0) {
                        const deletionOrderIndex = (totalGraphemeCount - 1 - globalCharIndex);
                        const deletionBegin = deleteStart + (deletionOrderIndex * deleteSpeed);
                        const deletionBeginAttr = params.repeat ? `cycle.begin + ${deletionBegin}s` : `${deletionBegin}s`;
                        deletionAnimation = `<animate attributeName="opacity" from="1" to="0" dur="0.01s" begin="${deletionBeginAttr}" fill="freeze" />`;
                    }

                    // If not deleting character by character, add an animation to hide the whole block at once.
                    let hideBlockAnimation = '';
                    if (!deleteAfter) {
                        const hideBegin = cycleOffset + totalTypingDuration + params.pause / 1000;
                        const hideBeginAttr = params.repeat ? `cycle.begin + ${hideBegin}s` : `${hideBegin}s`;
                        // Use `to="0"` and `fill="freeze"` to ensure it stays hidden until the next cycle reset.
                        hideBlockAnimation = `<animate attributeName="opacity" to="0" dur="0.01s" begin="${hideBeginAttr}" fill="freeze" />`;
                    }

                    const xForThisGrapheme = params.center ? lineStartX + currentX : currentX;
                    
                    beforeCharX.push(xForThisGrapheme);
                    beforeCharY.push(lineYCenter);
                    tspanElements += `<tspan x="${xForThisGrapheme}" opacity="0">${grapheme}${typingAnimation}${deletionAnimation}${hideBlockAnimation}</tspan>`;

                    const isLastGraphemeOfLine = (j === line.length - 1);
                    const graphemeWidth = getGraphemeBaseWidth(grapheme) + (isLastGraphemeOfLine ? 0 : letterSpacingPixels);
                    currentX += graphemeWidth;

                    afterCharX.push(params.center ? lineStartX + currentX : currentX);
                    afterCharY.push(lineYCenter);

                    cumulativeTypingTime += params.typingSpeed;
                    globalCharIndex++;
                }
                allTextElements.push(`<text class="text" y="${lineYCenter}" xml:space="preserve">${tspanElements}</text>`);
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
                const deletionBeginRel = cycleOffset + totalTypingDuration + (params.pause / 1000);
                const deletionBeginAttr = params.repeat ? `cycle.begin + ${deletionBeginRel}s` : `${deletionBeginRel}s`;
                const deletionXValuesStr = deletionXValues.join(';');
                const deletionYValuesStr = deletionYValues.join(';');
                allCursorAnimations += `<animate attributeName="x" values="${deletionXValuesStr}" dur="${totalGraphemeCount * deleteSpeed}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze" />`;
                allCursorAnimations += `<animate attributeName="y" values="${deletionYValuesStr}" dur="${totalGraphemeCount * deleteSpeed}s" calcMode="discrete" begin="${deletionBeginAttr}" fill="freeze" />`;
            }

            if (!deleteAfter) {
                const hideBeginRel = cycleOffset + totalTypingDuration + (params.pause / 1000);
                const hideBeginAttr = params.repeat ? `cycle.begin + ${hideBeginRel}s` : `${hideBeginRel}s`;

                const currentContentIndex = contents.indexOf(content);
                const nextContentIndex = (currentContentIndex + 1) % contents.length;

                let targetCursorPos;
                if (!params.repeat && nextContentIndex === 0) {
                    targetCursorPos = calculateInitialCursorPos(content, false);
                } else {
                    targetCursorPos = calculateInitialCursorPos(contents[nextContentIndex], true);
                }

                allCursorAnimations += `<animate attributeName="x" to="${targetCursorPos.x}" dur="0.01s" begin="${hideBeginAttr}" />`;
                allCursorAnimations += `<animate attributeName="y" to="${targetCursorPos.y}" dur="0.01s" begin="${hideBeginAttr}" />`;
            }
            
            cycleOffset += contentCycleDuration;
        }

        overallCycleDuration = cycleOffset;

        let cursorElement = getCursorSvgShape(params.cursorStyle, params.color, params.fontSize);
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
                <style>.text { font-family: '${params.font}', monospace; font-size: ${params.fontSize}px; fill: ${params.color}; letter-spacing: ${params.letterSpacing}em; dominant-baseline: middle; }</style>
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
