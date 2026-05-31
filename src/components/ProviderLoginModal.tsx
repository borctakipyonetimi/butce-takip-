/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Chrome,
  Facebook,
  Github,
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
  Info
} from "lucide-react";
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../utils/firebase";

interface ProviderLoginModalProps {
  isOpen: boolean;
  provider: "google" | null;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const ProviderLoginModal: React.FC<ProviderLoginModalProps> = ({
  isOpen,
  provider,
  onClose,
  onLoginSuccess
}) => {
  const [step, setStep] = useState<"email" | "password" | "connecting" | "success" | "apkSync">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncCode, setSyncCode] = useState("");

  const resetForm = () => {
    setStep("email");
    setEmail("");
    setPassword("");
    setError("");
    setSyncLogs([]);
    setSyncCode("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !provider) return null;

  const handleSocialLogin = async (platform: "gmail" | "facebook" | "github" | "hotmail") => {
    setError("");
    setStep("connecting");

    let authProvider: any;
    let platformLabel = "";
    let emoji = "";

    if (platform === "gmail") {
      authProvider = new GoogleAuthProvider();
      authProvider.setCustomParameters({ prompt: "select_account" });
      platformLabel = "Gmail / Google";
      emoji = "🔴";
    } else if (platform === "facebook") {
      authProvider = new FacebookAuthProvider();
      platformLabel = "Facebook";
      emoji = "🔵";
    } else if (platform === "github") {
      authProvider = new GithubAuthProvider();
      platformLabel = "GitHub";
      emoji = "⚫";
    } else if (platform === "hotmail") {
      authProvider = new OAuthProvider("microsoft.com");
      platformLabel = "Hotmail / Microsoft";
      emoji = "🟤";
    }

    setSyncLogs([
      `${platformLabel} Bağlantısı Başlatılıyor ${emoji}`,
      "Güvenli Kimlik Sağlayıcısı sorgulanıyor...",
      "Lütfen açılan pencerede hesabınızı doğrulayın."
    ]);

    try {
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      if (user && (user.email || user.uid)) {
        const detectedEmail = user.email || `${user.uid}@${platform}.com`;
        setSyncLogs((prev) => [...prev, `${platformLabel} ile Doğrulandı: ${detectedEmail}`, "Mali kayıt defteri buluttan yükleniyor..."]);
        setEmail(detectedEmail);
        setStep("success");
        setTimeout(() => {
          onLoginSuccess(detectedEmail);
          resetForm();
        }, 1200);
      }
    } catch (err: any) {
      console.warn(`${platformLabel} Auth Error:`, err);
      let errorMsg = `Ortam kısıtlaması nedeniyle veya Firebase üzerinde ${platformLabel} yapılandırma ayarı henüz eklenmediği için pop-up penceresi tamamlanamadı.`;
      
      if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("unauthorized-domain")) {
        errorMsg = "Bu site henüz Firebase projenizin Yetkilendirilmiş Etki Alanları listesinde ekli değil. Lütfen Firebase Console'dan bu adresi ekleyin.";
      }

      setSyncLogs((prev) => [
        ...prev,
        `⚠️ Bilgi: ${platformLabel} bağlantısı tamamlanamadı.`,
        "Sorunsuz devam etmeniz için simüle edilmiş giriş aktif ediliyor...",
        `Lütfen ${platformLabel} için e-posta bilginizi giriniz.`
      ]);

      setTimeout(() => {
        setError(errorMsg + " Lütfen aşağıdaki manuel e-posta formunu kullanarak devam edin.");
        setStep("email");
      }, 1500);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Lütfen e-posta adresinizi girin.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Geçerli bir e-posta adresi giriniz.");
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
      "Hesap veritabanı sorgulanıyor...",
    ]);

    try {
      // 1. Try signing in
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
        resetForm();
      }, 1200);
    } catch (signInErr: any) {
      // 2. Fallback to registration if user not found
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
            "Hesap bulunamadı. Yeni bir Gmail/Kullanıcı profili oluşturuluyor...",
          ]);
          const result = await createUserWithEmailAndPassword(auth, email, password);
          const user = result.user;
          setSyncLogs((prev) => [
            ...prev,
            `Yeni Profil Başarıyla Kaydedildi: ${user.email}`,
            "Veritabanı alanı başarıyla tahsis edildi!"
          ]);
          setStep("success");
          setTimeout(() => {
            onLoginSuccess(user.email!);
            resetForm();
          }, 1200);
        } catch (signUpErr: any) {
          console.error("Firebase Sign Up Error:", signUpErr);
          setError(signUpErr.message || "Eşleşen yeni hesap oluşturulamadı.");
          setStep("password");
        }
      } else {
        console.error("Firebase Sign In Error:", signInErr);
        setError(signInErr.message || "Gelişmiş oturum açma doğrulaması başarısız oldu.");
        setStep("password");
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh] relative scrollbar-none"
        >
          {/* Top colored aesthetic streak */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />

          {/* Header styling */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-indigo-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-indigo-200/50 dark:border-slate-700 shadow-sm">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                  GÜVENLİ GİRİŞ PANELİ
                </h3>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Sosyal Hesap veya E-Posta ile Giriş
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* Step 1: EMAIL & OAUTH HUB */}
            {step === "email" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                      Uçtan Uca Güvenceli Bulut Bağlantısı
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    Kayıtlarınızı güvenle bulutta saklamak ve tüm cihazlarınızla anlık eşitlemek için dilediğiniz sosyal hesabınızla veya e-postanızla giriş yapın:
                  </p>
                </div>

                {/* Social Login Options (Gmail, Hotmail, Facebook, GitHub) */}
                <div className="space-y-3 pb-2 bg-slate-50 dark:bg-slate-1000/20 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Hızlı Giriş Seçenekleri</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Google/Gmail */}
                    <button
                      type="button"
                      onClick={() => handleSocialLogin("gmail")}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 dark:border-slate-800 rounded-xl text-[11px] font-black tracking-wide text-slate-800 dark:text-slate-100 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 shadow-sm"
                    >
                      <Chrome className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Gmail</span>
                    </button>

                    {/* Hotmail/Microsoft */}
                    <button
                      type="button"
                      onClick={() => handleSocialLogin("hotmail")}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 dark:border-slate-800 rounded-xl text-[11px] font-black tracking-wide text-slate-800 dark:text-slate-100 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 shadow-sm"
                    >
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Hotmail</span>
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={() => handleSocialLogin("facebook")}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 dark:border-slate-800 rounded-xl text-[11px] font-black tracking-wide text-slate-800 dark:text-slate-100 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 shadow-sm"
                    >
                      <Facebook className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Facebook</span>
                    </button>

                    {/* GitHub */}
                    <button
                      type="button"
                      onClick={() => handleSocialLogin("github")}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 dark:border-slate-800 rounded-xl text-[11px] font-black tracking-wide text-slate-800 dark:text-slate-100 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 shadow-sm"
                    >
                      <Github className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
                      <span>GitHub</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center my-3 text-[10px] text-slate-600 dark:text-slate-300 uppercase font-black before:content-[''] before:flex-1 before:border-b before:border-slate-200 dark:before:border-slate-800 before:mr-2 after:content-[''] after:flex-1 after:border-b after:border-slate-200 dark:after:border-slate-800 after:ml-2">
                  veya Manuel E-Posta ile Giriş
                </div>

                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                      E-Posta Adresi
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kullanici@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      />
                      <div className="absolute left-3 top-3.5 text-slate-500 dark:text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs text-left">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                      <div className="space-y-1">
                        <p className="font-extrabold leading-tight">Hata Oluştu</p>
                        <p className="font-medium leading-relaxed">{error}</p>
                      </div>
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
              </div>
            )}

            {/* Step 2: PASSWORD INPUT */}
            {step === "password" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">Giriş Yapılacak Hesap</p>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate">{email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Giriş Şifresi
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-500 dark:text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-300 block mt-0.5 font-bold tracking-wide">
                    ⚠️ Şifrenizi ilk kez giriyorsanız bu şifre ile hesabınız otomatik oluşturulur.
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
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 shadow-lg cursor-pointer active:scale-98"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Bağlantıyı Aç</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: CONNECTING STATUS */}
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

                <div className="p-4 bg-slate-950 text-slate-300 rounded-2xl border border-slate-800 font-mono text-[9px] space-y-1.5 max-h-36 overflow-y-auto shadow-inner select-none leading-relaxed">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5 animate-fadeIn">
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
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center animate-bounce">
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
                    Mali kayıt defteri hesabınızla senkronize edildi.
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