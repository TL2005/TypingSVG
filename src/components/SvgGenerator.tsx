'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, TextCursor, Eye, Code, Palette, Plus, Minus, Download, Copy, Check, ChevronDown, ChevronUp, Github, Star } from 'lucide-react';

interface TextLine {
    text: string;
    font: string;
    color: string;
    fontSize: number;
    letterSpacing: string;
    typingSpeed: number;
    deleteSpeed: number;
}

interface GitHubStats {
    stars: number;
    loading: boolean;
}

export default function SVGGenerator() {
    const [textLines, setTextLines] = useState<TextLine[]>([
        { text: 'Hello, World!', font: 'Monaco', color: '#000000', fontSize: 28, letterSpacing: '0.1em', typingSpeed: 0.5, deleteSpeed: 0.5 },
        { text: 'And Emojis! 😀🚀', font: 'Monaco', color: '#000000', fontSize: 28, letterSpacing: '0.1em', typingSpeed: 0.5, deleteSpeed: 0.5 }
    ]);
    
    // Global settings
    const [width, setWidth] = useState(450);
    const [height, setHeight] = useState(150);
    const [pause, setPause] = useState(1000);
    const [repeat, setRepeat] = useState(true);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [center, setCenter] = useState(true);
    const [vCenter, setVCenter] = useState(true);
    const [border, setBorder] = useState(true);
    const [cursorStyle, setCursorStyle] = useState('straight');
    const [deleteAfter, setDeleteAfter] = useState(true);
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [origin, setOrigin] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set([0])); // First line expanded by default
    const [githubStats, setGithubStats] = useState<GitHubStats>({ stars: 0, loading: true });

    const GITHUB_REPO = 'whiteSHADOW1234/TypingSVG';

    // Fetch GitHub stars
    useEffect(() => {
        const fetchGitHubStats = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
                if (response.ok) {
                    const data = await response.json();
                    setGithubStats({ stars: data.stargazers_count, loading: false });
                } else {
                    setGithubStats({ stars: 0, loading: false });
                }
            } catch (error) {
                console.error('Failed to fetch GitHub stats:', error);
                setGithubStats({ stars: 0, loading: false });
            }
        };

        fetchGitHubStats();
    }, []);

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
        }, 300);

        return () => clearTimeout(timer);
    }, [textLines, width, height, pause, repeat, backgroundColor, center, vCenter, border, cursorStyle, deleteAfter]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const updateTextLine = (index: number, field: keyof TextLine, value: string | number) => {
        const newTextLines = [...textLines];
        newTextLines[index] = { ...newTextLines[index], [field]: value };
        setTextLines(newTextLines);
    };

    const addTextLine = () => {
        const newLine: TextLine = {
            text: '',
            font: 'Monaco',
            color: '#000000',
            fontSize: 28,
            letterSpacing: '0.1em',
            typingSpeed: 0.5,
            deleteSpeed: 0.5
        };
        setTextLines([...textLines, newLine]);
        // Expand the newly added line
        setExpandedLines(prev => new Set([...prev, textLines.length]));
    };

    const removeTextLine = (index: number) => {
        if (textLines.length > 1) {
            const newTextLines = textLines.filter((_, i) => i !== index);
            setTextLines(newTextLines);
            // Remove from expanded lines and adjust indices
            setExpandedLines(prev => {
                const newExpanded = new Set<number>();
                prev.forEach(lineIndex => {
                    if (lineIndex < index) {
                        newExpanded.add(lineIndex);
                    } else if (lineIndex > index) {
                        newExpanded.add(lineIndex - 1);
                    }
                });
                return newExpanded;
            });
        }
    };

    const toggleLineExpansion = (index: number) => {
        setExpandedLines(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(index)) {
                newExpanded.delete(index);
            } else {
                newExpanded.add(index);
            }
            return newExpanded;
        });
    };

    const generateQueryString = () => {
        const params = new URLSearchParams({
            width: String(width),
            height: String(height),
            pause: String(pause),
            repeat: String(repeat),
            backgroundColor,
            center: String(center),
            vCenter: String(vCenter),
            border: String(border),
            cursorStyle,
            deleteAfter: String(deleteAfter),
        });

        // Add line-specific data
        params.append('lines', JSON.stringify(textLines));

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

    const openGitHub = () => {
        window.open(`https://github.com/${GITHUB_REPO}`, '_blank');
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
                {/* Header with Dark Mode Toggle and GitHub Buttons */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                            <TextCursor className="w-6 h-6 text-white" />
                        </div>
                        <h1 className={`text-4xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-yellow-400 to-yellow-200' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
                            Typing SVG Generator
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* GitHub Repo Button */}
                        <button
                            onClick={openGitHub}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                isDarkMode 
                                    ? 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            } shadow-lg`}
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </button>

                        {/* Star Button */}
                        <button
                            onClick={openGitHub}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                isDarkMode 
                                    ? 'bg-gray-800 border border-yellow-500/30 text-yellow-400 hover:bg-gray-700 hover:border-yellow-500/50' 
                                    : 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300'
                            } shadow-lg`}
                        >
                            <Star className={`w-4 h-4 ${githubStats.loading ? 'animate-pulse' : ''}`} />
                            {githubStats.loading ? '...' : githubStats.stars.toLocaleString()}
                        </button>

                        {/* Dark/Light Mode Toggle */}
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
                            {/* Text Lines with Individual Controls */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Text Lines
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
                                
                                {textLines.map((line, index) => (
                                    <div key={index} className={`group border rounded-lg transition-all duration-200 ${
                                        isDarkMode 
                                            ? 'border-gray-700 bg-gray-800/30' 
                                            : 'border-gray-200 bg-gray-50/50'
                                    }`}>
                                        {/* Line Header */}
                                        <div className={`flex items-center gap-3 p-3 cursor-pointer ${
                                            isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100/50'
                                        }`} onClick={() => toggleLineExpansion(index)}>
                                            <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-mono font-medium ${
                                                isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`truncate text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {line.text || `Line ${index + 1}`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {textLines.length > 1 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeTextLine(index);
                                                        }}
                                                        className={`p-1 rounded transition-all duration-200 ${
                                                            isDarkMode 
                                                                ? 'text-red-400 hover:bg-red-900/20' 
                                                                : 'text-red-500 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {expandedLines.has(index) ? (
                                                    <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                ) : (
                                                    <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Expandable Line Settings */}
                                        {expandedLines.has(index) && (
                                            <div className={`border-t p-4 space-y-4 ${
                                                isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                            }`}>
                                                {/* Text Input */}
                                                <div>
                                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Text Content
                                                    </label>
                                                    <textarea
                                                        value={line.text}
                                                        onChange={(e) => updateTextLine(index, 'text', e.target.value)}
                                                        className={`flex w-full items-center px-3 py-2 text-sm rounded-lg border transition-all duration-200 resize-none ${
                                                            isDarkMode 
                                                                ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20' 
                                                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                                                        }`}
                                                        placeholder={`Line ${index + 1}`}
                                                        rows={1}
                                                        onInput={(e) => {
                                                            const target = e.target as HTMLTextAreaElement;
                                                            target.style.height = 'auto';
                                                            target.style.height = target.scrollHeight + 'px';
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Font and Size */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField 
                                                        label="Font Family" 
                                                        type="text" 
                                                        value={line.font} 
                                                        onChange={(e) => updateTextLine(index, 'font', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                    <InputField 
                                                        label="Font Size" 
                                                        type="number" 
                                                        value={line.fontSize} 
                                                        onChange={(e) => updateTextLine(index, 'fontSize', parseInt(e.target.value, 10) || 0)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                </div>
                                                
                                                {/* Color and Letter Spacing */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <ColorField 
                                                        label="Text Color" 
                                                        value={line.color} 
                                                        onChange={(e) => updateTextLine(index, 'color', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                    <InputField 
                                                        label="Letter Spacing" 
                                                        type="text" 
                                                        value={line.letterSpacing} 
                                                        onChange={(e) => updateTextLine(index, 'letterSpacing', e.target.value)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                        placeholder="0.1em, 2px, normal"
                                                    />
                                                </div>
                                                
                                                {/* Typing Speed and Delete Speed */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField 
                                                        label="Typing Speed (s/char)" 
                                                        type="number" 
                                                        step="0.01"
                                                        value={line.typingSpeed} 
                                                        onChange={(e) => updateTextLine(index, 'typingSpeed', parseFloat(e.target.value) || 0)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                    <InputField 
                                                        label="Delete Speed (s/char)" 
                                                        type="number" 
                                                        step="0.01"
                                                        value={line.deleteSpeed} 
                                                        onChange={(e) => updateTextLine(index, 'deleteSpeed', parseFloat(e.target.value) || 0)}
                                                        isDarkMode={isDarkMode}
                                                        size="small"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Global Settings */}
                            <div className={`border-t pt-5 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Global Settings
                                </h3>
                                
                                {/* Dimensions */}
                                <div className="grid grid-cols-2 gap-4 mb-4"> 
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

                                {/* Background and Pause */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <ColorField 
                                        label="Background Color" 
                                        value={backgroundColor} 
                                        onChange={(e) => setBackgroundColor(e.target.value)}
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

                                {/* Cursor Style */}
                                <div className="mb-4">
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

                                {/* Layout Options */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Checkbox label="Center Horizontally" checked={center} onChange={setCenter} isDarkMode={isDarkMode} />
                                    <Checkbox label="Center Vertically" checked={vCenter} onChange={setVCenter} isDarkMode={isDarkMode} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Checkbox label="Repeat Animation" checked={repeat} onChange={setRepeat} isDarkMode={isDarkMode} />
                                    <Checkbox label="Show SVG Border" checked={border} onChange={setBorder} isDarkMode={isDarkMode} />
                                </div>

                                {/* Delete Behavior */}
                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                                    <div className="flex items-center justify-between">
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
                                </div>
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
    size = "normal",
    placeholder,
    ...props 
}: {
    label: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDarkMode: boolean;
    className?: string;
    step?: string;
    size?: "normal" | "small";
    placeholder?: string;
    [key: string]: unknown;
}) => (
    <div>
        <label className={`block font-medium mb-1 ${size === "small" ? "text-xs" : "text-sm"} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
        </label>
        <input 
            type={type}
            step={step}
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className={`w-full px-3 rounded-lg border transition-all duration-200 ${
                size === "small" ? "py-1.5 text-sm" : "py-2"
            } ${
                isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-gray-400'
            } ${className}`}
            {...props}
        />
    </div>
);

const ColorField = ({ 
    label, 
    value, 
    onChange, 
    isDarkMode,
    size = "normal"
}: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDarkMode: boolean;
    size?: "normal" | "small";
}) => (
    <div>
        <label className={`block font-medium mb-1 ${size === "small" ? "text-xs" : "text-sm"} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
        </label>
        <div className="relative">
            <input 
                type="color" 
                value={value} 
                onChange={onChange} 
                className={`w-full rounded-lg border cursor-pointer transition-all duration-200 ${
                    size === "small" ? "h-8" : "h-10"
                } ${
                    isDarkMode 
                        ? 'border-gray-600 bg-gray-800' 
                        : 'border-gray-300 bg-white'
                }`}
            />
            <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 font-mono ${
                size === "small" ? "text-xs" : "text-xs"
            } ${
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