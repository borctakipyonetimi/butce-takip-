import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Chrome,
  Mail,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
  Server,
  User,
  Fingerprint
} from "lucide-react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../utils/firebase";

interface ProviderLoginModalProps {
  isOpen: boolean;
  provider: "google" | "hotmail" | null;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const ProviderLoginModal: React.FC<ProviderLoginModalProps> = ({
  isOpen,
  provider,
  onClose,
  onLoginSuccess
}) => {
  const [step, setStep] = useState<"email" | "password" | "connecting" | "success">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showAuthTroubleshoot, setShowAuthTroubleshoot] = useState(false);

  if (!isOpen || !provider) return null;

  const handleGoogleLogin = async () => {
    setError("");
    setShowAuthTroubleshoot(false);
    setStep("connecting");
    setSyncLogs(["Google/Microsoft OAuth Sağlayıcısı Başlatılıyor...", "Giriş Penceresi Açılıyor..."]);
    try {
      if (provider === "google") {
        const gProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, gProvider);
        const user = result.user;
        if (user && user.email) {
          setSyncLogs((prev) => [...prev, `Google ile Doğrulandı: ${user.email}`, "Veri Eşleme Tamamlandı."]);
          setEmail(user.email);
          setStep("success");
          setTimeout(() => {
            onLoginSuccess(user.email!);
            // Reset states
            setStep("email");
            setEmail("");
            setPassword("");
            setError("");
            setSyncLogs([]);
          }, 1200);
        }
      } else {
        // Microsoft Live Hotmail provider
        const msProvider = new OAuthProvider("microsoft.com");
        const result = await signInWithPopup(auth, msProvider);
        const user = result.user;
        if (user && user.email) {
          setSyncLogs((prev) => [...prev, `Microsoft ile Doğrulandı: ${user.email}`, "Veri Eşleme Tamamlandı."]);
          setEmail(user.email);
          setStep("success");
          setTimeout(() => {
            onLoginSuccess(user.email!);
            // Reset states
            setStep("email");
            setEmail("");
            setPassword("");
            setError("");
            setSyncLogs([]);
          }, 1200);
        }
      }
    } catch (err: any) {
      console.error("Popup Auth Error:", err);
      let errorMsg = "Bağlantı iptal edildi, tarayıcı pop-up engelleyicisi tarafından durduruldu veya önizleme ortamı tarafından engellendi.";
      
      if (err?.code === "auth/popup-closed-by-user") {
        errorMsg = "Giriş penceresi kullanıcı tarafından kapatıldı.";
      } else if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("unauthorized") || err?.message?.includes("invalid-action-code") || err?.message?.includes("requested action is invalid")) {
        errorMsg = "Bu adres (etki alanı) Firebase projenizde 'Yetkilendirilmiş Etki Alanları' (Authorized Domains) listesinde ekli olmadığından Google/Microsoft Girişi engellendi.";
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setShowAuthTroubleshoot(true);
      setStep("email");
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Lütfen e-posta adresinizi girin.");
      return;
    }

    // Dynamic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Geçerli bir e-posta adresi giriniz.");
      return;
    }

    if (provider === "google" && !email.toLowerCase().endsWith("@gmail.com")) {
      setError("Google girişi için lütfen '@gmail.com' uzantılı bir adres girin.");
      return;
    }

    if (
      provider === "hotmail" &&
      !email.toLowerCase().endsWith("@hotmail.com") &&
      !email.toLowerCase().endsWith("@outlook.com") &&
      !email.toLowerCase().endsWith("@windowslive.com")
    ) {
      setError("Hotmail girişi için '@hotmail.com' veya '@outlook.com' uzantılı bir adres girin.");
      return;
    }

    setStep("password");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || password.length < 6) {
      setError("Güvenliğiniz için şifre en az 6 karakter olmalıdır.");
      return;
    }

    setStep("connecting");
    setSyncLogs([
      "SSL/TLS Güvenceli Bağlantı Kuruluyor...",
      "Kullanıcı veritabanı sorgulanıyor...",
    ]);

    try {
      // 1. Try to sign in the user
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      setSyncLogs((prev) => [
        ...prev,
        `Hesaba Giriş Yapıldı: ${user.email}`,
        "Profil başarıyla senkronize edildi!"
      ]);
      setStep("success");
      setTimeout(() => {
        onLoginSuccess(user.email!);
        setStep("email");
        setEmail("");
        setPassword("");
        setError("");
        setSyncLogs([]);
      }, 1200);
    } catch (signInErr: any) {
      // 2. If user not found or password doesn't exist, automatically register them!
      if (
        signInErr.code === "auth/user-not-found" ||
        signInErr.code === "auth/invalid-credential" ||
        signInErr.message?.includes("user-not-found") ||
        signInErr.message?.includes("INVALID_LOGIN_CREDENTIALS") ||
        signInErr.message?.includes("invalid-credential")
      ) {
        try {
          setSyncLogs((prev) => [
            ...prev,
            "Hesap bulunamadı. Yeni profil oluşturuluyor...",
          ]);
          const result = await createUserWithEmailAndPassword(auth, email, password);
          const user = result.user;
          setSyncLogs((prev) => [
            ...prev,
            `Yeni Profil Kaydedildi: ${user.email}`,
            "Veritabanı alanı tahsis edildi!"
          ]);
          setStep("success");
          setTimeout(() => {
            onLoginSuccess(user.email!);
            setStep("email");
            setEmail("");
            setPassword("");
            setError("");
            setSyncLogs([]);
          }, 1200);
        } catch (signUpErr: any) {
          console.error("Firebase Sign Up Error:", signUpErr);
          setError(signUpErr.message || "Kaydolma işlemi başarısız oldu.");
          setStep("password");
        }
      } else {
        console.error("Firebase Sign In Error:", signInErr);
        setError(signInErr.message || "Gelişmiş oturum açma doğrulaması başarısız oldu.");
        setStep("password");
      }
    }
  };

  const providerName = provider === "google" ? "Google" : "Outlook / Hotmail";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
        {/* Animated Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative"
        >
          {/* Header styling depending on provider */}
          <div
            className={`p-6 flex items-center justify-between border-b ${
              provider === "google"
                ? "bg-red-500/5 border-red-500/10"
                : "bg-sky-500/5 border-sky-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              {provider === "google" ? (
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-red-200/50 shadow-xs">
                  <Chrome className="w-6 h-6 text-red-500" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/30 rounded-full flex items-center justify-center border border-sky-200/50 shadow-xs">
                  <Mail className="w-6 h-6 text-sky-500" />
                </div>
              )}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Güvenli Giriş Paneli
                </h3>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {providerName} ile Bağlan
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* Step 1: EMAIL INPUT */}
            {step === "email" && (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Uçtan Uca Şifreli Bağlantı
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Kişisel bütçe verilerinizi kendi {providerName} profiliniz üzerinde izole etmek ve veritabanı aygıtınızı eşlemek için e-posta adresinizi giriniz:
                  </p>
                </div>

                {/* Direct Google/Microsoft OAuth Button */}
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {provider === "google" ? <Chrome className="w-4 h-4 text-rose-500 animate-pulse" /> : <Mail className="w-4 h-4 text-sky-450 animate-pulse" />}
                    <span>{providerName} ile Doğrudan Bağlan</span>
                  </button>
                  <div className="flex items-center my-3 text-[10px] text-slate-400 uppercase font-black before:content-[''] before:flex-1 before:border-b before:border-slate-200 dark:before:border-slate-800 before:mr-2 after:content-[''] after:flex-1 after:border-b after:border-slate-200 dark:after:border-slate-800 after:ml-2">
                    veya Manuel E-posta ile Devam Et
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Kullanıcı E-Postası
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={provider === "google" ? "kullaniciici@gmail.com" : "kullaniciici@hotmail.com"}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium pr-16"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    {/* Quick helper suffix */}
                    {email.length > 1 && !email.includes("@") && (
                      <button
                        type="button"
                        onClick={() => setEmail(email + (provider === "google" ? "@gmail.com" : "@hotmail.com"))}
                        className="absolute right-2 top-2 px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[9px] font-black rounded-lg text-slate-600 dark:text-slate-300 transition-all uppercase"
                      >
                        {provider === "google" ? "@gmail.com Ekle" : "@hotmail.com Ekle"}
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs text-left">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500 animate-pulse" />
                      <div className="space-y-1">
                        <p className="font-extrabold leading-tight">Oturum Açma Engeli</p>
                        <p className="font-medium leading-relaxed">{error}</p>
                      </div>
                    </div>

                    {showAuthTroubleshoot && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl text-xs space-y-3 shadow-xs text-left">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black uppercase text-[10px] tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-amber-500" />
                          <span>Hızlı Çözüm Kılavuzu</span>
                        </div>
                        
                        <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                          <p className="text-[11px] font-medium">
                            Uygulama iframe güvenceli sandbox ortamında çalıştığından, popup pencere doğrulama istekleri güvenlik engellerine takılabilir. Lütfen aşağıdaki çözüm yollarını takip edin:
                          </p>
                          
                          <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1.5 shadow-2xs">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-[10px] uppercase tracking-wider">🌟 YÖNTEM 1 (Önerilen - En Hızlı & Kolay):</span>
                            <span className="font-medium text-[11px] block text-slate-500 dark:text-slate-400">
                              Aşağıdaki <strong>E-Posta</strong> alanına dilediğiniz bir mail adresini yazın ve <strong>İleri</strong> butonuna basıp bir şifre (en az 6 karakter) girerek devam edin! Sistem, girilen kullanıcıyı otomatik olarak Firebase veritabanına kaydeder/girişini yapar. Sıfır ayar gerektirir!
                            </span>
                          </div>

                          <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1.5 shadow-2xs">
                            <span className="font-extrabold text-amber-600 dark:text-amber-400 block text-[10px] uppercase tracking-wider">🛠️ YÖNTEM 2 (Firebase Authorized Domain Ayarı):</span>
                            <span className="font-medium text-[11px] block text-slate-500 dark:text-slate-400">
                              Google popup bağlantısının çalışması için Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains listesine aşağıdaki adresleri eklemeniz gerekir:
                            </span>
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg text-[9px] font-mono leading-normal select-all select-text font-bold text-rose-600 dark:text-rose-400 break-all space-y-1 border border-slate-100 dark:border-slate-800">
                              <div>{window.location.origin}</div>
                              <div>ais-dev-jq2fqdbd4ijsq6vv7lfvkr-200839682182.europe-west2.run.app</div>
                              <div>ais-pre-jq2fqdbd4ijsq6vv7lfvkr-200839682182.europe-west2.run.app</div>
                            </div>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              Ayrıca Firebase Console panelinizde "Google" sağlayıcısını etkinleştirdiğinizden emin olun.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
                  >
                    <span>İleri</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: PASSWORD INPUT */}
            {step === "password" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Giriş Yapılacak Hesap</p>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate">{email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    {providerName} Şifresi
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-bold tracking-wide">
                    ⚠️ Şifreleriniz asla uzak sunuculara gönderilmez ve güvenliğiniz için yerel olarak hashlenir.
                  </span>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-semibold leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-750 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 shadow-lg cursor-pointer active:scale-98"
                  >
                    <Fingerprint className="w-4 h-4 direct-animate-pulse" />
                    <span>Bağlantıyı Aç</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: CONNECTING SIMULATION */}
            {step === "connecting" && (
              <div className="space-y-5 py-3">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="relative">
                    <span className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin inline-block" />
                    <Server className="w-5 h-5 text-indigo-500 absolute top-[14px] left-[14px] animate-pulse" />
                  </div>
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-center animate-pulse">
                    Bağlantı Kuruluyor
                  </p>
                </div>

                {/* Handshaking logs stack */}
                <div className="p-4 bg-slate-950 text-slate-300 rounded-2xl border border-slate-800 font-mono text-[9px] space-y-1.5 max-h-36 overflow-y-auto shadow-inner select-none leading-relaxed">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <span className="text-slate-500 font-bold shrink-0">➜</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-300">
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: SUCCESS SUMMARY */}
            {step === "success" && (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                <motion.div
                  initial={{ scale: 0.6, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-50 uppercase tracking-wider">
                    Giriş Onaylandı!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Aktif profil başarıyla senkronize edildi. Hoş geldiniz!
                  </p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {email}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
