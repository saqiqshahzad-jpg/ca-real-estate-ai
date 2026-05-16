/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import logoImg from './logo.png'; 

const accentColors = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'bg-emerald-500/20' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', glow: 'bg-blue-500/20' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'bg-rose-500/20' },
};

const API_URL = 'https://ca-estate-api.onrender.com'; 

export default function App() {
  const [user, setUser] = useState(null); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // 📱 MOBILE SIDEBAR STATE (Only for Responsiveness)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pwdReqs = {
    length: password.length >= 8, uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password), special: /[^A-Za-z0-9]/.test(password)
  };
  const isPasswordValid = pwdReqs.length && pwdReqs.uppercase && pwdReqs.number && pwdReqs.special;

  const defaultWelcomeMessage = { role: 'ai', text: "Hello Alaaudin Bro! I am your Elite Real Estate Assistant. How can I help you today?", id: 1 };
  const [messages, setMessages] = useState([defaultWelcomeMessage]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [activeChatId, setActiveChatId] = useState(null);
  const [isTempChat, setIsTempChat] = useState(false);
  const [showTempDisclaimer, setShowTempDisclaimer] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [selectedAccent, setSelectedAccent] = useState('blue');

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('al_elite_user_final3');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedData = JSON.parse(localStorage.getItem('al_pro_estate_final3')) || {};
    setChatHistory(savedData.history || []);
    if(savedData.accent) setSelectedAccent(savedData.accent);
    if(savedData.isDarkMode !== undefined) setIsDarkMode(savedData.isDarkMode);
  }, []);

  useEffect(() => {
    if (user && !isTempChat) {
      localStorage.setItem('al_pro_estate_final3', JSON.stringify({
        history: chatHistory, accent: selectedAccent, isDarkMode: isDarkMode
      }));
    }
  }, [chatHistory, selectedAccent, isDarkMode, user, isTempChat]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleAuth = async (e) => {
    e.preventDefault(); setAuthError(''); setAuthSuccess('');
    if (authMode === 'signup' && !isPasswordValid) return;
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'signup' ? 'signup' : authMode === 'otp' ? 'verify-otp' : 'login';
      const body = authMode === 'otp' ? { email, otp } : { email, password };
      const res = await fetch(`${API_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        if (authMode === 'signup') setAuthMode('otp');
        else if (authMode === 'otp') setAuthMode('login');
        else {
          setUser({ email });
          localStorage.setItem('al_elite_user_final3', JSON.stringify({ email }));
          setShowAuthModal(false);
        }
      } else setAuthError(data.detail || "Error");
    } catch { setAuthError("⚠️ Connection Error."); }
    setAuthLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userInput = input;
    const userMsg = { role: 'user', text: userInput, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    if(window.innerWidth < 768) setIsSidebarOpen(false); // Mobile pe auto-close

    try {
      const response = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userInput, email: user ? user.email : "guest" }) });
      const data = await response.json();
      const aiMsg = { role: 'ai', text: data.response || "No response.", id: Date.now() + 1 };
      setMessages(prev => prev.filter(m => m.text !== '_thinking_').concat(aiMsg));
      
      if (user && !isTempChat) {
        setChatHistory(prev => {
          if (!activeChatId) {
            const newId = Date.now() + 2; setActiveChatId(newId);
            return [{ id: newId, title: userInput.substring(0, 30) + '...', msgs: [...messages, userMsg, aiMsg] }, ...prev];
          }
          return prev.map(c => c.id === activeChatId ? { ...c, msgs: [...c.msgs, userMsg, aiMsg] } : c);
        });
      }
    } catch { setMessages(prev => [...prev.filter(m => m.text !== '_thinking_').concat({ role: 'ai', text: "⚠️ Failed.", id: Date.now() })]); }
    setIsTyping(false);
  };

  const theme = {
    bg: isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#eef2f6]', textPrimary: isDarkMode ? 'text-white' : 'text-slate-900',
    textSecondary: isDarkMode ? 'text-gray-400' : 'text-slate-600', sidebarBg: isDarkMode ? 'bg-[#111111]/90' : 'bg-white/90',
    sidebarBorder: isDarkMode ? 'border-white/10' : 'border-slate-300', sidebarHover: isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100',
    activeHistory: isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900 font-bold',
    headerBg: isDarkMode ? 'bg-[#0a0a0a]/80' : 'bg-[#eef2f6]/80', chatBoxBgAI: isDarkMode ? 'bg-transparent text-gray-200' : 'bg-transparent text-slate-800',
    chatBoxBgUser: isDarkMode ? 'bg-[#222] text-white border-white/5' : 'bg-white text-slate-900 border-slate-300 shadow-md',
    inputWrapperBg: isDarkMode ? 'bg-[#1c1c1c]/90' : 'bg-white', inputBorder: isDarkMode ? 'border-white/10 focus-within:border-neutral-500' : 'border-slate-300 focus-within:border-slate-500 shadow-md',
    inputAreaGradient: isDarkMode ? 'from-[#0a0a0a] via-[#0a0a0a]/95' : 'from-[#eef2f6] via-[#eef2f6]/95',
    blurOrb1: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-300/30', blurOrb2: isDarkMode ? 'bg-purple-900/20' : 'bg-purple-300/30',
  };
  const accent = accentColors[selectedAccent];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100vw; height: 100vh; overflow: hidden; position: fixed; top: 0; left: 0; background-color: ${isDarkMode ? '#0a0a0a' : '#eef2f6'}; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
      `}} />

      <div className={`absolute inset-0 flex overflow-hidden ${theme.textPrimary} transition-colors duration-500 font-sans`}>
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${theme.blurOrb1} rounded-full blur-[140px] pointer-events-none z-0`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${theme.blurOrb2} rounded-full blur-[160px] pointer-events-none z-0`}></div>

        {/* 📱 MOBILE OVERLAY */}
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />}

        {/* --- 💎 SIDEBAR (STAYS EXACTLY SAME DESIGN) --- */}
        <div className={`fixed md:relative w-[280px] sm:w-[320px] h-full flex-shrink-0 ${theme.sidebarBg} backdrop-blur-3xl flex flex-col border-r ${theme.sidebarBorder} z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-5 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className={`text-xl font-extrabold tracking-tighter flex items-center gap-2 ${theme.textPrimary}`}>
                 <img src={logoImg} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                 Elite AI <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md text-white shadow-md ${accent.bg}`}>v3.0</span>
              </h1>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 opacity-50"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <button onClick={() => { setMessages([defaultWelcomeMessage]); setActiveChatId(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-sm font-bold transition border ${theme.sidebarBorder} ${theme.sidebarHover} ${theme.textPrimary} shadow-sm`}>+ New Conversation</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {user && chatHistory.map(chat => (
              <div key={chat.id} onClick={() => { setMessages(chat.msgs); setActiveChatId(chat.id); setIsSidebarOpen(false); }} className={`p-3 rounded-xl cursor-pointer text-sm mb-1 transition ${activeChatId === chat.id ? theme.activeHistory : `${theme.sidebarHover} ${theme.textSecondary}`}`}>
                <span className="truncate flex-1">{chat.title}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
             {!user ? <button onClick={() => setShowAuthModal(true)} className={`w-full ${isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white'} font-extrabold py-3.5 rounded-xl text-sm`}>Sign In</button> : 
               <div className="flex items-center gap-4 p-2.5 rounded-2xl bg-white/5">
                  <div className={`w-10 h-10 rounded-full ${accent.bg} text-white flex items-center justify-center font-extrabold text-sm`}>{user.email.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 text-left truncate text-sm font-bold opacity-60">{user.email}</div>
               </div>}
          </div>
        </div>

        {/* --- 💬 MAIN CHAT AREA --- */}
        <div className="flex-1 h-full relative z-10 min-w-0 flex flex-col">
          <header className={`h-16 border-b ${theme.sidebarBorder} flex items-center justify-between px-6 md:px-8 ${theme.headerBg} backdrop-blur-xl z-30`}>
            <div className="flex items-center gap-4">
              {/* 🍔 HAMBURGER BUTTON (Mobile only) */}
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/5 transition border border-white/5"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>
              <span className={`text-sm font-extrabold tracking-widest uppercase truncate ${theme.textPrimary}`}>CA REAL ESTATE ADVISOR</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${accent.bg} animate-pulse`}></span>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-40">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 md:gap-5 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${msg.role === 'ai' ? `${accent.bg} text-white` : 'bg-neutral-800'}`}>{msg.role === 'ai' ? 'AI' : 'U'}</div>
                  <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-6 rounded-3xl text-[14px] md:text-[15.5px] border ${msg.role === 'user' ? theme.chatBoxBgUser : `${theme.chatBoxBgAI} bg-white/5 backdrop-blur-2xl shadow-lg`}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] font-black tracking-widest text-blue-500 animate-pulse uppercase px-4">Analyzing Documents...</div>}
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 w-full px-4 md:px-6 pt-12 pb-6 bg-gradient-to-t ${theme.inputAreaGradient} z-20`}>
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#1c1c1c]/90 backdrop-blur-3xl rounded-3xl border ${theme.inputBorder} p-2 shadow-2xl">
              <textarea ref={textareaRef} rows="1" className="flex-1 bg-transparent text-white p-3 md:p-4 outline-none resize-none text-[14px] md:text-[15px]" placeholder="Ask Elite AI..." value={input} onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'; }} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} />
              <button onClick={handleSend} className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600 text-white shadow-lg flex-shrink-0 hover:scale-105 active:scale-95 transition`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111] p-10 rounded-[2.5rem] w-full max-w-sm border border-white/10 shadow-2xl relative">
            <h2 className="text-xl font-black mb-6 text-center">{authMode.toUpperCase()}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" placeholder="Email" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
              {authMode !== 'otp' && <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-sm" value={password} onChange={e => setPassword(e.target.value)} required />}
              {authMode === 'otp' && <input type="text" placeholder="6-digit OTP" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-center tracking-widest text-lg" value={otp} onChange={e => setOtp(e.target.value)} required />}
              {authError && <p className="text-red-500 text-[10px] text-center font-bold bg-red-500/10 p-2 rounded-lg">{authError}</p>}
              <button type="submit" disabled={authLoading} className="w-full p-4 rounded-xl bg-blue-600 text-white font-black text-xs tracking-widest shadow-xl">{authLoading ? '...' : 'PROCEED'}</button>
            </form>
            <button onClick={() => setShowAuthModal(false)} className="w-full mt-4 text-[9px] font-bold opacity-30 uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}
    </>
  );
}s