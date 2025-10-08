/**
 * Default values for the SVG generator
 */
const DEFAULT_VALUES = {
    // Text line defaults
    font: 'Courier Prime',
    color: '#000000',
    fontSize: 28,
    letterSpacing: '0.1em',
    typingSpeed: 0.5,
    deleteSpeed: 0.5,
    fontWeight: '400',
    lineHeight: 1.3,
    
    // Global defaults
    width: 450,
    height: 150,
    pause: 1000,
    repeat: true,
    backgroundColor: '#ffffff',
    backgroundOpacity: 1,
    center: true,
    vCenter: true,
    border: true,
    cursorStyle: 'straight',
    fontRatio: 0.6,
    deletionBehavior: 'backspace'
};

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
        const width = parseInt(params.get('width') || DEFAULT_VALUES.width.toString(), 10);
        const height = parseInt(params.get('height') || DEFAULT_VALUES.height.toString(), 10);
        const pause = parseInt(params.get('pause') || DEFAULT_VALUES.pause.toString(), 10);
        const repeat = params.get('repeat') !== null ? params.get('repeat') === 'true' : DEFAULT_VALUES.repeat;
        const backgroundColor = params.get('backgroundColor') || DEFAULT_VALUES.backgroundColor;
        const backgroundOpacity = parseFloat(params.get('backgroundOpacity') || DEFAULT_VALUES.backgroundOpacity.toString());
        const center = params.get('center') !== null ? params.get('center') === 'true' : DEFAULT_VALUES.center;
        const vCenter = params.get('vCenter') !== null ? params.get('vCenter') === 'true' : DEFAULT_VALUES.vCenter;
        const border = params.get('border') !== null ? params.get('border') === 'true' : DEFAULT_VALUES.border;
        const cursorStyle = params.get('cursorStyle') || DEFAULT_VALUES.cursorStyle;
        const fontRatio = parseFloat(params.get('fontRatio') || DEFAULT_VALUES.fontRatio.toString());

        // Handle deletion behavior with backward compatibility
        let deletionBehavior = DEFAULT_VALUES.deletionBehavior;
        const deletionParam = params.get('deletionBehavior');
        const deleteAfterParam = params.get('deleteAfter'); // legacy parameter
        
        if (deletionParam && ['stay', 'backspace', 'clear'].includes(deletionParam)) {
            deletionBehavior = deletionParam as typeof DEFAULT_VALUES.deletionBehavior;
        } else if (deleteAfterParam !== null) {
            // Handle legacy deleteAfter parameter
            deletionBehavior = deleteAfterParam === 'true' ? 'backspace' : 'stay';
        }

        if ([width, height, pause, fontRatio, backgroundOpacity].some(isNaN)) {
            throw new Error('Invalid numeric parameter');
        }

        return {
            // These fields are for backward compatibility but won't be used in new format
            text: '', 
            font: DEFAULT_VALUES.font,
            color: DEFAULT_VALUES.color,
            typingSpeed: DEFAULT_VALUES.typingSpeed,
            letterSpacing: DEFAULT_VALUES.letterSpacing,
            fontSize: DEFAULT_VALUES.fontSize,
            deleteSpeed: DEFAULT_VALUES.deleteSpeed,
            fontWeight: DEFAULT_VALUES.fontWeight,
            // Active fields for new format
            width,
            height,
            pause,
            repeat,
            backgroundColor,
            backgroundOpacity,
            center,
            vCenter,
            border,
            cursorStyle,
            fontRatio,
            deletionBehavior
        };
    } else {
        // Old format for backward compatibility
        const text = params.get('text') || 'Hello, World!';
        const font = params.get('font') || DEFAULT_VALUES.font;
        const color = params.get('color') || DEFAULT_VALUES.color;
        const width = parseInt(params.get('width') || DEFAULT_VALUES.width.toString(), 10);
        const height = parseInt(params.get('height') || DEFAULT_VALUES.height.toString(), 10);
        const typingSpeed = parseFloat(params.get('typingSpeed') || DEFAULT_VALUES.typingSpeed.toString());
        const deleteSpeed = parseFloat(params.get('deleteSpeed') || DEFAULT_VALUES.deleteSpeed.toString());
        const pause = parseInt(params.get('pause') || DEFAULT_VALUES.pause.toString(), 10);
        const fontWeight = params.get('fontWeight') || DEFAULT_VALUES.fontWeight;
        
        // Handle letter spacing - can be string (CSS value) or number (treated as em)
        const letterSpacingParam = params.get('letterSpacing') || DEFAULT_VALUES.letterSpacing.toString();
        let letterSpacing: string | number;
        
        // Check if it's a pure number (for backward compatibility)
        const numericValue = parseFloat(letterSpacingParam);
        if (!isNaN(numericValue) && letterSpacingParam === numericValue.toString()) {
            // Pure number - treat as em value
            letterSpacing = numericValue;
        } else {
            // String value - keep as is for CSS
            letterSpacing = letterSpacingParam;
        }
        
        const repeat = params.get('repeat') !== null ? params.get('repeat') === 'true' : DEFAULT_VALUES.repeat;
        const backgroundColor = params.get('backgroundColor') || DEFAULT_VALUES.backgroundColor;
        const backgroundOpacity = parseFloat(params.get('backgroundOpacity') || DEFAULT_VALUES.backgroundOpacity.toString());
        const fontSize = parseInt(params.get('fontSize') || DEFAULT_VALUES.fontSize.toString(), 10);
        const center = params.get('center') !== null ? params.get('center') === 'true' : DEFAULT_VALUES.center;
        const vCenter = params.get('vCenter') !== null ? params.get('vCenter') === 'true' : DEFAULT_VALUES.vCenter;
        const border = params.get('border') !== null ? params.get('border') === 'true' : DEFAULT_VALUES.border;
        const cursorStyle = params.get('cursorStyle') || DEFAULT_VALUES.cursorStyle;
        const fontRatio = parseFloat(params.get('fontRatio') || DEFAULT_VALUES.fontRatio.toString());

        // Handle deletion behavior with backward compatibility for old format
        let deletionBehavior = DEFAULT_VALUES.deletionBehavior;
        const deletionParam = params.get('deletionBehavior');
        const deleteAfterParam = params.get('deleteAfter'); // legacy parameter
        
        if (deletionParam && ['stay', 'backspace', 'clear'].includes(deletionParam)) {
            deletionBehavior = deletionParam as typeof DEFAULT_VALUES.deletionBehavior;
        } else if (deleteAfterParam !== null) {
            // Handle legacy deleteAfter parameter
            deletionBehavior = deleteAfterParam === 'true' ? 'backspace' : 'stay';
        }

        if ([width, height, typingSpeed, pause, deleteSpeed, fontSize, fontRatio, backgroundOpacity].some(isNaN)) {
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
            deleteSpeed,
            letterSpacing,
            repeat,
            backgroundColor,
            backgroundOpacity,
            fontSize,
            center,
            vCenter,
            border,
            cursorStyle,
            fontRatio,
            deletionBehavior,
            fontWeight
        };
    }
}