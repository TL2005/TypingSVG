/**
 * Validates the query parameters for the SVG generator.
 * @param params - The URLSearchParams object from the request.
 * @returns An object with the validated and parsed parameters.
 */
export function validateParams(params: URLSearchParams) {
    // Handle backward compatibility - check if 'lines' parameter exists
    const linesParam = params.get('lines');
    
    if (linesParam) {
        // New format with per-line styling
        const width = parseInt(params.get('width') || '450', 10);
        const height = parseInt(params.get('height') || '150', 10);
        const pause = parseInt(params.get('pause') || '1000', 10);
        const repeat = params.get('repeat') === 'true';
        const backgroundColor = params.get('backgroundColor') || '#ffffff';
        const center = params.get('center') === 'true';
        const vCenter = params.get('vCenter') === 'true';
        const border = params.get('border') === 'true';
        const cursorStyle = params.get('cursorStyle') || 'straight';
        const fontRatio = parseFloat(params.get('fontRatio') || '0.6');

        if ([width, height, pause, fontRatio].some(isNaN)) {
            throw new Error('Invalid numeric parameter');
        }

        return {
            // These fields are for backward compatibility but won't be used in new format
            text: '', 
            font: 'monospace',
            color: '#000000',
            typingSpeed: 0.5,
            letterSpacing: 0.1,
            fontSize: 28,
            // Active fields for new format
            width,
            height,
            pause,
            repeat,
            backgroundColor,
            center,
            vCenter,
            border,
            cursorStyle,
            fontRatio
        };
    } else {
        // Old format for backward compatibility
        const text = params.get('text') || 'Hello, World!';
        const font = params.get('font') || 'monospace';
        const color = params.get('color') || '#000000';
        const width = parseInt(params.get('width') || '450', 10);
        const height = parseInt(params.get('height') || '150', 10);
        const typingSpeed = parseFloat(params.get('typingSpeed') || '0.5');
        const pause = parseInt(params.get('pause') || '1000', 10);
        const letterSpacing = parseFloat(params.get('letterSpacing') || '0.1');
        const repeat = params.get('repeat') === 'true';
        const backgroundColor = params.get('backgroundColor') || '#ffffff';
        const fontSize = parseInt(params.get('fontSize') || '28', 10);
        const center = params.get('center') === 'true';
        const vCenter = params.get('vCenter') === 'true';
        const border = params.get('border') === 'true';
        const cursorStyle = params.get('cursorStyle') || 'straight';
        const fontRatio = parseFloat(params.get('fontRatio') || '0.6');

        if ([width, height, typingSpeed, pause, letterSpacing, fontSize, fontRatio].some(isNaN)) {
            throw new Error('Invalid numeric parameter');
        }

        return {
            text,
            font,
            color,
            width,
            height,
            typingSpeed,
            pause,
            letterSpacing,
            repeat,
            backgroundColor,
            fontSize,
            center,
            vCenter,
            border,
            cursorStyle,
            fontRatio
        };
    }
}