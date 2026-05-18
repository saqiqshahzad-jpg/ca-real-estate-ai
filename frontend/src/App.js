/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, Cpu, Zap, Mail, ArrowRight, Code, CheckCircle, MessageSquare, ExternalLink, Lock, Eye, EyeOff, ShieldCheck, LogOut, Moon, Sun, Trash2, Plus, Search, Menu, X } from 'lucide-react';
import logoImg from './logo.png'; 

// 🛑 UMAR BHAI FIX: API URL Live wala
const API_URL = 'https://ca-estate-api.onrender.com'; 

// --- 🎨 GLOBAL THEME & ACCENT CONFIG ---
const accentColors = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]' },
};

export default function App() {
  // --- 🖱️ CUSTOM CURSOR LOGIC ---
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  // --- 🧠 STATES ---
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 
  const [selectedAccent, setSelectedAccent] = useState('emerald');
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hello! I'm CA Real Estate ADVISOR. How can I help you today?", id: 1 }]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [activeChatId, setActiveChatId] = useState(null);
  const [isTempChat, setIsTempChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const accent = accentColors[selectedAccent];

  // --- 💾 INIT & PERSISTENCE ---
  useEffect(() => {
    const savedUser = localStorage.getItem('al_elite_user_final3');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedData = JSON.parse(localStorage.getItem('al_pro_estate_final3')) || {};
    setChatHistory(savedData.history || []);
  }, []);

  useEffect(() => {
    if (user && !isTempChat) {
      localStorage.setItem('al_pro_estate_final3', JSON.stringify({ history: chatHistory }));
    }
  }, [chatHistory, user, isTempChat]);

  // --- 🚀 CHAT ACTIONS ---
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userInput = input;
    const userMsg = { role: 'user', text: userInput, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, email: user ? user.email : "guest" }),
      });
      const data = await res.json();
      const aiMsg = { role: 'ai', text: data.response || "System Offline.", id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMsg]);

      if (user && !isTempChat) {
        if (!activeChatId) {
          const newId = Date.now();
          setActiveChatId(newId);
          setChatHistory([{ id: newId, title: userInput.substring(0, 25) + '...', msgs: [...messages, userMsg, aiMsg] }, ...chatHistory]);
        } else {
          setChatHistory(prev => prev.map(c => c.id === activeChatId ? { ...c, msgs: [...c.msgs, userMsg, aiMsg] } : c));
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "⚠️ Connection Error.", id: Date.now() + 1 }]);
    } finally {
      setIsTyping(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('al_elite_user_final3');
    setMessages([{ role: 'ai', text: "Logged out. Session cleared.", id: Date.now() }]);
    setChatHistory([]);
  };

  return (
    <div className={`fixed inset-0 overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#050508] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 🖱️ CUSTOM CURSOR */}
      <motion.div className="hidden md:block fixed top-0 left-0 w-3 h-3 rounded-full bg-emerald-500 z-[9999] pointer-events-none" animate={{ x: mousePosition.x - 6, y: mousePosition.y - 6, scale: isHovering ? 2.5 : 1 }} transition={{ type: "tween", ease: "backOut", duration: 0.1 }} />
      <motion.div className="hidden md:block fixed top-0 left-0 w-10 h-10 border border-emerald-500/50 rounded-full z-[9998] pointer-events-none" animate={{ x: mousePosition.x - 20, y: mousePosition.y - 20, scale: isHovering ? 1.5 : 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} />

      {/* 🌌 BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* 📱 MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />}
      </AnimatePresence>

      <div className="flex h-full relative z-10">
        
        {/* 📋 SIDEBAR */}
        <aside className={`fixed md:relative w-[300px] h-full flex flex-col border-r transition-transform duration-300 z-50 ${isDarkMode ? 'bg-[#0a0a0c]/90 border-white/5' : 'bg-white border-slate-200'} backdrop-blur-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <img src={logoImg} alt="Logo" className="w-10 h-10 rounded-lg shadow-lg" />
              <h1 className="font-black text-lg tracking-tight">CA ADVISOR</h1>
            </div>

            <button onClick={() => {setMessages([{ role: 'ai', text: "New session started. How can I help?", id: Date.now() }]); setActiveChatId(null); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 p-4 rounded-xl mb-4 font-bold transition-all border ${accent.border} ${accent.text} ${accent.glow} hover:brightness-125`}>
              <Plus size={18} /> New Conversation
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">History</p>
              {chatHistory.map(chat => (
                <div key={chat.id} onClick={() => {setMessages(chat.msgs); setActiveChatId(chat.id); setIsSidebarOpen(false);}} className={`p-3 rounded-xl cursor-pointer text-sm flex items-center gap-3 transition-all ${activeChatId === chat.id ? 'bg-white/10' : 'hover:bg-white/5 opacity-60'}`}>
                  <MessageSquare size={14} /> <span className="truncate">{chat.title}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
              {user ? (
                <div className="flex items-center justify-between p-2">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${accent.bg} flex items-center justify-center font-bold`}>{user.email[0].toUpperCase()}</div>
                      <span className="text-sm font-bold truncate w-24">{user.email.split('@')[0]}</span>
                   </div>
                   <button onClick={logout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"><LogOut size={18}/></button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="w-full p-4 bg-white text-black font-black rounded-xl hover:scale-[1.02] transition">Sign In</button>
              )}
            </div>
          </div>
        </aside>

        {/* 💬 MAIN CHAT */}
        <main className="flex-1 flex flex-col h-full min-w-0">
          <header className={`h-16 flex items-center justify-between px-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-200'} backdrop-blur-md`}>
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden"><Menu /></button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${accent.bg} animate-pulse`}></div>
              <span className="text-xs font-black tracking-widest">LIVE SYSTEM v3.0</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/5 transition">{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg, i) => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${msg.role === 'ai' ? accent.bg : 'bg-white/10'}`}>
                    {msg.role === 'ai' ? 'AI' : 'U'}
                  </div>
                  <div className={`max-w-[85%] p-5 rounded-2xl leading-relaxed text-[15px] ${msg.role === 'user' ? 'bg-white/10 border border-white/10' : 'bg-[#1c1c1e]/40 backdrop-blur-xl border border-white/5 shadow-2xl'}`}>
                    <ReactMarkdown className="prose prose-invert max-w-none">{msg.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent.bg} animate-pulse`}>AI</div>
                  <div className="flex gap-1 items-center p-5"><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span></div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 md:p-10">
            <div className="max-w-3xl mx-auto relative group">
              <div className={`flex items-end gap-2 p-2 rounded-3xl border transition-all ${isDarkMode ? 'bg-[#121214]/80 border-white/10 focus-within:border-emerald-500/50' : 'bg-white border-slate-200'}`}>
                <textarea 
                  rows="1" 
                  value={input} 
                  onChange={(e) => {setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'}}
                  onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                  className="flex-1 bg-transparent p-3 outline-none resize-none max-h-48 text-[15px]" 
                  placeholder="Ask about California real estate..."
                />
                <button onClick={handleSend} className={`p-4 rounded-2xl transition-all ${input.trim() ? `${accent.bg} text-white scale-105 shadow-lg` : 'opacity-20'}`}><ArrowRight size={20}/></button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 🔐 AUTH MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 bg-[#0a0a0c]/90 backdrop-blur-3xl shadow-2xl relative`}>
              <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 opacity-40 hover:opacity-100"><X /></button>
              <h2 className="text-3xl font-black mb-2 text-center">Elite Access</h2>
              <p className="text-center opacity-50 text-sm mb-8">Sign in to save your AI automation history.</p>
              
              <div className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-emerald-500 transition-all" />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-emerald-500 transition-all" />
                <button onClick={() => {setUser({email}); setShowAuthModal(false);}} className={`w-full p-4 ${accent.bg} text-white font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all`}>Continue</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::selection { background: #10b981; color: #000; }
      `}} />
    </div>
  );
}