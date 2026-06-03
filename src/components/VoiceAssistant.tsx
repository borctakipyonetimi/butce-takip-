import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  VolumeX, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Info, 
  Loader2, 
  Send,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  CreditCard,
  UserCheck
} from "lucide-react";

interface VoiceAssistantProps {
  onSaveDebt: (debtData: any, autoCreateAlarm?: boolean) => void;
  onSaveIncome: (incData: any) => void;
  onSaveExpense: (expData: any) => void;
  onSaveInstallment: (instData: any) => void;
  userApiKey?: string;
  triggerToast: (msg: string) => void;
}

export default function VoiceAssistant({
  onSaveDebt,
  onSaveIncome,
  onSaveExpense,
  onSaveInstallment,
  userApiKey,
  triggerToast
}: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    try {
      // Check SpeechRecognition cross-browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      } else {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = "tr-TR";
        rec.interimResults = false;

        rec.onstart = () => {
          isActiveRef.current = true;
          setIsListening(true);
          setStatus("listening");
          setErrorMsg("");
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          setManualInput(text);
          isActiveRef.current = false;
          stopListening();
          handleProcessText(text);
        };

        rec.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          isActiveRef.current = false;
          if (event.error === "not-allowed") {
            setErrorMsg("Mikrofon erişimi engellendi. Tarayıcı izinlerini açın.");
          } else {
            setErrorMsg("Ses algılanamadı, lütfen tekrar deneyin.");
          }
          setStatus("error");
          setIsListening(false);
        };

        rec.onend = () => {
          isActiveRef.current = false;
          setIsListening(false);
          
          // Safe, controlled async restart if requested
          if (shouldRestartRef.current) {
            shouldRestartRef.current = false;
            setTimeout(() => {
              startListening();
            }, 30);
          }
        };

        recognitionRef.current = rec;
      }
    } catch (e) {
      console.warn("SpeechRecognition initialization failed or blocked in this webview-container:", e);
      setIsSupported(false);
    }

    // Component unmount cleanup
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn("Speech unmount cleanup ignored error:", e);
        }
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      // Cancel previous speakings
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";
      // Find a natural Turkish voice if possible
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find(v => v.lang.startsWith("tr"));
      if (trVoice) {
        utterance.voice = trVoice;
      }
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Readback failure:", e);
    }
  };

  const startListening = () => {
    if (!isSupported) {
      triggerToast("Tarayıcınızda Ses Tanıma modu aktif değil, elle komut girebilirsiniz.");
      return;
    }
    
    // Stop speaking
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setTranscript("");
    setErrorMsg("");
    setAiResponse(null);

    // If the browser recognition is already active, request an abort first
    // and flag a restart once 'onend' has clean up resources.
    if (isActiveRef.current) {
      shouldRestartRef.current = true;
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn("Speech abort error ignored during restart trigger:", e);
      }
      return;
    }

    shouldRestartRef.current = false;

    try {
      setIsListening(true);
      setStatus("listening");
      recognitionRef.current.start();
      isActiveRef.current = true;
    } catch (e: any) {
      if (e.message && e.message.includes("already started")) {
        console.warn("Speech engine is already started state:", e.message);
        isActiveRef.current = true;
        setIsListening(true);
        setStatus("listening");
      } else {
        setErrorMsg("Mikrofon başlatılamadı.");
        setStatus("error");
        setIsListening(false);
        isActiveRef.current = false;
      }
    }
  };

  const stopListening = () => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // Use abort to force end instantly
      } catch (e) {
        console.warn("Speech stop warning ignored:", e);
      }
    }
    isActiveRef.current = false;
    setIsListening(false);
  };

  const handleProcessText = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    setStatus("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToProcess, userApiKey }),
      });

      if (!res.ok) {
        throw new Error("Sunucu bağlantısı kurulamadı (Ses Analizi).");
      }

      const data = await res.json();
      setAiResponse(data);

      if (data.action && data.action !== "unknown") {
        applyAction(data);
        setStatus("success");
        if (audioEnabled) {
          speakText(data.explanation);
        }
      } else {
        setStatus("error");
        setErrorMsg(data.explanation || "Söylediğiniz ifade bütçe şablonlarıyla eşleşmedi.");
        if (audioEnabled) {
          speakText(data.explanation || "Söylediğiniz ifade bütçe şablonlarıyla eşleşmedi. Lütfen farklı şekilde söylemeyi deneyin.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Bütçe kaydı ayrıştırılırken bir servis hatası oluştu.");
      setStatus("error");
    }
  };

  const applyAction = (data: any) => {
    const { action, debtData, installmentData, expenseData, incomeData } = data;

    try {
      switch (action) {
        case "addDebt":
          if (debtData) {
            onSaveDebt({
              name: debtData.name || "Sesli Borç",
              amount: Number(debtData.amount) || 0,
              paid: Number(debtData.paid) || 0,
              category: debtData.category || "Şahıs",
              dueDate: debtData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            }, true); // Auto create alarm
          }
          break;

        case "addInstallment":
          if (installmentData) {
            onSaveInstallment({
              name: installmentData.name || "Sesli Taksit",
              totalAmount: Number(installmentData.totalAmount) || 0,
              installmentCount: Number(installmentData.installmentCount) || 12,
              paidInstallmentCount: Number(installmentData.paidInstallmentCount) || 0,
              firstDueDate: installmentData.firstDueDate || new Date().toISOString().slice(0, 10)
            });
          }
          break;

        case "addExpense":
          if (expenseData) {
            onSaveExpense({
              amount: Number(expenseData.amount) || 0,
              description: expenseData.description || "Sesli Harcama",
              categoryId: Number(expenseData.categoryId) || 1
            });
          }
          break;

        case "addIncome":
          if (incomeData) {
            onSaveIncome({
              name: incomeData.name || "Sesli Gelir",
              amount: Number(incomeData.amount) || 0,
              date: incomeData.date || new Date().toISOString().slice(0, 10)
            });
          }
          break;

        default:
          console.warn("Bilinmeyen asistan işlemi:", action);
      }
    } catch (e) {
      console.error("Sesli asistan eylem kaydı hatası:", e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput);
    handleProcessText(manualInput);
  };

  const handleQuickCommand = (sampleCmd: string) => {
    setManualInput(sampleCmd);
    setTranscript(sampleCmd);
    handleProcessText(sampleCmd);
  };

  const toggleOpen = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsOpen(!isOpen);
    // Reset state on toggle
    if (!isOpen) {
      setStatus("idle");
      setTranscript("");
      setManualInput("");
      setAiResponse(null);
      setErrorMsg("");
    } else {
      stopListening();
    }
  };

  return (
    <>
      {/* Floating Microphone Trigger Pin Button */}
      <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-40">
        <motion.button
          onClick={toggleOpen}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          animate={isOpen ? { rotate: 90 } : {}}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-indigo-500/30 cursor-pointer border border-indigo-400/30 transition-shadow group"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Mic className="w-6 h-6 animate-none" />
              {/* Pulsing indicator circle when audio/assistance is active */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500"></span>
              </span>
            </div>
          )}
          
          {/* Label tooltip hovering slightly on desktop search */}
          <span className="absolute right-16 bg-slate-900 border border-slate-700 text-slate-100 text-[10px] font-black uppercase py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-wider shadow-md whitespace-nowrap">
            Sesli Asistan 🔊
          </span>
        </motion.button>
      </div>

      {/* Slide-over Full Custom Dialog Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleOpen}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog container */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh] sm:max-h-[80vh] z-10"
            >
              {/* Aesthetic Card Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-1.5 leading-none">
                      Bütçem Sesli Asistanı
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">
                      Yapay Zekâ ile Akıllı Bütçe Girişi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Speech synthesis audio feedback toggle */}
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`p-2 rounded-xl transition ${
                      audioEnabled 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" 
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    }`}
                    title={audioEnabled ? "Sesli Onay Açık" : "Sesli Onay Kapalı"}
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleOpen}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Dynamic Body Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Visual Audio Waveform panel */}
                <div className="flex flex-col items-center justify-center py-6 bg-slate-950/40 rounded-2xl border border-slate-800 relative overflow-hidden min-h-[160px]">
                  
                  {/* Backdrop glowing sphere decoration */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                  {isListening ? (
                    <div className="space-y-4 flex flex-col items-center justify-center">
                      {/* Animated Soundwave lines */}
                      <div className="flex items-center gap-1.5 h-12">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                          const delays = [0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.15, 0.35, 0.45, 0.25];
                          return (
                            <motion.span
                              key={bar}
                              animate={{ 
                                height: ["12px", "44px", "12px"],
                                backgroundColor: ["#6366f1", "#a855f7", "#ec4899", "#6366f1"]
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1.2, 
                                delay: delays[bar-1],
                                ease: "easeInOut"
                              }}
                              className="w-1.5 rounded-full"
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-indigo-300 font-extrabold animate-pulse tracking-wide uppercase">
                        Sizi dinliyorum, konuşun...
                      </p>
                    </div>
                  ) : status === "processing" ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                      <p className="text-xs text-indigo-200 font-extrabold tracking-wide uppercase animate-pulse">
                        Söylediklerinizi analiz ediyorum...
                      </p>
                    </div>
                  ) : status === "success" && aiResponse ? (
                    <div className="space-y-3 flex flex-col items-center text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
                        <Check className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/15">
                        {aiResponse.action === "addDebt" && "KAYIT: NAKİT BORÇ"}
                        {aiResponse.action === "addInstallment" && "KAYIT: TAKSİT PLANI"}
                        {aiResponse.action === "addExpense" && "KAYIT: HARCAMA"}
                        {aiResponse.action === "addIncome" && "KAYIT: GELİR KAYDI"}
                      </span>
                      <p className="text-xs font-bold text-slate-200 leading-relaxed max-w-sm">
                        {aiResponse.explanation}
                      </p>
                    </div>
                  ) : status === "error" ? (
                    <div className="space-y-3 flex flex-col items-center text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-rose-300 max-w-sm">
                        {errorMsg}
                      </p>
                      <button
                        onClick={startListening}
                        className="py-1 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white rounded-lg transition active:scale-95 cursor-pointer mt-1"
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <motion.button
                        onClick={startListening}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:text-white hover:bg-indigo-600 flex items-center justify-center cursor-pointer shadow-lg transition-all"
                      >
                        <Mic className="w-7 h-7" />
                      </motion.button>
                      <p className="text-xs text-slate-400 font-bold max-w-xs text-center leading-relaxed">
                        Kaydı başlatmak için mikrofona dokunun ve komutunuzu sesli söyleyin.
                      </p>
                    </div>
                  )}
                </div>

                {/* Real-time transcribed display fallback */}
                {transcript && (
                  <div className="p-3.5 bg-slate-950/20 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Algılanan Ses Kaydı
                    </span>
                    <p className="text-slate-200 font-medium italic">
                      "{transcript}"
                    </p>
                  </div>
                )}

                {/* Form Input for Manual Type Fallback (If not supported or in very noisy environments) */}
                <form onSubmit={handleManualSubmit} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Yazılı / Düzenlenebilir Bütçe Komutu
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Örn: Market için 150 lira gider kaydet"
                      disabled={isListening || status === "processing"}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-4 pr-12 text-xs font-bold text-slate-200 placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition"
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim() || isListening || status === "processing"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition active:scale-95 cursor-pointer"
                    >
                      {status === "processing" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </form>

                {/* Practical examples & command guides panel */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Örnek Türkçe Sesli Komutlar:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleQuickCommand("Ahmet'e borç 4000 lira")}
                      className="p-2.5 bg-slate-950/20 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition flex items-center gap-2 text-left text-slate-300 hover:text-white"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-indigo-200">Kişisel Borç Kaydı</span>
                        <span className="text-slate-500">"Ahmet'e borç 4000 lira"</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickCommand("Telefon taksiti 12000 lira 12 taksit")}
                      className="p-2.5 bg-slate-950/20 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition flex items-center gap-2 text-left text-slate-300 hover:text-white"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-amber-200">Taksit Planı</span>
                        <span className="text-slate-500">"Telefon taksiti 12000 TL 11 taksit"</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickCommand("Market mutfak harcaması 250 lira")}
                      className="p-2.5 bg-slate-950/20 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition flex items-center gap-2 text-left text-slate-300 hover:text-white"
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-rose-200">Anlık Harcama/Gider</span>
                        <span className="text-slate-500">"Market harcaması 250 TL"</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickCommand("Maaş yattı 35000 lira")}
                      className="p-2.5 bg-slate-950/20 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition flex items-center gap-2 text-left text-slate-300 hover:text-white"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-emerald-200">Gelir Kaydı</span>
                        <span className="text-slate-500">"Maaş yattı 35000 lira"</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Tips bottom bar Footer */}
              <div className="p-4 bg-slate-950 px-6 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-500">
                <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>
                  Sesi algılama süresi bittiğinde veya konuşmayı kestiğinizde asistan bütçe girişini kendiliğinden saniyeler içinde tamamlar.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
