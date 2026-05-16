/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import logoImg from './logo.png'; 

// --- 🎨 GLOBAL THEME & ACCENT CONFIG ---
const accentColors = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'bg-emerald-500/20' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', glow: 'bg-blue-500/20' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'bg-rose-500/20' },
};

// 🛑 UMAR BHAI FIX: API URL Live wala dalo, warna AI nahi chalega!
const API_URL = 'https://ca-estate-api.onrender.com'; 

export default function App() {
  // --- 🧠 AUTH STATES ---
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

  // --- 📱 MOBILE STATES (Zaroori addition) ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- 🧠 PASSWORD VALIDATION ---
  const pwdReqs = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const isPasswordValid = pwdReqs.length && pwdReqs.uppercase && pwdReqs.number && pwdReqs.special;

  // --- 🧠 CHAT STATES ---
  const defaultWelcomeMessage = { role: 'ai', text: "Hello! I'm CA Real Estate ADVISOR. How can I help you today?", id: 1 };
  
  const [messages, setMessages] = useState([defaultWelcomeMessage]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [activeChatId, setActiveChatId] = useState(null);
  
  const [isTempChat, setIsTempChat] = useState(false);
  const [showTempDisclaimer, setShowTempDisclaimer] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 🌓 THEME STATES
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [selectedAccent, setSelectedAccent] = useState('blue');

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // --- 💾 INIT ---
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
        history: chatHistory,
        accent: selectedAccent,
        isDarkMode: isDarkMode
      }));
    }
  }, [chatHistory, selectedAccent, isDarkMode, user, isTempChat]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  // --- 🔐 AUTH LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    if (authMode === 'signup' && !isPasswordValid) {
        setAuthError("Please meet all password requirements.");
        return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await fetch(`${API_URL}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            setAuthMode('otp');
            setAuthSuccess('✅ OTP Sent! Check your email.');
        } else {
            setAuthError(data.detail || "Signup failed");
        }
      } else if (authMode === 'otp') {
        const res = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
          });
          const data = await res.json();
          if (res.ok) {
              setAuthMode('login');
              setAuthSuccess('✅ Verified! Now please login.');
              setOtp('');
              setPassword('');
          } else {
              setAuthError(data.detail || "Invalid OTP");
          }
      } else { 
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            const userData = { email };
            setUser(userData);
            localStorage.setItem('al_elite_user_final3', JSON.stringify(userData));
            setShowAuthModal(false);
            setAuthError('');
            setAuthSuccess('');
            setEmail('');
            setPassword('');
            setMessages([{ role: 'ai', text: `Welcome back, ${email.split('@')[0]}! Feel free to ask any questions.`, id: Date.now() }]);
        } else {
            setAuthError(data.detail || "Login failed");
        }
      }
    } catch (err) {
        setAuthError("⚠️ Connection Error. Conatct the Host.");
    }
    setAuthLoading(false);
  };

  const logout = () => {
      setUser(null);
      localStorage.removeItem('al_elite_user_final3');
      setChatHistory([]);
      setMessages([defaultWelcomeMessage]);
      setShowProfileSettings(false);
  };

  // --- 🚀 CHAT LOGIC ---
  const startNewChat = () => {
    setMessages([{ role: 'ai', text: user ? "Starting a new session. How can I assist you?" : "Hello! I'm your CA Real Estate ADVISOR. How can I help you today?", id: Date.now() }]);
    setActiveChatId(null);
    setIsTempChat(false);
    setShowTempDisclaimer(false);
    setIsSidebarOpen(false); // Mobile pe auto-close
  };

  const toggleTempChat = () => {
    if (!isTempChat) {
      setShowTempDisclaimer(true);
      setMessages([{ role: 'ai', text: "🕶️ Incognito Mode Activated. Nothing is being saved.", id: Date.now() }]);
      setActiveChatId(null);
    } else {
      setShowTempDisclaimer(false);
      startNewChat();
    }
    setIsTempChat(!isTempChat);
    setIsSidebarOpen(false);
  };

  const loadChat = (id) => {
    const chat = chatHistory.find(c => c.id === id);
    if (chat) {
      setMessages(chat.msgs);
      setActiveChatId(id);
      setIsTempChat(false);
      setIsSidebarOpen(false); // Mobile pe auto-close
    }
  };

  const deleteChat = (id, e) => {
    e.stopPropagation(); 
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) startNewChat();
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userInput = input;
    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    const userMsg = { role: 'user', text: userInput, id: userMsgId };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    if(window.innerWidth < 768) setIsSidebarOpen(false); // Mobile pe auto-close

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages(prev => [...prev, { role: 'ai', text: '_thinking_', id: aiMsgId }]);

    try {
      const requestBody = { 
          message: userInput, 
          email: user ? user.email : "guest" 
      };

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Server Error");
      }

      const aiMsg = { role: 'ai', text: data.response || "No response.", id: aiMsgId };
      
      setMessages(prev => prev.map(m => m.id === aiMsgId ? aiMsg : m));

      if (user && !isTempChat) {
        setChatHistory(prevHistory => {
          let updatedHistory;
          const currentChatMsgs = [...messages, userMsg, aiMsg];
          if (!activeChatId) {
            const newId = Date.now() + 2;
            setActiveChatId(newId);
            updatedHistory = [{ id: newId, title: userInput.substring(0, 30) + '...', msgs: currentChatMsgs }, ...prevHistory];
          } else {
            updatedHistory = prevHistory.map(c => c.id === activeChatId ? { ...c, msgs: currentChatMsgs } : c);
          }
          return updatedHistory;
        });
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { 
          role: 'ai', 
          text: `⚠️ **Connection Failed:** Contact the Host.`, 
          id: aiMsgId 
      } : m));
    } finally {
      setIsTyping(false);
    }
  };

  // --- 🎨 THEME ENGINE ---
  const theme = {
    bg: isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#eef2f6]', 
    textPrimary: isDarkMode ? 'text-white' : 'text-slate-900',
    textSecondary: isDarkMode ? 'text-gray-400' : 'text-slate-600',
    
    sidebarBg: isDarkMode ? 'bg-[#111111]/90' : 'bg-white/90',
    sidebarBorder: isDarkMode ? 'border-white/10' : 'border-slate-300',
    sidebarHover: isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100',
    activeHistory: isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900 font-bold',
    
    headerBg: isDarkMode ? 'bg-[#0a0a0a]/80' : 'bg-[#eef2f6]/80',
    
    chatBoxBgAI: isDarkMode ? 'bg-transparent text-gray-200' : 'bg-transparent text-slate-800',
    chatBoxBgUser: isDarkMode ? 'bg-[#222] text-white border-white/5' : 'bg-white text-slate-900 border-slate-300 shadow-md',
    
    inputWrapperBg: isDarkMode ? 'bg-[#1c1c1c]/90' : 'bg-white',
    inputBorder: isDarkMode ? 'border-white/10 focus-within:border-neutral-500' : 'border-slate-300 focus-within:border-slate-500 shadow-md',
    inputAreaGradient: isDarkMode ? 'from-[#0a0a0a] via-[#0a0a0a]/95' : 'from-[#eef2f6] via-[#eef2f6]/95',
    
    blurOrb1: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-300/30',
    blurOrb2: isDarkMode ? 'bg-purple-900/20' : 'bg-purple-300/30',
  };

  const accent = accentColors[selectedAccent];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100vw !important; height: 100vh !important; overflow: hidden !important; position: fixed !important; top: 0; left: 0; background-color: ${isDarkMode ? '#0a0a0a' : '#eef2f6'}; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .markdown-container strong { font-weight: 800; color: inherit; }
        .markdown-container p { margin-bottom: 14px; }
        .markdown-container ul { list-style-type: disc; margin-left: 20px; margin-bottom: 14px; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px;}
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
      `}} />

      <div className={`absolute inset-0 flex overflow-hidden ${theme.textPrimary} transition-colors duration-500 font-sans`}>
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${theme.blurOrb1} rounded-full blur-[140px] pointer-events-none z-0`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${theme.blurOrb2} rounded-full blur-[160px] pointer-events-none z-0`}></div>

        {/* 📱 MOBILE OVERLAY (Only visible when sidebar open on mobile) */}
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />}

        {/* --- 💎 SIDEBAR (Responsive Fixed) --- */}
        <div className={`fixed md:relative w-[280px] sm:w-[320px] h-full flex-shrink-0 ${theme.sidebarBg} backdrop-blur-3xl flex flex-col border-r ${theme.sidebarBorder} z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-5 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className={`text-xl font-extrabold tracking-tighter flex items-center gap-2 ${theme.textPrimary}`}>
                 <img src={logoImg} alt="CA Real Estate Advisor" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                 Elite AI <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md text-white shadow-md ${accent.bg}`}>v3.0</span>
              </h1>
              {/* Close button for mobile */}
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 opacity-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            
            <button onClick={startNewChat} className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-sm font-bold transition border ${theme.sidebarBorder} ${theme.sidebarHover} shadow-sm`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg> New Conversation
            </button>
            {user && <button onClick={toggleTempChat} className={`w-full flex items-center justify-between rounded-xl p-3.5 text-sm transition border ${isTempChat ? `${accent.glow} ${accent.text} border-current` : `${theme.sidebarHover} border-transparent ${theme.textSecondary}`}`}>Incognito Mode <div className={`w-9 h-5 rounded-full p-0.5 transition ${isTempChat ? accent.bg : 'bg-gray-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${isTempChat ? 'translate-x-4' : 'translate-x-0'}`} /></div></button>}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 custom-scrollbar">
            {user ? chatHistory.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
              <div key={chat.id} onClick={() => loadChat(chat.id)} className={`p-3 rounded-xl cursor-pointer text-sm transition flex items-center gap-3 ${activeChatId === chat.id ? theme.activeHistory : `${theme.sidebarHover} ${theme.textSecondary}`}`}>
                <span className="truncate flex-1">{chat.title}</span>
                {activeChatId === chat.id && <button onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>}
              </div>
            )) : <div className="text-center opacity-30 mt-10 text-xs">History disabled</div>}
          </div>

          <div className={`p-4 border-t ${theme.sidebarBorder}`}>
            {!user ? <button onClick={() => setShowAuthModal(true)} className={`w-full ${isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white'} font-extrabold py-3.5 rounded-xl text-sm`}>Sign In / Sign Up</button> : 
              <button onClick={() => setShowProfileSettings(!showProfileSettings)} className="w-full flex items-center gap-4 p-2.5 rounded-2xl hover:bg-white/5 transition">
                <div className={`w-10 h-10 rounded-full ${accent.bg} text-white flex items-center justify-center font-extrabold text-sm`}>{user.email.charAt(0).toUpperCase()}</div>
                <div className="flex-1 text-left truncate text-sm font-bold">{user.email}</div>
              </button>}
          </div>
        </div>

        {/* --- 💬 MAIN CHAT AREA --- */}
        <div className="flex-1 h-full relative z-10 min-w-0 flex flex-col">
          <header className={`h-16 border-b ${theme.sidebarBorder} flex items-center justify-between px-6 md:px-8 ${theme.headerBg} backdrop-blur-xl z-30`}>
            <div className="flex items-center gap-4">
              {/* Hamburger for mobile */}
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition border border-white/5"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>
              <span className={`text-sm font-extrabold tracking-widest uppercase truncate ${theme.textPrimary}`}>CA Real Estate ADVISOR</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${accent.bg} animate-pulse shadow-glow`}></span>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-40">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex gap-3 md:gap-5 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${msg.role === 'ai' ? `${accent.bg} text-white` : 'bg-neutral-800'}`}>{msg.role === 'ai' ? 'AI' : (user ? user.email.charAt(0).toUpperCase() : 'U')}</div>
                  <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-6 rounded-3xl text-[14px] md:text-[15.5px] border ${msg.role === 'user' ? theme.chatBoxBgUser : `${theme.chatBoxBgAI} bg-white/5 backdrop-blur-2xl shadow-lg`}`}>
                      {msg.text === '_thinking_' ? <div className="flex gap-2 h-6 animate-pulse"><div className="w-2 h-2 bg-current rounded-full animate-bounce" /><div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75" /></div> : <ReactMarkdown>{msg.text}</ReactMarkdown>}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] font-black tracking-widest text-blue-500 animate-pulse px-4 uppercase">Analyzing...</div>}
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 w-full px-4 md:px-6 pt-12 pb-6 bg-gradient-to-t ${theme.inputAreaGradient} z-20`}>
            <div className="max-w-4xl mx-auto relative group">
              <div className={`${theme.inputWrapperBg} backdrop-blur-3xl rounded-3xl border ${theme.inputBorder} p-2 flex items-end shadow-2xl`}>
                <textarea ref={textareaRef} rows="1" className={`flex-1 bg-transparent ${theme.textPrimary} p-3 md:p-4 outline-none resize-none max-h-48 text-[14px] md:text-[15px] custom-scrollbar`} placeholder="Ask anything about California Real Estate..." value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'; }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-3 md:p-4 rounded-2xl mb-1 mr-1 transition-all ${input.trim() && !isTyping ? `${accent.bg} text-white shadow-lg` : `bg-transparent ${theme.textSecondary} cursor-not-allowed`}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
           <div className={`w-full max-w-md my-auto ${isDarkMode ? 'bg-[#111111]/95' : 'bg-white/95'} p-8 rounded-[2rem] border ${theme.sidebarBorder} shadow-2xl relative animate-slide-up`}>
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 opacity-50"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
              <h2 className="text-2xl font-black mb-6 text-center">{authMode.toUpperCase()}</h2>
              <form onSubmit={handleAuth} className="space-y-4">
                  <input type="email" required placeholder="Email" className={`w-full ${theme.inputWrapperBg} border ${theme.sidebarBorder} rounded-xl p-4 outline-none`} value={email} onChange={(e) => setEmail(e.target.value)} />
                  {authMode !== 'otp' && <input type={showPassword ? "text" : "password"} required placeholder="Password" className={`w-full ${theme.inputWrapperBg} border ${theme.sidebarBorder} rounded-xl p-4 outline-none`} value={password} onChange={(e) => setPassword(e.target.value)} />}
                  {authMode === 'otp' && <input type="text" required placeholder="OTP" className={`w-full ${theme.inputWrapperBg} border ${theme.sidebarBorder} rounded-xl p-4 text-center tracking-widest`} value={otp} onChange={e => setOtp(e.target.value)} />}
                  {authError && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg">{authError}</p>}
                  <button type="submit" disabled={authLoading} className={`w-full ${accent.bg} text-white font-extrabold py-4 rounded-xl shadow-xl transition`}>{authLoading ? '...' : 'PROCEED'}</button>
              </form>
           </div>
         </div>
      )}
    </>
  );
}