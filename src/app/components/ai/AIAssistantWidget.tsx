import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, RefreshCw, ChevronDown } from 'lucide-react';
import { askAIAgent, ChatMessage } from '../../../services/aiService';
import { useAuth } from '../../../contexts/AuthContext';

export function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi there! I'm **Zee**, your A2ZEE Microgreens Advisor! Looking for fresh organic microgreens, health advice, or grow kits? Ask me anything or pick a topic below!",
      timestamp: new Date(),
      suggestions: [
        '🥗 Best for fresh salads',
        '💪 High protein greens',
        '🛡️ Immunity & Detox',
        '🌱 Grow kits for home',
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const reply = await askAIAgent(query, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI chat error:", err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: "I recommend our delicious **Green Gram** (₹50) and **Sunflower Microgreens** (₹150)! Both are packed with energy, protein, and vitamins.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Format basic bold and bullet lists in AI replies
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-emerald-950">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={idx} className="block leading-relaxed">
          {formattedParts}
        </span>
      );
    });
  };

  return (
    <div className={`fixed ${user ? 'bottom-20 md:bottom-6' : 'bottom-6'} right-4 md:right-6 z-50 flex flex-col items-end`}>
      {/* Chat Window */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className="w-[92vw] sm:w-[380px] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-800 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/ai_mascot.png"
                  alt="Zee AI Advisor"
                  className="w-10 h-10 rounded-full border-2 border-white/70 shadow-sm object-cover bg-white"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base tracking-tight">Zee</h3>
                  <span className="bg-white/20 text-emerald-50 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300" /> AI
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-light">A2ZEE Microgreens Advisor</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="ai-chat-close"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 transition-colors"
                title="Minimize chat"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            id="ai-chat-messages"
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAF8] text-sm"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <img
                    src="/ai_mascot.png"
                    alt="Zee"
                    className="w-7 h-7 rounded-full border border-emerald-200 object-cover mt-1 shrink-0 bg-white"
                  />
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 shadow-sm text-[13.5px] ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sugg, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sugg)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full transition-colors font-medium border border-emerald-200/60"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 ${
                      msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <img
                  src="/ai_mascot.png"
                  alt="Zee"
                  className="w-7 h-7 rounded-full border border-emerald-200 object-cover shrink-0 bg-white"
                />
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-1.5 border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-inner">
              <input
                ref={inputRef}
                id="ai-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about microgreens, recipes, kits..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-1"
                disabled={isLoading}
              />
              <button
                id="ai-chat-send"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className={`p-2 rounded-xl transition-all ${
                  inputText.trim() && !isLoading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-1.5">
              Powered by A2ZEE Intelligent Health & Recommendation AI
            </p>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        id="ai-assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white p-2 md:pl-2 md:pr-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/80"
        title="Chat with Zee - A2ZEE AI Advisor"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <img
            src="/ai_mascot.png"
            alt="A2ZEE AI Mascot"
            className="w-12 h-12 md:w-11 md:h-11 rounded-full object-cover border-2 border-white bg-white shadow-md group-hover:rotate-6 transition-transform"
          />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-white"></span>
          </span>
        </div>

        <div className="hidden md:flex flex-col text-left">
          <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-300" /> AI Advisor
          </span>
          <span className="text-sm font-bold text-white tracking-tight leading-tight">
            Ask Zee
          </span>
        </div>
      </button>
    </div>
  );
}
