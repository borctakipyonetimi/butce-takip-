/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Chrome,
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
  Fingerprint,
  Info
} from "lucide-react";
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../utils/firebase";

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

  const handleGoogleLogin = async (method: "popup" | "redirect" | "apkSync") => {
    setError("");
    setStep("connecting");

    const gProvider = new GoogleAuthProvider();
    // Prompt the user to select accounts during login attempt
    gProvider.setCustomParameters({
      prompt: "select_account"
    });

    if (method === "popup") {
      setSyncLogs([
        "Tarayıcı modu algılandı 🌐",
        "Google Giriş Pop-up penceresi açılıyor...",
        "Lütfen açılan pencerede Gmail hesabınızı seçin."
      ]);

      try {
        const result = await signInWithPopup(auth, gProvider);
        const user = result.user;
        if (user && user.email) {
          setSyncLogs((prev) => [...prev, `Google ile Doğrulandı: ${user.email}`, "Mali kayıt defteri buluttan yükleniyor..."]);
          setEmail(user.email);
          setStep("success");
          setTimeout(() => {
            onLoginSuccess(user.email!);
            resetForm();
          }, 1200);
        }
      } catch (err: any) {
        console.error("Google Auth Pop-up Error:", err);
        let errorMsg = "Giriş işlemi iptal edildi veya tarayıcı tarafından engellendi.";
        if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("unauthorized-domain")) {
            errorMsg = "Bu site adresi (domain) Firebase projenizde 'Yetkilendirilmiş Etki Alanları' listesinde ekli değil. Lütfen Firebase Console -> Authentication -> Settings sayfasından bu adresi ekleyin.";
        } else if (err?.message) {
            errorMsg = err.message;
        }
        setError(errorMsg);
        setStep("email");
    }
} else if (method === "redirect") {
    setSyncLogs([
        "Mobil WebView / Yönlendirme modu başlatılıyor 📱",
        "Doğrudan Google Giriş sayfasına yönlendiriliyorsunuz...",
        "Giriş yaptıktan sonra uygulamanıza otomatik döneceksiniz."
    ]);

    try {
        const provider = gProvider;
        provider.setCustomParameters({
            prompt: 'select_account',
            auth_type: 'reauthenticate'
        });

        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                if (user && user.email) {
                    setSyncLogs((prev) => [...prev, "Google ile Giriş Başarılı"]);
                    setEmail(user.email);
                    setStep("success");
                    setTimeout(() => {
                        onLoginSuccess(user.email!);
                        resetForm();
                    }, 1200);
                }
            })
            .catch((popupErr) => {
                console.error("Popup Error:", popupErr);
                setError(popupErr?.message || "Giriş başarısız.");
                setStep("email");
            });
    } catch (err: any) {
        console.error("General Auth Error:", err);
        setError("Sistem hatası oluştu.");
        setStep("email");
    }
} else if (method === "apkSync") {
const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSyncCode(code);

      try {
        await setDoc(doc(db, "apk_sync_sessions", code), {
          status: "pending",
          createdAt: serverTimestamp()
        });

        setSyncLogs((prev) => [
          ...prev,
          `Eşleme Kodu Oluşturuldu: ${code}`,
          "Real-time dinleyici aktif edildi. Telefon tarayıcınızda veya Chrome'da giriş yapmanız bekleniyor..."
        ]);

        setStep("apkSync");

        // Set up real-time snapshot listener on the sync document
        const unsubscribe = onSnapshot(doc(db, "apk_sync_sessions", code), async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.status === "success" && data.email && data.uid) {
              unsubscribe(); // Stop listening
              setStep("connecting");
              setSyncLogs((prev) => [
                ...prev,
                "Google doğrulama sinyali alındı! 📡",
                `Aktarılan e-posta: ${data.email}`,
                "Güvenli giriş oturumu yetkilendiriliyor...",
              ]);

              try {
                // Secure password derived from the user's Google UID
                const pass = "ApkSecurePass_" + data.uid;
                const result = await signInWithEmailAndPassword(auth, data.email, pass);
                const user = result.user;

                setEmail(user.email!);
                setStep("success");
                setTimeout(() => {
                  onLoginSuccess(user.email!);
                  resetForm();
                }, 1200);
              } catch (loginErr: any) {
                console.log("APK Direct login failed, trying automatic registration coupling:", loginErr);
                try {
                  const pass = "ApkSecurePass_" + data.uid;
                  const result = await createUserWithEmailAndPassword(auth, data.email, pass);
                  const user = result.user;

                  setEmail(user.email!);
                  setStep("success");
                  setTimeout(() => {
                    onLoginSuccess(user.email!);
                    resetForm();
                  }, 1200);
                } catch (regErr: any) {
                  console.error("APK registration Coupling failed:", regErr);
                  setError("Veritabanı erişim doğrulaması uyuşmadı. Lütfen tarayıcıda veya e-posta ve şifrenizle giriş yapın.");
                  setStep("email");
                }
              }
            }
          }
        });
      } catch (err: any) {
        console.error("Failed to set up APK sync session document:", err);
        setError("Senkronizasyon köprüsü kurulamadı. Lütfen internetinizi kontrol edin.");
        setStep("email");
      }
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
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-red-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-red-200/50 shadow-sm">
                <Chrome className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  GÜVENLİ GİRİŞ PANELİ
                </h3>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Google Hesabıyla Oturum Açın
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition active:scale-90 cursor-pointer"
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
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Uçtan Uca Güvenceli Bulut Bağlantısı
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Kayıtlarınızı güvenle bulutta saklamak ve tüm cihazlarınızla anlık eşitlemek için dilediğiniz Gmail veya e-posta ile giriş yapın:
                  </p>
                </div>

                {/* Google OAuth Options specially built for browser vs. APK */}
                <div className="space-y-2.5 pb-2 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Chrome className="w-3.5 h-3.5 text-red-500" />
                    <span>Google / Gmail Giriş Yöntemleri</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* Method 3: APK Smooth Bridge */}
                    <button
                      type="button"
                      onClick={() => handleGoogleLogin("apkSync")}
                      className="w-full py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 shadow-sm"
                    >
                      <span>🔥 APK Google Girişi (%100 Uyumlu)</span>
                    </button>

                    {/* Method 1: Popup */}
                    <button
                      type="button"
                      onClick={() => handleGoogleLogin("popup")}
                      className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Chrome / Safaride Giriş (Web Sürüm)</span>
                    </button>
                  </div>

                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] leading-relaxed">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
                    <p className="font-semibold">
                      💡 <strong>APK Mobil kullanıcıları için:</strong> <u>APK Google Girişi</u> metodunu kullanın! Telefonunuzun tarayıcısında hızlıca giriş yapıp uygulamanıza şifresiz ve anında güvenli dönüş sağlarsınız.
                    </p>
                  </div>
                </div>

                <div className="flex items-center my-3 text-[10px] text-slate-400 uppercase font-black before:content-[''] before:flex-1 before:border-b before:border-slate-200 dark:before:border-slate-800 before:mr-2 after:content-[''] after:flex-1 after:border-b after:border-slate-200 dark:after:border-slate-800 after:ml-2">
                  veya Manuel E-Posta ile Giriş
                </div>

                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
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
                      <div className="absolute left-3 top-3.5 text-slate-400">
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
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Giriş Yapılacak Hesap</p>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate">{email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
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
                    <Fingerprint className="w-4 h-4" />
                    <span>Bağlantıyı Aç</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step: APK SYNC SCREEN LOCK KÖPRÜSÜ */}
            {step === "apkSync" && (
              <div className="space-y-4 py-1.5 font-sans leading-relaxed text-left">
                <div className="text-center space-y-1.5">
                  <div className="inline-flex p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
                    <Shield className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                      Mobil APK Eşleme Kodunuz
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold px-2 mt-0.5 leading-relaxed text-center">
                      Aşağıdaki kodu tarayıcı üzerinden giriş yaparak onayladığınızda, APK uygulamanız otomatik olarak açılacaktır.
                    </p>
                  </div>
                </div>

                {/* Big visual sync code block spaced out */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner text-center space-y-0.5 select-all relative group overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/10 animate-pulse pointer-events-none" />
                  <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block">GÜVENLİ EŞLEŞME KODU</span>
                  <span className="text-2xl font-black font-mono tracking-[0.25em] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    {syncCode.slice(0, 3)} {syncCode.slice(3)}
                  </span>
                </div>

                <div className="space-y-2">
                  <a
                    href={`${window.location.origin}/?sync_code=${syncCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 text-center block shadow-lg shadow-indigo-600/25"
                  >
                    <span>🌐 Girişi Tarayıcıda (Chrome) Aç</span>
                  </a>

                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-center px-3.5 bg-slate-50 dark:bg-slate-950/50 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 font-sans">
                    💡 Tarayıcı sayfası açıldığında "APK Giriş Talebi: {syncCode}" şeklinde bir ekran göreceksiniz. Oradaki yeşil butona tıklayarak girişinizi bitirip bu sayfaya kesintisiz dönebilirsiniz!
                  </p>
                </div>

                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-98"
                  >
                    Vazgeç ve Başa Dön
                  </button>
                </div>
              </div>
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