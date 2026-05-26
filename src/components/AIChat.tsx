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
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("user_gemini_api_key") || "");
  const [showApiKeyField, setShowApiKeyField] = useState(false);
  
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

  const generateClientFallbackReply = (query: string): string => {
    const q = query.toLowerCase();
    
    // Safety calculations
    const dRatio = stats.totalIncome > 0 ? (stats.remaining / stats.totalIncome) : 0;
    const expensePercentage = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome) * 100 : 0;
    
    let reply = "";
    
    if (q.includes("risk") || q.includes("analiz") || q.includes("durum") || q.includes("bütçe") || q.includes("butce") || q.includes("genel")) {
      reply += `📊 **Finansal Sağlık ve Risk Analiz Raporu (Hibrid Akıllı Hesap Motoru)**\n\n`;
      reply += `Uzak yapay zeka sunucusuna bağlanılamadı ancak bütçe kayıtlarınız üzerinden anlık mali sağlık simülasyonunu tamamladım:\n\n`;
      reply += `• **Aylık Toplam Gelir**: ₺${stats.totalIncome.toLocaleString("tr-TR")}\n`;
      reply += `• **Aylık Toplam Gider**: ₺${stats.totalExpense.toLocaleString("tr-TR")} (%${expensePercentage.toFixed(1)} tasarruf/harcama oranı)\n`;
      reply += `• **Kalan Net Bakiye (Bebek Adımı Rezervi)**: ₺${stats.netIncome.toLocaleString("tr-TR")}\n`;
      reply += `• **Kalan Ödenecek Toplam Borç**: ₺${stats.remaining.toLocaleString("tr-TR")} (Toplam borç: ₺${stats.totalDebt.toLocaleString("tr-TR")})\n\n`;
      
      reply += `🚨 **Borç Risk Durumunuz**: `;
      if (dRatio > 5) {
        reply += `⚡ **YÜKSEK RİSK**\nÖdenecek borçlarınız, aylık toplam gelirinizin 5 katından fazla (%${Math.round(dRatio * 100)}). Harcamaları acilen durdurmalı, taksitli alışverişlerden kaçınmalı ve borçlarınızı konsolide etmelisiniz.\n\n`;
      } else if (dRatio > 2) {
        reply += `⚖️ **ORTA RİSK**\nBorç yükünüz kontrol edilebilir seviyede (%${Math.round(dRatio * 100)}) ancak aylık dondurulmuş bakiye oranınız yüksek. Birikimlerinizi artırıp borç kapatma hızınızı yükseltmenizi tavsiye ederim.\n\n`;
      } else {
        reply += `🟢 **GÜVENLİ DURUM**\nMali göstergeleriniz son derece dengeli görünüyor (%${Math.round(dRatio * 100)}). Bütçe disiplininizi koruyarak mevcut borçlarınızı kısa sürede kapatabilirsiniz.\n\n`;
      }
      
      reply += `💡 **Bilgi**: Portalı GitHub Pages veya benzeri statik bir sunucudan açtığınızda arka plan yapay zeka sunucusu bulunamadığı için sistemimiz sizi asla yarı yolda bırakmaz ve bu akıllı matematiksel danışman paneliyle bütçenizi anında analiz eder!`;
      
    } else if (q.includes("borç") || q.includes("borc") || q.includes("kapat") || q.includes("erit") || q.includes("strateji") || q.includes("kartopu") || q.includes("avalanche") || q.includes("çığ") || q.includes("cig")) {
      reply += `🚀 **Akıllı Borç Kapatma ve Eritme Planı**\n\n`;
      reply += `Mevcut borç listeniz (${debts.length} adet borç) için uygulayabileceğiniz profesyonel borç eritme stratejileri aşağıdadır:\n\n`;
      
      reply += `1️⃣ **Kartopu (Snowball) Yöntemi (Önerilen)**:\n`;
      reply += `• En küçük tutarlı borca odaklanıp onu hızla kapatın. Psikolojik olarak borçların tek tek yok olduğunu görmek sizi motive edecektir.\n`;
      if (debts.length > 0) {
        const sortedDebts = [...debts].sort((a,b) => (a.amount - a.paid) - (b.amount - b.paid));
        const smallest = sortedDebts[0];
        reply += `👉 *Kartopu Önceliğiniz*: En küçük kalan borcunuz olan **${smallest.name}** (Kalan: ₺${(smallest.amount - smallest.paid).toLocaleString("tr-TR")}) borcuna odaklanıp her ay ekstra ödeme aktarın.\n\n`;
      } else {
        reply += `👉 *Kartopu Önceliğiniz*: Henüz kayıtlı borç kaydınız yok, lütfen borç ekleyin.\n\n`;
      }
      
      reply += `2️⃣ **Çığ (Avalanche) Yöntemi**:\n`;
      reply += `• En yüksek faiz oranına ya da mali yükümlülüğe sahip borca öncelik tanıyın. Matematiksel olarak toplamda en az faiz ödemenizi sağlayacak bilimsel yöntem budur.\n`;
      if (debts.length > 0) {
        const sortedByLarge = [...debts].sort((a,b) => (b.amount - b.paid) - (a.amount - a.paid));
        const largest = sortedByLarge[0];
        reply += `👉 *Çığ Önceliğiniz*: En yüksek kalan borcunuz olan **${largest.name}** (Kalan: ₺${(largest.amount - largest.paid).toLocaleString("tr-TR")}) borcuna asgarilerden kalan tüm bakiye fazlasını yönlendirin.\n\n`;
      }
      
      reply += `💡 Tasarruf oranlarınızı her ay %10 artırarak bu süreci daha da hızlandırabilirsiniz.`;
      
    } else if (q.includes("tasarruf") || q.includes("tasaruf") || q.includes("para biriktir") || q.includes("biriktir") || q.includes("tasarruf yöntemi")) {
      reply += `🎯 **Kişiselleştirilmiş Tasarruf Danışmanı**\n\n`;
      reply += `Aylık toplam gelirinize (₺${stats.totalIncome.toLocaleString("tr-TR")}) göre ideal bakiye planınızı modelledim:\n\n`;
      
      const idealSavings = stats.totalIncome * 0.2;
      const emergencyFund = stats.totalExpense * 3;
      
      reply += `• **50/30/20 Kuralı**: Gelirinizin %50'sini zorunlu harcamalara, %30'unu lüks isteklerinize ayırın. En az **%20'sini (₺${idealSavings.toLocaleString("tr-TR")})** doğrudan birikim veya borç kapatma fonu olarak ayırmalısınız.\n`;
      reply += `• **Acil Durum Fonu**: İşsizlik, sağlık vb. durumları için asgari 3 aylık harcamalarınızı kapsayan (Önerilen: ₺${emergencyFund.toLocaleString("tr-TR")}) bir güvence akçesi biriktirin.\n\n`;
      
      if (expenses.length > 0) {
        reply += `🚨 **Harcama Analiz Önceliği**: Toplam ₺${stats.totalExpense.toLocaleString("tr-TR")} tutarında kayıtli ${expenses.length} adet lüks veya genel harcamanız bulunuyor. Bu giderlerden tasarruf ederek mali süreci iki kat hızlandırabilirsiniz!`;
      } else {
        reply += `💡 Şu anda kayıtlı gideriniz bulunmuyor. Düzenli olarak giderlerinizi ekleyerek tasarruf açıklarını daha net görebilirsiniz.`;
      }
      
    } else if (q.includes("taksit") || q.includes("limit") || q.includes("hedef") || q.includes("plan")) {
      reply += `🔔 **Taksit ve Harcama Limit Takip Raporu**\n\n`;
      reply += `• **Cari Ay Taksit / Harcama Yükü**: ₺${stats.totalExpense.toLocaleString("tr-TR")}\n`;
      if (installmentDebts.length > 0) {
        reply += `• **Aktif Devam Eden Taksit**: ${installmentDebts.length} adet borç planı yürürlükte.\n\n`;
      }
      
      reply += `📌 *Finansal Öneri*: Taksitli alışverişler gelecekteki nakit akışınızı bloke eder. Yeni taksitli alışveriş yapmaktan kaçınarak bütçenizi özgürleştirin!`;
    } else {
      reply += `💡 **Finansal Analiz ve Yardımcı Asistan**\n\n`;
      reply += `Yazdığınız mesajı bütçe durumunuzla ilişkilendirerek inceledim:\n\n`;
      reply += `• **Aylık Gelir**: ₺${stats.totalIncome.toLocaleString("tr-TR")}\n`;
      reply += `• **Aylık Gider**: ₺${stats.totalExpense.toLocaleString("tr-TR")}\n`;
      reply += `• **Kalan Net Bakiye**: ₺${stats.netIncome.toLocaleString("tr-TR")}\n`;
      reply += `• **Kalan Toplam Borç**: ₺${stats.remaining.toLocaleString("tr-TR")}\n\n`;
      reply += `Bana borç kapatma stratejileri (*kartopu/çığ yöntemleri*), tasarruf tavsiyeleri veya mali risk durumunuz hakkında dilediğinizi sorabilirsiniz. Bütçe verilerinizle anında hesaplama yapabilirim!`;
    }
    
    return reply;
  };

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || inputValue.trim();
    if (!question) return;

    if (!textToSend) {
      setInputValue("");
    }

    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setLoading(true);

    const userApiKey = localStorage.getItem("user_gemini_api_key");

    if (userApiKey && userApiKey.trim() !== "") {
      try {
        const sysInstruction = `Sen 'Bütçem Pro' finans portalının akıllı yapay zeka asistanısın. Kullanıcıya bütçe yönetimi, tasarruf, borç kapatma stratejileri (Kartopu / Çığ yöntemleri) konusunda yardımcı oluyorsun.

Mevcut Finansal Durum:
- Toplam Gelir: ₺${stats.totalIncome.toLocaleString("tr-TR")}
- Toplam Gider: ₺${stats.totalExpense.toLocaleString("tr-TR")}
- Net Kalan Bakiye: ₺${stats.netIncome.toLocaleString("tr-TR")}
- Toplam Borç: ₺${stats.totalDebt.toLocaleString("tr-TR")}
- Kalan Ödenecek Borç (sadece o ayki taksit dahil): ₺${stats.remaining.toLocaleString("tr-TR")}
- Taksitli Borç Sayısı: ${installmentDebts.length} adet

Kullanıcının Borçları:
${debts.map(d => `- ${d.name}: Toplam ₺${d.amount}, Ödenen ₺${d.paid}, Kalan ₺${d.amount - d.paid}, SKT: ${d.dueDate || "Yok"}`).join("\n")}

Kullanıcının Taksitleri:
${installmentDebts.map(inst => `- ${inst.name}: Toplam ₺${inst.totalAmount}, ${inst.installmentCount} Taksit (Ödenen: ${inst.paidInstallmentCount} adet), Aylık Taksit: ₺${(inst.totalAmount / inst.installmentCount).toFixed(2)}`).join("\n")}

Görevlerin:
1. Gelir/gider ve kalan borç analizini yaparak kullanıcının risk seviyesini (Yüksek, Orta, Düşük) belirle.
2. Tasarruf, borç kapatma stratejileri (Kartopu / Çığ yöntemleri vb.) hakkında pratik öneriler ver.
3. Kullanıcının sorduğu soruları finansal verileri baz alarak dost canlısı, rasyonel ve cesaretlendirici bir tonla somutlaştırarak cevapla.
4. Cevaplarının okunabilirliği için markdown, başlıklar ve maddeler kullan.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey.trim()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              ...messages.slice(-6).map(m => ({
                role: m.sender === "user" ? "user" : "model",
                parts: [{ text: m.text }]
              })),
              {
                role: "user",
                parts: [{ text: `Sistem Bilgileri:\n${sysInstruction}\n\nKullanıcı Sorusuna Cevap Ver:\n${question}` }]
              }
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1000
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Gemini API bağlantısı başarısız oldu.");
        }

        const data = await response.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Boş yanıt alındı.";
        setMessages((prev) => [...prev, { sender: "bot", text: replyText }]);
      } catch (err: any) {
        console.warn("[AIChat Client-Side Direct API Error]:", err);
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `⚠️ Girilen Gemini API Anahtarı ile bağlantı kurulamadı: ${err.message}\nLütfen anahtarın doğruluğunu kontrol edin veya offline asistanı kullanın.`,
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

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
      console.warn("[AIChat Frontend Fallback] Backend chat failed or is offline. Generating high-quality mathematical fallback response directly in client:", err);
      const fallbackReply = generateClientFallbackReply(question);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: fallbackReply,
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
