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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `* { margin:0; padding:0; box-sizing:border-box; } html,body,#root{width:100vw; height:100vh; overflow:hidden; position:fixed; top:0; left:0; background-color:#0a0a0a;} .custom-scrollbar::-webkit-scrollbar{width:5px;} .custom-scrollbar::-webkit-scrollbar-thumb{background:#888; border-radius:10px;}`}} />
      <div className="absolute inset-0 flex overflow-hidden text-white font-sans bg-[#0a0a0a]">
        <div className="w-[280px] sm:w-[320px] h-full flex-shrink-0 bg-[#111]/90 backdrop-blur-3xl flex flex-col border-r border-white/10 z-20">
          <div className="p-5 space-y-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="w-10 h-10 rounded-lg object-cover shadow-lg border border-white/10" />
              <h1 className="text-lg font-black tracking-tighter">CA ADVISOR <span className="text-[9px] px-1.5 py-0.5 rounded text-white bg-blue-500">V3.0</span></h1>
            </div>
            <button onClick={() => {setMessages([defaultWelcomeMessage]); setActiveChatId(null);}} className="w-full p-3 rounded-xl border border-white/10 hover:bg-white/5 transition font-bold text-sm">+ New Conversation</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
            {chatHistory.map(chat => (
              <div key={chat.id} onClick={() => {setMessages(chat.msgs); setActiveChatId(chat.id);}} className={`p-3 rounded-xl cursor-pointer text-sm truncate ${activeChatId === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>{chat.title}</div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
             {!user ? <button onClick={()=>setShowAuthModal(true)} className="w-full bg-blue-600 p-3 rounded-xl font-bold text-sm shadow-lg">Sign In / Sign Up</button> : <p className="text-[10px] opacity-40 truncate">{user.email}</p>}
          </div>
        </div>
        <div className="flex-1 h-full relative z-10 min-w-0">
          <header className="absolute top-0 left-0 w-full h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-xl z-30">
            <span className="text-xs font-black tracking-widest uppercase opacity-70">CA Real Estate Advisor</span>
          </header>
          <div ref={chatContainerRef} className="absolute top-16 bottom-0 left-0 w-full overflow-y-auto custom-scrollbar z-10 pb-[120px] p-6">
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${msg.role==='ai'? 'bg-blue-500' : 'bg-neutral-600'}`}>{msg.role==='ai'?'AI':'U'}</div>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] ${msg.role==='user'?'bg-[#222] border border-white/5':'border border-white/5 bg-white/5'}`}><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] italic opacity-50 animate-pulse">Advisor is thinking...</div>}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20">
            <div className="max-w-3xl mx-auto flex items-end gap-2 bg-[#1c1c1c] p-2 rounded-2xl border border-white/10 shadow-2xl shadow-blue-500/5">
              <textarea ref={textareaRef} rows="1" className="flex-1 bg-transparent p-3 outline-none resize-none max-h-32 text-sm text-white" placeholder="Ask about property documents..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleSend())} />
              <button onClick={handleSend} className="p-3 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition">Send</button>
            </div>
          </div>
        </div>
      </div>
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-[#111] p-8 rounded-3xl border border-white/10 w-full max-w-sm animate-slide-up">
                <h2 className="text-xl font-bold mb-6 text-center text-white">{authMode.toUpperCase()}</h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input type="email" placeholder="Email" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition" value={email} onChange={e=>setEmail(e.target.value)} required />
                    {authMode !== 'otp' && <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition" value={password} onChange={e=>setPassword(e.target.value)} required />}
                    {authMode === 'otp' && <input type="text" placeholder="Enter OTP" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-center tracking-widest text-xl" value={otp} onChange={e=>setOtp(e.target.value)} required />}
                    {authError && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg">{authError}</p>}
                    <button type="submit" disabled={authLoading} className="w-full p-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-600/20">{authLoading ? 'Please wait...' : (authMode === 'login' ? 'Secure Login' : authMode === 'signup' ? 'Create Account' : 'Verify OTP')}</button>
                </form>
                <button onClick={()=>setAuthMode(authMode==='login'?'signup':'login')} className="w-full mt-4 text-[10px] opacity-40 hover:opacity-100 transition text-white">Switch to {authMode==='login'?'Signup':'Login'}</button>
                <button onClick={()=>setShowAuthModal(false)} className="w-full mt-2 text-[10px] opacity-40 hover:opacity-100 transition text-white">Cancel</button>
            </div>
        </div>
      )}
    </>
  );
}