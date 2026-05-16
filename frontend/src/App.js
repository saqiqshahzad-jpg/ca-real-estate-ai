import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import logoImg from './logo.png'; 

// --- 🎨 GLOBAL THEME & ACCENT CONFIG ---
const accentColors = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'bg-emerald-500/20', shadow: 'shadow-emerald-500/50' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', glow: 'bg-blue-500/20', shadow: 'shadow-blue-500/50' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'bg-rose-500/20', shadow: 'shadow-rose-500/50' },
};

const API_URL = 'https://ca-estate-api.onrender.com'; 

export default function App() {
  // --- 🧠 STATES (All used to satisfy Vercel Linter) ---
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

  // Password Checks
  const pwdReqs = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const isPasswordValid = pwdReqs.length && pwdReqs.uppercase && pwdReqs.number && pwdReqs.special;

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
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [selectedAccent, setSelectedAccent] = useState('blue');

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // --- 💾 INIT & PERSISTENCE ---
  useEffect(() => {
    const savedUser = localStorage.getItem('ca_adv_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedData = JSON.parse(localStorage.getItem('ca_adv_data')) || {};
    setChatHistory(savedData.history || []);
    if(savedData.accent) setSelectedAccent(savedData.accent);
    if(savedData.isDarkMode !== undefined) setIsDarkMode(savedData.isDarkMode);
  }, []);

  useEffect(() => {
    if (user && !isTempChat) {
      localStorage.setItem('ca_adv_data', JSON.stringify({ history: chatHistory, accent: selectedAccent, isDarkMode }));
    }
  }, [chatHistory, selectedAccent, isDarkMode, user, isTempChat]);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // --- 🔐 AUTH LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    if (authMode === 'signup' && !isPasswordValid) return setAuthError("Password requirements not met.");
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'signup' ? 'signup' : authMode === 'otp' ? 'verify-otp' : 'login';
      const body = authMode === 'otp' ? { email, otp } : { email, password };
      const res = await fetch(`${API_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        if (authMode === 'signup') { setAuthMode('otp'); setAuthSuccess('OTP Sent to your email!'); }
        else if (authMode === 'otp') { setAuthMode('login'); setAuthSuccess('Verified! You can now login.'); setOtp(''); }
        else {
            setUser({ email });
            localStorage.setItem('ca_adv_user', JSON.stringify({ email }));
            setShowAuthModal(false);
        }
      } else setAuthError(data.detail || "Error occurred");
    } catch { setAuthError("⚠️ Connection Failed. Start Backend!"); }
    setAuthLoading(false);
  };

  const logout = () => {
    setUser(null); localStorage.removeItem('ca_adv_user'); setChatHistory([]); setMessages([defaultWelcomeMessage]); setShowProfileSettings(false);
  };

  // --- 🚀 CHAT LOGIC ---
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const msg = { role: 'user', text: input, id: Date.now() };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setIsTyping(true);
    try {
      const res = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg.text, email: user ? user.email : "guest" }) });
      const data = await res.json();
      const aiMsg = { role: 'ai', text: data.response || "Error", id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMsg]);
      if (user && !isTempChat) {
        setChatHistory(prev => {
          if (!activeChatId) {
            const newId = Date.now(); setActiveChatId(newId);
            return [{ id: newId, title: msg.text.slice(0, 25) + '...', msgs: [...messages, msg, aiMsg] }, ...prev];
          }
          return prev.map(c => c.id === activeChatId ? { ...c, msgs: [...c.msgs, msg, aiMsg] } : c);
        });
      }
    } catch { setMessages(prev => [...prev, { role: 'ai', text: "⚠️ Server Down!", id: Date.now() + 1 }]); }
    setIsTyping(false);
  };

  const theme = {
    bg: isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f0f2f5]',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    sidebar: isDarkMode ? 'bg-[#111111]/90' : 'bg-white/95',
    input: isDarkMode ? 'bg-[#1c1c1c]/90 text-white border-white/10' : 'bg-white text-black border-slate-300 shadow-md',
    bubbleUser: isDarkMode ? 'bg-[#2a2a2a] text-white border-white/5' : 'bg-slate-200 text-slate-900 border-slate-300 shadow-sm',
    bubbleAI: isDarkMode ? 'bg-transparent text-gray-200 border-white/5' : 'bg-transparent text-slate-800 border-slate-200'
  };

  const accent = accentColors[selectedAccent];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; } 
        html,body,#root{width:100vw; height:100vh; overflow:hidden; position:fixed; top:0; left:0; background-color:${isDarkMode?'#0a0a0a':'#f0f2f5'};}
        .custom-scrollbar::-webkit-scrollbar{width:5px;} .custom-scrollbar::-webkit-scrollbar-thumb{background:#444;border-radius:10px;}
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade { animation: fadeIn 0.3s ease-out; }
      `}} />
      
      <div className={`absolute inset-0 flex overflow-hidden ${theme.text} font-sans`}>
        {/* Blurs */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDarkMode?'bg-blue-900/10':'bg-blue-300/20'} rounded-full blur-[140px] pointer-events-none z-0`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isDarkMode?'bg-purple-900/10':'bg-purple-300/20'} rounded-full blur-[160px] pointer-events-none z-0`}></div>

        {/* Sidebar */}
        <div className={`w-[280px] sm:w-[320px] h-full flex-shrink-0 flex flex-col border-r border-white/10 ${theme.sidebar} backdrop-blur-3xl z-20`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-2xl border border-white/10" />
              <h1 className="text-sm font-black tracking-widest italic">CA ADVISOR <span className={`text-[9px] px-1.5 py-0.5 rounded ${accent.bg} text-white`}>V3.0</span></h1>
            </div>
            <button onClick={() => {setMessages([defaultWelcomeMessage]); setActiveChatId(null); setIsTempChat(false);}} className={`w-full p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition font-bold text-xs tracking-widest`}>+ NEW CHAT</button>
            
            {user && (
              <button onClick={() => { if(!isTempChat) setShowTempDisclaimer(true); else setIsTempChat(false); }} className={`w-full p-4 rounded-2xl border transition-all text-[10px] font-bold flex items-center justify-between ${isTempChat ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-gray-500'}`}>
                INCOGNITO MODE {isTempChat ? 'ON' : 'OFF'}
                <div className={`w-8 h-4 rounded-full p-0.5 ${isTempChat ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                   <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isTempChat ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-1">
             {user && (
               <>
                <input type="text" placeholder="Search history..." className="w-full mb-4 p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] outline-none" onChange={(e) => setSearchQuery(e.target.value)} />
                {chatHistory.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                  <div key={c.id} onClick={() => {setMessages(c.msgs); setActiveChatId(c.id);}} className={`p-3 rounded-xl cursor-pointer text-xs transition truncate ${activeChatId === c.id ? 'bg-white/10' : 'hover:bg-white/5 opacity-50'}`}>{c.title}</div>
                ))}
               </>
             )}
          </div>

          <div className="p-4 border-t border-white/5">
             {!user ? (
               <button onClick={() => {setAuthMode('login'); setShowAuthModal(true);}} className="w-full bg-blue-600 p-4 rounded-2xl font-black text-xs tracking-widest">LOGIN / SIGNUP</button>
             ) : (
               <button onClick={() => setShowProfileSettings(!showProfileSettings)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition relative">
                  <div className={`w-8 h-8 rounded-lg ${accent.bg} flex items-center justify-center font-bold text-xs`}>{user.email[0].toUpperCase()}</div>
                  <div className="flex-1 text-left truncate text-[10px] font-bold opacity-60">{user.email}</div>
                  {showProfileSettings && (
                    <div className="absolute bottom-14 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl animate-fade z-50">
                       <div className="flex justify-between mb-4 items-center">
                          <span className="text-[9px] font-bold opacity-50">THEME</span>
                          <button onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }} className="text-[9px] bg-white/5 p-1.5 rounded">{isDarkMode ? '🌙 DARK' : '☀️ LIGHT'}</button>
                       </div>
                       <div className="flex gap-2 mb-4">
                          {Object.keys(accentColors).map(k => <div key={k} onClick={(e) => { e.stopPropagation(); setSelectedAccent(k); }} className={`w-5 h-5 rounded-full cursor-pointer ${accentColors[k].bg} ${selectedAccent===k?'border-2 border-white':''}`}></div>)}
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); logout(); }} className="w-full p-2 bg-red-600/20 text-red-500 rounded-lg text-[9px] font-bold">LOGOUT</button>
                    </div>
                  )}
               </button>
             )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 h-full flex flex-col relative min-w-0">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-transparent backdrop-blur-md z-10">
            <span className="text-[10px] font-black tracking-[4px] opacity-40">CA REAL ESTATE ADVISOR</span>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-40">
            <div className="max-w-3xl mx-auto w-full">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-5 mb-8 animate-fade ${m.role === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shadow-xl flex-shrink-0 ${m.role === 'ai' ? `${accent.bg} text-white` : 'bg-neutral-700'}`}>{m.role === 'ai' ? 'AI' : 'U'}</div>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-[15px] leading-relaxed shadow-lg border ${m.role === 'user' ? theme.bubbleUser : theme.bubbleAI}`}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] italic opacity-30 animate-pulse">Thinking...</div>}
            </div>
          </div>

          {/* Input */}
          <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20">
            <div className="max-w-3xl mx-auto flex items-end gap-3 p-3 rounded-[2rem] border border-white/10 bg-[#1c1c1c]/80 backdrop-blur-3xl shadow-2xl">
              <textarea ref={textareaRef} rows="1" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Ask about property documents..." className="flex-1 bg-transparent p-4 outline-none resize-none max-h-32 text-sm text-white" />
              <button onClick={handleSend} className={`p-4 rounded-2xl ${accent.bg} text-white shadow-xl hover:scale-105 transition active:scale-95`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111] p-10 rounded-[2.5rem] w-full max-w-sm border border-white/10 shadow-2xl relative animate-fade">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 opacity-30">X</button>
            <h2 className="text-2xl font-black mb-8 text-center tracking-tighter">{authMode.toUpperCase()}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
              {authMode !== 'otp' && (
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 opacity-30 text-[10px]">{showPassword ? 'HIDE' : 'SHOW'}</button>
                </div>
              )}
              {authMode === 'signup' && (
                  <div className="text-[10px] p-3 bg-white/5 rounded-xl space-y-1 opacity-60">
                      <p>{pwdReqs.length ? '✅' : '⚪'} 8+ Characters</p>
                      <p>{pwdReqs.uppercase ? '✅' : '⚪'} Uppercase</p>
                      <p>{pwdReqs.number ? '✅' : '⚪'} Number</p>
                  </div>
              )}
              {authMode === 'otp' && <input type="text" placeholder="6-digit OTP" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-center tracking-widest text-xl" value={otp} onChange={e => setOtp(e.target.value)} required />}
              {authError && <p className="text-red-500 text-[10px] text-center font-bold">{authError}</p>}
              {authSuccess && <p className="text-emerald-500 text-[10px] text-center font-bold">{authSuccess}</p>}
              <button type="submit" disabled={authLoading} className={`w-full p-4 rounded-2xl ${accent.bg} text-white font-black text-xs tracking-widest shadow-xl`}>{authLoading ? '...' : 'CONTINUE'}</button>
            </form>
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); setAuthSuccess(''); }} className="w-full mt-6 text-[9px] font-black opacity-30 tracking-[2px]">SWITCH TO {authMode === 'login' ? 'SIGNUP' : 'LOGIN'}</button>
          </div>
        </div>
      )}

      {/* Incognito Disclaimer */}
      {showTempDisclaimer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-indigo-950/20 p-10 rounded-[3rem] border border-indigo-500/30 max-w-sm text-center shadow-2xl animate-fade">
              <h2 className="text-2xl font-black text-white mb-4 tracking-tighter">INCOGNITO MODE</h2>
              <p className="text-xs text-indigo-200 mb-8 leading-relaxed">Your chats will NOT be saved. Everything disappears when you refresh or logout.</p>
              <button onClick={() => { setShowTempDisclaimer(false); setIsTempChat(true); setMessages([defaultWelcomeMessage]); }} className="w-full p-4 bg-white text-black rounded-2xl font-black text-xs tracking-widest">UNDERSTOOD</button>
           </div>
        </div>
      )}
    </>
  );
}