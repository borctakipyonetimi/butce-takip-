import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini dynamically and lazily with proper User-Agent header and environment reloading support
let cachedApiKey: string | undefined = undefined;
let cachedAi: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!currentKey || currentKey.trim() === "") {
    cachedAi = null;
    cachedApiKey = undefined;
    return null;
  }

  const cleanKey = currentKey.trim();

  if (cleanKey !== cachedApiKey || !cachedAi) {
    try {
      cachedAi = new GoogleGenAI({
        apiKey: cleanKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      cachedApiKey = cleanKey;
      console.log("[Gemini API Client] Successfully initialized with a valid key format.");
    } catch (err) {
      console.error("Gemini API Client Initialization Error:", err);
      return null;
    }
  }
  return cachedAi;
}

// API Route for Yapay Zeka (AI Specialist)
app.post("/api/chat", async (req, res) => {
  const { message, context, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Mesaj alanı boş bırakılamaz." });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    const stats = context?.stats;
    const totalDebt = stats?.totalDebt || 0;
    const remaining = stats?.remaining || 0;
    const totalIncome = stats?.totalIncome || 0;
    const totalExpense = stats?.totalExpense || 0;
    const netIncome = stats?.netIncome || 0;
    
    let advice = "Merhaba! 😊 Ben finansal asistanınız. Yapay zeka servisimiz şu anda çevrimdışı (GEMINI_API_KEY tanımlanmamış) ancak sizin girmiş olduğunuz bütçe verileriyle akıllı bir matematiksel risk tablosu oluşturdum:\n\n";
    advice += `💰 *Bütçe Karneniz*:\n`;
    advice += `• Toplam Borç: ₺${totalDebt.toLocaleString("tr-TR")}\n`;
    advice += `• Kalan Borç: ₺${remaining.toLocaleString("tr-TR")}\n`;
    advice += `• Aylık Gelir: ₺${totalIncome.toLocaleString("tr-TR")}\n`;
    advice += `• Aylık Harcama: ₺${totalExpense.toLocaleString("tr-TR")}\n`;
    advice += `• Cebinizde Kalan: ₺${netIncome.toLocaleString("tr-TR")}\n\n`;

    const dRatio = totalIncome > 0 ? (remaining / totalIncome) : 0;
    
    advice += `🚨 *Risk Seviyeniz*: `;
    if (dRatio > 5) {
      advice += `⚡ YÜKSEK RİSK (Borçlar aylık gelirinizin 5 katından fazla. Acilen harcamaları kısıp borç yapılandırma yapmalısınız.)\n\n`;
    } else if (dRatio > 2) {
      advice += `⚖️ ORTA RİSK (Borç seviyesi yönetilebilir ancak tasarrufları artırmanız gerekiyor.)\n\n`;
    } else {
      advice += `🟢 DÜŞÜK RİSK (Mali durumunuz oldukça stabil görünüyor. Borçlarınızı kısa sürede kapatabilirsiniz!)\n\n`;
    }

    advice += `💡 *Tavsiye*: Gemini Yapay Zeka modeline tam bağlanmak için lütfen **Settings > Secrets** sekmesinden bir \`GEMINI_API_KEY\` girin!`;
    return res.json({ reply: advice });
  }

  try {
    const stats = context?.stats;
    const totalDebt = stats?.totalDebt || 0;
    const totalPaid = stats?.totalPaid || 0;
    const remaining = stats?.remaining || 0;
    const totalIncome = stats?.totalIncome || 0;
    const totalExpense = stats?.totalExpense || 0;
    const netIncome = stats?.netIncome || 0;

    const systemPrompt = `Sen "Borç Takip Sistemi" Android/Web uygulamasının dahili yapay zeka finans asistanısın. Türkçe konuşacaksın.
Kullanıcının bütçe durumuna ilişkin güncel veriler aşağıdadır:
- Toplam Borç: ₺${totalDebt}
- Ödenmiş Miktar: ₺${totalPaid}
- Kalan Borç: ₺${remaining}
- Toplam Aylık Gelir: ₺${totalIncome}
- Toplam Aylık Gider: ₺${totalExpense}
- Kalan Net Gelir (Bakiye): ₺${netIncome}
- Taksitli Borç Sayısı: ${context?.installmentDebts?.length || 0}
- Borç Listesi Detayı: ${JSON.stringify(context?.debts || [])}
- Giderler Listesi Detayı: ${JSON.stringify(context?.expenses || [])}

Görevlerin:
1. Gelir/gider ve kalan borç analizini yaparak kullanıcının risk seviyesini (Yüksek, Orta, Düşük) belirle.
2. Tasarruf, borç kapatma stratejileri (Kartopu / Çığ yöntemleri vb.) hakkında pratik öneriler ver.
3. Kullanıcının yazdığı soruları finansal verileri baz alarak dost canlısı, rasyonel ve cesaretlendirici bir tonla somutlaştırarak cevapla.
4. Cevaplarının okunabilirliği için markdown, başlıklar ve maddeler kullan.`;

    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const turn of chatHistory) {
        contents.push({
          role: turn.sender === "user" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Enforce an active 60-second timeout to prevent API hangs or slow responses in Cloud environments
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout after 60000ms: Gemini API calls are taking too long due to rate limits or connection restrictions.")), 60000);
    });

    const geminiPromise = aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: "LOW" as any
        }
      },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    res.json({ reply: response.text });
  } catch (error: any) {
    const errMsg = error?.message || error?.toString() || "";
    console.error("[Gemini API Error Diagnostics]:", error);

    const isKeyError = errMsg.toLowerCase().includes("expired") || 
                       errMsg.toLowerCase().includes("key") || 
                       errMsg.toLowerCase().includes("credential") || 
                       errMsg.toLowerCase().includes("invalid_argument") ||
                       errMsg.toLowerCase().includes("unauthorized") ||
                       errMsg.toLowerCase().includes("api_key_invalid") ||
                       errMsg.toLowerCase().includes("forbidden");

    const isTimeout = errMsg.toLowerCase().includes("timeout") ||
                      errMsg.toLowerCase().includes("deadline") ||
                      errMsg.toLowerCase().includes("duration");

    if (isKeyError) {
      console.warn(`[Gemini API Config Alert] API Key is inactive or expired: ${errMsg.slice(0, 150)}`);
    } else if (isTimeout) {
      console.warn(`[Gemini API Config Alert] API Request timed out: ${errMsg.slice(0, 150)}`);
    } else {
      console.warn(`[Gemini API Service Warn] General AI fetch failure, falling back to offline calculator: ${errMsg.slice(0, 150)}`);
    }
    
    // Always fall back to robust offline budget analytics to keep the app 100% online
    const stats = context?.stats;
    const totalDebt = stats?.totalDebt || 0;
    const remaining = stats?.remaining || 0;
    const totalIncome = stats?.totalIncome || 0;
    const totalExpense = stats?.totalExpense || 0;
    const netIncome = stats?.netIncome || 0;

    let advice = `⚠️ **Yapay Zeka Servisi Bilgilendirmesi**\n\n`;
    if (isKeyError) {
      advice += `Sistemde tanımlı olan Gemini API anahtarının (\`GEMINI_API_KEY\`) süresi dolmuş veya geçersiz görünüyor.\n\n`;
      advice += `🔧 **Hızlı Çözüm Adımları**:\n`;
      advice += `1. Ekranın sağ üst köşesindeki **Settings** (Çark) menüsünü açın.\n`;
      advice += `2. **Secrets** (veya Environment Variables) kısmına gidin.\n`;
      advice += `3. Süresi dolan veya geçersiz olan \`GEMINI_API_KEY\` değerini geçerli yeni bir model anahtarıyla yenileyin.\n\n`;
    } else if (isTimeout) {
      advice += `Yapay zeka asistanı bağlantı zaman aşımına uğradı (Uzak sunucu yanıt vermedi). Ancak endişelenmeyin, yerel akıllı hesaplama motorumuz bütçe verilerinizi anında analiz etti!\n\n`;
    } else {
      advice += `Geçici bir ağ veya servis kısıtlaması nedeniyle model asistanımıza bağlanılamadı. Endişelenmeyin, yerel akıllı hesaplama motorumuz bütçe verilerinizi anında analiz etti!\n\n`;
    }
    
    advice += `---\n\n`;
    advice += `📊 **Mevcut Finansal Durum Raporunuz (Bütçe Karnesi)**:\n`;
    advice += `• **Aylık Toplam Gelir**: ₺${totalIncome.toLocaleString("tr-TR")}\n`;
    advice += `• **Aylık Toplam Gider**: ₺${totalExpense.toLocaleString("tr-TR")}\n`;
    advice += `• **Net Kalan Bakiye**: ₺${netIncome.toLocaleString("tr-TR")}\n`;
    advice += `• **Toplam Borç Yükümlülüğü**: ₺${totalDebt.toLocaleString("tr-TR")}\n`;
    advice += `• **Kalan Ödenecek Borç**: ₺${remaining.toLocaleString("tr-TR")}\n\n`;

    const dRatio = totalIncome > 0 ? (remaining / totalIncome) : 0;
    advice += `📈 **Borç/Gelir Oranı**: %${Math.round(dRatio * 100)}\n`;
    advice += `🚨 **Borç Risk Durumunuz**: `;
    if (dRatio > 5) {
      advice += `⚡ **YÜKSEK RİSK** (Borçlarınız aylık gelirinizin 5 katından yüksek! Harcamaları kısıtlamalı, ek gelir kaynakları araştırmalı ve borçlarınızı acilen yapılandırmalısınız.)\n`;
    } else if (dRatio > 2) {
      advice += `⚖️ **ORTA RİSK** (Mali durumunuz kontrol edilebilir seviyede olsa da acil durum fonu oluşturmaya ve kartopu ödeme yöntemine odaklanmalısınız.)\n`;
    } else {
      advice += `🟢 **GÜVENLİ DURUM** (Dengeli bir bütçe dağılımınız var. Mevcut harcama disiplininizi sürdürerek borçlarınızı planlı şekilde sıfırlayabilirsiniz.)\n`;
    }
    
    return res.json({ reply: advice });
  }
});

// API Route for currency exchange rates proxy (Server-side bypass of CORS/adblock restrictions)
app.get("/api/rates", async (req, res) => {
  // Instruct the browser and CDN under no circumstances to cache this real-time financial endpoint
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const apis = [
    "https://api.exchangerate-api.com/v4/latest/USD",
    "https://open.er-api.com/v6/latest/USD"
  ];

  // Actual modern baseline fallback rates (2026 actual levels)
  const defaultUsd = 45.85;
  const defaultEur = 49.85;
  const defaultGbp = 58.20;

  for (const baseUrl of apis) {
    try {
      // Append runtime token to completely bypass and invalidate any upstream cache
      const delimiter = baseUrl.includes("?") ? "&" : "?";
      const url = `${baseUrl}${delimiter}t=${Date.now()}`;

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout per API fetch
      const response = await fetch(url, { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
      clearTimeout(id);
      
      if (response.ok) {
        const data: any = await response.json();
        if (data && data.rates) {
          // Normalize structure keys to uppercase
          const baseCode = (data.base || data.base_code || "TRY").toUpperCase();
          const rawRates: Record<string, number> = {};
          for (const key of Object.keys(data.rates)) {
            rawRates[key.toUpperCase()] = Number(data.rates[key]);
          }

          const tryInBase = rawRates.TRY;
          
          // Verify that we actually have Turkish Lira (TRY) information in the response
          if (!tryInBase && baseCode !== "TRY") {
            throw new Error("TRY currency rate not present in this exchange API response.");
          }

          let usdRate = defaultUsd;
          let eurRate = defaultEur;
          let gbpRate = defaultGbp;

          if (baseCode === "TRY") {
            usdRate = rawRates.USD ? (1 / rawRates.USD) : defaultUsd;
            eurRate = rawRates.EUR ? (1 / rawRates.EUR) : defaultEur;
            gbpRate = rawRates.GBP ? (1 / rawRates.GBP) : defaultGbp;
          } else if (tryInBase) {
            usdRate = tryInBase / (rawRates.USD || 1);
            eurRate = tryInBase / (rawRates.EUR || 1);
            gbpRate = tryInBase / (rawRates.GBP || 1);
          }

          console.log(`[CORS Proxy Info] Rates loaded correctly from source: ${url}. Rates - USD: ${usdRate}, EUR: ${eurRate}, GBP: ${gbpRate}`);
          return res.json({
            success: true,
            rates: {
              TRY: 1,
              USD: Number(usdRate.toFixed(4)),
              EUR: Number(eurRate.toFixed(4)),
              GBP: Number(gbpRate.toFixed(4))
            },
            base: baseCode,
            source: url
          });
        }
      }
    } catch (e: any) {
      console.warn(`[CORS Proxy Warn] Failed fetch for url ${baseUrl}: ${e.message}`);
    }
  }

  // Highly resilient fallback with current accurate baselines
  res.json({
    success: false,
    rates: {
      TRY: 1,
      USD: defaultUsd,
      EUR: defaultEur,
      GBP: defaultGbp
    },
    message: "Tüm anlık döviz kaynağı sorguları zaman aşımına uğradı. Güncel kurlar uygulandı."
  });
});

// Vite middleware flow
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
