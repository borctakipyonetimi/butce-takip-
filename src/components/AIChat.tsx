import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Brain, Flame, Target, MessageSquareCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Debt, Income, Expense, InstallmentDebt, FinancialStats } from "../types";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

interface AIChatProps {
  debts: Debt[];
  incomes: Income[];
  expenses: Expense[];
  installmentDebts: InstallmentDebt[];
  stats: FinancialStats;
}

export const AIChat: React.FC<AIChatProps> = ({ debts, incomes, expenses, installmentDebts, stats }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Merhaba! 😊 Ben bütçe ve borç yönetim asistanınız. Borçlarınız, aylık harcamalarınız, tasarruf stratejileri (Kartopu / Avalanche yöntemi), gelir-gider optimizasyonu veya 'hangi borcu erken ödemeliyim?' gibi finansal konular için bana dilediğinizi sorabilirsiniz. Bütçe verilerinizi analiz etmek için sabırsızlanıyorum!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom scroll refs to target ONLY the scrollable chat container, preventing parent window scroll jump
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    // Only scroll if there are user messages or loading transitions, avoiding auto-scrolling the parent viewport on initial mount
    if (messages.length > 1 || loading) {
      // Small timeout guarantees layout has finished rendering new nodes
      const t = setTimeout(() => scrollToBottom("smooth"), 80);
      return () => clearTimeout(t);
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || inputValue.trim();
    if (!question) return;

    if (!textToSend) {
      setInputValue("");
    }

    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          context: {
            debts,
            incomes,
            expenses,
            installmentDebts,
            stats,
          },
          chatHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error("Yapay zeka servisi yanıt vermedi.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `⚠️ Maalesef asistanla bağlantı kurulurken bir sorun oluştu: ${err.message}. Local verileriniz güvendedir!`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (qn: string) => {
    handleSend(qn);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Dynamic Animated Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/85">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Pulsing ambient glowing background halo */}
            <motion.div
              className="absolute inset-x-[-4px] inset-y-[-4px] bg-gradient-to-tr from-indigo-500/25 to-pink-500/25 rounded-2xl blur-md"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
              }}
            />
            {/* Spinning geometric background decoration (no random Hydration bugs) */}
            <motion.div
              className="absolute inset-0 border-2 border-indigo-500/30 rounded-2xl"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            />
            <div className="relative p-3 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 rounded-2xl shadow-md text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-md sm:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
                FİNANSAL DANIŞMANLIK & AKILLI ANALİZ PORTALI
              </h2>
              {/* Pulsing state indicator badge */}
              <motion.span
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="px-2.5 py-0.5 text-[9px] font-black tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 uppercase shrink-0"
              >
                AKTİF DESTEK ⚡
              </motion.span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase mt-0.5">
              Yapay Zekâ Destekli Borç Eritme ve Bütçe Planlama Motoru
            </p>
          </div>
        </div>
      </div>

      {/* Security and Info Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl flex items-start gap-3.5 border border-indigo-100/30 dark:border-indigo-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-indigo-500/5 pointer-events-none">
          <Brain className="w-24 h-24" />
        </div>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-500 shrink-0">
          <Brain className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-100">Bütçe Verileriniz %100 Güvende</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
            Finansal kayıtlarınız sunucuya kaydedilmez. Yapay zekâmız verilerinizi anlık ve şifreli olarak analiz edip size özel kişiselleştirilmiş borç kapatma önerileri hazırlar.
          </p>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="p-1 border border-slate-200/50 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 rounded-3xl shadow-xs">
        <div
          ref={chatContainerRef}
          className="h-100 overflow-y-auto space-y-4 p-4 pr-1.5 scrollbar-thin scrollbar-thumb-slate-250 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex items-start gap-3 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Sender Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden transition-all ${
                      isUser
                        ? "bg-slate-800 text-white"
                        : "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white"
                    }`}
                  >
                    {!isUser && (
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1">
                    <span className={`text-[9px] font-black tracking-wider uppercase block text-slate-400 dark:text-slate-500 ${isUser ? "text-right" : "text-left"}`}>
                      {isUser ? "Siz" : "Hesap Yapay Zekası"}
                    </span>
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs md:text-sm shadow-xs whitespace-pre-wrap leading-relaxed transition-all duration-300 ${
                        isUser
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none hover:shadow-md"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/40 dark:border-slate-700/60 hover:shadow-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 max-w-[80%] mr-auto"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                  Hesap Yapay Zekası
                </span>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 text-xs text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-slate-700/60 shadow-xs flex items-center gap-2">
                  <span className="font-semibold text-indigo-500 animate-pulse">Bütçeniz analiz ediliyor</span>
                  <span className="flex items-center gap-0.5 mt-0.5">
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                    />
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                    />
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                    />
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Suggested Quick Questions Panel with beautiful tag stylings */}
      <div className="space-y-2">
        <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
          <MessageSquareCode className="w-3.5 h-3.5 text-indigo-500" /> Önerilen Hızlı Sorular
        </span>
        <div className="flex flex-wrap gap-2.5">
          {[
            {
              text: "Mevcut bütçemin genel risk durumu nedir?",
              label: "🔍 Bütçe Risk Durumum",
              color: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-400",
            },
            {
              text: "Borçlarımı en hızlı nasıl kapatabilirim? Kartopu mu Avalanche mi?",
              label: "🚀 Borç Kapatma Stratejileri",
              color: "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-400",
            },
            {
              text: "Gereksiz harcamaları azaltıp nasıl tasarruf fonu yaparım?",
              label: "🎯 Tasarruf Yönetimi",
              color: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400",
            },
          ].map((qn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickQuestion(qn.text)}
              disabled={loading}
              className={`text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-250/30 dark:border-slate-700/50 px-3.5 py-2 rounded-xl transition duration-200 cursor-pointer shadow-3xs hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${qn.color}`}
            >
              {qn.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Message Input Box with modern border glows */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && inputValue.trim()) handleSend();
          }}
          disabled={loading}
          placeholder="Örn: Bu ayki bütçe hedeflerimi aşmamak için ne yapmalıyım?"
          className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs font-medium"
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSend()}
          disabled={loading || !inputValue.trim()}
          className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/10 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          <Send className="w-4.5 h-4.5" />
        </motion.button>
      </div>

    </div>
  );
};
