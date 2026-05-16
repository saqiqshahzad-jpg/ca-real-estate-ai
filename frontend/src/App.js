/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import logoImg from './logo.png'; 

// --- 🎨 THEME CONFIG ---
const accentColors = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'bg-emerald-500/20' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', glow: 'bg-blue-500/20' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'bg-rose-500/20' },
};

const API_URL = 'https://ca-estate-api.onrender.com'; 

export default function App() {
  // --- 🧠 AUTH STATES ---
  const [user, setUser] = useState(null); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login, signup, otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // 📱 MOBILE & UI STATES
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [selectedAccent, setSelectedAccent] = useState('blue');

  // --- 🧠 CHAT STATES ---
  const defaultWelcomeMessage = { role: 'ai', text: "Hello Alaaudin! I'm your CA Real Estate Advisor. How can I help you today?", id: 1 };
  const [messages, setMessages] = useState([defaultWelcomeMessage]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [activeChatId, setActiveChatId] = useState(null);
  const [isTempChat, setIsTempChat] = useState(false);
  const [showTempDisclaimer, setShowTempDisclaimer] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Password Validation
  const pwdReqs = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const isPasswordValid = pwdReqs.length && pwdReqs.uppercase && pwdReqs.number && pwdReqs.special;

  // --- 💾 INITIALIZATION ---
  useEffect(() => {
    const savedUser = localStorage.getItem('ca_advisor_session_v3');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedData = JSON.parse(localStorage.getItem('ca_advisor_data_v3')) || {};
    setChatHistory(savedData.history || []);
    if(savedData.accent) setSelectedAccent(savedData.accent);
  }, []);

  useEffect(() => {
    if (user && !isTempChat) {
      localStorage.setItem('ca_advisor_data_v3', JSON.stringify({
        history: chatHistory, accent: selectedAccent
      }));
    }
  }, [chatHistory, selectedAccent, user, isTempChat]);

  // --- 🚀 SCROLL LOGIC ---
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };
  useEffect(() => { const t = setTimeout(scrollToBottom, 100); return () => clearTimeout(t); }, [messages, isTyping]);

  // --- 🔐 AUTH LOGIC (FIXED) ---
  const handleAuth = async (e) => {
    if(e) e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    
    if (authMode === 'signup' && !isPasswordValid) {
        setAuthError("Please meet all password requirements.");
        return;
    }

    setAuthLoading(true);
    try {
      const endpoint = authMode === 'signup' ? 'signup' : (authMode === 'otp' ? 'verify-otp' : 'login');
      const payload = authMode === 'otp' ? { email, otp } : { email, password };

      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        if (authMode === 'signup') {
          setAuthMode('otp');
          setAuthSuccess('✅ OTP sent to your email!');
        } else if (authMode === 'otp') {
          setAuthMode('login');
          setAuthSuccess('✅ Verified! Please login now.');
          setOtp(''); setPassword('');
        } else {
          // LOGIN SUCCESS
          const userData = { email };
          setUser(userData);
          localStorage.setItem('ca_advisor_session_v3', JSON.stringify(userData));
          setShowAuthModal(false);
          setMessages([{ role: 'ai', text: `Welcome back, ${email.split('@')[0]}! How can I help you?`, id: Date.now() }]);
        }
      } else {
        setAuthError(data.detail || "Authentication failed. Try again.");
      }
    } catch (err) {
      setAuthError("⚠️ Connection Error. Ensure Backend is online.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
      setUser(null); localStorage.removeItem('ca_advisor_session_v3');
      setChatHistory([]); setMessages([defaultWelcomeMessage]);
      setShowProfileSettings(false);
  };

  // --- 💬 CHAT LOGIC ---
  const startNewChat = () => {
    setMessages([defaultWelcomeMessage]);
    setActiveChatId(null); setIsSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userInput = input;
    const userMsg = { role: 'user', text: userInput, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setIsTyping(true);
    if(window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      setMessages(prev => [...prev, { role: 'ai', text: '_thinking_', id: Date.now() + 1 }]);
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, email: user ? user.email : "guest" }),
      });
      const data = await res.json();
      const aiMsg = { role: 'ai', text: data.response || "No response.", id: Date.now() + 2 };
      setMessages(prev => prev.filter(m => m.text !== '_thinking_').concat(aiMsg));

      if (user && !isTempChat) {
        setChatHistory(prev => {
          if (!activeChatId) {
            const newId = Date.now() + 3; setActiveChatId(newId);
            return [{ id: newId, title: userInput.substring(0, 25) + '...', msgs: [...messages, userMsg, aiMsg] }, ...prev];
          }
          return prev.map(c => c.id === activeChatId ? { ...c, msgs: [...c.msgs, userMsg, aiMsg] } : c);
        });
      }
    } catch {
      setMessages(prev => prev.filter(m => m.text !== '_thinking_').concat({ role: 'ai', text: "⚠️ Server busy. Please try again.", id: Date.now() }));
    } finally { setIsTyping(false); }
  };

  const accent = accentColors[selectedAccent];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100vw; height: 100dvh; overflow: hidden; background-color: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />

      <div className="fixed inset-0 flex overflow-hidden text-white font-sans bg-[#0a0a0a]">
        
        {/* Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        {/* 📱 Mobile Overlay */}
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />}

        {/* --- 💎 SIDEBAR --- */}
        <div className={`fixed md:relative w-[280px] sm:w-[320px] h-full flex-shrink-0 flex flex-col border-r border-white/5 bg-[#111]/90 backdrop-blur-3xl z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-2xl" />
                <h1 className="text-sm font-black tracking-widest italic">CA ADVISOR <span className={`text-[9px] px-1.5 py-0.5 rounded ${accent.bg}`}>V3.0</span></h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden opacity-50"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <button onClick={startNewChat} className="w-full p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition font-bold text-xs tracking-widest">+ NEW SESSION</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-1">
            {user ? chatHistory.map(chat => (
              <div key={chat.id} onClick={() => { setMessages(chat.msgs); setActiveChatId(chat.id); setIsSidebarOpen(false); }} className={`p-3 rounded-xl cursor-pointer text-xs transition truncate ${activeChatId === chat.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 opacity-50'}`}>{chat.title}</div>
            )) : <div className="text-center opacity-20 mt-10 text-[10px] font-bold tracking-widest uppercase">History Locked</div>}
          </div>

          <div className="p-4 border-t border-white/5">
             {!user ? <button onClick={() => {setAuthMode('login'); setShowAuthModal(true);}} className="w-full bg-blue-600 p-4 rounded-2xl font-black text-xs tracking-widest shadow-lg">LOGIN / SIGNUP</button> : 
               <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl">
                  <div className={`w-8 h-8 rounded-lg ${accent.bg} flex items-center justify-center font-bold text-xs`}>{user.email[0].toUpperCase()}</div>
                  <div className="flex-1 text-[10px] font-bold opacity-40 truncate">{user.email}</div>
                  <button onClick={logout} className="opacity-40 hover:opacity-100"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></button>
               </div>}
          </div>
        </div>

        {/* --- 💬 MAIN AREA --- */}
        <div className="flex-1 flex flex-col h-full relative z-10 min-w-0 overflow-hidden">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-black/20 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/5 border border-white/5"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>
              <span className="text-[10px] font-black tracking-[4px] opacity-40 uppercase truncate">CA Real Estate Advisor</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${accent.bg} animate-pulse shadow-glow`}></div>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 space-y-8">
            <div className="max-w-3xl mx-auto w-full pb-32">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-4 md:gap-6 mb-8 animate-up ${m.role === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-2xl flex-shrink-0 ${m.role==='ai'? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-neutral-800'}`}>{m.role==='ai'?'AI':'U'}</div>
                  <div className={`max-w-[85%] p-5 md:p-6 rounded-3xl text-[15px] leading-relaxed shadow-xl border ${m.role==='user'?'bg-[#1a1a1a] border-white/10 rounded-tr-none':'bg-[#111]/50 backdrop-blur-xl border-white/5 rounded-tl-none text-gray-200'}`}>
                    {m.text === '_thinking_' ? <div className="flex gap-2 animate-pulse"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><div className="w-2 h-2 bg-blue-500 rounded-full delay-75"></div></div> : <ReactMarkdown>{m.text}</ReactMarkdown>}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[9px] font-bold tracking-[3px] text-blue-500 animate-pulse uppercase">Analyzing Documents...</div>}
            </div>
          </div>

          {/* INPUT BAR */}
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent flex-shrink-0">
            <div className="max-w-3xl mx-auto flex items-end gap-3 bg-[#161616]/80 backdrop-blur-3xl p-2 md:p-3 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl">
              <textarea ref={textareaRef} rows="1" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleSend())} placeholder="Ask about property..." className="flex-1 bg-transparent p-3 md:p-4 outline-none resize-none max-h-32 text-sm text-white placeholder:text-gray-600" />
              <button onClick={handleSend} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${accent.bg} text-white shadow-2xl hover:scale-105 transition-all active:scale-95`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      {/* --- 🔐 AUTH MODAL --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm shadow-2xl relative animate-up">
                <div className={`absolute top-0 left-0 w-full h-1 ${accent.bg}`}></div>
                <h2 className="text-xl font-black mb-8 text-center tracking-tighter uppercase">{authMode}</h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all text-sm" value={email} onChange={e=>setEmail(e.target.value)} required />
                    {authMode !== 'otp' && (
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all text-sm" value={password} onChange={e=>setPassword(e.target.value)} required />
                        <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-4 opacity-30 text-[10px] font-bold">SHOW</button>
                      </div>
                    )}
                    {authMode === 'otp' && <input type="text" placeholder="6-Digit OTP" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-center tracking-[10px] text-xl font-bold" value={otp} onChange={e=>setOtp(e.target.value)} required />}
                    
                    {authError && <p className="text-red-500 text-[10px] text-center font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20 uppercase">{authError}</p>}
                    {authSuccess && <p className="text-emerald-500 text-[10px] text-center font-bold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 uppercase">{authSuccess}</p>}
                    
                    <button type="submit" disabled={authLoading} className={`w-full p-5 rounded-2xl ${accent.bg} text-white font-black text-xs tracking-widest hover:opacity-80 transition-all active:scale-95 shadow-xl`}>{authLoading ? 'WAITING...' : 'PROCEED'}</button>
                </form>
                <div className="flex flex-col gap-2 mt-6">
                    <button onClick={()=>{setAuthMode(authMode==='login'?'signup':'login'); setAuthError(''); setAuthSuccess('');}} className="text-[9px] font-bold text-gray-500 hover:text-white transition uppercase tracking-widest">{authMode==='login'?'Create New Account':'Back to Login'}</button>
                    <button onClick={()=>setShowAuthModal(false)} className="text-[9px] font-bold text-red-900 hover:text-red-500 transition uppercase tracking-widest">Cancel</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}