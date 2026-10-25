import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { askAIAgentDetailed, getRangeIdByName, type SemanticProduct, type ChatMessage } from '../../../services/aiService';
import { useAuth } from '../../../contexts/AuthContext';
import allProductsData from '../../../data/productEmbeddings.json';

const allCatalogueItems: SemanticProduct[] = ((allProductsData as any)?.items || []) as SemanticProduct[];

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

  /**
   * Navigates directly to the product or box card on the website
   * and highlights it with an animated glow.
   */
  const navigateToProduct = (productId: string, rangeId?: string, isBox?: boolean) => {
    // If user is currently on another subpage, navigate to homepage
    const currentHash = window.location.hash || '';
    if (currentHash && currentHash !== '#/' && !currentHash.startsWith('#/?')) {
      window.location.hash = '#/';
    }

    // Dispatch event so LandingPage can activate range and scroll
    window.dispatchEvent(new CustomEvent('a2zee-navigate-product', {
      detail: { productId, rangeId, isBox }
    }));

    // If card exists in the DOM right now, scroll and pulse highlight
    setTimeout(() => {
      const targetId = isBox ? `box-card-${productId}` : `product-card-${productId}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-emerald-500', 'scale-[1.03]', 'shadow-2xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-emerald-500', 'scale-[1.03]', 'shadow-2xl');
        }, 3000);
      } else {
        const section = isBox ? document.getElementById('boxes') : document.getElementById('catalogue');
        section?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  /**
   * Helper to find which catalogue product matches a line of text.
   */
  const findProductInLine = (line: string): SemanticProduct | undefined => {
    const lineLower = line.toLowerCase();
    return allCatalogueItems.find(p => lineLower.includes(p.name.toLowerCase()));
  };

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

      const { text, recommendedProducts } = await askAIAgentDetailed(query, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text,
        recommendedProducts,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI chat error:", err);
      const fallbackProducts = allCatalogueItems.filter(p => p.id === 'mc-01' || p.id === 'mc-08');
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: "I recommend our delicious **Green Gram** (₹50) and **Sunflower Microgreens** (₹150)! Both are packed with energy, protein, and vitamins.",
        recommendedProducts: fallbackProducts,
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

  // Format basic bold, bullet lists, and inject action button near product details
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-emerald-950">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Detect if this line describes a specific product
      const matchedProduct = findProductInLine(line);
      const isBulletOrHeading = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim());

      return (
        <div key={idx} className="leading-relaxed my-0.5 flex flex-wrap items-center gap-1.5">
          <span>{formattedParts}</span>
          {matchedProduct && isBulletOrHeading && (
            <button
              type="button"
              onClick={() => navigateToProduct(
                matchedProduct.id, 
                getRangeIdByName(matchedProduct.range), 
                matchedProduct.type === 'curated_box' || matchedProduct.id.startsWith('box-')
              )}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
              title={`View ${matchedProduct.name} on catalogue card`}
            >
              <span>View Card</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`fixed ${user ? 'bottom-20 md:bottom-6' : 'bottom-6'} right-4 md:right-6 z-50 flex flex-col items-end`}>
      {/* Chat Window */}
      {isOpen && (
        <div
          id="ai-chat-window"
          className="w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
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
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 transition-colors cursor-pointer"
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
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-[13.5px] ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Dedicated Product Recommendation Cards with Direct Navigation Button */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-100 flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Recommended Product Cards:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {msg.recommendedProducts.map((p) => {
                          const isBox = p.type === 'curated_box' || p.id.startsWith('box-');
                          const rangeId = getRangeIdByName(p.range);
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 p-2 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 rounded-xl transition-all shadow-2xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={p.image || '/greengram.png'}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-lg object-cover bg-white border border-emerald-200 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/greengram.png';
                                  }}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-[11px] font-semibold text-emerald-700">
                                    {p.priceText}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => navigateToProduct(p.id, rangeId, isBox)}
                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-transform active:scale-95"
                              >
                                <span>Go to Card</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sugg, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sugg)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full transition-colors font-medium border border-emerald-200/60 cursor-pointer"
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
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all shadow-sm cursor-pointer"
                title="Send Message"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">
              Powered by A2ZEE Intelligent Health & Recommendation AI
            </p>
          </div>
        </div>
      )}

      {/* Floating Mascot Button */}
      <button
        id="ai-assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-700 via-green-600 to-emerald-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/80 cursor-pointer"
        aria-label="Toggle AI Advisor"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping pointer-events-none group-hover:hidden"></div>

        <img
          src="/ai_mascot.png"
          alt="Zee AI Assistant"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover p-0.5 bg-white shadow-xs"
        />

        {/* Status Bubble */}
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
        </span>

        {/* Hover Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-3 hidden sm:flex items-center px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span>Ask Zee AI • Smart Recommendations</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900/90"></div>
          </div>
        )}
      </button>
    </div>
  );
}
