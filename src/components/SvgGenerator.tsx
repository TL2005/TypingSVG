'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Settings, Eye, Code, Palette, Plus, Minus, Download, Copy, Check } from 'lucide-react';

export default function SVGGenerator() {
    const [texts, setTexts] = useState(['Hello, World!', 'And Emojis! 😀🚀']);
    const [font, setFont] = useState('Monaco');
    const [color, setColor] = useState('#000000');
    const [width, setWidth] = useState(450);
    const [height, setHeight] = useState(150);
    const [typingSpeed, setTypingSpeed] = useState(0.5);
    const [pause, setPause] = useState(1000);
    const [letterSpacing, setLetterSpacing] = useState(0.1);
    const [repeat, setRepeat] = useState(true);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [fontSize, setFontSize] = useState(28);
    const [center, setCenter] = useState(true);
    const [vCenter, setVCenter] = useState(true);
    const [border, setBorder] = useState(true);
    const [cursorStyle, setCursorStyle] = useState('straight');
    const [deleteAfter, setDeleteAfter] = useState(false);
    const [deleteSpeed, setDeleteSpeed] = useState(typingSpeed);
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [origin, setOrigin] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    // Add loading state management for SVG updates
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300); // Small delay to show loading state

        return () => clearTimeout(timer);
    }, [texts, font, color, width, height, typingSpeed, pause, letterSpacing, repeat, backgroundColor, fontSize, center, vCenter, border, cursorStyle, deleteAfter, deleteSpeed]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const handleTextChange = (index: number, newText: string) => {
        const newTexts = [...texts];
        newTexts[index] = newText;
        setTexts(newTexts);
    };

    const addTextLine = () => {
        setTexts([...texts, '']);
    };

    const removeTextLine = (index: number) => {
        if (texts.length > 1) {
            const newTexts = texts.filter((_, i) => i !== index);
            setTexts(newTexts);
        }
    };

    const generateQueryString = () => {
        const params = new URLSearchParams({
            text: texts.join(';'),
            font,
            color,
            width: String(width),
            height: String(height),
            typingSpeed: String(typingSpeed),
            pause: String(pause),
            letterSpacing: String(letterSpacing),
            repeat: String(repeat),
            backgroundColor,
            fontSize: String(fontSize),
            center: String(center),
            vCenter: String(vCenter),
            border: String(border),
            cursorStyle,
            deleteAfter: String(deleteAfter),
            deleteSpeed: String(deleteSpeed),
        });
        return params.toString();
    };

    const svgUrl = `/api/svg?${generateQueryString()}`;
    const fullSvgUrl = `${origin}${svgUrl}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(svgUrl);
            const svgBlob = await response.blob();
            const url = window.URL.createObjectURL(svgBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'typing-svg.svg';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('SVG downloaded to Downloads folder!');
        } catch (error) {
            console.error('Failed to download SVG:', error);
            showNotification('Failed to download SVG', 'error');
        }
    };

    return (
        <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
            {/* Notification Toast */}
            <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
                notification.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' 
                        ? (isDarkMode ? 'bg-green-900 border border-green-700 text-green-200' : 'bg-green-100 border border-green-300 text-green-800')
                        : (isDarkMode ? 'bg-red-900 border border-red-700 text-red-200' : 'bg-red-100 border border-red-300 text-red-800')
                }`}>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            </div>

            <div className="container mx-auto p-6">
                {/* Header with Dark Mode Toggle */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <h1 className={`text-4xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-yellow-400 to-yellow-200' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
                            Typing SVG Generator
                        </h1>
                    </div>
                    
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-800 border border-yellow-500 text-yellow-400 hover:bg-gray-700' 
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        } shadow-lg`}
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {isDarkMode ? 'Light' : 'Dark'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- CONTROLS COLUMN --- */}
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                        isDarkMode 
                            ? 'bg-gray-900 border-gray-700' 
                            : 'bg-white border-gray-200'
                    } shadow-xl`}>
                        <div className="flex items-center gap-2 mb-6">
                            <Palette className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                                Configuration
                            </h2>
                        </div>
                        
                        <div className="space-y-5">
                            {/* Text Content */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Text Content
                                    </label>
                                    <button 
                                        onClick={addTextLine} 
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200 ${
                                            isDarkMode 
                                                ? 'text-yellow-400 hover:bg-gray-800 border border-yellow-500/20 hover:border-yellow-500/40' 
                                                : 'text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Line
                                    </button>
                                </div>
                                {texts.map((text, index) => (
                                    <div key={index} className="group relative">
                                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                            isDarkMode 
                                                ? 'border-gray-700 bg-gray-800/50 focus-within:border-yellow-500 focus-within:bg-gray-800' 
                                                : 'border-gray-200 bg-gray-50/50 focus-within:border-blue-500 focus-within:bg-white'
                                        }`}>
                                            <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-mono font-medium ${
                                                isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <textarea
                                                value={text}
                                                onChange={(e) => handleTextChange(index, e.target.value)}
                                                className={`flex-1 bg-transparent border-none outline-none resize-none text-sm ${
                                                    isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                                                }`}
                                                placeholder={`Line ${index + 1}`}
                                                rows={1}
                                                style={{ minHeight: '20px' }}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                            />
                                            {texts.length > 1 && (
                                                <button
                                                    onClick={() => removeTextLine(index)}
                                                    className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200 ${
                                                        isDarkMode 
                                                            ? 'text-red-400 hover:bg-red-900/20' 
                                                            : 'text-red-500 hover:bg-red-100'
                                                    }`}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Font Settings */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label="Font Size" 
                                    type="number" 
                                    value={fontSize} 
                                    onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 0)}
                                    isDarkMode={isDarkMode}
                                />
                                <InputField 
                                    label="Letter Spacing (em)" 
                                    type="number" 
                                    step="0.01"
                                    value={letterSpacing} 
                                    onChange={(e) => setLetterSpacing(parseFloat(e.target.value) || 0)}
                                    isDarkMode={isDarkMode}
                                />
                            </div>

                            <InputField 
                                label="Font Family" 
                                type="text" 
                                value={font} 
                                onChange={(e) => setFont(e.target.value)}
                                isDarkMode={isDarkMode}
                            />

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <ColorField 
                                    label="Text Color" 
                                    value={color} 
                                    onChange={(e) => setColor(e.target.value)}
                                    isDarkMode={isDarkMode}
                                />
                                <ColorField 
                                    label="Background Color" 
                                    value={backgroundColor} 
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    isDarkMode={isDarkMode}
                                />
                            </div>

                            {/* Cursor Style */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Cursor Style
                                </label>
                                <select 
                                    value={cursorStyle} 
                                    onChange={(e) => setCursorStyle(e.target.value)} 
                                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                                        isDarkMode 
                                            ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20' 
                                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    }`}
                                >
                                    <option value="straight">Straight</option>
                                    <option value="underline">Underline</option>
                                    <option value="block">Block</option>
                                    <option value="blank">Blank (No Cursor)</option>
                                </select>
                            </div>

                            {/* Dimensions */}
                            <div className="grid grid-cols-2 gap-4"> 
                                <InputField 
                                    label="Width" 
                                    type="number" 
                                    value={width} 
                                    onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
                                    isDarkMode={isDarkMode}
                                /> 
                                <InputField 
                                    label="Height" 
                                    type="number" 
                                    value={height} 
                                    onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
                                    isDarkMode={isDarkMode}
                                /> 
                            </div>

                            {/* Animation Timing */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label="Typing Speed (s/char)" 
                                    type="number" 
                                    step="0.01"
                                    value={typingSpeed} 
                                    onChange={(e) => {
                                        const newSpeed = parseFloat(e.target.value) || 0;
                                        setTypingSpeed(newSpeed); 
                                        setDeleteSpeed(newSpeed); 
                                    }}
                                    isDarkMode={isDarkMode}
                                />
                                <InputField 
                                    label="End Pause (ms)" 
                                    type="number" 
                                    value={pause} 
                                    onChange={(e) => setPause(parseInt(e.target.value, 10) || 0)}
                                    isDarkMode={isDarkMode}
                                />
                            </div>

                            {/* Layout Options */}
                            <div className="grid grid-cols-2 gap-4">
                                <Checkbox label="Center Horizontally" checked={center} onChange={setCenter} isDarkMode={isDarkMode} />
                                <Checkbox label="Center Vertically" checked={vCenter} onChange={setVCenter} isDarkMode={isDarkMode} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Checkbox label="Repeat Animation" checked={repeat} onChange={setRepeat} isDarkMode={isDarkMode} />
                                <Checkbox label="Show SVG Border" checked={border} onChange={setBorder} isDarkMode={isDarkMode} />
                            </div>

                            {/* Delete Behavior */}
                            <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <label htmlFor="deleteAfter" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Delete text after typing
                                    </label>
                                    <input 
                                        id="deleteAfter" 
                                        type="checkbox" 
                                        checked={deleteAfter} 
                                        onChange={(e) => setDeleteAfter(e.target.checked)} 
                                        className={`h-4 w-4 rounded transition-colors ${
                                            isDarkMode 
                                                ? 'border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700' 
                                                : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                                        }`} 
                                    />
                                </div>
                                {deleteAfter && (
                                    <InputField 
                                        label="Delete Speed (s/char)" 
                                        type="number" 
                                        step="0.01"
                                        value={deleteSpeed} 
                                        onChange={(e) => setDeleteSpeed(parseFloat(e.target.value) || 0)}
                                        isDarkMode={isDarkMode}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- PREVIEW COLUMN --- */}
                    <div className="space-y-6">
                        {/* Preview Section */}
                        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-900 border-gray-700' 
                                : 'bg-white border-gray-200'
                        } shadow-xl`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Eye className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                                        Live Preview
                                    </h2>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                        isDarkMode
                                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50'
                                            : 'bg-blue-500/10 border border-blue-500/30 text-blue-600 hover:bg-blue-500/20 hover:border-blue-500/50'
                                    }`}
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                            <div className={`border-2 border-dashed rounded-xl p-8 flex items-center justify-center min-h-[200px] relative ${
                                isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50/50'
                            }`}>
                                {/* Loading Animation */}
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className={`relative w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`}>
                                                <div className="absolute inset-0 border-2 border-current rounded-full opacity-20"></div>
                                                <div className="absolute inset-0 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
                                            </div>
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Updating preview...
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {/* SVG Image */}
                                <img 
                                    key={svgUrl} 
                                    src={svgUrl} 
                                    alt="Generated SVG" 
                                    className={`max-w-full h-auto transition-opacity duration-200 ${
                                        isLoading ? 'opacity-30' : 'opacity-100'
                                    }`}
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => setIsLoading(false)}
                                />
                            </div>
                        </div>

                        {/* URL Section */}
                        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-gray-900 border-gray-700' 
                                : 'bg-white border-gray-200'
                        } shadow-xl`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Code className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-blue-500'}`} />
                                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                                    Generated Code
                                </h2>
                            </div>
                            <div className="space-y-4">
                                <UrlBox label="URL" value={fullSvgUrl} isDarkMode={isDarkMode} showNotification={showNotification} />
                                <UrlBox label="Markdown" value={`![Typing SVG](${fullSvgUrl})`} isDarkMode={isDarkMode} showNotification={showNotification} />
                                <UrlBox label="HTML" value={`<img src="${fullSvgUrl}" alt="Typing SVG" />`} isDarkMode={isDarkMode} showNotification={showNotification} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const InputField = ({ 
    label, 
    type = "text", 
    value, 
    onChange, 
    isDarkMode, 
    className = "", 
    step,
    ...props 
}: {
    label: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDarkMode: boolean;
    className?: string;
    step?: string;
    [key: string]: unknown;
}) => (
    <div>
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
        </label>
        <input 
            type={type}
            step={step}
            value={value} 
            onChange={onChange} 
            className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            } ${className}`}
            {...props}
        />
    </div>
);

const ColorField = ({ 
    label, 
    value, 
    onChange, 
    isDarkMode 
}: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDarkMode: boolean;
}) => (
    <div>
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
        </label>
        <div className="relative">
            <input 
                type="color" 
                value={value} 
                onChange={onChange} 
                className={`w-full h-10 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isDarkMode 
                        ? 'border-gray-600 bg-gray-800' 
                        : 'border-gray-300 bg-white'
                }`}
            />
            <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-mono ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
                {value}
            </div>
        </div>
    </div>
);

const Checkbox = ({ 
    label, 
    checked, 
    onChange, 
    isDarkMode 
}: { 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    isDarkMode: boolean;
}) => (
    <div className="flex items-center">
        <input 
            id={label} 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)} 
            className={`h-4 w-4 rounded transition-colors ${
                isDarkMode 
                    ? 'border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700' 
                    : 'border-gray-300 text-blue-600 focus:ring-blue-500'
            }`} 
        />
        <label htmlFor={label} className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {label}
        </label>
    </div>
);

const UrlBox = ({ 
    label, 
    value, 
    isDarkMode,
    showNotification 
}: { 
    label: string; 
    value: string; 
    isDarkMode: boolean;
    showNotification: (message: string, type?: 'success' | 'error') => void;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            showNotification(`${label} copied to clipboard!`);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            showNotification('Failed to copy to clipboard', 'error');
        }
    };

    return (
        <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {label}
            </label>
            <div className="relative group">
                <div 
                    className={`p-3 pr-12 rounded-lg border font-mono text-sm break-all cursor-pointer transition-all duration-200 ${
                        isDarkMode 
                            ? 'bg-gray-800 border-gray-700 text-yellow-200 hover:bg-gray-700/70 hover:border-gray-600' 
                            : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-150 hover:border-gray-300'
                    }`}
                    onClick={handleCopy}
                >
                    {value}
                </div>
                <button 
                    onClick={handleCopy}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 ${
                        isDarkMode 
                            ? 'text-gray-400 hover:bg-gray-600 hover:text-yellow-400' 
                            : 'text-gray-500 hover:bg-gray-200 hover:text-blue-600'
                    }`}
                    aria-label="Copy to clipboard"
                >
                    {copied ? (
                        <Check className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
};