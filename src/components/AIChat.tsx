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
    if (messages.length > 1 || loading) {
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_API_KEY;

      if (!apiKey) {
        throw new Error("API Anahtarı bulunamadı. Lütfen GitHub Secrets ayarlarını kontrol edin.");
      }

      const totalDebtsVal = stats ? stats.totalDebts : 0;
      const totalIncomesVal = stats ? stats.totalIncomes : 0;
      const totalExpensesVal = stats ? stats.totalExpenses : 0;
      const netStatusVal = totalIncomesVal - totalExpensesVal;
      const debtsCount = debts ? debts.length : 0;
      const installmentsCount = installmentDebts ? installmentDebts.length : 0;

      const budgetContext = " Kullanicinin Mevcut Finansal Durumu: " +
        " - Toplam Borc: " + totalDebtsVal + 
        " - Toplam Gelir: " + totalIncomesVal + 
        " - Toplam Gider: " + totalExpensesVal + 
        " - Net Durum: " + netStatusVal + 
        " - Borc Sayisi: " + debtsCount + 
        " - Taksit Sayisi: " + installmentsCount;

      const fullPrompt = "Sen profesyonel bir finans, bütçe ve borç yönetim uzmanısın. Kullanıcıya net, samimi, Türkçe ve finansal açıdan mantıklı tavsiyeler ver. " + 
        budgetContext + " Kullanicinin Sorusu: " + question;

      const response = await fetch(
        "https://googleapis.com" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error("Yapay zeka servisi API bağlantı hatası verdi.");
      }

      const data = await response.json();
      
      // Klasik ve hatasız nesne doğrulama yöntemi
      let replyText = "Mesajınızı tam olarak analiz edemedim, lütfen tekrar sormayı deneyin.";
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        replyText = data.candidates[0].content.parts[0].text || replyText;
      }
      
      setMessages((prev) => [...prev, { sender: "bot", text: replyText }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Maalesef asistanla bağlantı kurulurken bir sorun oluştu: " + err.message + ". Local verileriniz güvendedir!",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/85">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              className="absolute inset-x-[-4px] inset-y-[-4px] bg-gradient-to-tr from-indigo-500/25 to-pink-500/25 rounded-2xl blur-md"
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
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
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button onClick={() => handleQuickQuestion("Mevcut bütçeme göre borçlarımı en hızlı nasıl kapatabilirim?")} className="p-3 text-left bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 shrink-0" /> Borç Kapatma Stratejisi
        </button>
        <button onClick={() => handleQuickQuestion("Aylık harcamalarımı azaltmak için bana tasarruf ipuçları verir misin?")} className="p-3 text-left bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500 shrink-0" /> Tasarruf Önerileri
        </button>
        <button onClick={() => handleQuickQuestion("Gelir ve gider dengemi analiz edip genel bir finansal check-up yapar mısın?")} className="p-3 text-left bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <MessageSquareCode className="w-4 h-4 text-violet-500 shrink-0" /> Finansal Check-up
        </button>
      </div>

      <div className="p-1 border border-slate-200/50 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 rounded-3xl shadow-sm">
        <div ref={chatContainerRef} className="h-96 overflow-y-auto space-y-4 p-4 pr-1.5 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              const userStyle = "bg-indigo-600 text-white rounded-tr-none";
              const botStyle = "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs";
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={"flex items-start gap-3 max-w-[85%] " + (isUser ? "ml-auto flex-row-reverse" : "mr-auto")}
                >
                  <div className={"w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs " + (isUser ? "bg-slate-800 text-white" : "bg-indigo-600 text-white")}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={"p-3 rounded-2xl text-xs font-medium leading-relaxed " + (isUser ? userStyle : botStyle)}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
            {loading && (
              <div className="flex items-start gap-3 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-400 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-2 bg-white dark:bg-slate-900 rounded-2xl mt-1 border-t border-slate-100 dark:border-slate-800/60 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Yapay zekaya bütçeni sor..."
            disabled={loading}
            className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent dark:border-slate-800/40"
          />
          <button type="submit" disabled={loading || !inputValue.trim()} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
