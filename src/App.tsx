import React, { useState, useRef, useEffect } from 'react';
import {
  AlignLeft,
  Plus,
  Film,
  Settings,
  Menu,
  FileVideo,
  ChevronDown,
  Download,
  User,
  Settings2,
  History,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  MonitorPlay,
  Clock,
  Music,
  CheckCircle2,
  Split,
  Heart,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import { uploadVideo, getRecentVideos, getSubtitles, translateVideo, deleteVideo, toggleFavorite, getUsage, saveSubtitles, getRevisions, addRevision, type VideoFile, type SubtitleBlock, type UsageInfo, type Revision } from './api/client';


// --- Utility Functions ---
const formatTime = (totalSeconds: number, showMs = false) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);

  const hoursStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
  const formattedTime = `${hoursStr}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  if (showMs) {
    return `${formattedTime}.${ms.toString().padStart(3, '0')}`;
  }
  return formattedTime;
};

const formatSrtTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

// --- Components ---

function Sidebar({
  recentFiles,
  activeVideoId,
  onSelectVideo,
  isSidebarOpen,
  onUpload,
  onOpenSettings,
  onDeleteVideo,
  onToggleFavorite,
  usageData
}: {
  recentFiles: VideoFile[],
  activeVideoId: string | null,
  onSelectVideo: (id: string) => void,
  isSidebarOpen: boolean,
  onUpload: (file: File) => void,
  onOpenSettings: () => void,
  onDeleteVideo: (id: string) => void,
  onToggleFavorite: (id: string, isFav: boolean) => void,
  usageData: UsageInfo | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <aside
      className={`flex-shrink-0 bg-[#0B1121] border-r border-slate-800/60 flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden border-none'
        }`}
    >
      <div className="w-[260px] min-w-[260px] flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 pt-7">
          <div className="bg-primary-500 rounded-lg p-1.5 shadow-lg shadow-primary-500/20 text-white">
            <AlignLeft size={20} strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">SubSync</span>
        </div>

        {/* Upload Button */}
        <div className="px-6 pb-8">
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-primary-200 hover:bg-primary-300 text-primary-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} strokeWidth={2.5} /> Upload Video
          </button>
        </div>

        {/* Recent Files List */}
        <div className="flex flex-col">
          <h3 className="px-6 text-[11px] font-bold tracking-wider text-slate-500 mb-3">RECENT FILES</h3>
          <div className="flex flex-col px-3 gap-1">
            {recentFiles.map(file => {
              const isActive = file.id === activeVideoId;
              return (
                <button
                  key={file.id}
                  onClick={() => onSelectVideo(file.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all border group relative overflow-hidden ${isActive
                      ? 'bg-slate-800/60 border-slate-700/50 shadow-sm'
                      : 'hover:bg-slate-800/30 border-transparent'
                    }`}
                >
                  {isActive ? (
                    <Film className="text-primary-400 mt-0.5 flex-shrink-0" size={18} />
                  ) : (
                    <div className="bg-slate-800/50 p-1 rounded-md mt-0.5"><Film className="text-slate-400" size={14} /></div>
                  )}
                  <div className="flex-1 min-w-0 pr-14">
                    <div className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}`}>
                      {file.name}
                    </div>
                    <div className={`text-xs mt-1 ${isActive ? 'text-slate-500' : 'text-slate-600'}`}>
                      {file.timestamp}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(file.id, !file.is_favorite); }}
                      className={`p-1.5 rounded-md hover:bg-slate-700 transition-colors ${file.is_favorite ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'}`}
                    >
                      <Heart size={14} fill={file.is_favorite ? "currentColor" : "none"} />
                    </div>
                    <div
                      onClick={(e) => { e.stopPropagation(); onDeleteVideo(file.id); }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 size={14} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Quota Card */}
        {usageData && (
          <div className="px-4 mt-auto mb-2 pt-4">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-200">Free Daily Credits</span>
                <span className={`font-bold ${usageData.remaining_requests < (usageData.daily_limit * 0.1) ? 'text-red-400' : 'text-primary-400'}`}>
                  {usageData.remaining_requests} / {usageData.daily_limit}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usageData.remaining_requests < (usageData.daily_limit * 0.1) ? 'bg-red-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, (usageData.remaining_requests / usageData.daily_limit) * 100))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-0.5 font-medium tracking-wide uppercase">
                Resets in {usageData.reset_in_hours} hours
              </div>
            </div>
          </div>
        )}

        {/* Workspace Settings */}
        <div className={`p-4 mb-2 ${!usageData ? 'mt-auto' : ''}`}>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-slate-200 w-full p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <Settings size={18} /> Workspace Settings
          </button>
        </div>
      </div>
    </aside>
  );
}

function Header({
  activeVideo,
  onToggleSidebar,
  onExport,
  targetLanguage,
  onLanguageChange,
  isTranslating,
  onLogout
}: {
  activeVideo: VideoFile | null,
  onToggleSidebar: () => void,
  onExport: () => void,
  targetLanguage: string,
  onLanguageChange: (lang: string) => void,
  isTranslating: boolean,
  onLogout: () => void
}) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const languages = [
    { code: 'en', label: 'English (EN)' },
    { code: 'th', label: 'Thai (TH)' },
    { code: 'ja', label: 'Japanese (JA)' },
    { code: 'es', label: 'Spanish (ES)' }
  ];

  const currentLangLabel = languages.find(l => l.code === targetLanguage)?.label || targetLanguage;

  return (
    <header className="h-[72px] border-b border-slate-800/60 flex items-center justify-between px-6 bg-[#111827] flex-shrink-0 relative z-30">
      <div className="flex items-center gap-5">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2.5 bg-slate-800/50 px-3.5 py-1.5 rounded-full text-sm border border-slate-700/50 shadow-sm max-w-sm">
          <FileVideo size={16} className="text-primary-400 flex-shrink-0" />
          <span className="text-slate-200 font-medium truncate">{activeVideo?.name || 'No video selected'}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800 ml-2"
          title="Reload App"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <div className="flex items-center gap-6">

        {/* Translate Dropdown */}
        <div className="relative">
          <button
            onClick={() => !isTranslating && setShowLangDropdown(!showLangDropdown)}
            disabled={isTranslating}
            className={`flex items-center gap-2 text-sm text-slate-400 transition-colors ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'hover:text-slate-300'}`}
          >
            Translate to: <span className="text-slate-200 font-medium ml-1">{currentLangLabel}</span>
            <ChevronDown size={14} className="ml-0.5" />
          </button>

          {showLangDropdown && !isTranslating && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onLanguageChange(lang.code); setShowLangDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
        >
          <Download size={16} /> Export (.srt / .vtt)
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white border-2 border-slate-600 hover:border-slate-500 transition-colors shadow-sm overflow-hidden"
          >
            <User size={18} className="text-slate-300" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 flex flex-col gap-2">
              <div className="text-sm text-white font-medium">Role: Admin</div>
              <div className="text-xs text-slate-400 pb-3 border-b border-slate-700">admin@local</div>
              <button
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="text-sm font-medium text-red-400 hover:text-red-300 text-left pt-2 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

function SubtitleCard({
  block,
  isActive,
  onSeek,
  onChange,
  onBlur,
  onDelete,
  showOriginalText
}: {
  block: SubtitleBlock,
  isActive: boolean,
  onSeek: (time: number) => void,
  onChange: (id: string, text: string) => void,
  onBlur?: (id: string) => void,
  onDelete?: (id: string) => void,
  showOriginalText: boolean
}) {
  if (isActive) {
    return (
      <div id={`subtitle-block-${block.id}`} className="bg-[#1E293B] rounded-xl p-5 border-l-[3px] border-l-primary-400 border-t border-t-primary-500/10 border-r border-r-primary-500/10 border-b border-b-primary-500/10 shadow-lg shadow-primary-900/10 relative transform scale-[1.01] transition-transform">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 text-[11px] text-primary-300 font-mono font-semibold cursor-pointer hover:text-primary-200 transition-colors"
              onClick={() => onSeek(block.startTime)}
            >
              <Volume2 size={13} /> {formatTime(block.startTime, true)} - {formatTime(block.endTime, true)}
            </div>
            <span className="bg-primary-500/20 text-primary-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest border border-primary-500/20">PLAYING</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-1.5 hover:text-white rounded-md hover:bg-slate-700 transition-colors"><RotateCcw size={14} /></button>
            <button className="p-1.5 hover:text-white rounded-md hover:bg-slate-700 transition-colors"><Split size={14} className="rotate-90" /></button>
            <button onClick={() => onDelete && onDelete(block.id)} className="p-1.5 hover:text-red-400 rounded-md hover:bg-slate-700 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
        {showOriginalText && (
          <p className="text-[14px] text-white mb-4 leading-relaxed font-semibold">
            {block.originalText || <span className="text-slate-500 italic">No original text</span>}
          </p>
        )}
        <textarea
          className="w-full bg-[#0F172A] border border-primary-500/40 rounded-lg p-3 text-[14px] text-white focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 resize-none shadow-inner"
          rows={2}
          value={block.translatedText}
          onChange={(e) => onChange(block.id, e.target.value)}
          onFocus={() => onSeek(block.startTime)}
          onBlur={() => onBlur && onBlur(block.id)}
          placeholder="Translate here..."
        />
      </div>
    );
  }

  return (
    <div id={`subtitle-block-${block.id}`} className="bg-[#1E293B] rounded-xl p-4.5 border border-slate-700/50 hover:border-slate-600 transition-colors group shadow-sm p-5">
      <div className="flex justify-between items-start mb-3">
        <div
          className="flex items-center gap-2 text-[11px] text-slate-400 font-mono font-medium cursor-pointer hover:text-primary-400 transition-colors w-fit"
          onClick={() => onSeek(block.startTime)}
        >
          <Clock size={13} /> {formatTime(block.startTime, true)} - {formatTime(block.endTime, true)}
        </div>
        <button onClick={() => onDelete && onDelete(block.id)} className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
      </div>
      {showOriginalText && (
        <p className="text-[14px] text-slate-300 mb-3.5 leading-relaxed font-medium">
          {block.originalText || <span className="text-slate-600 italic">No original text</span>}
        </p>
      )}
      <textarea
        className="w-full bg-[#0F172A]/80 border border-slate-700/50 rounded-lg p-3 text-[14px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 resize-none transition-all shadow-inner"
        rows={2}
        value={block.translatedText}
        onChange={(e) => onChange(block.id, e.target.value)}
        onFocus={() => onSeek(block.startTime)}
        onBlur={() => onBlur && onBlur(block.id)}
        placeholder="Translate here..."
      />
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const savedTimes = useRef<Record<string, number>>({});

  const [recentFiles, setRecentFiles] = useState<VideoFile[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [subtitleBlocks, setSubtitleBlocks] = useState<SubtitleBlock[]>([]);
  const [usageData, setUsageData] = useState<UsageInfo | null>(null);

  // Revisions State
  const [revisions, setRevisions] = useState<Revision[]>([]);

  const handleAddRevision = async (description: string) => {
    if (!activeVideoId) return;
    try {
      const newRev = await addRevision(activeVideoId, description);
      setRevisions(prev => [newRev, ...prev].slice(0, 50));
    } catch (e) {
      console.error("Failed to add revision", e);
      setApiError("Failed to add revision");
    }
  };

  // App UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState<boolean>(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState<boolean>(false);
  const [showRevisionLog, setShowRevisionLog] = useState<boolean>(false);

  // Theme State
  const [themeColor, setThemeColor] = useState<string>('indigo');

  useEffect(() => {
    const colors: Record<string, Record<string, string>> = {
      indigo: { 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 950: '#1e1b4b' },
      pink: { 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 950: '#831843' },
      emerald: { 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 950: '#022c22' },
      amber: { 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 950: '#451a03' },
      sky: { 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 950: '#082f49' },
      rose: { 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 950: '#4c0519' },
    };

    const selected = colors[themeColor];
    if (selected) {
      const root = document.documentElement;
      Object.entries(selected).forEach(([weight, val]) => {
        root.style.setProperty(`--theme-${weight}`, val);
      });
    }
  }, [themeColor]);

  // Translation States
  const [targetLanguage, setTargetLanguage] = useState('th');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Settings States
  const [showOriginalText, setShowOriginalText] = useState<boolean>(true);
  const [autoScrollSync, setAutoScrollSync] = useState<boolean>(true);
  const [showVideoOriginalText, setShowVideoOriginalText] = useState<boolean>(true);
  const [showVideoTranslatedText, setShowVideoTranslatedText] = useState<boolean>(true);

  const subtitleListRef = useRef<HTMLDivElement>(null);
  const prevActiveBlockIdRef = useRef<string | null>(null);

  // Video Player State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const activeVideo = recentFiles.find(f => f.id === activeVideoId) || null;

  // Fetch recent videos on mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videos = await getRecentVideos();
        setRecentFiles(videos);
        if (videos.length > 0) {
          setActiveVideoId(videos[0].id);
        }

        const usage = await getUsage();
        setUsageData(usage);
      } catch (err) {
        console.error(err);
        setApiError("Failed to fetch initial data");
      }
    };
    fetchVideos();
  }, []);

  // Handle Subtitle Loading and Translation
  useEffect(() => {
    if (!activeVideoId) return;

    const loadSubtitles = async () => {
      try {
        const [subs, revs] = await Promise.all([
          getSubtitles(activeVideoId, targetLanguage),
          getRevisions(activeVideoId)
        ]);
        setRevisions(revs);

        if (subs) {
          setSubtitleBlocks(subs);
        } else {
          setIsTranslating(true);
          const newSubs = await translateVideo(activeVideoId, targetLanguage);
          setSubtitleBlocks(newSubs);

          // Refresh usage data after successful translation
          getUsage().then(setUsageData).catch(console.error);

          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setIsPlaying(true);
          }
          setIsTranslating(false);
        }
      } catch (err) {
        console.error(err);
        setApiError('Failed to load or translate subtitles');
        setIsTranslating(false);
      }
    };

    loadSubtitles();
  }, [activeVideoId, targetLanguage]);

  // Effect to reset video when a new file is selected
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      // Wait for loadedmetadata to set actual duration, but reset it initially if available
      if (activeVideo && activeVideo.duration > 0) {
        setDuration(activeVideo.duration);
      }
    }
  }, [activeVideoId, activeVideo?.duration]);

  // Video Controls Handlers
  const togglePlay = () => {
    if (isTranslating) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (activeVideoId) {
        savedTimes.current[activeVideoId] = videoRef.current.currentTime;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration;
      setDuration(vidDuration);

      if (activeVideoId && savedTimes.current[activeVideoId]) {
        videoRef.current.currentTime = savedTimes.current[activeVideoId];
      }

      // Update the recent files duration property if it's a newly uploaded video (duration 0 initially)
      if (activeVideo && activeVideo.duration === 0) {
        setRecentFiles(prev => prev.map(f => f.id === activeVideo.id ? { ...f, duration: vidDuration } : f));
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const handlePlaybackRate = () => {
    const nextRates: Record<number, number> = { 1: 1.25, 1.25: 1.5, 1.5: 2, 2: 0.5, 0.5: 1 };
    const next = nextRates[playbackRate] || 1;
    if (videoRef.current) {
      videoRef.current.playbackRate = next;
    }
    setPlaybackRate(next);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos));

    setVolume(pos);
    if (pos === 0) {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
    } else {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = pos;
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Error attempting to enable full-screen mode:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-scroll sync effect
  useEffect(() => {
    if (!autoScrollSync) return;

    const activeBlock = subtitleBlocks.find(b => currentTime >= b.startTime && currentTime <= b.endTime);
    if (activeBlock && activeBlock.id !== prevActiveBlockIdRef.current) {
      const el = document.getElementById(`subtitle-block-${activeBlock.id}`);
      if (el && subtitleListRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      prevActiveBlockIdRef.current = activeBlock.id;
    }
  }, [currentTime, subtitleBlocks, autoScrollSync]);

  const seekToTime = (timeInSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  };

  const handleSubtitleBlur = async (id: string) => {
    if (!activeVideoId) return;
    const blockIndex = subtitleBlocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;
    try {
      await saveSubtitles(activeVideoId, targetLanguage, subtitleBlocks);
      await handleAddRevision(`Block #${blockIndex + 1} translated text updated`);
    } catch (err) {
      console.error(err);
      setApiError("Failed to save subtitle edits");
    }
  };

  const handleSubtitleChange = (id: string, newText: string) => {
    setSubtitleBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === id ? { ...block, translatedText: newText } : block
      )
    );
  };

  const handleVideoUpload = async (file: File) => {
    try {
      const newFile = await uploadVideo(file);
      setRecentFiles(prev => [newFile, ...prev]);
      setActiveVideoId(newFile.id);
    } catch (err) {
      console.error(err);
      alert('Failed to upload video');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    // Clear active video first to help release file lock on Windows
    if (activeVideoId === id) {
      setActiveVideoId(null);
      setSubtitleBlocks([]);
    }

    try {
      await deleteVideo(id);
      setRecentFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete video');
    }
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    try {
      await toggleFavorite(id, isFav);
      setRecentFiles(prev => prev.map(f => f.id === id ? { ...f, is_favorite: isFav } : f));
    } catch (err) {
      console.error(err);
      alert('Failed to update favorite');
    }
  };

  const handleAddBlock = async () => {
    if (!activeVideoId) return;
    const lastBlock = subtitleBlocks[subtitleBlocks.length - 1];
    const newStartTime = lastBlock ? lastBlock.endTime + 0.5 : 0;
    const newEndTime = newStartTime + 3;

    const newBlock: SubtitleBlock = {
      id: `s${Date.now()}`,
      startTime: newStartTime,
      endTime: newEndTime,
      originalText: '',
      translatedText: ''
    };

    const newBlocks = [...subtitleBlocks, newBlock];
    setSubtitleBlocks(newBlocks);
    try {
      await saveSubtitles(activeVideoId, targetLanguage, newBlocks);
      await handleAddRevision(`Added new block #${newBlocks.length}`);
    } catch (err) {
      console.error(err);
      setApiError("Failed to save new block");
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!activeVideoId) return;
    const blockIndex = subtitleBlocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;
    const newBlocks = subtitleBlocks.filter(b => b.id !== id);
    setSubtitleBlocks(newBlocks);
    try {
      await saveSubtitles(activeVideoId, targetLanguage, newBlocks);
      await handleAddRevision(`Deleted block #${blockIndex + 1}`);
    } catch (err) {
      console.error(err);
      setApiError("Failed to delete block");
    }
  };

  const handleExport = () => {
    const srtContent = subtitleBlocks.map((block, index) => {
      return `${index + 1}\n${formatSrtTime(block.startTime)} --> ${formatSrtTime(block.endTime)}\n${block.translatedText}\n`;
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleAddRevision('Exported subtitles');
  };

  const activeVideoUrl = activeVideo?.url || "";

  if (!isLoggedIn) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (loginUser === "admin" && loginPass === "1234") {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        setLoginError("");
      } else {
        setLoginError("Invalid credentials");
      }
    };

    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 font-sans text-slate-300">
        <div className="bg-[#1E293B] p-8 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-primary-500 rounded-lg p-2 shadow-lg shadow-primary-500/20 text-white">
              <AlignLeft size={24} strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">SubSync</span>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-slate-600"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-slate-600"
                placeholder="••••"
              />
            </div>
            {loginError && <p className="text-red-400 text-sm mt-1 font-medium">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 rounded-lg mt-4 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 overflow-hidden font-sans selection:bg-primary-500/30 relative">
      {apiError && (
        <div className="fixed top-6 right-6 bg-red-500/90 text-white px-5 py-3.5 rounded-xl shadow-2xl z-[100] flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 border border-red-400/50">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span className="text-sm font-medium">{apiError}</span>
          <button onClick={() => setApiError(null)} className="ml-2 hover:bg-red-600/50 p-1 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <Sidebar
        recentFiles={recentFiles}
        activeVideoId={activeVideoId}
        onSelectVideo={setActiveVideoId}
        isSidebarOpen={isSidebarOpen}
        onUpload={handleVideoUpload}
        onOpenSettings={() => setShowWorkspaceSettings(true)}
        onDeleteVideo={handleDeleteVideo}
        onToggleFavorite={handleToggleFavorite}
        usageData={usageData}
      />

      <main className="flex-1 flex flex-col bg-[#0F172A] min-w-0 relative z-10">

        <Header
          activeVideo={activeVideo}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onExport={handleExport}
          targetLanguage={targetLanguage}
          onLanguageChange={setTargetLanguage}
          isTranslating={isTranslating}
          onLogout={() => {
            setIsLoggedIn(false);
            localStorage.removeItem('isLoggedIn');
          }}
        />

        {/* Workspace Split Layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Column: Video Section */}
          <div className="w-[58%] flex flex-col p-6 overflow-y-auto min-w-0">
            {/* Video Header */}
            <div className="flex items-center justify-between mb-5 relative">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate max-w-[300px]">
                  {activeVideo?.name.replace(/\.[^/.]+$/, "") || "No video selected"}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700/60 uppercase tracking-wide flex-shrink-0">
                  v2.4 Draft
                </span>
                <div className={`flex items-center gap-2 text-xs font-medium ml-4 px-2.5 py-1 rounded-full border ${autoScrollSync ? 'text-slate-300 bg-slate-900/50 border-slate-800' : 'text-slate-500 bg-slate-900/30 border-slate-800/50'} flex-shrink-0`}>
                  <div className={`w-2 h-2 rounded-full relative ${autoScrollSync ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}>
                    {autoScrollSync && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20"></div>}
                  </div>
                  {autoScrollSync ? 'Auto-sync active' : 'Auto-sync disabled'}
                </div>
              </div>
              <div className="flex items-center gap-3">

                {/* Display Settings */}
                <div className="relative">
                  <button
                    onClick={() => { setShowDisplaySettings(!showDisplaySettings); setShowRevisionLog(false); }}
                    className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-all font-medium"
                  >
                    <Settings2 size={16} /> Display Settings
                  </button>
                  {showDisplaySettings && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowOriginalText(!showOriginalText)}>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Show Original Text (Editor)</span>
                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${showOriginalText ? 'bg-primary-500' : 'bg-slate-600'}`}>
                          <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${showOriginalText ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowVideoOriginalText(!showVideoOriginalText)}>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Show Original Text (Video)</span>
                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${showVideoOriginalText ? 'bg-primary-500' : 'bg-slate-600'}`}>
                          <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${showVideoOriginalText ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowVideoTranslatedText(!showVideoTranslatedText)}>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Show Translated Text (Video)</span>
                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${showVideoTranslatedText ? 'bg-primary-500' : 'bg-slate-600'}`}>
                          <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${showVideoTranslatedText ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between cursor-pointer group" onClick={() => setAutoScrollSync(!autoScrollSync)}>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Auto-scroll Sync</span>
                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${autoScrollSync ? 'bg-primary-500' : 'bg-slate-600'}`}>
                          <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${autoScrollSync ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Revision Log */}
                <div className="relative">
                  <button
                    onClick={() => { setShowRevisionLog(!showRevisionLog); setShowDisplaySettings(false); }}
                    className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-all font-medium"
                  >
                    <History size={16} /> Revision Log
                  </button>
                  {showRevisionLog && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
                      <h4 className="text-sm font-bold text-white mb-3 pb-2 border-b border-slate-700">Recent Revisions</h4>
                      <ul className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {revisions.length === 0 ? (
                          <li className="text-sm text-slate-500">No revisions yet</li>
                        ) : revisions.map(rev => (
                          <li key={rev.id} className="flex flex-col">
                            <span className="text-xs font-mono text-slate-400">{rev.time}</span>
                            <span className="text-sm text-slate-200">{rev.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Video Player */}
            <div ref={videoContainerRef} className="relative bg-black rounded-xl overflow-hidden aspect-video border border-slate-800 shadow-2xl ring-1 ring-white/5 flex-shrink-0 group">
              <video
                ref={videoRef}
                src={activeVideoUrl}
                className="w-full h-full object-contain opacity-80"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
              />

              <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                {/* On-screen Subtitles */}
                <div className="mb-24 flex flex-col items-center gap-1.5 text-center px-12 z-10 drop-shadow-lg">
                  {subtitleBlocks.map(block => {
                    const isActive = currentTime >= block.startTime && currentTime <= block.endTime;
                    if (!isActive) return null;
                    return (
                      <React.Fragment key={`overlay-${block.id}`}>
                        {showVideoOriginalText && (
                          <div className="text-white text-[19px] font-semibold bg-black/50 px-5 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
                            "{block.originalText}"
                          </div>
                        )}
                        {showVideoTranslatedText && (
                          <div className="text-slate-300 text-[15px] bg-black/50 px-5 py-1 rounded-lg backdrop-blur-md border border-white/5 shadow-lg pointer-events-auto">
                            {block.translatedText}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Custom Video Controls */}
                <div className={`absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-4 bg-gradient-to-t from-[#0B1121]/95 via-[#0B1121]/50 to-transparent pointer-events-auto ${isTranslating ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div
                    className="w-full h-1.5 bg-slate-600/50 rounded-full overflow-hidden cursor-pointer group/scrubber"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-primary-500 relative group-hover/scrubber:bg-primary-400 transition-colors"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow scale-0 group-hover/scrubber:scale-100 transition-transform"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-5">
                      <button
                        onClick={togglePlay}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                      >
                        {isPlaying ? <Pause size={18} fill="currentColor" strokeWidth={1} /> : <Play size={18} fill="currentColor" strokeWidth={1} className="ml-1" />}
                      </button>
                      <button onClick={skipBackward} className="hover:text-white transition-colors"><RotateCcw size={18} /></button>
                      <button onClick={skipForward} className="hover:text-white transition-colors"><RotateCw size={18} /></button>
                      <div className="text-xs font-semibold ml-2 font-mono tracking-wide">
                        <span className="text-white">{formatTime(currentTime)}</span> <span className="text-slate-500 mx-1">/</span> {formatTime(duration)}
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <button
                        onClick={handlePlaybackRate}
                        className="text-xs font-bold hover:text-white transition-colors bg-white/5 px-2 py-1 rounded"
                      >
                        {playbackRate.toFixed(1)}x
                      </button>
                      <div className="flex items-center gap-2 group/volume cursor-pointer">
                        <button onClick={toggleMute} className="hover:text-white transition-colors group-hover/volume:text-white">
                          {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                        </button>
                        <div className="w-16 h-1.5 bg-slate-600/50 rounded-full overflow-hidden" onClick={handleVolumeChange}>
                          <div
                            className="h-full bg-slate-300 rounded-full group-hover/volume:bg-white transition-colors"
                            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <button onClick={handleFullscreen} className="hover:text-white transition-colors ml-1">
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Footer Stats */}
            <div className="flex items-center mt-4 text-[11px] font-bold text-slate-400 bg-slate-800/30 p-3 rounded-xl border border-slate-800/80 uppercase tracking-wider">
              <div className="flex items-center gap-2 px-3"><MonitorPlay size={15} className="text-slate-500" /> 1080p · 60fps</div>
              <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
              <div className="flex items-center gap-2 px-3"><Clock size={15} className="text-slate-500" /> {formatTime(duration)} total</div>
              <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
              <div className="flex items-center gap-2 px-3"><Music size={15} className="text-slate-500" /> Stereo 48kHz</div>
              <div className="flex items-center gap-2 ml-auto text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 size={15} /> All edits saved
              </div>
            </div>
          </div>

          {/* Right Column: Subtitle Editor */}
          <div className="w-[42%] border-l border-slate-800/60 bg-[#141E33]/30 flex flex-col p-6 min-w-0 relative">
            {isTranslating && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#141E33]/80 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-primary-300 font-medium">AI is generating translations...</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-semibold text-white tracking-wide">Subtitle Blocks</h2>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-700/50">
                  {subtitleBlocks.length}
                </span>
              </div>
              <button
                onClick={handleAddBlock}
                className="flex items-center gap-2 text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-all border border-slate-700 font-medium shadow-sm"
              >
                <Plus size={16} /> Add Block
              </button>
            </div>

            <div ref={subtitleListRef} className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 pb-10">
              {subtitleBlocks.map(block => {
                const isActive = currentTime >= block.startTime && currentTime <= block.endTime;
                return (
                  <SubtitleCard
                    key={block.id}
                    block={block}
                    isActive={isActive}
                    onSeek={seekToTime}
                    onChange={handleSubtitleChange}
                    onBlur={handleSubtitleBlur}
                    onDelete={handleDeleteBlock}
                    showOriginalText={showOriginalText}
                  />
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Workspace Settings Modal Overlay */}
      {showWorkspaceSettings && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-7 shadow-2xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Workspace Settings</h3>
            <p className="text-slate-400 text-sm mb-6">Configure defaults and customize your workspace appearance.</p>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Default Target Language</span>
                <span className="text-sm text-primary-400">Thai (TH)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Auto-Save Interval</span>
                <span className="text-sm text-slate-400">30 seconds</span>
              </div>

              <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-700/50">
                <span className="text-sm font-medium text-slate-300">Theme Color</span>
                <div className="flex gap-2">
                  {['indigo', 'sky', 'emerald', 'amber', 'pink', 'rose'].map(c => (
                    <button
                      key={c}
                      onClick={() => setThemeColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${themeColor === c ? 'border-white scale-110 shadow-md shadow-black/50' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                      style={{
                        backgroundColor:
                          c === 'indigo' ? '#6366f1' :
                            c === 'pink' ? '#ec4899' :
                              c === 'emerald' ? '#10b981' :
                                c === 'amber' ? '#f59e0b' :
                                  c === 'sky' ? '#0ea5e9' :
                                    '#f43f5e'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWorkspaceSettings(false)}
              className="self-end bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-primary-500/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
