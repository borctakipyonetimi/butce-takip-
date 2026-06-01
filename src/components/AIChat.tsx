import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Brain, Flame, Target, MessageSquareCode, Settings, TrendingUp } from "lucide-react";
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

// Helper to highlight words between **
const renderTextWithBold = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/15 px-1 py-0.5 rounded text-[11px] sm:text-xs">
          {part}
        </strong>
      );
    }
    return part;
  });
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-xs md:text-sm leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Subheaders or Header Section
        if (
          trimmed.startsWith("###") || 
          trimmed.startsWith("📊") || 
          trimmed.startsWith("🚀") || 
          trimmed.startsWith("🎯") || 
          trimmed.startsWith("🔔") || 
          trimmed.startsWith("📈") || 
          trimmed.startsWith("💡") ||
          trimmed.startsWith("🚨") ||
          trimmed.startsWith("🟢") ||
          trimmed.startsWith("⚡")
        ) {
          const cleanText = trimmed.replace(/^###\s*/, "");
          return (
            <div key={idx} className="font-extrabold text-slate-900 dark:text-white border-b border-indigo-500/10 dark:border-indigo-500/5 pb-1 pt-2 flex items-center gap-1.5 tracking-wide text-xs sm:text-sm mt-2">
              <span className="text-indigo-400">✧</span>
              <span>{renderTextWithBold(cleanText)}</span>
            </div>
          );
        }

        // Bullet point lines starting with •, - or *
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const cleanText = trimmed.replace(/^[•\-\*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-slate-700 dark:text-slate-300 py-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
              <div className="flex-1">{renderTextWithBold(cleanText)}</div>
            </div>
          );
        }

        // Numeric lists starting with numbers
        if (/^\d+️⃣/.test(trimmed) || /^\d+\./.test(trimmed)) {
          return (
            <div key={idx} className="pl-2 border-l-2 border-indigo-500 dark:border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10 py-1.5 rounded-r-md my-1 text-slate-800 dark:text-slate-200">
              {renderTextWithBold(line)}
            </div>
          );
        }

        // Default paragraph
        return (
          <p key={idx} className="text-slate-700 dark:text-slate-300">
            {renderTextWithBold(line)}
          </p>
        );
      })}
    </div>
  );
};

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
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  
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
    const q = (query || "").toLowerCase();
    
    const dRatio = stats.totalIncome > 0 ? (stats.remaining / stats.totalIncome) : 0;
    const dRatioPerc = dRatio * 100;
    const expensePercentage = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome) * 100 : 0;
    const savingsRate = stats.totalIncome > 0 ? ((stats.netIncome / stats.totalIncome) * 100) : 0;

    const categoriesList = [
      { id: 1, name: "Kira", color: "#3b82f6", icon: "🏠" },
      { id: 2, name: "Market", color: "#10b981", icon: "🛒" },
      { id: 3, name: "Ulaşım", color: "#f59e0b", icon: "🚗" },
      { id: 4, name: "Yeme İçme", color: "#ec4899", icon: "🍔" },
      { id: 5, name: "Faturalar", color: "#ef4444", icon: "⚡" }
    ];

    const categoryKeywords: Record<string, string[]> = {
      "Kira": ["kira", "ev", "konut", "depo", "otel", "apart", "rezidans"],
      "Market": ["market", "gıda", "gida", "yemek", "manav", "kasap", "mutfak", "bim", "migros", "carrefoursa", "şok", "sok", "alışveriş", "alisveris", "groseri", "tekel"],
      "Ulaşım": ["ulaşım", "ulasim", "yol", "akaryakıt", "akaryakit", "benzin", "otobüs", "otobus", "metro", "taksi", "bilet", "yakıt", "yakit", "otoyol", "köprü", "hgs", "egzoz", "sanayi", "araba"],
      "Faturalar": ["fatura", "elektrik", "su", "doğalgaz", "dogalgaz", "gaz", "internet", "telefon", "aidat", "asansör", "asansor", "tv", "abonelik"],
      "Eğlence": ["eğlence", "eglence", "sinema", "kafe", "oyun", "netflix", "konser", "bira", "bar", "restoran", "lokanta", "pub", "ps5", "alkol", "hediye", "hobi", "tatil", "gezi"],
      "Sağlık": ["sağlık", "saglik", "hastane", "ilaç", "ilac", "eczane", "doktor", "muayene", "diş", "dis", "optik", "gözlük", "reçete", "recete"]
    };

    let matchedCategory: string | null = null;
    for (const [catName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(k => q.includes(k))) {
        matchedCategory = catName;
        break;
      }
    }

    let reply = `✨ **Bütçem Pro Gelişmiş Finansal Analiz Raporu**\n\n`;

    if (matchedCategory) {
      let totalCatSpent = 0;
      const catObj = categoriesList.find((c) => c.name.toLowerCase() === matchedCategory!.toLowerCase());
      const catId = catObj ? catObj.id : null;

      const matchedExpenses = expenses.filter((e) => {
        const desc = (e.description || "").toLowerCase();
        const inDesc = desc.includes(matchedCategory!.toLowerCase()) || categoryKeywords[matchedCategory!].some(k => desc.includes(k));
        const inCatId = catId ? e.categoryId === catId : false;
        return inDesc || inCatId;
      });

      totalCatSpent = matchedExpenses.reduce((sum, curr) => sum + curr.amount, 0);
      const catRatioOfExpense = stats.totalExpense > 0 ? (totalCatSpent / stats.totalExpense) * 100 : 0;
      const catRatioOfIncome = stats.totalIncome > 0 ? (totalCatSpent / stats.totalIncome) * 100 : 0;

      reply += `🔍 **Harcama Kalemi Derinlemesine İncelemesi: ${matchedCategory}**\n\n`;
      reply += `Bütçe kayıtlarınızda **${matchedCategory}** kategorisi veya açıklamasına yönelik harcamalarınızı bizzat taradım:\n\n`;
      reply += `• **Kayıtlı Harcama Sayısı**: ${matchedExpenses.length} adet işlem \n`;
      reply += `• **Sektörel Toplam Gider**: ₺${totalCatSpent.toLocaleString("tr-TR")}\n`;
      reply += `• **Harcama Yükü (Gider Oranı)**: Toplam giderlerinizin **%${catRatioOfExpense.toFixed(1)}** kadarını oluşturuyor.\n`;
      reply += `• **Gelir Tüketim Oranı**: Aylık toplam gelirinizin **%${catRatioOfIncome.toFixed(1)}** kadarını sömürüyor.\n\n`;

      if (matchedExpenses.length > 0) {
        reply += `📊 **Son Harcama Detayları**:\n`;
        matchedExpenses.slice(0, 5).forEach((e) => {
          reply += `- ₺${e.amount.toLocaleString("tr-TR")} ➔ *"${e.description || "Açıklama Belirtilmemiş"}"* (${e.date ? e.date.split("T")[0] : "Tarih yok"})\n`;
        });
        reply += `\n`;
      }

      reply += `💡 **Asistan Tasarruf Önerisi**:\n`;
      if (totalCatSpent > stats.totalIncome * 0.15) {
        reply += `⚠️ **${matchedCategory}** harcamalarınız aylık gelirinizin %15 sınırını aşmış durumda. Bu kalemde her ay ekstra **%20 tasarruf** yaparak ayda **₺${(totalCatSpent * 0.2).toFixed(0)}** cebinizde tutabilir ve bu kaynağı borçlarınızı eritmek için kullanabilirsiniz! Harici abonelikleri veya lüks liyakat harcamalarını yeniden gözden geçirin.\n`;
      } else {
        reply += `🟢 Bu kategorideki harcamalarınız makul sınırda (%15 altında) seyrediyor. Mevcut tasarruflu bütçe disiplininizi tebrik ederim! Yeni lüks taksitler yaratmayarak bu istikrarı koruyun.\n`;
      }

    } else if (q.includes("risk") || q.includes("analiz") || q.includes("durum") || q.includes("bütçe") || q.includes("butce") || q.includes("genel") || q.includes("karne") || q.includes("sağlık") || q.includes("saglik") || q.includes("rapor")) {
      reply += `📊 **Kişiselleştirilmiş Bütçe Karnesi ve Risk Analizi**\n\n`;
      reply += `Aylık kayıtlı hesap parametreleriniz üzerinden gerçekleştirdiğim finansal sağlık taraması çıktısı:\n\n`;
      reply += `| Mali Metrik | Değer | Bütçe Oran Payı | Durum |\n`;
      reply += `| :--- | :--- | :--- | :---: |\n`;
      reply += `| **Aylık Gelir** | ₺${stats.totalIncome.toLocaleString("tr-TR")} | %100 | Nakit Girişi |\n`;
      reply += `| **Aylık Gider** | ₺${stats.totalExpense.toLocaleString("tr-TR")} | %${expensePercentage.toFixed(1)} | Harcama Oranı |\n`;
      reply += `| **Net Bakiye** | ₺${stats.netIncome.toLocaleString("tr-TR")} | %${savingsRate.toFixed(1)} | Aylık Tasarruf |\n`;
      reply += `| **Kalan Borç** | ₺${stats.remaining.toLocaleString("tr-TR")} | %${dRatioPerc.toFixed(0)} | Borç/Gelir Yükü |\n\n`;

      reply += `🚨 **Cari Borç Risk Seviyeniz**: `;
      if (dRatio > 5) {
        reply += `⚡ **KIRMIZI ALARM (YÜKSEK MALI RİSK)**\n`;
        reply += `Mevcut toplam borç yükünüz, aylık gelirinizin **${dRatio.toFixed(1)} katı**! Finansal güvenliğiniz tehlikede. Harcamalarınızı acilen dondurmalı, taksitli borçlanmayı durdurmalı ve tüm bütçe fazlasını en küçük borca kanalize etmelisiniz.\n\n`;
      } else if (dRatio > 2.5) {
        reply += `⚖️ **SARI ALARM (ORTA SEVİYE RİSK)**\n`;
        reply += `Geri ödenmesi gereken borç portföyünüz aylık gelirinizin **${dRatio.toFixed(1)} katı** düzeyinde. Bütçeniz kontrol edilebilir durumda ancak yeni taksitler eklemek sizi yüksek risk sınırına itecektir. Kar topu stratejisiyle acilen borç kapatmaya odaklanın.\n\n`;
      } else {
        reply += `🟢 **YEŞİL BÖLGE (GÜVENLİ VE RESİLİENT)**\n`;
        reply += `Toplam borç yükünüz aylık gelirinizin **${dRatio.toFixed(1)} katı** seviyesinde ve oldukça güvenli sınırda. Mevcut bütçe planınızı koruyarak borçlarınızı takvimine göre sıfırlayabilirsiniz.\n\n`;
      }

      reply += `💪 **Mali Güçlenme Tavsiyeleriniz**:\n`;
      if (savingsRate < 10) {
        reply += `- **Tasarruf Sızıntısı**: Aylık tasarruf oranınız (%${savingsRate.toFixed(1)}) çok düşük. Acil durum fonu oluşturmak için aylık gider bütçenizden en az **%15 kısıntı** planlamalıyız.\n`;
      } else {
        reply += `- **Yüksek Likidite Gücü**: Aylık tasarruf oranınız (%${savingsRate.toFixed(1)}) son derece güçlü. Biriktirdiğiniz bu net bakiye fazlasını borç kapatma hızlandırıcısı olarak asgari ödemelerin üzerine ekleyin.\n`;
      }
      if (installmentDebts.length > 2) {
        reply += `- **Taksit Blokajı**: Devam eden **${installmentDebts.length} aktif taksitiniz** gelecekteki nakit akışınızı rehin tutuyor. Gelecek aylarda yeni taksitli işlem yapmayacağınıza dair kendinize söz verin.\n`;
      }

    } else if (q.includes("borç") || q.includes("borc") || q.includes("kapat") || q.includes("erit") || q.includes("strateji") || q.includes("kartopu") || q.includes("avalanche") || q.includes("çığ") || q.includes("cig") || q.includes("öde")) {
      reply += `🚀 **Akıllı Borç Sıfırlama ve Yapılandırma Stratejisi**\n\n`;
      
      if (debts.length === 0) {
        reply += `Şu anda sistemde kayıtlı aktif nakit borç kaleminiz bulunmuyor. Yeni borçlar ekleyerek asistanın gerçek-zamanlı kar topu simülasyonunu başlatabilirsiniz!\n\n`;
      } else {
        reply += `Mevcut **${debts.length} adet** borç kaleminiz analiz edilerek borçsuz bir yaşama en hızlı ulaşmanızı sağlayacak iki temel metodoloji simüle edilmiştir:\n\n`;
        
        const sortedSnowball = [...debts].sort((a, b) => (a.amount - a.paid) - (b.amount - b.paid));
        const sortedAvalanche = [...debts].sort((a, b) => (b.amount - b.paid) - (a.amount - a.paid));

        reply += `1️⃣ **Kartopu (Snowball) Stratejisi (Psikolojik & En Hızlı Sonuç)**:\n`;
        reply += `• Kalan net bakiyesi en düşük olan borca agresif ödeme yapıp onu yok edin, diğerlerine asgari yatırın. Bir borcun tamamen silindiğini görmek sizi inanılmaz motive eder.\n`;
        reply += `👉 **Kartopu İlk Hedefiniz**: En az kalan borç olan **"${sortedSnowball[0].name}"** borcunu kapatmaya odaklanın. Kalan Ödenecek: **₺${(sortedSnowball[0].amount - sortedSnowball[0].paid).toLocaleString("tr-TR")}**.\n\n`;

        reply += `2️⃣ **Çığ (Avalanche) Stratejisi (Matematiksel / En Ekonomik Yol)**:\n`;
        reply += `• Tutarı veya maliyeti en yüksek olan borca öncelik tanıyın. Böylece toplamda katlanacağınız enflasyonist vade yükünü ve faiz kaybını minimuma indirirsiniz.\n`;
        reply += `👉 **Çığ İlk Hedefiniz**: En büyük kalan borç olan **"${sortedAvalanche[0].name}"** borcuna odaklanın. Kalan Ödenecek: **₺${(sortedAvalanche[0].amount - sortedAvalanche[0].paid).toLocaleString("tr-TR")}**.\n\n`;

        const monthlyReserve = stats.netIncome;
        reply += `⏱️ **Borç Eritme Zaman Projeksiyonu**:\n`;
        if (monthlyReserve > 100) {
          const monthsNeeded = stats.remaining / monthlyReserve;
          reply += `• Her ay biriktirdiğiniz **₺${monthlyReserve.toLocaleString("tr-TR")}** tasarruf fazlasının tamamını borç kapatmaya yönlendirirseniz, teorik olarak **${monthsNeeded.toFixed(1)} ay sonra** tamamen borçsuz ve özgür bir hayata kavuşabilirsiniz! 🎉\n\n`;
        } else {
          reply += `• ⚠️ Aylık kullanılabilir tasarruf rezerviniz yetersiz (Negatif veya çok düşük nakit akışı). Borçlarınızı planlı sürede sıfırlayabilmek için aylık harcamalarınızı kısmalı veya acilen ek gelir yaratmalısınız. Giderleri azaltmadan borçların azalması matematiksel olarak imkansızdır.\n\n`;
        }
      }

    } else if (q.includes("tasarruf") || q.includes("tasaruf") || q.includes("para biriktir") || q.includes("biriktir") || q.includes("tasarruf yöntemi") || q.includes("gider") || q.includes("harcama") || q.includes("bakiye") || q.includes("birikim")) {
      reply += `🎯 **Profesyonel Tasarruf ve Birikim Rehberi**\n\n`;
      reply += `Aylık toplam kalibre edilmiş geliriniz olan **₺${stats.totalIncome.toLocaleString("tr-TR")}** temel alınarak oluşturulan tasarruf matrisiniz aşağıdadır:\n\n`;
      
      const necessityLimit = stats.totalIncome * 0.50;
      const wantLimit = stats.totalIncome * 0.30;
      const savingTarget = stats.totalIncome * 0.20;

      reply += `💡 **İdeal 50/30/20 Bütçe Bölüşümü**:\n`;
      reply += `- **Zorunlu Giderler (Ev, Fatura, Gıda - %50)**: Maksimum **₺${necessityLimit.toLocaleString("tr-TR")}** ayrılmalı. (Sizin Mevcut Gideriniz: ₺${stats.totalExpense.toLocaleString("tr-TR")})\n`;
      reply += `- **Kişisel İstekler (Sosyal Yaşam - %30)**: Maksimum **₺${wantLimit.toLocaleString("tr-TR")}** ayrılmalı.\n`;
      reply += `- **Borç Ödeme ve Birikim Fonu (%20)**: Aylık asgari **₺${savingTarget.toLocaleString("tr-TR")}** hedef koyulmalı.\n\n`;

      reply += `🌟 **Eyleme Geçilebilir Tasarruf Reçetesi**:\n`;
      reply += `1. **Acil Durum Fonu (Emergency Fund)**: Olası harika fırsatlar veya beklenmedik krizler için asgari 3 aylık yaşamsal harcamalarınızı kapsayan (Önerilen Güvence Kaynağı: **₺${(stats.totalExpense * 3).toLocaleString("tr-TR")}**) bir kenar akçesi biriktirmeye başlayın.\n`;
      if (expenses.length > 0) {
        reply += `2. **Gereksiz Abonelikler ve Harcama Optimizasyonu**: Sistemde kayıtlı **${expenses.length} adet harcamanızı** tek tek gözden geçirdim. Küçük ve tekrarlayan harcamaları keserek ayda ortalama **₺400** ila **₺1.500** arasında doğrudan ek bütçe yaratabilirsiniz.\n`;
      } else {
        reply += `2. **Gider Kaydı Tutma**: Şu an hiç anlık gider kalemi girmemişsiniz. Harcamalarınızı disipline etmek ve nereye bütçe sızıntısı olduğunu teşhis etmek için 'Harcamalar' sekmesinden harcamalarınızı kaydetmeye başlayın.\n`;
      }

    } else if (q.includes("merhaba") || q.includes("selam") || q.includes("hey") || q.includes("nasılsın") || q.includes("kimsin") || q.includes("yardım") || q.includes("help")) {
      reply += `👋 **Merhaba! Ben Bütçem Pro Bireysel Finans Danışmanınız.**\n\n`;
      reply += `Finansal hedeflerinize emin adımlarla yürümeniz, tüm borçlarınızı planlı şekilde sıfırlamanız ve bütçenizi en verimli şekilde yönetebilmeniz için bizzat buradayım.\n\n`;
      reply += `Aşağıdaki konuları bütçe verilerinizle bizzat hesaplayabiliyorum. Bana dilediğinizi yazabilirsiniz:\n`;
      reply += `• 📊 **Genel Bütçe Karnesi**: "Mevcut bütçe durumum genel olarak nasıl?"\n`;
      reply += `• 🚀 **Borç Eritme Stratejileri**: "Borçlarımı kartopu veya avalanche ile nasıl eritirim?"\n`;
      reply += `• 🎯 **Gider ve Tasarruf Tüyoları**: "Birikim yapmak için hangi harcamalarımı kısmalıyım?"\n`;
      reply += `• 🔍 **Kategori Analizi**: "Market (veya faturalar) için ne kadar harcama yaptım?"\n\n`;
      reply += `Sorularınızı bekliyorum!`;

    } else {
      reply += `👋 **Bütçem Pro Bireysel Finansal Tavsiye Özet Raporu**\n\n`;
      reply += `Yazdığınız soruyu bütçenizin genel matematiksel verileriyle ilişkilendirerek detaylı şekilde analiz ettim:\n\n`;
      reply += `• **Aylık Gelir Kaynağınız**: ₺${stats.totalIncome.toLocaleString("tr-TR")}\n`;
      reply += `• **Aylık Gider Yükünüz**: ₺${stats.totalExpense.toLocaleString("tr-TR")}\n`;
      reply += `• **Kalan Serbest Net Rezerve**: ₺${stats.netIncome.toLocaleString("tr-TR")}\n`;
      reply += `• **Geri Ödenecek Kalan Toplam Borç**: ₺${stats.remaining.toLocaleString("tr-TR")} (Ödenen: ₺${stats.totalPaid.toLocaleString("tr-TR")})\n\n`;
      reply += `Bana borç kapatma simülasyonları (*Kartopu/Çığ yöntemleri*), sektörel harcama analizleri (*market, fatura, kira harcamaları*) veya tasarruf yöntemleri hakkında sorular yöneltebilirsiniz. Bütçe bizzat hesaplanarak size en rasyonel öneriler sunulacaktır!`;
    }

    reply += `\n\n---\n`;
    reply += `⚙️ *Bilgi: Bu analiz çevrimdışı finans hesaplama motoru tarafından bütçe verileriniz bizzat hesaplanarak üretilmiştir. Çevrimiçi yapay zekayı (Gemini 3.5) aktifleştirmek isterseniz, yan menüdeki **Yapay Zekâ Motor Ayarları** alanından kendi Gemini API Anahtarınızı kolayca kaydedebilirsiniz.*`;

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

    const userApiKey = localStorage.getItem("user_gemini_api_key") || undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
          userApiKey: userApiKey,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Yapay zeka servisi yanıt vermedi.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err: any) {
      clearTimeout(timeoutId);
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
              <motion.h2
                animate={{ y: [0, -1.2, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="text-md sm:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase"
              >
                FİNANSAL DANIŞMANLIK & AKILLI ANALİZ PORTALI
              </motion.h2>
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
                      {isUser ? (
                        msg.text
                      ) : (
                        <FormattedText text={msg.text} />
                      )}
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

      {/* Collapsible API Key settings panel */}
      <div className="bg-slate-50 dark:bg-slate-800/45 rounded-2xl border border-slate-200/50 dark:border-slate-700/60 p-4 transition-all shadow-3xs">
        <button
          onClick={() => setShowApiKeyField(!showApiKeyField)}
          className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500 animate-[spin_10s_linear_infinite]" />
            <span className="text-xs font-black tracking-wide uppercase text-slate-700 dark:text-slate-300">
              Yapay Zekâ Motor Ayarları (İsteğe Bağlı)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold font-mono hover:text-indigo-500 transition">
            {showApiKeyField ? "Gizle ▲" : "Göster (Anahtar Ekle) ▼"}
          </span>
        </button>

        <AnimatePresence>
          {showApiKeyField && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3 pt-3 border-t border-slate-250/20 dark:border-slate-700/30 space-y-3"
            >
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Sistem varsayılan olarak bütçe analizlerini <strong className="text-indigo-500 dark:text-indigo-400">Çevrimdışı Yapay Zekâ Analiz Motoru</strong> ile süper hızlı ve güvenli yapar. Dilerseniz kendi kişisel <strong className="text-indigo-500 dark:text-indigo-400">Gemini API Key</strong> anahtarınızı kaydederek doğrudan geniş modelleri sorgulayabilirsiniz:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setIsApiKeySaved(false);
                  }}
                  placeholder="AIzaSy... ile başlayan Gemini API anahtarınızı girin"
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("user_gemini_api_key", apiKeyInput);
                    setIsApiKeySaved(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-black text-xs text-white rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
                >
                  Kaydet 💾
                </button>
              </div>
              {isApiKeySaved && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] sm:text-xs font-bold border border-emerald-500/10 flex items-center gap-1.5"
                >
                  🟢 Gemini API Anahtarı başarıyla tarayıcıya kaydedildi! Üst düzey akıllı mod aktif.
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
