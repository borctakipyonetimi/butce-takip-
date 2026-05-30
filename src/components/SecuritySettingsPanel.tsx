/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Fingerprint,
  Grid,
  Settings,
  HelpCircle,
  Unlock,
  Sparkles,
  Lock
} from "lucide-react";

interface SecuritySettingsPanelProps {
  onSuccessToast: (msg: string) => void;
}

export const SecuritySettingsPanel: React.FC<SecuritySettingsPanelProps> = ({ onSuccessToast }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("security_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      isEnabled: false,
      type: "pin",
      pinCode: "",
      patternCode: "",
      biometricsEnabled: true,
    };
  });

  // UI Flow modes: "idle" | "set_pin" | "set_pattern"
  const [setupMode, setSetupMode] = useState<"idle" | "set_pin" | "set_pattern">("idle");
  const [pinTemp, setPinTemp] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // first entry and confirmation entry
  const [validationError, setValidationError] = useState("");

  // Pattern states for setting custom pattern
  const [patternDots, setPatternDots] = useState<number[]>([]);
  const [firstPattern, setFirstPattern] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem("security_settings", JSON.stringify(newSettings));
  };

  const handleToggleSecurity = () => {
    if (settings.isEnabled) {
      // Prompt to turn off - disable instantly and clean saved codes
      const next = {
        ...settings,
        isEnabled: false,
        pinCode: "",
        patternCode: "",
      };
      saveSettings(next);
      onSuccessToast("Ekran Kilidi Güvenliği Devre Dışı Bırakıldı! 🔓");
    } else {
      // Prompt setup mode depending on current type
      startSetupFlow(settings.type);
    }
  };

  const startSetupFlow = (type: "pin" | "pattern") => {
    setValidationError("");
    if (type === "pin") {
      setSetupMode("set_pin");
      setPinTemp("");
      setPinConfirm("");
      setStep(1);
    } else {
      setSetupMode("set_pattern");
      setPatternDots([]);
      setFirstPattern("");
      setStep(1);
    }
  };

  const handlePinNext = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (pinTemp.length !== 4 || isNaN(Number(pinTemp))) {
      setValidationError("Şifre en az ve en fazla 4 haneli sayısal bir kod olmalıdır.");
      return;
    }

    setStep(2);
  };

  const handlePinSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (pinTemp !== pinConfirm) {
      setValidationError("Girdiğiniz PIN kodları uyuşmuyor. Lütfen tekrar deneyin.");
      setPinConfirm("");
      return;
    }

    const next = {
      ...settings,
      isEnabled: true,
      type: "pin" as const,
      pinCode: pinTemp,
    };
    saveSettings(next);
    setSetupMode("idle");
    onSuccessToast("4 Haneli Güvenlik PIN Kodu Başarıyla Etkinleştirildi! 🔒");
  };

  // Pattern Setting Helpers
  const handlePatternStart = (index: number) => {
    setIsDrawing(true);
    setValidationError("");
    setPatternDots([index]);
  };

  const handlePatternHover = (index: number) => {
    if (!isDrawing) return;
    if (patternDots.includes(index)) return;
    setPatternDots((prev) => [...prev, index]);
  };

  const handlePatternTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const dotId = element.getAttribute("data-dot-index");
      if (dotId !== null) {
        handlePatternStart(parseInt(dotId));
      }
    }
  };

  const handlePatternTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const dotId = element.getAttribute("data-dot-index");
      if (dotId !== null) {
        handlePatternHover(parseInt(dotId));
      }
    }
  };

  const handlePatternEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (patternDots.length < 3) {
      setValidationError("Çizim en az 3 koordinattan oluşmalıdır.");
      setPatternDots([]);
      return;
    }

    const patternStr = patternDots.join(",");

    if (step === 1) {
      setFirstPattern(patternStr);
      setPatternDots([]);
      setStep(2);
    } else {
      if (patternStr !== firstPattern) {
        setValidationError("Çizim desenleriniz eşleşmedi. Lütfen adımları yeniden takip edin.");
        setPatternDots([]);
        return;
      }

      const next = {
        ...settings,
        isEnabled: true,
        type: "pattern" as const,
        patternCode: patternStr,
      };
      saveSettings(next);
      setSetupMode("idle");
      onSuccessToast("Yeni Çizim Deseni Başarıyla Kaydedildi ve Etkinleşti! 🌀");
    }
  };

  const getDotCoordinates = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: col * 100 + 50,
      y: row * 100 + 50,
    };
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        {/* Panel Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
              Uygulama Giriş Güvenliği & Kilit Sistemi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-lg">
              Kişisel bütçenizi, alacak/borç verilerinizi ve hesap detaylarınızı üçüncü şahıslardan saklayın. Uygulama her açıldığında veya kilit aktifken bir kod sorulmasını sağlayabilirsiniz.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSecurity}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm ${
              settings.isEnabled
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "bg-slate-150 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200"
            }`}
          >
            {settings.isEnabled ? "GÖREVLİ: AKTİF" : "DEVRE DIŞI ⚠️"}
          </button>
        </div>

        {/* Configurations status and type select */}
        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          {/* Status Indicator Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">GÜVENLİK MODELİ</span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block mt-1.5 flex items-center gap-1.5">
                {settings.isEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    Koruma Devrede
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    Şifresiz Erişim
                  </>
                )}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-2">
              {settings.isEnabled
                ? `${settings.type === "pin" ? "PIN Kodu" : "Çizim Deseni"} korunuyor.`
                : "Herhangi bir şifre talep edilmiyor."}
            </span>
          </div>

          {/* Secure lock Selector Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">KİLİT KORUMA TÜRÜ</label>
              <select
                disabled={setupMode !== "idle"}
                value={settings.type}
                onChange={(e) => {
                  const type = e.target.value as "pin" | "pattern";
                  const next = { ...settings, type };
                  saveSettings(next);
                  if (settings.isEnabled) {
                    startSetupFlow(type);
                  }
                }}
                className="w-full mt-2 py-1 bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black cursor-pointer focus:outline-none"
              >
                <option value="pin">4 Haneli PIN Kodu</option>
                <option value="pattern">Çizim Deseni (Pattern Lock)</option>
              </select>
            </div>
            {settings.isEnabled && (
              <button
                type="button"
                onClick={() => startSetupFlow(settings.type)}
                className="text-[10px] text-indigo-500 hover:underline font-extrabold text-left block mt-1.5"
              >
                Şifreyi Değiştir ⚙️
              </button>
            )}
          </div>

          {/* Biometrics Opt-in Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                BİYOMETRİK YEDEK
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Parmak İzi / Yüz ID
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.biometricsEnabled;
                const next = { ...settings, biometricsEnabled: nextVal };
                saveSettings(next);
                onSuccessToast(nextVal ? "Biyometrik yedek girişi aktif edildi! 🧬" : "Biyometrik yedek girişi kapatıldı.");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
                settings.biometricsEnabled
                  ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {settings.biometricsEnabled ? "AÇIK" : "KAPALI"}
            </button>
          </div>
        </div>

        {/* DETAILED INTERACTIVE SETUP FORMS */}
        <AnimatePresence mode="wait">
          {setupMode === "set_pin" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  New 4-Digit Security Pin Setup
                </span>
              </div>

              {step === 1 ? (
                <form onSubmit={handlePinNext} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Yeni PIN Kodunu Girin (4 Rakam)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinTemp}
                      onChange={(e) => setPinTemp(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-[0.5em] text-lg font-black bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                      placeholder="••••"
                      autoFocus
                    />
                  </div>

                  {validationError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[10px] font-bold rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setSetupMode("idle")}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-black rounded-lg cursor-pointer"
                    >
                      Kapat
                    </button>
                    <button
                      type="submit"
                      disabled={pinTemp.length !== 4}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      Devam Et
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePinSave} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tekrar Girerek PIN Kodunu Onaylayın</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-[0.5em] text-lg font-black bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                      placeholder="••••"
                      autoFocus
                    />
                  </div>

                  {validationError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 text-rose-500 text-[10px] font-bold rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-black rounded-lg cursor-pointer"
                    >
                      Geri Dön
                    </button>
                    <button
                      type="submit"
                      disabled={pinConfirm.length !== 4}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      PIN Kaydet ve Etkinleştir
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {setupMode === "set_pattern" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl space-y-4 overflow-hidden text-center"
            >
              <div className="flex items-center gap-2 justify-center">
                <Grid className="w-4.5 h-4.5 text-indigo-500" />
                <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-widest">
                  {step === 1 ? "1. Yeni Deseni Çiziniz" : "2. Deseni Onaylamak İçin Tekrar Çiziniz"}
                </span>
              </div>

              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed max-w-xs mx-auto">
                {step === 1
                  ? "Fareyi sürükleyerek veya dokunarak en az 3 noktayı birbirine bağlayacak şekilde deseninizi çizin."
                  : "İlk aşamada çizdiğiniz yolun aynısını tekrar çizerek doğruluğu pekiştirin."}
              </p>

              {/* DRAW CANVAS AREA */}
              <div className="relative w-56 h-56 mx-auto bg-slate-950/90 border border-indigo-500/10 rounded-3xl p-4 overflow-hidden shadow-2xl">
                {/* SVG Connecting Tracks */}
                <svg
                  ref={svgRef}
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  onTouchEnd={handlePatternEnd}
                  onMouseUp={handlePatternEnd}
                >
                  {patternDots.map((dot, idx) => {
                    if (idx === 0) return null;
                    const start = getDotCoordinates(patternDots[idx - 1]);
                    const end = getDotCoordinates(dot);
                    return (
                      <line
                        key={idx}
                        x1={`${start.x}%`}
                        y1={`${start.y}%`}
                        x2={`${end.x}%`}
                        y2={`${end.y}%`}
                        stroke="#6366f1"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                {/* 3x3 Interaction Circles */}
                <div
                  className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full relative z-20"
                  onTouchStart={handlePatternTouchStart}
                  onTouchMove={handlePatternTouchMove}
                  onTouchEnd={handlePatternEnd}
                  onMouseLeave={handlePatternEnd}
                  onMouseUp={handlePatternEnd}
                >
                  {Array.from({ length: 9 }).map((_, i) => {
                    const isSelected = patternDots.includes(i);
                    return (
                      <div
                        key={i}
                        data-dot-index={i}
                        onMouseDown={() => handlePatternStart(i)}
                        onMouseEnter={() => handlePatternHover(i)}
                        className="flex items-center justify-center cursor-pointer w-full h-full"
                      >
                        <div
                          data-dot-index={i}
                          className={`w-9 h-9 rounded-full border border-white/5 flex items-center justify-center transition-all ${
                            isSelected ? "bg-indigo-500/20 border-indigo-400 scale-110" : "bg-slate-900/60 hover:bg-slate-800"
                          }`}
                        >
                          <div
                            data-dot-index={i}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              isSelected ? "bg-indigo-500" : "bg-slate-400"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {validationError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[10px] font-bold rounded-xl flex items-center gap-1.5 max-w-xs mx-auto">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setSetupMode("idle")}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-750 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                >
                  Setup İptal Et
                </button>
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setPatternDots([]);
                      setFirstPattern("");
                    }}
                    className="px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Baştan Çiz
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informative guidelines */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-850 flex gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
          <HelpCircle className="w-5 h-5 mt-0.5 shrink-0 text-slate-400" />
          <div className="space-y-1">
            <p className="font-extrabold text-slate-705 dark:text-slate-300">💡 Güvenli Kilit Nasıl Çalışır?</p>
            <p>
              Uygulamayı kapatıp tekrar açtığınızda otomatik kalkan devreye girer. Şifreyi 5 kez üst üste yanlış girmeniz durumunda sistem geçici olarak 30 saniye boyunca kendini askıya alır. PIN veya Desenini unutan kullanıcılar, cihazlarında kayıtlı Parmak İzi veya Yüz Tanıma (Biyometrik) ile kalkanı anında aşabilirler.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
