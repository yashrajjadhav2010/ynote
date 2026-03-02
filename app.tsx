import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, FolderOpen, Save, Settings, Moon, Sun, 
  Search, X, Plus, Type, AlignLeft, Maximize2, Minimize2, Check,
  ArrowRight, Replace, Bold, Italic, Heading, List, TextQuote, Code,
  Clock, Columns, Trash2, ArrowUp, ArrowDown
} from 'lucide-react';

// --- Subcomponents ---

const IconButton = ({ icon: Icon, onClick, title, active, danger, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-colors flex items-center justify-center
      ${active ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}
      ${danger ? 'hover:bg-red-500 hover:text-white' : ''}
      ${className}
    `}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

const ToolbarButton = ({ icon: Icon, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
  >
    <Icon size={14} strokeWidth={2.5} />
  </button>
);

const Tab = ({ tab, isActive, onClick, onClose }) => (
  <div
    className={`group flex items-center gap-2 px-4 py-2 min-w-[120px] max-w-[200px] border-r border-slate-200 dark:border-slate-700 cursor-pointer transition-all
      ${isActive ? 'bg-white dark:bg-slate-900 border-t-2 border-t-blue-500 text-blue-600 dark:text-blue-400 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'}
    `}
    onClick={() => onClick(tab.id)}
  >
    <FileText size={14} className="flex-shrink-0" />
    <span className="truncate flex-1 text-sm font-medium">
      {tab.title}
      {tab.isModified && <span className="ml-1 text-blue-500">*</span>}
    </span>
    <button
      onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
      className={`p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-opacity
        ${isActive ? 'opacity-100' : ''}
      `}
    >
      <X size={12} />
    </button>
  </div>
);

// --- Simple Markdown Parser for Preview ---
const parseMarkdown = (text) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape HTML
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-5 mb-3 border-b border-slate-200 dark:border-slate-700 pb-1 text-slate-800 dark:text-slate-100">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold mt-6 mb-4 text-slate-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code class="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-3 text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50">$1</blockquote>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc my-1">$1</li>')
    .replace(/\n\n/gim, '<br/><br/>')
    .replace(/\n(?!\<)/gim, '<br/>'); // basic line break preservation
  return { __html: html };
};

// --- Markdown Syntax Highlighter for Editor Overlay ---
const highlightMarkdown = (text) => {
  if (!text) return '';
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Apply colors to markdown syntax
  html = html.replace(/^(#{1,6}\s+.*)$/gm, '<span class="text-blue-600 dark:text-blue-400">$1</span>');
  html = html.replace(/(\*\*.*?\*\*)/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>');
  html = html.replace(/(\*.*?\*)/g, '<span class="text-purple-500 dark:text-purple-300">$1</span>');
  html = html.replace(/(`.*?`)/g, '<span class="text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-800 rounded px-1">$1</span>');
  html = html.replace(/^(>.*)$/gm, '<span class="text-green-600 dark:text-green-400">$1</span>');
  html = html.replace(/^([-*]\s+.*)$/gm, '<span class="text-orange-600 dark:text-orange-400">$1</span>');
  html = html.replace(/(\[.*?\]\(.*?\))/g, '<span class="text-teal-600 dark:text-teal-400 underline">$1</span>');

  // Preserve trailing newline height
  if (html.endsWith('\n')) {
    html += ' ';
  }
  return html;
};

// --- Main Application ---

export default function App() {
  // Load initial state from local storage or use defaults
  const loadInitialTabs = () => {
    const saved = localStorage.getItem('ynote-tabs');
    if (saved) return JSON.parse(saved);
    return [{ id: '1', title: 'Untitled 1', content: '# Welcome to Y Note\n\nThis advanced version includes:\n- **Auto-Save** to LocalStorage\n- **Markdown Preview** Split-Screen\n- **Formatting Toolbar**\n- Text Transformation Utilities\n\n> Try selecting some text and clicking the toolbar icons above!', isModified: false }];
  };

  const loadInitialSettings = () => {
    const saved = localStorage.getItem('ynote-settings');
    if (saved) return JSON.parse(saved);
    return {
      theme: 'dark', wordWrap: true, fontSize: 16, fontFamily: 'font-mono',
      showLineNumbers: true, fullScreen: false, splitPreview: false, syntaxHighlighting: true
    };
  };

  // State
  const [tabs, setTabs] = useState(loadInitialTabs);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '1');
  const [settings, setSettings] = useState(loadInitialSettings);
  
  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved');
  
  // Refs
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const overlayRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('ynote-tabs', JSON.stringify(tabs));
    localStorage.setItem('ynote-settings', JSON.stringify(settings));
    
    // Simulate save indicator
    if (tabs.some(t => t.isModified)) {
      setSaveStatus('Saving...');
      const timer = setTimeout(() => {
        setTabs(currentTabs => currentTabs.map(t => ({ ...t, isModified: false })));
        setSaveStatus('Saved');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tabs, settings]);

  // Apply Theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Sync scroll for line numbers & preview
  const handleScroll = (e) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.target.scrollTop;
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.target.scrollTop;
      overlayRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (previewRef.current && settings.splitPreview) {
      // Proportional scrolling for preview
      const scrollPercentage = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight);
      previewRef.current.scrollTop = scrollPercentage * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    }
  };

  // --- Handlers: Tabs & Content ---

  const createNewTab = () => {
    const newId = crypto.randomUUID();
    setTabs([...tabs, { id: newId, title: `Untitled ${tabs.length + 1}`, content: '', isModified: false }]);
    setActiveTabId(newId);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) {
      setTabs([{ ...tabs[0], title: 'Untitled 1', content: '', isModified: false }]);
      return;
    }
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const updateActiveContent = (newContent) => {
    setTabs(tabs.map(tab => tab.id === activeTabId ? { ...tab, content: newContent, isModified: true } : tab));
  };

  const handleTitleChange = (e) => {
    setTabs(tabs.map(tab => tab.id === activeTabId ? { ...tab, title: e.target.value } : tab));
  };

  // --- Handlers: Text Formatting & Utilities ---

  const insertText = (before, after = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeTab.content;
    const selected = text.substring(start, end);
    const newContent = text.substring(0, start) + before + selected + after + text.substring(end);

    updateActiveContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const transformText = (type) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeTab.content;
    const selected = text.substring(start, end);
    
    if (!selected) return; // Need selection to transform

    let transformed = selected;
    if (type === 'upper') transformed = selected.toUpperCase();
    if (type === 'lower') transformed = selected.toLowerCase();

    const newContent = text.substring(0, start) + transformed + text.substring(end);
    updateActiveContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + transformed.length);
    }, 0);
  };

  const insertDate = () => {
    const dateStr = new Date().toLocaleString();
    insertText(dateStr);
  };

  // --- Handlers: File I/O ---

  const handleDownload = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab.title || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newId = crypto.randomUUID();
      setTabs([...tabs, { id: newId, title: file.name, content: event.target.result, isModified: false }]);
      setActiveTabId(newId);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  // --- Handlers: Find & Replace ---
  const executeFind = () => {
    if (!findText || !editorRef.current) return;
    const content = activeTab.content;
    const index = content.indexOf(findText, editorRef.current.selectionEnd);
    if (index !== -1) {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(index, index + findText.length);
    } else {
      const firstIndex = content.indexOf(findText);
      if (firstIndex !== -1) {
         editorRef.current.focus();
         editorRef.current.setSelectionRange(firstIndex, firstIndex + findText.length);
      }
    }
  };

  const executeReplace = () => {
    if (!findText || !editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const content = activeTab.content;

    if (start !== end && content.substring(start, end) === findText) {
      const newContent = content.substring(0, start) + replaceText + content.substring(end);
      updateActiveContent(newContent);
      setTimeout(() => {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(start, start + replaceText.length);
      }, 0);
    } else {
      executeFind();
    }
  };

  const executeReplaceAll = () => {
    if (!findText) return;
    updateActiveContent(activeTab.content.split(findText).join(replaceText));
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleDownload(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowFindReplace(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); insertText('**', '**'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); insertText('*', '*'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // --- Calculation Helpers ---
  const lineCount = activeTab ? activeTab.content.split('\n').length : 0;
  const wordCount = activeTab ? (activeTab.content.match(/\b[-?(\w+)?]+\b/gi) || []).length : 0;
  const charCount = activeTab ? activeTab.content.length : 0;

  return (
    <div className={`flex flex-col h-screen w-full transition-colors duration-300 ${settings.theme === 'dark' ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* --- Top Menu Bar --- */}
      <div className="flex flex-col bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 flex-shrink-0">
        
        {/* Main Nav */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-black text-xl tracking-tight mr-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Edit3 size={18} strokeWidth={3} />
              </div>
              <span>Y Note</span>
            </div>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <div className="flex items-center gap-0.5">
              <IconButton icon={Plus} title="New Note" onClick={createNewTab} />
              <IconButton icon={FolderOpen} title="Open File" onClick={() => fileInputRef.current?.click()} />
              <IconButton icon={Save} title="Download (Ctrl+S)" onClick={handleDownload} />
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv,.js,.html,.css" />
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <div className="flex items-center gap-0.5">
              <IconButton icon={Search} title="Find & Replace (Ctrl+F)" onClick={() => setShowFindReplace(!showFindReplace)} active={showFindReplace} />
              <IconButton icon={Columns} title="Toggle Split Preview" onClick={() => setSettings({...settings, splitPreview: !settings.splitPreview})} active={settings.splitPreview} />
              <IconButton icon={settings.theme === 'dark' ? Sun : Moon} title="Toggle Theme" onClick={() => setSettings({...settings, theme: settings.theme === 'dark' ? 'light' : 'dark'})} />
              <IconButton icon={settings.fullScreen ? Minimize2 : Maximize2} title="Zen Mode" onClick={() => setSettings({...settings, fullScreen: !settings.fullScreen})} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={activeTab?.title || ''}
              onChange={handleTitleChange}
              placeholder="Note Title..."
              className="bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 dark:hover:border-slate-700 dark:focus:border-blue-500 outline-none px-2 py-1 text-sm font-bold transition-all w-48 focus:w-64 text-right"
            />
            <IconButton icon={Settings} title="Settings" onClick={() => setShowSettings(!showSettings)} active={showSettings} />
          </div>
        </div>

        {/* Formatting Toolbar (Only show if not in Zen mode) */}
        {!settings.fullScreen && (
          <div className="flex items-center gap-1 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <ToolbarButton icon={Bold} title="Bold (Ctrl+B)" onClick={() => insertText('**', '**')} />
            <ToolbarButton icon={Italic} title="Italic (Ctrl+I)" onClick={() => insertText('*', '*')} />
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <ToolbarButton icon={Heading} title="Heading" onClick={() => insertText('### ', '')} />
            <ToolbarButton icon={List} title="List" onClick={() => insertText('- ', '')} />
            <ToolbarButton icon={TextQuote} title="Quote" onClick={() => insertText('> ', '')} />
            <ToolbarButton icon={Code} title="Code" onClick={() => insertText('`', '`')} />
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <ToolbarButton icon={ArrowUp} title="UPPERCASE Selection" onClick={() => transformText('upper')} />
            <ToolbarButton icon={ArrowDown} title="lowercase Selection" onClick={() => transformText('lower')} />
            <ToolbarButton icon={Clock} title="Insert Date/Time" onClick={insertDate} />
            <div className="flex-1"></div>
            <ToolbarButton icon={Trash2} title="Clear Tab" onClick={() => { if(window.confirm('Clear all content?')) updateActiveContent(''); }} />
          </div>
        )}
      </div>

      {/* --- Tab Bar --- */}
      {!settings.fullScreen && (
        <div className="flex items-end px-2 pt-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar flex-shrink-0">
          {tabs.map(tab => (
            <Tab key={tab.id} tab={tab} isActive={activeTabId === tab.id} onClick={setActiveTabId} onClose={closeTab} />
          ))}
          <button onClick={createNewTab} className="p-1.5 ml-1 mb-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-[#0d1117]">
        
        {/* Settings Sidebar Overlay */}
        {showSettings && (
          <div className="absolute top-0 right-0 w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 p-6 flex flex-col gap-6 animate-slide-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Preferences</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Word Wrap</span>
                <button onClick={() => setSettings({...settings, wordWrap: !settings.wordWrap})} className={`w-11 h-6 rounded-full transition-colors relative ${settings.wordWrap ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.wordWrap ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Line Numbers</span>
                <button onClick={() => setSettings({...settings, showLineNumbers: !settings.showLineNumbers})} className={`w-11 h-6 rounded-full transition-colors relative ${settings.showLineNumbers ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.showLineNumbers ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Syntax Highlighting</span>
                <button onClick={() => setSettings({...settings, syntaxHighlighting: !settings.syntaxHighlighting})} className={`w-11 h-6 rounded-full transition-colors relative ${settings.syntaxHighlighting ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.syntaxHighlighting ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Typography</span>
                <select value={settings.fontFamily} onChange={(e) => setSettings({...settings, fontFamily: e.target.value})} className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-sm font-medium">
                  <option value="font-mono">Fira Code / Monospace</option>
                  <option value="font-sans">Inter / Sans Serif</option>
                  <option value="font-serif">Merriweather / Serif</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Font Size</span>
                  <span className="text-blue-500 font-bold">{settings.fontSize}px</span>
                </span>
                <input type="range" min="12" max="32" value={settings.fontSize} onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})} className="w-full accent-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Find & Replace Floating Widget */}
        {showFindReplace && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-3 z-20 flex flex-col gap-2 w-[420px] animate-fade-in">
            <div className="flex items-center justify-between pb-1 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Search size={14}/> Find & Replace</span>
              <button onClick={() => setShowFindReplace(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={16}/></button>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Find..." value={findText} onChange={(e) => setFindText(e.target.value)} className="flex-1 p-2 text-sm bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-lg outline-none" autoFocus />
              <button onClick={executeFind} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors" title="Find Next"><ArrowRight size={16} /></button>
            </div>

            <div className="flex items-center gap-2">
              <input type="text" placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} className="flex-1 p-2 text-sm bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-lg outline-none" />
              <button onClick={executeReplace} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors" title="Replace">Replace</button>
              <button onClick={executeReplaceAll} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors" title="Replace All">All</button>
            </div>
          </div>
        )}

        {/* Editor Pane */}
        <div className="flex flex-1 overflow-hidden relative">
          {settings.showLineNumbers && (
            <div ref={lineNumbersRef} className="w-14 flex-shrink-0 bg-slate-50 dark:bg-[#0d1117] border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-right pr-3 py-6 select-none overflow-hidden font-mono" style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6' }}>
              {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
          )}

          <div className="relative flex-1 w-full h-full overflow-hidden bg-white dark:bg-[#0d1117]">
            {/* Syntax Highlighting Overlay */}
            {settings.syntaxHighlighting && (
              <div 
                ref={overlayRef}
                aria-hidden="true"
                className={`absolute inset-0 w-full h-full p-6 pointer-events-none overflow-auto overlay-scrollbar text-slate-800 dark:text-slate-300
                  ${settings.fontFamily} ${settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}
                `}
                style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6', tabSize: 4 }}
                dangerouslySetInnerHTML={{ __html: highlightMarkdown(activeTab?.content) }}
              />
            )}

            <textarea
              ref={editorRef}
              value={activeTab?.content || ''}
              onChange={(e) => updateActiveContent(e.target.value)}
              onScroll={handleScroll}
              spellCheck="false"
              className={`absolute inset-0 w-full h-full resize-none outline-none p-6 custom-scrollbar
                ${settings.fontFamily} ${settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}
                ${settings.syntaxHighlighting ? 'editor-textarea' : 'text-slate-800 dark:text-slate-300 bg-transparent'}
              `}
              style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6', tabSize: 4, backgroundColor: 'transparent' }}
              placeholder="Start typing..."
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  insertText('    ');
                }
              }}
            />
          </div>
        </div>

        {/* Preview Pane (Split Screen) */}
        {settings.splitPreview && (
          <div ref={previewRef} className={`flex-1 w-full h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-8 overflow-y-auto custom-scrollbar markdown-body ${settings.fontFamily}`} style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6' }}>
            <div dangerouslySetInnerHTML={parseMarkdown(activeTab?.content)} />
          </div>
        )}

      </div>

      {/* --- Status Bar --- */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-xs font-medium shadow-inner flex-shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><AlignLeft size={14}/> {lineCount} L</span>
          <span className="flex items-center gap-1.5"><Type size={14}/> {wordCount} W</span>
          <span>{charCount} C</span>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="opacity-80">UTF-8</span>
          <span className="opacity-80">{settings.wordWrap ? 'Wrap' : 'No Wrap'}</span>
          <span className="flex items-center gap-1.5 min-w-[80px] justify-end">
            {saveStatus === 'Saving...' ? (
               <span className="text-blue-200 animate-pulse">{saveStatus}</span>
            ) : (
               <span className="flex items-center gap-1"><Check size={14} /> {saveStatus}</span>
            )}
          </span>
        </div>
      </div>

      {/* CSS overrides for animations and scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 6px; border: 3px solid transparent; background-clip: padding-box; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(71, 85, 105, 0.6); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(107, 114, 128, 0.8); }
        
        /* Overlay scrollbar matching but invisible */
        .overlay-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
        .overlay-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .overlay-scrollbar::-webkit-scrollbar-thumb { background: transparent; }

        /* Transparent Editor Textarea Tricks */
        .editor-textarea {
          color: transparent !important;
          caret-color: #0f172a;
        }
        .dark .editor-textarea {
          caret-color: #f1f5f9;
        }
        .editor-textarea::selection {
          background-color: rgba(59, 130, 246, 0.3) !important;
          color: #0f172a !important; 
        }
        .dark .editor-textarea::selection {
          background-color: rgba(59, 130, 246, 0.5) !important;
          color: #f1f5f9 !important;
        }

        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}} />
    </div>
  );
}

const Edit3 = ({size, strokeWidth=2}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;