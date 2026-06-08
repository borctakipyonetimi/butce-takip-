import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  Cloud,
  Languages,
  Sliders,
  DollarSign,
  TrendingUp,
  Layout,
  RefreshCw,
  FolderSync,
  HardDriveUpload,
  HardDriveDownload,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Settings,
  BellRing,
  Check,
  Globe2,
  CheckCircle,
  XCircle,
  LogOut
} from "lucide-react";
import { Debt, Income, Expense, InstallmentDebt, ExpenseCategory } from "../types";
import { translations } from "../utils/translations";

interface DriveBackup {
  id: string;
  name: string;
  size: string;
  createdTime: string;
}

interface GPlayEnhancementsProps {
  language: "tr" | "en";
  setLanguage: (lang: "tr" | "en") => void;
  expenseCategories: ExpenseCategory[];
  onUpdateAllCategories: (categories: ExpenseCategory[]) => void;
  expenses: Expense[];
  statsBag: {
    totalDebt: number;
    totalPaid: number;
    remaining: number;
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
  };
  currentUser: string | null;
  triggerToast: (msg: string) => void;
  debts: Debt[];
  installmentDebts: InstallmentDebt[];
  format: (val: number) => string;
  onRestoreBackup?: (data: any) => void;
}

export const GPlayEnhancements: React.FC<GPlayEnhancementsProps> = ({
  language,
  setLanguage,
  expenseCategories,
  onUpdateAllCategories,
  expenses,
  statsBag,
  currentUser,
  triggerToast,
  debts,
  installmentDebts,
  format,
  onRestoreBackup
}) => {
  const [activeTab, setActiveTab] = useState<"drive" | "limits" | "currency">("drive");
  const t = (key: keyof typeof translations.tr) => {
    return translations[language][key] || translations.tr[key];
  };

  // Google Drive Real Integration State
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveUser, setDriveUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackup[]>([]);
  const [autoBackup, setAutoBackup] = useState(() => {
    return localStorage.getItem("gdrive_auto_backup") === "1";
  });

  // Load token if exists (in a real app, you might want to check auth state)
  // For simplicity here, we'll rely on the user clicking "Connect" to get the token.

  const fetchDriveUser = async (token: string) => {
    try {
      const res = await fetch("/api/drive/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveUser(data);
      }
    } catch (e) {
      console.error("Fetch drive user error:", e);
    }
  };

  const fetchBackups = async (token: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/drive/backups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveBackups(data.files || []);
      }
    } catch (e) {
      console.error("Fetch backups error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDriveConnect = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/drive.appdata");
    // Force consent screen to ensure the user can select the drive scope checkbox
    provider.setCustomParameters({ 
      prompt: "select_account consent",
      access_type: "offline"
    });
    
    try {
      setIsSyncing(true);
      console.log("Starting Google Auth popup with scopes...");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        console.log("Token obtained successfully.");
        await fetchDriveUser(credential.accessToken);
        await fetchBackups(credential.accessToken);
        triggerToast(language === "tr" ? "Google Drive hesabı başarıyla bağlandı! ☁️" : "Google Drive account linked successfully! ☁️");
      } else {
        throw new Error("Access Token not found in Firebase response.");
      }
    } catch (e: any) {
      console.error("Firebase Auth Error:", e);
      let errorMsg = e.message;
      
      if (e.code === "auth/popup-blocked") {
        errorMsg = language === "tr" ? "Popup engelleyiciyi kapatın." : "Please disable your popup blocker.";
      } else if (e.code === "auth/unauthorized-domain") {
        errorMsg = language === "tr" 
          ? "Bu alan adı Firebase ayarlarında yetkilendirilmemiş. Lütfen yöneticiye başvurun." 
          : "This domain is not authorized in Firebase settings.";
      } else if (e.code === "auth/cancelled-popup-request" || e.code === "auth/popup-closed-by-user") {
        errorMsg = language === "tr" ? "Giriş işlemi iptal edildi." : "Login cancelled.";
      }
      
      triggerToast(language === "tr" ? `Bağlantı hatası: ${errorMsg}` : `Connection error: ${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDriveDisconnect = async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
      setDriveUser(null);
      setDriveBackups([]);
      triggerToast(language === "tr" ? "Oturum kapatıldı. Yeni bir hesap seçmek için tekrar bağlanın." : "Logged out. Connect again to select a different account.");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // Create real backup
  const handleCreateDriveBackup = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    try {
      const now = new Date();
      // Format filename with local date/time for user recognition
      const datePart = now.toLocaleDateString("tr-TR").replace(/\./g, "-");
      const timePart = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }).replace(":", "");
      const fileName = `ButcemPro_Yedek_${datePart}_${timePart}.json`;
      
      const backupData = {
        expenses,
        debts,
        installmentDebts,
        expenseCategories,
        statsBag,
        version: "2.0.0",
        timestamp: now.toISOString()
      };

      const res = await fetch("/api/drive/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          fileName,
          content: backupData
        })
      });

      if (res.ok) {
        await fetchBackups(accessToken);
        triggerToast(t("drive_success"));
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }
    } catch (e: any) {
      triggerToast(language === "tr" ? `Yükleme hatası: ${e.message}` : `Upload error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/drive/backups/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        await fetchBackups(accessToken);
        triggerToast(language === "tr" ? "Yedek silindi." : "Backup deleted.");
      }
    } catch (e) {
      console.error("Delete backup error:", e);
    }
  };

  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    setIsSyncing(true);
    try {
      // In a real app we'd fetch the file content. 
      // For this implementation, we'll fetch the content from Drive
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (onRestoreBackup) {
          onRestoreBackup(data);
          triggerToast(language === "tr" ? `${fileName} başarıyla geri yüklendi!` : `${fileName} restored successfully!`);
        } else {
          triggerToast(language === "tr" ? "Geri yükleme motoru aktif değil." : "Restore engine is not active.");
        }
      }
    } catch (e: any) {
      triggerToast(language === "tr" ? `Geri yükleme hatası: ${e.message}` : `Restore error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Category Limit Settings State
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [editLimitVal, setEditLimitVal] = useState<string>("");
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("app_budget_alarm_threshold");
    return saved ? parseInt(saved) : 85;
  });

  const [convertAmount, setConvertAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("TRY");
  const [convertResult, setConvertResult] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 34.85,
    EUR: 37.40,
    GBP: 44.15,
    BTC: 3365000,
    TRY: 1.0
  });
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  // Sync back auto backup settings to local browser
  useEffect(() => {
    localStorage.setItem("gdrive_auto_backup", autoBackup ? "1" : "0");
  }, [autoBackup]);

  // Handle Live Currency Market Conversion
  const handleConvert = () => {
    const amt = parseFloat(convertAmount) || 0;
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;

    // Convert to Turkish Lira first as baseline
    const inBasline = amt * fromRate;
    const finalYield = inBasline / toRate;
    setConvertResult(finalYield);
  };

  useEffect(() => {
    handleConvert();
  }, [convertAmount, fromCurrency, toCurrency, exchangeRates]);

  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      if (data && data.rates) {
        setExchangeRates(data.rates);
        triggerToast(
          language === "tr"
            ? "Piyasa döviz kurları canlı olarak güncellendi! 💱"
            : "Market exchange rates updated live! 💱"
        );
      }
    } catch (err) {
      console.warn("Failed to fetch live FX rates:", err);
    } finally {
      setIsRefreshingRates(false);
    }
  };

  // Get active budget totals by category
  const getCategoryCurrentTotal = (catId: number) => {
    return expenses
      .filter(exp => exp.categoryId === catId)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Handle category budget ceiling save
  const handleSaveCategoryLimit = (catId: number, limit: number) => {
    const updated = expenseCategories.map((c) => {
      if (c.id === catId) {
        return { 
          ...c, 
          limitAmount: limit,
          warningThreshold: alertThreshold
        };
      }
      return c;
    });
    onUpdateAllCategories(updated);
    setSelectedCatId(null);
    triggerToast(language === "tr" ? "Kategori bütçe limiti kaydedildi!" : "Category budget ceiling saved!");
  };

  // Formatting Drive Size
  const formatSize = (bytes: string | undefined) => {
    if (!bytes) return "0 KB";
    const b = parseInt(bytes);
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Formatting Drive Date
  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString(language === "tr" ? "tr-TR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="w-full space-y-6" id="gplay-enhancements-root">
      
      {/* Centered & Animated Page Title */}
      <div className="flex flex-col items-center justify-center text-center py-4 select-none">
        <motion.h2
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2.5"
        >
          <Cloud className="w-7 h-7 text-indigo-500 animate-pulse" /> BULUT & PRO ÖZELLİKLER
        </motion.h2>
        <div className="w-16 h-1 bg-indigo-500 rounded-full mt-2 opacity-80" />
      </div>

      {/* Upper Brand Card / Header */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center gap-4">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest leading-none">
            👑 BÜTÇEM PRO PREMİUM SÜRÜM
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed uppercase tracking-tight max-w-2xl mx-auto">
            Bütçe limit aşım uyarıları, Google Drive bulut yedekleme, çoklu döviz birikim hesaplayıcısı ve telefon masaüstü widget tasarımı gibi tüm gelişmiş pro özellikler.
          </p>
        </div>
      </div>

      {/* Sub Tabs Toggle Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveTab("drive")}
          className={`py-3 px-4 rounded-2xl font-black text-[11px] uppercase tracking-wide flex flex-col items-center justify-center gap-1.5 transition-all outline-none border cursor-pointer ${
            activeTab === "drive"
              ? "bg-indigo-650 text-white border-indigo-500 shadow-md transform scale-[1.02]"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-755"
          }`}
        >
          <Cloud className={`w-5 h-5 ${activeTab === "drive" ? "animate-pulse" : "text-indigo-500"}`} />
          <span>Google Drive</span>
        </button>

        <button
          onClick={() => setActiveTab("limits")}
          className={`py-3 px-4 rounded-2xl font-black text-[11px] uppercase tracking-wide flex flex-col items-center justify-center gap-1.5 transition-all outline-none border cursor-pointer ${
            activeTab === "limits"
              ? "bg-indigo-650 text-white border-indigo-500 shadow-md transform scale-[1.02]"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-755"
          }`}
        >
          <Sliders className={`w-5 h-5 ${activeTab === "limits" ? "animate-bounce" : "text-emerald-500"}`} style={{ animationDuration: "3s" }} />
          <span>{t("limit_warning")}</span>
        </button>

        <button
          onClick={() => setActiveTab("currency")}
          className={`py-3 px-4 rounded-2xl font-black text-[11px] uppercase tracking-wide flex flex-col items-center justify-center gap-1.5 transition-all outline-none border cursor-pointer ${
            activeTab === "currency"
              ? "bg-indigo-650 text-white border-indigo-500 shadow-md transform scale-[1.02]"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-755"
          }`}
        >
          <DollarSign className={`w-5 h-5 ${activeTab === "currency" ? "animate-spin [animation-duration:10s]" : "text-rose-500"}`} />
          <span>{language === "tr" ? "Canlı Döviz / Kur" : "Live Exchange"}</span>
        </button>
      </div>

      {/* Main Tab Screen Area */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
        
        {/* TAB 1: GOOGLE DRIVE BACKUP */}
        {activeTab === "drive" && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-700 pb-5">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
                  <Cloud className="w-5 h-5 text-indigo-500" />
                  {t("drive_title")}
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-bold leading-normal uppercase">
                  {t("drive_desc")}
                </p>
              </div>

              {/* Connected Badge */}
              <div>
                {accessToken ? (
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-black text-[9.5px] flex items-center gap-1 uppercase">
                    <CheckCircle className="w-3.5 h-3.5" /> GDrive Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-full font-black text-[9.5px] uppercase">
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            {/* Real Account Link Action Cards */}
            <div className="grid md:grid-cols-2 gap-5 items-stretch">
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                <span className="text-[9px] font-black uppercase text-indigo-500 block tracking-widest leading-none">
                  GOOGLE ACCOUNT CONTROL PANEL
                </span>
                
                {isSyncing ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-xs font-bold text-slate-500">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span>{t("drive_syncing")}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accessToken ? (
                      <div className="space-y-2">
                        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold border border-slate-150 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            {driveUser?.picture ? (
                              <img src={driveUser.picture} className="w-6 h-6 rounded-full" alt="Profile" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-[10px]">
                                {driveUser?.name?.[0] || "U"}
                              </span>
                            )}
                            <div>
                              <p className="text-slate-800 dark:text-slate-100">{driveUser?.email || "Connected"}</p>
                              <p className="text-[9px] text-slate-400 uppercase leading-none">OAuth Google Scope: GDrive.AppData</p>
                            </div>
                          </div>
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateDriveBackup}
                            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                          >
                            <HardDriveUpload className="w-3.5 h-3.5" /> Google Drive'a Yedekle
                          </button>
                          <button
                            type="button"
                            onClick={handleDriveDisconnect}
                            className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1"
                            title="Oturumu Kapat / Hesap Değiştir"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-4">
                        <p className="text-slate-500 dark:text-slate-400 text-xs text-balance">
                          {language === "tr" 
                            ? "Güvenli veri yedeklemesi yapabilmek için Google Drive hesabınızı bağlayın." 
                            : "Connect your personal Google Drive account to backup your data."}
                        </p>
                        <button
                          type="button"
                          onClick={handleDriveConnect}
                          className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl text-xs font-black tracking-wide transition active:scale-95 inline-flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-500/10 uppercase"
                        >
                          <Cloud className="w-4 h-4 animate-pulse" /> {t("drive_connect")}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Auto Synchronize setting state */}
                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold">
                  <div className="space-y-0.5">
                    <span className="text-slate-750 dark:text-slate-200 block text-[11px]">{t("drive_auto_backup")}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase leading-none block">HER SÜRÜM DEĞİŞİKLİĞİNDE GÜNCELLE</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoBackup}
                      onChange={(e) => setAutoBackup(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-755 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Right Side: Backups List Box */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-indigo-500 block tracking-widest leading-none">
                      {t("drive_files")}
                    </span>
                    <button
                      onClick={() => accessToken && fetchBackups(accessToken)}
                      className="text-[9.5px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? "animate-spin" : ""}`} /> YENİLE
                    </button>
                  </div>

                  {!accessToken ? (
                    <div className="text-center py-10 text-slate-400 font-bold text-[11px] flex flex-col items-center gap-1.5">
                      <FolderSync className="w-8 h-8 text-slate-300" />
                      <span>{language === "tr" ? "Bulut kayıt listesi için hesabınızı bağlayın." : "Sign in to query backups."}</span>
                    </div>
                  ) : driveBackups.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 font-bold text-[11px]">
                         Yedek bulunamadı.
                      </div>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {driveBackups.map((bk) => (
                        <div
                          key={bk.id}
                          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate text-[11.5px]" title={bk.name}>
                              {bk.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold font-mono">
                              {formatDate(bk.createdTime)} &bull; {formatSize(bk.size)}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => handleRestoreFromDrive(bk.id, bk.name)}
                              className="p-1 px-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg hover:scale-105 active:scale-95 transition text-[9px] font-black border border-transparent"
                              title="Buluttan Geri Yükle"
                            >
                              YÜKLE
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(bk.id)}
                              className="p-1 bg-rose-50 text-rose-600 dark:bg-rose-955/20 rounded-lg hover:scale-105 active:scale-95 transition text-[9px] font-black"
                              title="Yedeği Sil"
                            >
                              SİL
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-955/20 text-amber-800 dark:text-amber-300 rounded-xl text-[10px] leading-relaxed flex gap-2 border border-amber-100 dark:border-amber-955/30 font-bold mt-3">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>
                    Google Drive AppData klasörü korumalı yapıda olup diğer tüm uygulamaların erişime kapalıdır. Bu klasör Drive ana listesinde görünmez, tam güvenlik sunar.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUDGET AND OVERUSE ALERTS */}
        {activeTab === "limits" && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-150 dark:border-slate-700 pb-5 space-y-1">
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
                <Sliders className="w-5 h-5 text-emerald-500" />
                {t("limit_warning_badge")} & {t("limit_warning")}
              </h3>
              <p className="text-[10.5px] text-slate-400 font-bold leading-normal uppercase">
                {t("limit_warning_desc")}
              </p>
            </div>

            {/* Threshold Master Adjuster Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-250 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[12px] block">
                  🚨 {t("limit_alert_threshold")} (%Yüzde)
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase leading-none block">
                  Limit aşım uyarısı verilecek kritik alarm seviyesini seçin.
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-black text-rose-500 dark:text-rose-400 text-sm font-mono tracking-tighter bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg">
                  %{alertThreshold}
                </span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    setAlertThreshold(parsed);
                    localStorage.setItem("app_budget_alarm_threshold", String(parsed));
                  }}
                  className="w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
              </div>
            </div>

            {/* Grid of Custom Categories and Budgets */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {expenseCategories.map((cat) => {
                const currentMonthTotal = getCategoryCurrentTotal(cat.id);
                const limitAmount = cat.limitAmount || 5000; // default baseline limit
                const percent = Math.min(100, Math.round((currentMonthTotal / limitAmount) * 100));
                const isOverThreshold = percent >= alertThreshold;
                const isExceeded = percent >= 100;

                return (
                  <div
                    key={cat.id}
                    className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition duration-200 relative overflow-hidden"
                  >
                    {/* Visual left Indicator line */}
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" style={{ backgroundColor: cat.color || "#6366f1" }} />

                    {/* Content Header of category */}
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon || "🛒"}</span>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                            {cat.name}
                          </p>
                          <p className="text-[9.5px] text-slate-400 font-bold font-mono">
                            {format(currentMonthTotal)} / {format(limitAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Warning indicators */}
                      {isExceeded ? (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-extrabold text-[9px] uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> LİMİT AŞILDI
                        </span>
                      ) : isOverThreshold ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-extrabold text-[9px] uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> TEHLİKELİ (%{percent})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] uppercase tracking-wide">
                          GÜVENLİ (%{percent})
                        </span>
                      )}
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded ? "bg-rose-500" : isOverThreshold ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Limit configuration settings */}
                      {selectedCatId === cat.id ? (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="number"
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl"
                            placeholder="Yeni Tavan Limit (TL)"
                            value={editLimitVal}
                            onChange={(e) => setEditLimitVal(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const lim = parseFloat(editLimitVal);
                              if (!isNaN(lim) && lim > 0) {
                                handleSaveCategoryLimit(cat.id, lim);
                              }
                            }}
                            className="px-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black cursor-pointer"
                          >
                            KAYDET
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCatId(null)}
                            className="px-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl text-[10px] font-bold cursor-pointer"
                          >
                            İPTAL
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-[10px] pt-1">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Maks LİMİT: {format(limitAmount)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCatId(cat.id);
                              setEditLimitVal(String(limitAmount));
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-black hover:underline cursor-pointer uppercase shrink-0"
                          >
                            LİMİTİ AYARLA
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE CURRENCY MARKETS AND EXCHANGE CONVERTER */}
        {activeTab === "currency" && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-700 pb-5">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
                  <DollarSign className="w-5 h-5 text-indigo-500" />
                  {t("currency_title")}
                </h3>
                <p className="text-[10.5px] text-slate-400 font-bold leading-normal uppercase">
                  {t("currency_desc")}
                </p>
              </div>

              {/* Refresh Markets Button */}
              <button
                type="button"
                onClick={handleRefreshRates}
                disabled={isRefreshingRates}
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isRefreshingRates ? "animate-spin" : ""}`} />
                {t("currency_refresh")}
              </button>
            </div>

            {/* Currency convert calculation tools */}
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              
              {/* Box 1: Currency Calculator Sheet */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase text-indigo-500 block tracking-widest leading-none">
                    {t("currency_convert")}
                  </span>

                  {/* Input amount */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      {t("currency_from_amount")}
                    </label>
                    <input
                      type="number"
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-550 text-slate-805 dark:text-slate-100"
                    />
                  </div>

                  {/* Drops of selection currencies */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wide">
                        {t("currency_from")}
                      </label>
                      <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        {Object.keys(exchangeRates).map((curr) => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wide">
                        {t("currency_to")}
                      </label>
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        {Object.keys(exchangeRates).map((curr) => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Calculation Result */}
                <div className="mt-5 p-4 bg-indigo-600 rounded-2xl text-white space-y-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase opacity-85">{t("currency_result")}</span>
                  <span className="text-xl md:text-2xl font-black font-mono tracking-tight">
                    {convertResult !== null ? convertResult.toFixed(2) : "-"}
                    <span className="text-sm font-bold opacity-90 ml-1.5">{toCurrency}</span>
                  </span>
                </div>
              </div>

              {/* Box 2: Live Rate Sheet listing board */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase text-indigo-500 block tracking-widest leading-none">
                    {t("currency_live_rates")}
                  </span>

                  <div className="divide-y divide-slate-200/50 dark:divide-slate-800">
                    {Object.keys(exchangeRates).map((key) => {
                      if (key === "TRY") return null;
                      const rateValue = exchangeRates[key] as number;
                      return (
                        <div key={key} className="py-2.5 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 flex items-center justify-center font-black text-[9.5px]">
                              {key === "USD" ? "💵" : key === "EUR" ? "💶" : key === "GBP" ? "💷" : "🪙"}
                            </span>
                            <span className="font-extrabold text-slate-806 dark:text-slate-200">1 {key}</span>
                          </div>
                          <span className="font-mono font-black text-slate-801 dark:text-white">
                            {rateValue.toFixed(2)} TRY
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300 border border-emerald-150 rounded-xl text-[10px] leading-relaxed font-bold">
                  Döviz çevirici kurları bütçe, gelir ve harcama hesaplamalarında kullanılmak üzere güvenli, şifreli anahtar sorgusu ile TCMB tüneli üzerinden beslenir.
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
