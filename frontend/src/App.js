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
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const defaultWelcomeMessage = { role: 'ai', text: "Hello! I'm your CA Real Estate Advisor. How can I help you today?", id: 1 };
  const [messages, setMessages] = useState([defaultWelcomeMessage]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [activeChatId, setActiveChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // UI States
  const [isDarkMode] = useState(true); 
  const [selectedAccent] = useState('blue');

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('ca_advisor_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedData = JSON.parse(localStorage.getItem('ca_advisor_data')) || {};
    setChatHistory(savedData.history || []);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ca_advisor_data', JSON.stringify({ history: chatHistory }));
    }
  }, [chatHistory, user]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'signup' ? 'signup' : authMode === 'otp' ? 'verify-otp' : 'login';
      const body = authMode === 'otp' ? { email, otp } : { email, password };
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
          if (authMode === 'signup') setAuthMode('otp');
          else if (authMode === 'otp') setAuthMode('login');
          else {
              setUser({ email });
              localStorage.setItem('ca_advisor_user', JSON.stringify({ email }));
              setShowAuthModal(false);
          }
      } else { setAuthError(data.detail || "Action failed"); }
    } catch { setAuthError("Connection Error."); }
    setAuthLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userInput = input;
    const userMsg = { role: 'user', text: userInput, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, email: user ? user.email : "guest" }),
      });
      const data = await response.json();
      const aiMsg = { role: 'ai', text: data.response || "No response.", id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMsg]);
      if (user) {
        setChatHistory(prev => {
          if (!activeChatId) {
            setActiveChatId(userMsg.id);
            return [{ id: userMsg.id, title: userInput.substring(0, 30), msgs: [...messages, userMsg, aiMsg] }, ...prev];
          }
          return prev.map(c => c.id === activeChatId ? { ...c, msgs: [...c.msgs, userMsg, aiMsg] } : c);
        });
      }
    } catch { setMessages(prev => [...prev, { role: 'ai', text: "⚠️ Server Down.", id: Date.now() }]); }
    setIsTyping(false);
  };

  const accent = accentColors[selectedAccent];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin:0; padding:0; box-sizing:border-box; } 
        html,body,#root{width:100vw; height:100vh; overflow:hidden; position:fixed; top:0; left:0; background-color:#0a0a0a;} 
        .custom-scrollbar::-webkit-scrollbar{width:5px;} 
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#333; border-radius:10px;}
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-chat { animation: fadeIn 0.4s ease-out forwards; }
      `}} />

      <div className="absolute inset-0 flex overflow-hidden text-white font-sans bg-[#0a0a0a]">
        
        {/* 🔮 GLASSMORPHISM ORBS 🔮 */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

        {/* SIDEBAR */}
        <div className="w-[280px] sm:w-[320px] h-full flex-shrink-0 bg-[#111]/80 backdrop-blur-2xl flex flex-col border-r border-white/5 z-20">
          <div className="p-6 space-y-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-2xl border border-white/10" />
              <div>
                <h1 className="text-sm font-black tracking-widest text-white leading-none">CA ADVISOR</h1>
                <span className="text-[10px] text-blue-400 font-bold tracking-tighter">PREMIUM AI V3.0</span>
              </div>
            </div>
            <button onClick={() => {setMessages([defaultWelcomeMessage]); setActiveChatId(null);}} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs tracking-wide shadow-lg">+ NEW SESSION</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
            <p className="text-[10px] font-bold text-gray-500 tracking-[3px] px-2 mb-2">HISTORY</p>
            {chatHistory.map(chat => (
              <div key={chat.id} onClick={() => {setMessages(chat.msgs); setActiveChatId(chat.id);}} className={`p-3.5 rounded-xl cursor-pointer text-xs font-medium truncate border transition-all ${activeChatId === chat.id ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'border-transparent hover:bg-white/5 text-gray-400'}`}>{chat.title}</div>
            ))}
          </div>

          <div className="p-5 border-t border-white/5 bg-black/20">
             {!user ? <button onClick={()=>setShowAuthModal(true)} className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-black text-xs tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">SIGN IN / UP</button> : <p className="text-[10px] font-bold opacity-30 truncate text-center">{user.email}</p>}
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 h-full relative z-10 min-w-0 flex flex-col">
          <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-md">
            <span className="text-[10px] font-bold tracking-[4px] text-gray-400 uppercase">California / Real Estate Advisor</span>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-emerald-500 tracking-widest">SYSTEM ONLINE</span>
            </div>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 pb-40">
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-6 animate-chat ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-2xl flex-shrink-0 ${msg.role==='ai'? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-neutral-800'}`}>{msg.role==='ai'?'AI':'U'}</div>
                  <div className={`max-w-[85%] p-6 rounded-3xl text-[15px] leading-relaxed shadow-xl ${msg.role==='user'?'bg-[#1a1a1a] border border-white/10 rounded-tr-none':'bg-[#111]/50 backdrop-blur-xl border border-white/5 rounded-tl-none text-gray-200'}`}><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] font-bold tracking-widest text-blue-500 animate-pulse">ANALYZING DOCUMENTS...</div>}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
            <div className="max-w-3xl mx-auto flex items-end gap-3 bg-[#161616]/80 backdrop-blur-3xl p-3 rounded-[2rem] border border-white/10 shadow-2xl">
              <textarea ref={textareaRef} rows="1" className="flex-1 bg-transparent p-4 outline-none resize-none max-h-32 text-sm text-white placeholder:text-gray-600" placeholder="Ask anything about the property..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleSend())} />
              <button onClick={handleSend} className={`p-4 rounded-2xl ${accent.bg} text-white shadow-2xl hover:scale-105 transition-all active:scale-95`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111] p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                <h2 className="text-2xl font-black mb-8 text-center tracking-tighter">{authMode.toUpperCase()}</h2>
                <form onSubmit={handleAuth} className="space-y-5">
                    <input type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all text-sm" value={email} onChange={e=>setEmail(e.target.value)} required />
                    {authMode !== 'otp' && <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all text-sm" value={password} onChange={e=>setPassword(e.target.value)} required />}
                    {authMode === 'otp' && <input type="text" placeholder="Verification Code" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-center tracking-[10px] text-xl font-bold" value={otp} onChange={e=>setOtp(e.target.value)} required />}
                    {authError && <p className="text-red-500 text-[10px] text-center font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20 uppercase tracking-widest">{authError}</p>}
                    <button type="submit" disabled={authLoading} className="w-full p-5 rounded-2xl bg-blue-600 text-white font-black text-xs tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20">{authLoading ? '...' : 'PROCEED'}</button>
                </form>
                <div className="flex flex-col gap-2 mt-6">
                    <button onClick={()=>setAuthMode(authMode==='login'?'signup':'login')} className="text-[10px] font-bold text-gray-500 hover:text-white transition uppercase tracking-widest">Switch to {authMode==='login'?'Signup':'Login'}</button>
                    <button onClick={()=>setShowAuthModal(false)} className="text-[10px] font-bold text-red-900 hover:text-red-500 transition uppercase tracking-widest">Cancel</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}