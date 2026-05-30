/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Fingerprint,
  HelpCircle,
  AlertTriangle
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
      biometricsEnabled: true,
      recoveryQuestion: "İlkokul öğretmeninizin adı nedir?",
      recoveryAnswer: "",
    };
  });

  // UI Flow modes: "idle" | "set_pin"
  const [setupMode, setSetupMode] = useState<"idle" | "set_pin">("idle");
  const [pinTemp, setPinTemp] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState("İlkokul öğretmeninizin adı nedir?");
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: PIN entry, 2: confirmation PIN entry, 3: recovery question
  const [validationError, setValidationError] = useState("");

  const saveSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem("security_settings", JSON.stringify(newSettings));
  };

  const handleToggleSecurity = () => {
    if (settings.isEnabled) {
      const next = {
        ...settings,
        isEnabled: false,
        pinCode: "",
        recoveryAnswer: "",
      };
      saveSettings(next);
      onSuccessToast("Ekran Kilidi Güvenliği Devre Dışı Bırakıldı! 🔓");
    } else {
      startSetupFlow();
    }
  };

  const startSetupFlow = () => {
    setValidationError("");
    setSetupMode("set_pin");
    setPinTemp("");
    setPinConfirm("");
    setRecoveryAnswer("");
    setStep(1);
  };

  const handlePinNext = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (pinTemp.length !== 4 || isNaN(Number(pinTemp))) {
      setValidationError("Şifre 4 haneli sayısal bir kod olmalıdır.");
      return;
    }

    setStep(2);
  };

  const handlePinConfirmNext = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (pinTemp !== pinConfirm) {
      setValidationError("Girdiğiniz PIN kodları uyuşmuyor. Lütfen tekrar deneyin.");
      setPinConfirm("");
      return;
    }

    setStep(3);
  };

  const handleRecoverySave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!recoveryAnswer.trim()) {
      setValidationError("Lütfen şifre kurtarma sorusu için geçerli bir cevap girin.");
      return;
    }

    const next = {
      ...settings,
      isEnabled: true,
      type: "pin",
      pinCode: pinTemp,
      recoveryQuestion: recoveryQuestion,
      recoveryAnswer: recoveryAnswer.trim().toLowerCase(),
      biometricsEnabled: settings.biometricsEnabled,
    };
    saveSettings(next);
    setSetupMode("idle");
    onSuccessToast("4 Haneli Güvenlik PIN Kodu ve Kurtarma Şifresi Başarıyla Etkinleştirildi! 🔒🛡️");
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        {/* Panel Header */}
        <div className="flex items-start justify-between gap-4">
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
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shrink-0 ${
              settings.isEnabled
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "bg-slate-150 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200"
            }`}
          >
            {settings.isEnabled ? "KİLİDİ KAPAT 🔓" : "KİLİDİ ETKİNLEŞTİR 🔒"}
          </button>
        </div>

        {/* Configurations status and credentials select */}
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
                ? "4 Haneli PIN Kodu ve Kurtarma Sorusu korunuyor."
                : "Herhangi bir şifre talep edilmiyor."}
            </span>
          </div>

          {/* Secure lock Info Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">KİLİT KORUMA TÜRÜ</span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block mt-2 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-500" />
                4 Haneli PIN Kodu
              </span>
            </div>
            {settings.isEnabled && (
              <button
                type="button"
                onClick={() => startSetupFlow()}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 font-extrabold text-left block mt-1.5 cursor-pointer"
              >
                Şifreyi ve Kurtarmayı Değiştir ⚙️
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
              onClick={async () => {
                const registerBiometricsObj = async () => {
                  if (!window.PublicKeyCredential) {
                    throw new Error("Tarayıcınız veya cihazınız WebAuthn biyometrik doğrulamayı desteklemiyor.");
                  }
                  
                  let isSupported = false;
                  try {
                    isSupported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                  } catch (e) {
                    throw new Error("Cihazınızda aktif edilmiş bir Touch ID / Face ID / Windows Hello biyometrik doğrulayıcısı algılanamadı veya izin verilmedi.");
                  }

                  if (!isSupported) {
                    throw new Error("Biyometrik doğrulayıcı bu cihazda kullanılamıyor.");
                  }

                  const challenge = new Uint8Array(32);
                  window.crypto.getRandomValues(challenge);
                  const userId = new Uint8Array(16);
                  window.crypto.getRandomValues(userId);

                  const createOptions: any = {
                    challenge,
                    rp: {
                      name: "Butcem Pro",
                      id: window.location.hostname || "localhost"
                    },
                    user: {
                      id: userId,
                      name: "ButcemProUser",
                      displayName: "Butcem Pro Biyometrik Giriş"
                    },
                    pubKeyCredParams: [
                      { type: "public-key", alg: -7 },
                      { type: "public-key", alg: -257 }
                    ],
                    authenticatorSelection: {
                      authenticatorAttachment: "platform",
                      userVerification: "required"
                    },
                    timeout: 60000
                  };

                  const credential = await navigator.credentials.create({ publicKey: createOptions });
                  if (credential) {
                    const rawId = new Uint8Array((credential as any).rawId);
                    let binary = "";
                    for (let i = 0; i < rawId.byteLength; i++) {
                      binary += String.fromCharCode(rawId[i]);
                    }
                    const credentialIdB64 = btoa(binary);
                    localStorage.setItem("biometric_credential_id", credentialIdB64);
                    return true;
                  }
                  return false;
                };

                const isTurningOn = !settings.biometricsEnabled;
                if (isTurningOn) {
                  try {
                    onSuccessToast("Parmak izinizi kaydetmek için cihazınız hazırlanıyor... 📱🔑");
                    const success = await registerBiometricsObj();
                    if (success) {
                      const next = { ...settings, biometricsEnabled: true };
                      saveSettings(next);
                      onSuccessToast("Gerçek parmak iziniz / Yüz ID cihazınızla başarıyla eşleştirildi! 🧬✅");
                    }
                  } catch (err: any) {
                    console.warn("Biyometrik cihaz kaydı başarısız oldu veya kısıtlandı:", err);
                    // Automatic fallback to high fidelity simulation mode
                    const next = { ...settings, biometricsEnabled: true };
                    saveSettings(next);
                    onSuccessToast("Simüle edilmiş parmak izi / Yüz ID yedek giriş modu aktif edildi! 🧬🛡️");
                  }
                } else {
                  const next = { ...settings, biometricsEnabled: false };
                  saveSettings(next);
                  localStorage.removeItem("biometric_credential_id");
                  onSuccessToast("Biyometrik yedek girişi kapatıldı.");
                }
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
                  Şifre ve Güvenlik Sorusunu Tanımla
                </span>
              </div>

              {step === 1 && (
                <form onSubmit={handlePinNext} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Yeni PIN Kodunu Girin (4 Rakam)</label>
                    <input
                      type="password"
                      inputMode="numeric"
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
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
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
              )}

              {step === 2 && (
                <form onSubmit={handlePinConfirmNext} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tekrar Girerek PIN Kodunu Onaylayın</label>
                    <input
                      type="password"
                      inputMode="numeric"
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
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
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
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      Devam Et (Kurtarma Sorusuna Geç)
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleRecoverySave} className="space-y-3">
                  <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 font-bold mb-1 flex items-start gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-indigo-505 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Şifrenizi unutmanız durumunda kilidi açmak için kullanılacak güvenlik sorusunu seçin ve kalıcı bir yanıt belirleyin.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Güvenlik Sorusu Seçiniz</label>
                    <select
                      value={recoveryQuestion}
                      onChange={(e) => setRecoveryQuestion(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="İlkokul öğretmeninizin adı nedir?">İlkokul öğretmeninizin adı nedir?</option>
                      <option value="En sevdiğiniz evcil hayvanın adı nedir?">En sevdiğiniz evcil hayvanın adı nedir?</option>
                      <option value="Doğduğunuz şehir hangisidir?">Doğduğunuz şehir hangisidir?</option>
                      <option value="İlk arabanızın markası nedir?">İlk arabanızın markası nedir?</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sorunun Yanıtı</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={recoveryAnswer}
                      onChange={(e) => setRecoveryAnswer(e.target.value)}
                      placeholder="Cevabınızı buraya yazınız..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  {validationError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 text-rose-500 text-[10px] font-bold rounded-xl flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-black rounded-lg cursor-pointer"
                    >
                      Geri Dön
                    </button>
                    <button
                      type="submit"
                      disabled={!recoveryAnswer.trim()}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      PIN ve Kurtarmayı Kaydet
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informative guidelines */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-850 flex gap-2 text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
          <HelpCircle className="w-5 h-5 mt-0.5 shrink-0 text-slate-400" />
          <div className="space-y-1">
            <p className="font-extrabold text-slate-750 dark:text-slate-300">💡 Güvenli Kilit Nasıl Çalışır?</p>
            <p>
              Uygulamayı kapatıp tekrar açtığınızda otomatik kalkan devreye girer. Şifreyi 5 kez üst üste yanlış girmeniz durumunda sistem geçici olarak 30 saniye boyunca kendini askıya alır. Şifrenizi unuttuysanız, belirlediğiniz Güvenlik Sorusu ve Gizli Yanıt ile şifrenizi sıfırlayabilir veya Cihaz Parmak İzi / Yüz ID'niz ile kalkanı anında açabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
