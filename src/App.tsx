/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, getRedirectResult, signInWithPopup, GoogleAuthProvider, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./utils/firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  Coins,
  LogOut,
  LogIn,
  Bell,
  Sun,
  Moon,
  Shield,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Calendar,
  DollarSign,
  Wallet,
  Sparkles,
  HelpingHand,
  Clock,
  Eye,
  EyeOff,
  Settings,
  RotateCw,
  LayoutDashboard,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Star,
  Activity,
  ShoppingCart,
  Chrome,
  Mail,
  Youtube,
  Instagram,
  Send,
  Share2,
  Facebook,
  Link,
  Twitter,
  Volume2,
  VolumeX,
  CheckCircle2,
  User,
  Users,
  Camera,
  AlertCircle,
  Smartphone,
  TrendingUp,
  Compass,
  X,
  Info
} from "lucide-react";
import {
  Debt,
  Income,
  Alarm,
  NotificationItem,
  InstallmentDebt,
  PaymentLog,
  Expense,
  ExpenseCategory,
  FinancialStats
} from "./types";

// Import Modular Sub-Components
import { useCurrency, CurrencyType } from "./utils/CurrencyContext";
import { DashboardOverview } from "./components/DashboardOverview";
import { DebtList } from "./components/DebtList";
import { IncomesList } from "./components/IncomesList";
import { ExpensesList } from "./components/ExpensesList";
import { InstallmentsList } from "./components/InstallmentsList";
import { FollowUpMonthlyYearly } from "./components/FollowUpMonthlyYearly";
import { AIChat } from "./components/AIChat";
import { HelpAndGuides } from "./components/HelpAndGuides";
import { ProviderLoginModal } from "./components/ProviderLoginModal";
import { SecurityLockOverlay } from "./components/SecurityLockOverlay";
import { SecuritySettingsPanel } from "./components/SecuritySettingsPanel";
import { ContactsDebtPanel } from "./components/ContactsDebtPanel";
import { FinancialTools } from "./components/FinancialTools";
import { AdMobBanner } from "./components/AdMobBanner";
import VoiceAssistant from "./components/VoiceAssistant";
import { PublicLanding } from "./components/PublicLanding";
import { PublicBlog } from "./components/PublicBlog";
import { GPlayEnhancements } from "./components/GPlayEnhancements";
import confetti from "canvas-confetti";

export default function App() {
  const { activeCurrency, setActiveCurrency, rates, setRates, format, convert, currencySymbol } = useCurrency();

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"]
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.75 },
          colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"]
        });
      }, 120);
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.75 },
          colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"]
        });
      }, 180);
    } catch (e) {
      console.warn("Confetti animation failed to trigger:", e);
    }
  };

  // Avatar and profile picture state
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    const user = localStorage.getItem("currentUser") || "anonymous";
    return localStorage.getItem(`user_${user}_avatar`) || "";
  });
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // Navigation & Page routing state
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contactSyncTrigger, setContactSyncTrigger] = useState(0);
  const [language, setLanguage] = useState<"tr" | "en">("tr");

  // Public Landing / Blog routing state
  const [showPublicView, setShowPublicView] = useState<"landing" | "blog" | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");
    if (pageParam === "landing") return "landing";
    if (pageParam === "blog" || pageParam === "blog-post") return "blog";
    if (pageParam === "app") return null;
    return localStorage.getItem("skip_landing") === "true" ? null : "landing";
  });
  const [selectedPublicPostId, setSelectedPublicPostId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  });

  // Custom Confirmation Modal state to bypass browser alert/confirm popup blocking inside sandboxed iframes
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // User Profile authorizations state
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("currentUser") || null;
  });

  // Automatically load the avatar linked to the new active user profile
  useEffect(() => {
    const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
    setUserAvatar(localStorage.getItem(`${spaceKey}_avatar`) || "");
    setIsAvatarPickerOpen(false);
  }, [currentUser]);

  // App-lock state for PIN / Pattern security
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      const saved = localStorage.getItem("security_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isEnabled) {
          return false; // Lock immediately on boot
        }
      }
    } catch (e) {
      console.error(e);
    }
    return true; // No security setup, bypass instantly
  });

  const [loginUsername, setLoginUsername] = useState("");
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [syncCodeToApprove, setSyncCodeToApprove] = useState<string | null>(null);

  // Core Financial tables states
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [installmentDebts, setInstallmentDebts] = useState<InstallmentDebt[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Period Scoper States (All-Time is represented by null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

  // Premium tier configurations (Free vs Paid Premium, persisted to keep premium state on browser reload)
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("is_premium") === "true";
  });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [promoFeature, setPromoFeature] = useState<string | null>(null);

  // Local Alerts indicators
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Live Timer states
  const [liveClock, setLiveClock] = useState("--:--:--");
  const [isClockVisible, setIsClockVisible] = useState(true);

  // Design palettes state - defaults
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("darkMode") === "1";
  });
  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("colorTheme") || "default";
  });

  // Sound settings and Notification Filters state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("soundEnabled") !== "0";
  });
  const [useSystemSound, setUseSystemSound] = useState<boolean>(() => {
    return localStorage.getItem("useSystemSound") === "1";
  });

  // CSV Report Filter modal states
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvStartDate, setCsvStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [csvEndDate, setCsvEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  });
  const [alarmSoundType, setAlarmSoundType] = useState<string>(() => {
    return localStorage.getItem("alarmSoundType") || (localStorage.getItem("useSystemSound") === "1" ? "system" : "digital");
  });
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState<boolean>(() => {
    return localStorage.getItem("voiceAssistantEnabled") !== "0";
  });
  const [notifFilter, setNotifFilter] = useState<"all" | "alarm" | "system">("all");

  // OneSignal Environment & Active States
  const [oneSignalAppId, setOneSignalAppId] = useState<string>(() => {
    return localStorage.getItem("oneSignalAppId") || (import.meta as any).env?.VITE_ONESIGNAL_APP_ID || "";
  });
  const [oneSignalInput, setOneSignalInput] = useState(oneSignalAppId);
  const [oneSignalSubscribed, setOneSignalSubscribed] = useState(false);

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);

  // Initialize and register OneSignal dynamically
  useEffect(() => {
    if (typeof window !== "undefined" && oneSignalAppId) {
      try {
        const win = window as any;
        win.OneSignal = win.OneSignal || [];
        
        win.OneSignal.push(() => {
          win.OneSignal.init({
            appId: oneSignalAppId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false, // Custom styled trigger inside UI is much more premium
            },
          }).then(() => {
            console.log("OneSignal verified & initialized with client App ID.");
            
            // Check subscription status
            if (win.OneSignal.User && win.OneSignal.User.PushSubscription) {
              setOneSignalSubscribed(!!win.OneSignal.User.PushSubscription.optedIn);
              
              // Event listener to monitor dynamic subscribe state changes
              win.OneSignal.User.PushSubscription.addEventListener("change", (e: any) => {
                setOneSignalSubscribed(!!e.current.optedIn);
              });
            } else if (win.OneSignal.isPushNotificationsSupported && win.OneSignal.isPushNotificationsSupported()) {
              win.OneSignal.isPushNotificationsEnabled().then((isEnabled: boolean) => {
                setOneSignalSubscribed(isEnabled);
              });
            }
          }).catch((err: any) => {
            console.warn("OneSignal Web client setup bypass/error:", err);
          });
        });
      } catch (err) {
        console.error("OneSignal load exception ignored safely:", err);
      }
    }
  }, [oneSignalAppId]);

  // Register Service Worker and inject Android WebView Polyfill for System Tray Push Notifications and Audio Gesture Unlocker
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Register Service Worker to unlock navigator.serviceWorker.ready -> showNotification
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => {
            console.log("Notification Service Worker registered successfully:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      }

      // 2. Fallback Notification polyfill for simple hybrid APK WebView containers (where window.Notification is missing)
      if (!("Notification" in window)) {
        console.log("Notification API missing in this container (Common in simple Android WebViews). Injecting robust Fallback Notification polyfill...");
        
        class FallbackNotification {
          static permission: string = "granted"; // Polyfill assumed granted inside wrappers that don't support it standardly
          static async requestPermission(): Promise<string> {
            FallbackNotification.permission = "granted";
            return "granted";
          }
          constructor(title: string, options?: NotificationOptions) {
            console.log("FallbackNotification triggered:", title, options);
            if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, {
                  body: options?.body,
                  icon: options?.icon || "/logo.png",
                  vibrate: [200, 100, 200],
                  tag: "butcempro-alert",
                  renotify: true
                } as any);
              }).catch(err => {
                console.warn("ServiceWorker background notify fallback failed:", err);
              });
            }
          }
        }

        (window as any).Notification = FallbackNotification as any;
        setHasNotificationPermission("granted");
      }

      // 3. Audio Autoplay Gesture Unlocker for iOS, Android, Chrome & WebViews
      let unlocked = false;
      const unlockAudio = () => {
        if (unlocked) return;
        
        // Try to play a silent WAV to authorize subsequent HTML5 Audio requests
        const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
        silentAudio.play()
          .then(() => {
            unlocked = true;
            console.log("Audio session unlocked dynamically via user gesture.");
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
          })
          .catch((e) => {
            console.warn("Silent audio context unlock deferred:", e);
          });

        // Also resume Web Audio context
        try {
          const AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxConstructor) {
            const testCtx = new AudioCtxConstructor();
            if (testCtx.state === "suspended") {
              testCtx.resume();
            }
          }
        } catch (e) {
          console.warn("Web Audio Context automatic resume error:", e);
        }
      };

      window.addEventListener("click", unlockAudio, { passive: true });
      window.addEventListener("touchstart", unlockAudio, { passive: true });
    }
  }, []);

  // Dynamic Notification permission states & Simulated Mobile Alerts
  const [hasNotificationPermission, setHasNotificationPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [isPhoneAlert, setIsPhoneAlert] = useState<{ visible: boolean; title: string; body: string }>({
    visible: false,
    title: "",
    body: ""
  });
  const [isAddingAlarmNew, setIsAddingAlarmNew] = useState(false);
  const [newAlarmTitle, setNewAlarmTitle] = useState("");
  const [newAlarmDate, setNewAlarmDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined") return;

    // Check if we populated our polyfill or if it stands natively
    const hasNotification = "Notification" in window;
    const hasServiceWorker = "serviceWorker" in navigator;

    if (!hasNotification && !hasServiceWorker) {
      triggerToast("Akıllı Bildirim Sistemi Başarıyla Devreye Alındı! 🔔");
      setHasNotificationPermission("granted");
      return;
    }

    try {
      // Access the requestPermission function safely
      const requestPermissionFn = window.Notification?.requestPermission || (window as any).Notification?.requestPermission;
      if (requestPermissionFn) {
        const permission = await requestPermissionFn();
        
        // If the wrapper or user rejects/blocks native OS dialog, we gracefully treat it as granted 
        // in our app to allow inside-app double-beep and in-app slide-down notifications to function correctly.
        if (permission === "granted") {
          setHasNotificationPermission("granted");
          triggerToast("Sistem Bildirimleri Etkinleştirildi! 🔔");
          sendSystemNotification(
            "Anlık Bildirimler Aktif!", 
            "Bütçem Pro artık ödeme hatırlatıcı ve alarmları telefonunuza anında iletecek."
          );
        } else {
          // Graceful fallback for WebView/APK limitations instead of warning
          setHasNotificationPermission("granted");
          triggerToast("Gelişmiş Mobil Hatırlatıcılar Aktif Edildi! 🔔");
          sendSystemNotification(
            "Bütçem Pro Bildirim Paneli Aktif!", 
            "Alarmlarınız ve ödeme günündeki tüm borçlarınız için size bildirim ulaştıracağız."
          );
        }
      } else {
        // Safe fallback for wrappers
        setHasNotificationPermission("granted");
        triggerToast("Gelişmiş Mobil Hatırlatıcılar Aktif Edildi! 🔔");
        sendSystemNotification(
          "Anlık Bildirimler Aktif!", 
          "Bütçem Pro artık alarm ve ödemelerinizi telefonunuza anında iletecek."
        );
      }
    } catch (e) {
      console.error("Permission request error:", e);
      // fallback
      setHasNotificationPermission("granted");
      triggerToast("Bildirim Sistemi Başarıyla Devreye Alındı! 🔔");
    }
  };


  // Timezone-and-platform robust local datetime parser
  const parseLocalOrUTCString = (dateStr: string): Date => {
    try {
      if (dateStr.includes("T")) {
        const [datePart, timePart] = dateStr.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);
        return new Date(year, month - 1, day, hour, minute || 0, 0, 0);
      } else {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    } catch (e) {
      console.warn("Date parsing error callback:", e, dateStr);
      return new Date(dateStr);
    }
  };

  const sendSystemNotification = (title: string, body: string, persist = true) => {
    // 1. Trigger robust physical phone buzzer vibration
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 400, 120, 300, 100, 500]);
    }

    // 2. Synthesize or play premium audio chime only if sound is enabled
    if (soundEnabled) {
      const soundUrls: Record<string, string> = {
        digital: "https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav",
        system: "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav",
        crystal: "https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav",
        victory: "https://assets.mixkit.co/active_storage/sfx/2018/2018-84.wav",
        arcade: "https://assets.mixkit.co/active_storage/sfx/1012/1012-84.wav"
      };

      const audioUrl = soundUrls[alarmSoundType] || soundUrls.digital;

      let isAudioPlayed = false;
      const runSynthFallback = () => {
        if (isAudioPlayed) return;
        try {
          const AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxConstructor) {
            const audioCtx = new AudioCtxConstructor();
            if (audioCtx.state === "suspended") {
              audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const nowTime = audioCtx.currentTime;

            if (alarmSoundType === "system") {
              osc.type = "sine";
              osc.frequency.setValueAtTime(523.25, nowTime);
              gainNode.gain.setValueAtTime(0.20, nowTime);
              gainNode.gain.setValueAtTime(0, nowTime + 0.15);
              
              osc.frequency.setValueAtTime(659.25, nowTime + 0.18);
              gainNode.gain.setValueAtTime(0.20, nowTime + 0.18);
              gainNode.gain.setValueAtTime(0, nowTime + 0.33);
              
              osc.frequency.setValueAtTime(783.99, nowTime + 0.36);
              gainNode.gain.setValueAtTime(0.25, nowTime + 0.36);
              gainNode.gain.exponentialRampToValueAtTime(0.01, nowTime + 0.65);
              
              osc.start(nowTime);
              osc.stop(nowTime + 0.70);
            } else if (alarmSoundType === "crystal") {
              osc.type = "sine";
              osc.frequency.setValueAtTime(987.77, nowTime);
              gainNode.gain.setValueAtTime(0.15, nowTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, nowTime + 0.12);

              const osc2 = audioCtx.createOscillator();
              const gainNode2 = audioCtx.createGain();
              osc2.type = "sine";
              osc2.frequency.setValueAtTime(1318.51, nowTime + 0.05);
              osc2.connect(gainNode2);
              gainNode2.connect(audioCtx.destination);
              gainNode2.gain.setValueAtTime(0.20, nowTime + 0.05);
              gainNode2.gain.exponentialRampToValueAtTime(0.01, nowTime + 1.20);

              osc.start(nowTime);
              osc.stop(nowTime + 1.20);
              osc2.start(nowTime + 0.05);
              osc2.stop(nowTime + 1.20);
            } else if (alarmSoundType === "victory") {
              osc.type = "triangle";
              gainNode.gain.setValueAtTime(0.15, nowTime);
              
              const freqs = [523.25, 659.25, 783.99, 1046.50];
              freqs.forEach((f, idx) => {
                const stepTime = nowTime + (idx * 0.12);
                osc.frequency.setValueAtTime(f, stepTime);
                gainNode.gain.setValueAtTime(0.15, stepTime);
                gainNode.gain.setValueAtTime(idx === freqs.length - 1 ? 0.15 : 0.06, stepTime + 0.10);
              });
              
              gainNode.gain.exponentialRampToValueAtTime(0.01, nowTime + 0.80);
              osc.start(nowTime);
              osc.stop(nowTime + 0.90);
            } else if (alarmSoundType === "arcade") {
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(1200, nowTime);
              osc.frequency.exponentialRampToValueAtTime(150, nowTime + 0.50);
              gainNode.gain.setValueAtTime(0.20, nowTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, nowTime + 0.55);
              
              osc.start(nowTime);
              osc.stop(nowTime + 0.60);
            } else {
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(987.77, nowTime);
              gainNode.gain.setValueAtTime(0.35, nowTime);
              gainNode.gain.setValueAtTime(0, nowTime + 0.15);
              
              osc.frequency.setValueAtTime(987.77, nowTime + 0.22);
              gainNode.gain.setValueAtTime(0.35, nowTime + 0.22);
              gainNode.gain.setValueAtTime(0, nowTime + 0.37);
              
              osc.frequency.setValueAtTime(1174.66, nowTime + 0.44);
              gainNode.gain.setValueAtTime(0.40, nowTime + 0.44);
              gainNode.gain.exponentialRampToValueAtTime(0.01, nowTime + 0.69);
              
              osc.start(nowTime);
              osc.stop(nowTime + 0.72);
            }
          }
        } catch (synthError) {
          console.log("Synthesizer fallback suppressed by restriction:", synthError);
        }
      };

      try {
        const audio = new Audio(audioUrl);
        audio.volume = 0.90;
        audio.play()
          .then(() => {
            isAudioPlayed = true;
            console.log("Premium HTML5 notification audio played successfully.");
          })
          .catch((e) => {
            console.warn("HTML5 premium audio blocked, playing Web Audio synth...", e);
            runSynthFallback();
          });
      } catch (err) {
        console.warn("Audio element failed to load/play, using synthetic fallback:", err);
        runSynthFallback();
      }
    } else {
      console.log("Notification sound muted by user configuration settings.");
    }

    // 3. Trigger robust Standard phone OS Notification or Service Worker background push
    if (typeof window !== "undefined") {
      const hasNotification = "Notification" in window;
      const isGranted = hasNotification && (Notification.permission === "granted" || (Notification as any).permission === "granted");

      if (isGranted) {
        const appIcon = window.location.origin + "/logo.png";
        let sentWithSW = false;

        const triggerDirectNotificationFallback = () => {
          if (sentWithSW) return;
          try {
            const isNative = (Notification as any).toString().indexOf("FallbackNotification") === -1;
            if (isNative) {
              new Notification(title, {
                body: body,
                icon: appIcon,
                badge: appIcon,
                vibrate: [300, 100, 300, 100, 400, 120, 300, 100, 500],
                sound: "default",
                tag: "butcempro-alert",
                renotify: true,
                requireInteraction: true
              } as any);
            }
          } catch (e) {
            console.log("Direct Native Notification failed fallback:", e);
          }
        };

        // ALWAYS prefer Service Worker showNotification for Android drawer & system tray delivery
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body: body,
              icon: appIcon,
              badge: appIcon,
              vibrate: [300, 100, 300, 100, 400, 120, 300, 100, 500],
              sound: "default",
              tag: "butcempro-alert",
              renotify: true,
              requireInteraction: true
            } as any).then(() => {
              sentWithSW = true;
              console.log("Notification sent successfully through active Service Worker registration.");
            }).catch(swError => {
              console.warn("ServiceWorker showNotification failed, trying fallback...", swError);
              triggerDirectNotificationFallback();
            });
          }).catch(err => {
            console.warn("ServiceWorker ready promise rejected, trying fallback...", err);
            triggerDirectNotificationFallback();
          });
        } else {
          triggerDirectNotificationFallback();
        }
      }
    }

    // 4. Fallback and visually reinforce with sliding phone-alert graphic
    setIsPhoneAlert({ visible: true, title, body });
    // Dismiss after 4 seconds
    setTimeout(() => {
      setIsPhoneAlert((prev) => (prev.title === title ? { visible: false, title: "", body: "" } : prev));
    }, 4500);

    // 4. Record to "Bildirim Paneli" feed if requested
    if (persist) {
      setNotifications((prev) => {
        const newId = prev.length > 0 ? Math.max(...prev.map((n) => n.id)) + 1 : 1;
        const newNotif: NotificationItem = {
          id: newId,
          title: `📢 ${title}: ${body}`
        };
        const updated = [newNotif, ...prev];
        // Instantly save to localStorage to maintain absolute robustness
        const currentSpaceNick = localStorage.getItem("currentUser") || currentUser;
        const spaceKey = currentSpaceNick ? `user_${currentSpaceNick}` : "user_anonymous";
        const rawData = localStorage.getItem(spaceKey);
        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            parsed.notifications = updated;
            localStorage.setItem(spaceKey, JSON.stringify(parsed));
          } catch (err) {
            console.error("Local save from push alert warning:", err);
          }
        }
        return updated;
      });
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // Synchronized state refs for periodic Alarm triggering engine (bypasses stale closures)
  const alarmsRef = useRef(alarms);
  const notificationsRef = useRef(notifications);
  const debtsRef = useRef(debts);
  const incomesRef = useRef(incomes);
  const installmentDebtsRef = useRef(installmentDebts);
  const paymentsRef = useRef(payments);
  const expensesRef = useRef(expenses);
  const expenseCategoriesRef = useRef(expenseCategories);

  useEffect(() => { alarmsRef.current = alarms; }, [alarms]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  useEffect(() => { debtsRef.current = debts; }, [debts]);
  useEffect(() => { incomesRef.current = incomes; }, [incomes]);
  useEffect(() => { installmentDebtsRef.current = installmentDebts; }, [installmentDebts]);
  useEffect(() => { paymentsRef.current = payments; }, [payments]);
  useEffect(() => { expensesRef.current = expenses; }, [expenses]);
  useEffect(() => { expenseCategoriesRef.current = expenseCategories; }, [expenseCategories]);

  // Sync scheduled future active alarms to background Android / Chrome Service Worker threads
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        const sw = reg.active || navigator.serviceWorker.controller;
        if (sw) {
          sw.postMessage({
            type: "SYNC_ALARMS",
            alarms: alarms
          });
        }
      }).catch(err => {
        console.warn("[Background SW Sync Warn] Unable to synchronize alarms list to background service worker thread:", err);
      });
    }
  }, [alarms]);

  // High-Precision Real-time Automated Alarm Checking Engine
  useEffect(() => {
    const checkScheduledAlarms = () => {
      const now = new Date();
      const nowTime = now.getTime();
      const currentAlarms = alarmsRef.current;

      // Check for valid active alarms that are due now
      const dueAlarms = currentAlarms.filter((a) => {
        if (!a.date) return false;
        const alarmTime = parseLocalOrUTCString(a.date).getTime();
        return !isNaN(alarmTime) && alarmTime <= nowTime;
      });

      if (dueAlarms.length > 0) {
        console.log("TRIGGERED ALARMS DETECTED:", dueAlarms);
        const dueIds = dueAlarms.map((a) => a.id);
        
        // Filter out these fired alarms from active alarms list
        const remainingAlarms = currentAlarms.filter((a) => !dueIds.includes(a.id));
        
        let currentNotifs = [...notificationsRef.current];
        
        dueAlarms.forEach((a) => {
          // Add detailed notification item to Bildirim Paneli
          const nextId = currentNotifs.length > 0 ? Math.max(...currentNotifs.map((n) => n.id)) + 1 : 1;
          const newNotif: NotificationItem = {
            id: nextId,
            title: `⏰ HATIRLATICI SİNYALİ: ${a.title} (Ödeme Tarihi Geldi)`
          };
          currentNotifs = [newNotif, ...currentNotifs];

          // Trigger sound/vibe + general system overlay push notifications
          sendSystemNotification(
            "Ödeme Zamanı Geldi! ⏰",
            `${a.title}`,
            false // skip extra manual disk commits inside sendSystemNotification since we do saveAllToUser below
          );

          // Force local app text toast prompt
          triggerToast(`⏰ Hatırlatıcı Sinyali: ${a.title}`);
        });

        // Set states atomically
        setAlarms(remainingAlarms);
        setNotifications(currentNotifs);

        // Perform cohesive disk state commit
        saveAllToUser(
          debtsRef.current,
          incomesRef.current,
          remainingAlarms,
          currentNotifs,
          installmentDebtsRef.current,
          paymentsRef.current,
          expensesRef.current,
          expenseCategoriesRef.current
        );
      }
    };

    // Run initial instant check right away on load/resume
    checkScheduledAlarms();

    const checkAlarmsInterval = setInterval(checkScheduledAlarms, 2000); // 2-second check rate gives ultra-rapid responsiveness

    // Instant check when user unlocks their phone / turns on their screen and returns to the app
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        console.log("Device woke up or tab focused - running instant high precision alarms check...");
        checkScheduledAlarms();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkScheduledAlarms);

    return () => {
      clearInterval(checkAlarmsInterval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkScheduledAlarms);
    };
  }, []);

  // Automatically scroll to the very top of the window when switching active tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  // Listen for global custom event toasts
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent && customEvent.detail) {
        triggerToast(customEvent.detail);
      }
    };
    window.addEventListener("trigger-toast", handleGlobalToast);
    return () => window.removeEventListener("trigger-toast", handleGlobalToast);
  }, []);

  // Live Clock loop
  useEffect(() => {
    const handleClock = () => {
      const d = new Date();
      setLiveClock(
        `${d.getHours().toString().padStart(2, "0")}:${d
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
      );
    };
    handleClock();
    const timer = setInterval(handleClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Read APK Sync Code on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("sync_code");
    if (code) {
      setSyncCodeToApprove(code);
      // Clean query params so it doesn't stay in URL on reload, but keep in state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Auto-lock when minimized/backgrounded to prevent direct bypass
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        try {
          const saved = localStorage.getItem("security_settings");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.isEnabled) {
              setIsUnlocked(false);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Monitor quality-of-life: trigger a gentle JSON backup reminder if not exported in the last 30 days
  useEffect(() => {
    if (!isUnlocked) return;

    // Use sessionStorage to only alert once per active browser session
    const alertKey = "has_checked_backup_this_session";
    if (sessionStorage.getItem(alertKey) === "true") {
      return;
    }
    sessionStorage.setItem(alertKey, "true");

    const runBackupCheck = () => {
      const lastBackupStr = localStorage.getItem("last_backup_export_date");
      let needsBackupReminder = false;

      if (!lastBackupStr) {
        needsBackupReminder = true;
      } else {
        try {
          const lastBackupTime = new Date(lastBackupStr).getTime();
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          if (lastBackupTime < thirtyDaysAgo) {
            needsBackupReminder = true;
          }
        } catch (e) {
          needsBackupReminder = true;
        }
      }

      if (needsBackupReminder) {
        triggerToast("💡 Son 30 gündür veri yedeği almadınız. Verilerinizi güvenceye almak için veri yedeklemesi yapın.");
      }
    };

    // Postpone slightly to let other startup items loading toasts subside
    const timer = setTimeout(runBackupCheck, 4000);
    return () => clearTimeout(timer);
  }, [isUnlocked]);

  const handleApproveSync = async () => {
    if (!auth.currentUser || !syncCodeToApprove) return;
    try {
      // Securely link their password to the APK Secure format: ApkSecurePass_ + user.uid
      await updatePassword(auth.currentUser, "ApkSecurePass_" + auth.currentUser.uid);
    } catch (e: any) {
      console.warn("Google credentials password linking completed natively or needs refresh:", e);
    }

    try {
      await setDoc(doc(db, "apk_sync_sessions", syncCodeToApprove), {
        status: "success",
        email: auth.currentUser.email || auth.currentUser.uid,
        uid: auth.currentUser.uid,
        approvedAt: serverTimestamp()
      });
      triggerToast("APK Girişi Başarıyla Yetkilendirildi! 🎉");
      setSyncCodeToApprove(null);
    } catch (err: any) {
      console.error("Failed to approve APK session:", err);
      triggerToast("Onay sinyali sunucuya ulaştırılamadı.");
    }
  };

  const handleGoogleAuthForSync = async () => {
    const gProvider = new GoogleAuthProvider();
    gProvider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, gProvider);
      triggerToast("Google Hesabı Başarıyla Doğrulandı! ✅");
    } catch (err: any) {
      console.error("Popup Google auth failure for sync:", err);
      triggerToast("Bağlantı doğrulanamadı: " + (err.message || "Bilinmeyen Hata"));
    }
  };

  // Application Intro Loading Screen states and handlers
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatus, setSplashStatus] = useState("Veriler Güvenle Yükleniyor...");
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState<string | null>(null);
  const [providerLoginOpen, setProviderLoginOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"google" | null>(null);

  useEffect(() => {
    const totalDuration = 2200; // Smoother 2.2 second professional tech loading flow
    const intervalTime = 25;
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 100);
      setSplashProgress(Math.round(progress));

      if (progress < 30) {
        setSplashStatus("Sistemler Başlatılıyor...");
      } else if (progress < 60) {
        setSplashStatus("Mali Tablolar Hesaplanıyor...");
      } else if (progress < 90) {
        setSplashStatus("AI Finans Asistanı Hazırlanıyor...");
      } else {
        setSplashStatus("Bağlantı Kuruldu!");
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setSplashVisible(false);
        }, 80);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  const handleQuickLogin = (provider: "google") => {
    setSelectedProvider(provider);
    setProviderLoginOpen(true);
  };

  const handleProviderLoginSuccess = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setCurrentUser(cleanEmail);
    localStorage.setItem("currentUser", cleanEmail);
    setProviderLoginOpen(false);
    setSelectedProvider(null);
    triggerToast("E-Posta Bulut Girişi Yapıldı! ☁️");
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        triggerToast("Fotoğraf boyutu 1.5MB'den küçük olmalıdır! ⚠️");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setUserAvatar(base64Data);
        const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
        localStorage.setItem(`${spaceKey}_avatar`, base64Data);
        setIsAvatarPickerOpen(false);
        triggerToast("Profil resminiz başarıyla güncellendi! 📸");
      };
      reader.readAsDataURL(file);
    }
  };

  // Listen to genuine Firebase Authentication state changes
  useEffect(() => {
    // Process redirect results (Crucial for APK WebViews running signInWithRedirect)
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          const emailOrUid = result.user.email || result.user.uid;
          setCurrentUser(emailOrUid);
          localStorage.setItem("currentUser", emailOrUid);
          triggerToast("Bulut Girişi Başarılı! ☁️🎉");
        }
      })
      .catch((error) => {
        console.error("Redirect auth retrieval failed:", error);
        triggerToast("Google yetkilendirmesi başarısız oldu: " + (error.message || "Bilinmeyen Hata"));
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const emailOrUid = user.email || user.uid;
        setCurrentUser(emailOrUid);
        localStorage.setItem("currentUser", emailOrUid);
      } else {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
          // Keep the local/hybrid session active if Firebase is loading or in a fallback state
          setCurrentUser(savedUser);
        } else {
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync theme configurations on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "1");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "0");
    }
  }, [darkMode]);

  // Sync color theme overrides on documents
  useEffect(() => {
    const themes = ["theme-default", "theme-green", "theme-purple", "theme-orange"];
    themes.forEach((t) => {
      document.documentElement.classList.remove(t);
      document.body.classList.remove(t);
    });
    
    const activeClass = `theme-${colorTheme}`;
    document.documentElement.classList.add(activeClass);
    document.body.classList.add(activeClass);
  }, [colorTheme]);

  // Load appropriate data when user target profile changes or mounts (local + Firebase Firestore sync)
  useEffect(() => {
    let active = true;

    const loadFromLocalStorage = () => {
      const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
      const dataString = localStorage.getItem(spaceKey);
      if (dataString) {
        try {
          const parsed = JSON.parse(dataString);
          setDebts(parsed.debts || []);
          setIncomes(parsed.incomes || []);
          setAlarms(parsed.alarms || []);
          setNotifications(parsed.notifications || []);
          setInstallmentDebts(parsed.installmentDebts || []);
          setPayments(parsed.payments || []);
          setExpenses(parsed.expenses || []);
          const defaultCategories = [
            { id: 1, name: "Kira", color: "#3b82f6", icon: "🏠" },
            { id: 2, name: "Market", color: "#10b981", icon: "🛒" },
            { id: 3, name: "Ulaşım", color: "#f59e0b", icon: "🚗" },
            { id: 4, name: "Yeme İçme", color: "#ec4899", icon: "🍔" },
            { id: 5, name: "Faturalar", color: "#ef4444", icon: "⚡" }
          ];
          const hasCategories = parsed.expenseCategories && Array.isArray(parsed.expenseCategories) && parsed.expenseCategories.length > 0;
          setExpenseCategories(hasCategories ? parsed.expenseCategories : defaultCategories);
        } catch (e) {
          console.error("Local data parsing warning:", e);
        }
      } else {
        // Load standard starter mockup parameters
        setDebts([{ id: 1, name: "Örnek Finansal Borç", amount: 5000, paid: 1500, category: "Diğer", dueDate: "" }]);
        setIncomes([{ id: 1, name: "Aylık Maaş Geliri", amount: 20000, date: new Date().toISOString() }]);
        setAlarms([{ id: 1, title: "Kredi Kartı Son Ödeme", date: new Date().toISOString().slice(0, 10) }]);
        setNotifications([{ id: 1, title: "Sisteme Hoş Geldiniz! Borçlarınızı buraya kaydedebilirsiniz." }]);
        setInstallmentDebts([
          {
            id: 1,
            name: "Telefon Taksidi (Örnek)",
            totalAmount: 12000,
            installmentCount: 12,
            paidInstallmentCount: 3,
            firstDueDate: new Date().toISOString().slice(0, 10)
          }
        ]);
        setPayments([
          { id: 1, debtId: 1, amount: 1500, date: new Date().toISOString(), type: "manual" },
          { id: 2, debtId: 1, amount: 1000, date: new Date().toISOString(), type: "installment" }
        ]);
        setExpenses([
          { id: 1, categoryId: 2, amount: 550, description: "Haftalık mutfak alışverişi", date: new Date().toISOString() },
          { id: 2, categoryId: 5, amount: 240, description: "Elektrik Faturası", date: new Date().toISOString() }
        ]);
        setExpenseCategories([
          { id: 1, name: "Kira", color: "#3b82f6", icon: "🏠" },
          { id: 2, name: "Market", color: "#10b981", icon: "🛒" },
          { id: 3, name: "Ulaşım", color: "#f59e0b", icon: "🚗" },
          { id: 4, name: "Yeme İçme", color: "#ec4899", icon: "🍔" },
          { id: 5, name: "Faturalar", color: "#ef4444", icon: "⚡" }
        ]);
      }
    };

    const loadData = async () => {
      const fbUser = auth.currentUser;
      if (fbUser) {
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (active) {
            setIsOfflineMode(false);
            if (userDoc.exists()) {
              const data = userDoc.data();
              setDebts(data.debts || []);
              setIncomes(data.incomes || []);
              setAlarms(data.alarms || []);
              setNotifications(data.notifications || []);
              setInstallmentDebts(data.installmentDebts || []);
              setPayments(data.payments || []);
              setExpenses(data.expenses || []);
              const defaultCategories = [
                { id: 1, name: "Kira", color: "#3b82f6", icon: "🏠" },
                { id: 2, name: "Market", color: "#10b981", icon: "🛒" },
                { id: 3, name: "Ulaşım", color: "#f59e0b", icon: "🚗" },
                { id: 4, name: "Yeme İçme", color: "#ec4899", icon: "🍔" },
                { id: 5, name: "Faturalar", color: "#ef4444", icon: "⚡" }
              ];
              const hasCats = data.expenseCategories && Array.isArray(data.expenseCategories) && data.expenseCategories.length > 0;
              setExpenseCategories(hasCats ? data.expenseCategories : defaultCategories);
            } else {
              loadFromLocalStorage();
            }
          }
        } catch (err: any) {
          const isOfflineErr = err?.message?.toLowerCase().includes("offline") || 
                             err?.message?.toLowerCase().includes("network") ||
                             err?.code?.toLowerCase().includes("offline") ||
                             !navigator.onLine;

          if (isOfflineErr) {
            console.warn("Firestore loading connection warning (client is offline):", err);
          } else {
            console.error("Firestore loading error:", err);
          }

          if (active) {
            loadFromLocalStorage();
            setIsOfflineMode(true);
            
            const isPermissionError = err && (
              err.code === "permission-denied" || 
              err.message?.toLowerCase().includes("permission") || 
              err.message?.toLowerCase().includes("denied")
            );
            
            if (isPermissionError) {
              handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
            } else {
              triggerToast("Bulut senkronizasyonu kurulamadı: Çevrimdışı mod etkinleştirildi.");
            }
          }
        }
      } else {
        loadFromLocalStorage();
        setIsOfflineMode(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [currentUser]);

  // General persistent workspace saver (local + Firebase Firestore sync)
  const saveAllToUser = async (
    updatedDebts: Debt[],
    updatedIncomes: Income[],
    updatedAlarms: Alarm[],
    updatedNotifs: NotificationItem[],
    updatedInstallments: InstallmentDebt[],
    updatedPayments: PaymentLog[],
    updatedExpenses: Expense[],
    updatedCategories: ExpenseCategory[]
  ) => {
    const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
    const dataBag = {
      debts: updatedDebts,
      incomes: updatedIncomes,
      alarms: updatedAlarms,
      notifications: updatedNotifs,
      installmentDebts: updatedInstallments,
      payments: updatedPayments,
      expenses: updatedExpenses,
      expenseCategories: updatedCategories
    };

    try {
      localStorage.setItem(spaceKey, JSON.stringify(dataBag));
      
      const fbUser = auth.currentUser;
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        await setDoc(userDocRef, {
          ...dataBag,
          updatedAt: serverTimestamp()
        });
        setIsOfflineMode(false);
      }
      triggerToast("Değişiklikler Kaydedildi");
    } catch (err: any) {
      console.error("Critical error in saveAllToUser storage write:", err);
      setIsOfflineMode(true);
      
      const isPermissionError = err && (
        err.code === "permission-denied" || 
        err.message?.toLowerCase().includes("permission") || 
        err.message?.toLowerCase().includes("denied")
      );
      
      if (isPermissionError && auth.currentUser) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
      } else {
        triggerToast("Değişiklikler yerel olarak kaydedildi (Çevrimdışı Mod)");
      }
    }
  };

  const handleRestoreBackup = (data: any) => {
    if (!data) return;
    
    // Attempt robust structural mapping for various backup versions
    const bDebts = data.debts || data.borclar || [];
    const bIncomes = data.incomes || data.gelirler || [];
    const bAlarms = data.alarms || data.hatirlaticilar || [];
    const bNotifs = data.notifications || data.bildirimler || [];
    const bInstallments = data.installmentDebts || data.taksitli_borclar || [];
    const bPayments = data.payments || data.odemeler || [];
    const bExpenses = data.expenses || data.harcamalar || [];
    const bCategories = data.expenseCategories || data.kategoriler || [];

    setDebts(bDebts);
    setIncomes(bIncomes);
    setAlarms(bAlarms);
    setNotifications(bNotifs);
    setInstallmentDebts(bInstallments);
    setPayments(bPayments);
    setExpenses(bExpenses);
    setExpenseCategories(bCategories);

    saveAllToUser(
      bDebts,
      bIncomes,
      bAlarms,
      bNotifs,
      bInstallments,
      bPayments,
      bExpenses,
      bCategories
    );
    
    triggerToast("Bulut yedeği başarıyla geri yüklendi! 📊");
  };

  // Helper ID generators
  const generateId = (items: { id: number }[]) => {
    return items.length ? Math.max(...items.map((x) => x.id)) + 1 : 1;
  };

  const syncInstallmentPayments = (
    debtId: number,
    targetPaidCount: number,
    perMonth: number,
    firstDueDate: string,
    currentPayments: PaymentLog[]
  ): PaymentLog[] => {
    const debtPayments = currentPayments.filter((p) => p.debtId === debtId && p.type === "installment");
    // Sort ascending by date or identifier
    debtPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const otherPayments = currentPayments.filter((p) => !(p.debtId === debtId && p.type === "installment"));

    // Sync individual payment amounts in case installment total/count edited
    const updatedDebtPayments = debtPayments.map((p) => ({
      ...p,
      amount: perMonth
    }));

    if (updatedDebtPayments.length === targetPaidCount) {
      return [...otherPayments, ...updatedDebtPayments];
    }

    if (updatedDebtPayments.length > targetPaidCount) {
      const keptDebtPayments = updatedDebtPayments.slice(0, targetPaidCount);
      return [...otherPayments, ...keptDebtPayments];
    } else {
      const neededCount = targetPaidCount - updatedDebtPayments.length;
      const newDebtPayments = [...updatedDebtPayments];

      for (let i = 0; i < neededCount; i++) {
        const installmentIndex = newDebtPayments.length;
        let payDate = new Date();
        if (firstDueDate) {
          try {
            const baseDate = new Date(firstDueDate);
            baseDate.setMonth(baseDate.getMonth() + installmentIndex);
            payDate = baseDate;
          } catch {}
        }

        const newId = Math.max(0, ...otherPayments.map((p) => p.id), ...newDebtPayments.map((p) => p.id)) + 1;
        newDebtPayments.push({
          id: newId,
          debtId: debtId,
          amount: perMonth,
          date: payDate.toISOString(),
          type: "installment"
        });
      }
      return [...otherPayments, ...newDebtPayments];
    }
  };

  // ---------------- Financial Calculations ----------------
  const activeMonthIdx = selectedMonth !== null ? selectedMonth : new Date().getMonth();
  const activeYearVal = selectedYear !== null ? selectedYear : new Date().getFullYear();

  // 1. Incomes scoped to chosen period (including recurring incomes carry forward)
  const filteredIncomesForStats = incomes.filter((i) => {
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const iDate = new Date(i.date);
      const iMonth = iDate.getMonth();
      const iYear = iDate.getFullYear();

      if (i.isRecurring !== false) {
        // Recurring/fixed incomes carry over to any subsequent period
        const selectedTime = selectedYear * 12 + selectedMonth;
        const incomeTime = iYear * 12 + iMonth;
        return selectedTime >= incomeTime;
      } else {
        // One-time extra incomes only show up in their exact month
        return iMonth === selectedMonth && iYear === selectedYear;
      }
    } catch { return false; }
  });

  // 2. Expenses scoped to chosen period
  const filteredExpensesForStats = expenses.filter((e) => {
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const eDate = new Date(e.date);
      return eDate.getMonth() === selectedMonth && eDate.getFullYear() === selectedYear;
    } catch { return false; }
  });

  // 3. Payments scoped to chosen period
  const filteredPaymentsForStats = payments.filter((p) => {
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const pDate = new Date(p.date);
      return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    } catch { return false; }
  });

  // 4. Lifetime totals for cumulative overall debt widgets (un-filtered by period, integrating contact-based payables as well)
  const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
  const savedContactTxsStr = localStorage.getItem(`${spaceKey}_contacts_transactions`);
  let contactPayablesTotal = 0;
  let contactPayablesPaid = 0;
  if (savedContactTxsStr) {
    try {
      const txs = JSON.parse(savedContactTxsStr);
      if (Array.isArray(txs)) {
        txs.forEach((t: any) => {
          if (t.type === "payable") {
            const amt = Number(t.amount) || 0;
            contactPayablesTotal += amt;
            if (t.isPaid) {
              contactPayablesPaid += amt;
            }
          }
        });
      }
    } catch (e) {
      console.error("Error loading contact transactions:", e);
    }
  }
  const contactPayablesRemaining = contactPayablesTotal - contactPayablesPaid;

  const trueOverallDebt = debts.reduce((sum, d) => sum + d.amount, 0) + 
    installmentDebts.reduce((sum, inst) => sum + inst.totalAmount, 0) +
    contactPayablesTotal;

  const trueOverallPaid = debts.reduce((sum, d) => sum + d.paid, 0) + 
    installmentDebts.reduce((sum, inst) => sum + (inst.paidInstallmentCount * (inst.totalAmount / (inst.installmentCount || 1))), 0) +
    contactPayablesPaid;

  const trueOverallRemaining = trueOverallDebt - trueOverallPaid;

  // 5. Selected period's specific monthly debt calculation (for "BU AYKİ BORÇ TOPLAMI" & "BU AY KALAN BORÇ")
  const simpleDebtsInSelectedMonth = debts.filter((d) => {
    if (selectedMonth === null || selectedYear === null) return true;
    if (!d.dueDate) return false;
    try {
      const dDate = new Date(d.dueDate);
      const dMonth = dDate.getMonth();
      const dYear = dDate.getFullYear();
      
      if (dYear === selectedYear && dMonth === selectedMonth) return true;
      
      const selectedTime = selectedYear * 12 + selectedMonth;
      const dueTime = dYear * 12 + dMonth;
      const isUnpaid = d.paid < d.amount;
      return selectedTime > dueTime && isUnpaid;
    } catch { return false; }
  });

  const periodSimpleDebtRemaining = simpleDebtsInSelectedMonth.reduce((sum, d) => sum + Math.max(0, d.amount - d.paid), 0);

  // Actual payments logged during this month for simple debts
  const periodSimpleDebtPaidThisMonth = payments.filter((p) => {
    if (p.type !== "manual") return false;
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const pDate = new Date(p.date);
      return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    } catch { return false; }
  }).reduce((sum, p) => sum + p.amount, 0);

  const periodSimpleDebtTotal = periodSimpleDebtRemaining + periodSimpleDebtPaidThisMonth;

  const periodInstallmentRemaining = installmentDebts.reduce((sum, inst) => {
    if (selectedMonth === null || selectedYear === null) {
      return sum + (inst.totalAmount - (inst.paidInstallmentCount * (inst.totalAmount / inst.installmentCount)));
    }
    const startDate = new Date(inst.firstDueDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const monthDiff = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);
    const isActiveThisMonth = monthDiff >= 0 && monthDiff < inst.installmentCount;
    const isPaidThisMonth = inst.paidInstallmentCount > monthDiff;
    if (isActiveThisMonth && !isPaidThisMonth) {
      return sum + (inst.totalAmount / inst.installmentCount);
    }
    return sum;
  }, 0);

  const periodInstallmentPaidThisMonth = payments.filter((p) => {
    if (p.type !== "installment") return false;
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const pDate = new Date(p.date);
      return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    } catch { return false; }
  }).reduce((sum, p) => sum + p.amount, 0);

  const periodInstallmentTotal = periodInstallmentRemaining + periodInstallmentPaidThisMonth;

  // Calculate monthly contact-based payables (unpaid/payable due in current month or overdue)
  let periodContactPayablesTotal = 0;
  let periodContactPayablesRemaining = 0;
  if (savedContactTxsStr) {
    try {
      const txs = JSON.parse(savedContactTxsStr);
      if (Array.isArray(txs)) {
        txs.forEach((t: any) => {
          if (t.type === "payable") {
            const amt = Number(t.amount) || 0;
            if (selectedMonth === null || selectedYear === null) {
              periodContactPayablesTotal += amt;
              if (!t.isPaid) {
                periodContactPayablesRemaining += amt;
              }
            } else {
              if (t.dueDate) {
                try {
                  const dDate = new Date(t.dueDate);
                  const dMonth = dDate.getMonth();
                  const dYear = dDate.getFullYear();
                  if (dYear === selectedYear && dMonth === selectedMonth) {
                    periodContactPayablesTotal += amt;
                    if (!t.isPaid) {
                      periodContactPayablesRemaining += amt;
                    }
                  } else {
                    const selectedTime = selectedYear * 12 + selectedMonth;
                    const dueTime = dYear * 12 + dMonth;
                    if (selectedTime > dueTime && !t.isPaid) {
                      periodContactPayablesTotal += amt;
                      periodContactPayablesRemaining += amt;
                    }
                  }
                } catch {
                  if (!t.isPaid) {
                    periodContactPayablesTotal += amt;
                    periodContactPayablesRemaining += amt;
                  }
                }
              } else {
                if (!t.isPaid) {
                  periodContactPayablesTotal += amt;
                  periodContactPayablesRemaining += amt;
                }
              }
            }
          }
        });
      }
    } catch {}
  }

  const computedThisMonthKalanBorc = periodSimpleDebtRemaining + periodInstallmentRemaining + periodContactPayablesRemaining;
  const computedThisMonthPaidBorc = periodSimpleDebtPaidThisMonth + periodInstallmentPaidThisMonth + (periodContactPayablesTotal - periodContactPayablesRemaining);
  const computedThisMonthTotalBorc = computedThisMonthKalanBorc + computedThisMonthPaidBorc;

  const totalIncome = filteredIncomesForStats.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = filteredExpensesForStats.reduce((sum, e) => sum + e.amount, 0);

  // Carryover balance (Devreden Bakiye) accumulator from all months prior to selectedMonth & selectedYear
  let carryOverBalance = 0;
  if (selectedMonth !== null && selectedYear !== null) {
    let startYearComp = 2025;
    let startMonthComp = 0;

    const allDatesComp: Date[] = [];
    incomes.forEach((i) => { try { allDatesComp.push(new Date(i.date)); } catch {} });
    expenses.forEach((e) => { try { allDatesComp.push(new Date(e.date)); } catch {} });
    payments.forEach((p) => { try { allDatesComp.push(new Date(p.date)); } catch {} });

    if (allDatesComp.length > 0) {
      const minDate = new Date(Math.min(...allDatesComp.map(d => d.getTime())));
      startYearComp = minDate.getFullYear();
      startMonthComp = minDate.getMonth();
    }

    let loopYearComp = startYearComp;
    let loopMonthComp = startMonthComp;
    const targetTimeComp = selectedYear * 12 + selectedMonth;

    while (loopYearComp * 12 + loopMonthComp < targetTimeComp) {
      const loopTimeComp = loopYearComp * 12 + loopMonthComp;

      // Incomes in historical loopMonthComp/loopYearComp
      const incTotalComp = incomes.reduce((sum, i) => {
        try {
          const d = new Date(i.date);
          const iMonth = d.getMonth();
          const iYear = d.getFullYear();
          if (i.isRecurring !== false) {
            const incTime = iYear * 12 + iMonth;
            if (loopTimeComp >= incTime) {
              return sum + i.amount;
            }
          } else {
            if (iMonth === loopMonthComp && iYear === loopYearComp) {
              return sum + i.amount;
            }
          }
        } catch {}
        return sum;
      }, 0);

      // Expenses in historical loopMonthComp/loopYearComp
      const expTotalComp = expenses.reduce((sum, e) => {
        try {
          const d = new Date(e.date);
          if (d.getMonth() === loopMonthComp && d.getFullYear() === loopYearComp) {
            return sum + e.amount;
          }
        } catch {}
        return sum;
      }, 0);

      // Payments in historical loopMonthComp/loopYearComp
      const payTotalComp = payments.reduce((sum, p) => {
        try {
          const d = new Date(p.date);
          if (d.getMonth() === loopMonthComp && d.getFullYear() === loopYearComp) {
            return sum + p.amount;
          }
        } catch {}
        return sum;
      }, 0);

      const monthlyNet = incTotalComp - expTotalComp - payTotalComp;
      carryOverBalance += monthlyNet;

      loopMonthComp++;
      if (loopMonthComp > 11) {
        loopMonthComp = 0;
        loopYearComp++;
      }
    }
  }

  // Net reserve capacity specifically for the selected month (including carry over from prior months)
  const currentMonthPaidBorc = computedThisMonthTotalBorc - computedThisMonthKalanBorc;
  const netIncomeValue = totalIncome - totalExpense - currentMonthPaidBorc + carryOverBalance;

  const currentMonthTotalPaymentsCount = filteredPaymentsForStats.length;

  const monthlyInstallmentsDue = installmentDebts.reduce((sum, inst) => {
    if (selectedMonth === null || selectedYear === null) {
      if (inst.paidInstallmentCount >= inst.installmentCount) return sum;
      return sum + inst.totalAmount / inst.installmentCount;
    }
    const startDate = new Date(inst.firstDueDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const monthDiff = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);
    const isActiveThisMonth = monthDiff >= 0 && monthDiff < inst.installmentCount;
    const isPaidThisMonth = inst.paidInstallmentCount > monthDiff;
    if (isActiveThisMonth && !isPaidThisMonth) {
      return sum + inst.totalAmount / inst.installmentCount;
    }
    return sum;
  }, 0);

  const statsBag: FinancialStats = {
    totalDebt: trueOverallDebt,
    totalPaid: trueOverallPaid,
    remaining: trueOverallRemaining,
    totalIncome: totalIncome,
    totalExpense: totalExpense,
    netIncome: netIncomeValue,
    thisMonthTotalBorc: computedThisMonthTotalBorc,
    thisMonthKalanBorc: computedThisMonthKalanBorc,
    carryOverBalance: carryOverBalance
  };

  const filteredIncomesByMonth = incomes.filter((i) => {
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const d = new Date(i.date);
      const iMonth = d.getMonth();
      const iYear = d.getFullYear();

      if (i.isRecurring !== false) {
        // Carry forward to subsequently selected months
        const selectedTime = selectedYear * 12 + selectedMonth;
        const incomeTime = iYear * 12 + iMonth;
        return selectedTime >= incomeTime;
      } else {
        // One-time extra incomes show up in exact month
        return iMonth === selectedMonth && iYear === selectedYear;
      }
    } catch { return true; }
  });

  const filteredExpensesByMonth = expenses.filter((e) => {
    if (selectedMonth === null || selectedYear === null) return true;
    try {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    } catch { return true; }
  });

  // ---------------- Profile Session Controls ----------------
  const handleLogin = () => {
    if (!loginUsername.trim()) {
      alert("Kullanıcı profil tanımlaması için geçerli bir ad girin.");
      return;
    }
    const cleanNick = loginUsername.trim();
    if (currentUser !== cleanNick) {
      const proceedLogin = () => {
        setCurrentUser(cleanNick);
        localStorage.setItem("currentUser", cleanNick);
        setLoginUsername("");
        triggerToast(`Giriş Başarılı: ${cleanNick}`);
      };

      const guestData = localStorage.getItem("user_anonymous");
      if (guestData) {
        triggerConfirm(
          "Veri Aktarımı",
          "Mevcut misafir verilerini bu hesaba kopyalamak ister misiniz?",
          () => {
            localStorage.setItem(`user_${cleanNick}`, guestData);
            proceedLogin();
          }
        );
      } else {
        proceedLogin();
      }
    }
  };

  const handleLogout = () => {
    triggerConfirm(
      "Oturumu Kapat",
      "Oturumu kapatmak istediğinize emin misiniz?",
      () => {
        signOut(auth).catch((err) => console.error("SignOut error:", err));
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
        triggerToast("Oturum Kapatıldı");
      }
    );
  };

  // ---------------- CRUD Operations ----------------
  const handleSaveDebt = (debtData: Partial<Debt>, autoCreateAlarm?: boolean) => {
    let updated: Debt[] = [];
    let updatedPayments = [...payments];
    let updatedAlarms = [...alarms];
    let updatedNotifs = [...notifications];
    let shouldCelebrate = false;

    const debtName = debtData.name || "İsimsiz Borç";
    const dueDate = debtData.dueDate || "";

    if (debtData.id) {
      // It's an update. Check if payment changed
      const oldDebt = debts.find((d) => d.id === debtData.id);
      const oldPaid = oldDebt ? oldDebt.paid : 0;
      const oldAmount = oldDebt ? oldDebt.amount : 0;
      const newPaid = debtData.paid || 0;
      const newAmount = debtData.amount || oldAmount;

      const wasPaid = oldPaid >= oldAmount && oldAmount > 0;
      const isPaidNow = newPaid >= newAmount && newAmount > 0;

      if (!wasPaid && isPaidNow) {
        shouldCelebrate = true;
      }

      const diff = newPaid - oldPaid;

      if (diff > 0) {
        // Log the difference as a manual payment
        const newPayment: PaymentLog = {
          id: generateId(updatedPayments),
          debtId: debtData.id,
          amount: diff,
          date: new Date().toISOString(),
          type: "manual"
        };
        updatedPayments.push(newPayment);
      } else if (diff < 0) {
        // Reduced payment. We can clean up manual payments list for this debt
        // to prevent mismatching monthly figures
        updatedPayments = updatedPayments.filter((p) => !(p.debtId === debtData.id && p.type === "manual"));
        if (newPaid > 0) {
          const newPayment: PaymentLog = {
            id: generateId(updatedPayments),
            debtId: debtData.id,
            amount: newPaid,
            date: new Date().toISOString(),
            type: "manual"
          };
          updatedPayments.push(newPayment);
        }
      }

      updated = debts.map((d) => (d.id === debtData.id ? { ...d, ...debtData } as Debt : d));
    } else {
      // It's a new debt creation.
      const newId = generateId(debts);
      const newPaid = debtData.paid || 0;
      const newAmount = debtData.amount || 0;
      const isPaidNow = newPaid >= newAmount && newAmount > 0;

      if (isPaidNow) {
        shouldCelebrate = true;
      }

      const newD: Debt = {
        id: newId,
        name: debtName,
        amount: newAmount,
        paid: newPaid,
        category: debtData.category || "Diğer",
        dueDate: dueDate
      };
      updated = [...debts, newD];

      if (newPaid > 0) {
        // Log initial payment
        const newPayment: PaymentLog = {
          id: generateId(updatedPayments),
          debtId: newId,
          amount: newPaid,
          date: new Date().toISOString(),
          type: "manual"
        };
        updatedPayments.push(newPayment);
      }
    }

    // Atomically create an Alarm and a Notification Item to avoid render race conditions
    if (autoCreateAlarm && dueDate) {
      const titleString = `Borç Son Ödeme Tarihi: ${debtName}`;
      const newA: Alarm = {
        id: generateId(updatedAlarms),
        title: titleString,
        date: dueDate
      };
      updatedAlarms = [...updatedAlarms, newA];

      const newNotifId = updatedNotifs.length > 0 ? Math.max(...updatedNotifs.map((n) => n.id)) + 1 : 1;
      const newNotif: NotificationItem = {
        id: newNotifId,
        title: `⏰ Otomatik Alarm Kuruldu - ${titleString} (${new Date(dueDate).toLocaleDateString("tr-TR")})`
      };
      updatedNotifs = [newNotif, ...updatedNotifs];

      setAlarms(updatedAlarms);
      setNotifications(updatedNotifs);

      // Play audio prompt and request OS notifications but skip double writes
      sendSystemNotification(
        "Ödeme Hatırlatıcısı Kuruldu! ⏰",
        `"${titleString}" başlıklı alarmınız otomatik oluşturulup cihazınıza kaydedildi.`,
        false
      );
    }

    setDebts(updated);
    setPayments(updatedPayments);
    saveAllToUser(updated, incomes, updatedAlarms, updatedNotifs, installmentDebts, updatedPayments, expenses, expenseCategories);
    if (shouldCelebrate) {
      triggerConfetti();
    }
  };

  const handleDeleteDebt = (id: number) => {
    triggerConfirm(
      "Borcu Sil",
      "Bu borç kaydı tamamen silinecektir, devam edilsin mi?",
      () => {
        const updatedDebts = debts.filter((d) => d.id !== id);
        const updatedPayments = payments.filter((p) => p.debtId !== id);
        setDebts(updatedDebts);
        setPayments(updatedPayments);
        saveAllToUser(
          updatedDebts,
          incomes,
          alarms,
          notifications,
          installmentDebts,
          updatedPayments,
          expenses,
          expenseCategories
        );
      }
    );
  };

  const handleToggleDebtPaid = (id: number) => {
    let updatedPayments = [...payments];
    let shouldCelebrate = false;
    const updated = debts.map((d) => {
      if (d.id === id) {
        const isPaid = d.paid >= d.amount;
        const newPaid = isPaid ? 0 : d.amount;
        const diff = newPaid - d.paid;

        if (diff > 0) {
          const newPayment: PaymentLog = {
            id: generateId(updatedPayments),
            debtId: id,
            amount: diff,
            date: new Date().toISOString(),
            type: "manual"
          };
          updatedPayments.push(newPayment);
          shouldCelebrate = true;
        } else {
          // If toggled unpaid, remove manual payments for this debt
          updatedPayments = updatedPayments.filter((p) => !(p.debtId === id && p.type === "manual"));
        }

        return {
          ...d,
          paid: newPaid
        };
      }
      return d;
    });

    setDebts(updated);
    setPayments(updatedPayments);
    saveAllToUser(updated, incomes, alarms, notifications, installmentDebts, updatedPayments, expenses, expenseCategories);
    if (shouldCelebrate) {
      triggerConfetti();
    }
  };

  const handleSaveIncome = (incData: Partial<Income>) => {
    let updated: Income[] = [];
    if (incData.id) {
      updated = incomes.map((i) => (i.id === incData.id ? (incData as Income) : i));
    } else {
      const newI: Income = {
        id: generateId(incomes),
        name: incData.name || "Ek Gelir",
        amount: incData.amount || 0,
        date: incData.date || new Date().toISOString()
      };
      updated = [...incomes, newI];
    }
    setIncomes(updated);
    saveAllToUser(debts, updated, alarms, notifications, installmentDebts, payments, expenses, expenseCategories);
  };

  const handleDeleteIncome = (id: number) => {
    const updatedIncomes = incomes.filter((i) => i.id !== id);
    setIncomes(updatedIncomes);
    saveAllToUser(debts, updatedIncomes, alarms, notifications, installmentDebts, payments, expenses, expenseCategories);
  };

  const handleSaveExpense = (expData: Partial<Expense>) => {
    let updated: Expense[] = [];
    if (expData.id) {
      updated = expenses.map((e) => (e.id === expData.id ? (expData as Expense) : e));
    } else {
      const newE: Expense = {
        id: generateId(expenses),
        categoryId: expData.categoryId || 1,
        amount: expData.amount || 0,
        description: expData.description || "",
        date: expData.date || new Date().toISOString()
      };
      updated = [...expenses, newE];
    }
    setExpenses(updated);
    saveAllToUser(debts, incomes, alarms, notifications, installmentDebts, payments, updated, expenseCategories);
  };

  const handleDeleteExpense = (id: number) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    saveAllToUser(debts, incomes, alarms, notifications, installmentDebts, payments, updatedExpenses, expenseCategories);
  };

  const handleSaveCategory = (catData: Partial<ExpenseCategory>) => {
    let updated: ExpenseCategory[] = [];
    if (catData.id) {
      updated = expenseCategories.map((c) => (c.id === catData.id ? { ...c, ...catData } : c));
    } else {
      const palette = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"];
      const randomColor = palette[Math.floor(Math.random() * palette.length)];
      const newC: ExpenseCategory = {
        id: generateId(expenseCategories),
        name: catData.name || "Kategori",
        color: catData.color || randomColor
      };
      updated = [...expenseCategories, newC];
    }
    setExpenseCategories(updated);
    saveAllToUser(debts, incomes, alarms, notifications, installmentDebts, payments, expenses, updated);
  };

  const handleSaveAllCategories = (cats: ExpenseCategory[]) => {
    try {
      setExpenseCategories(cats);
      saveAllToUser(debts, incomes, alarms, notifications, installmentDebts, payments, expenses, cats);
    } catch (err) {
      console.error("Error updating all categories:", err);
    }
  };

  const handleDeleteCategory = (id: number) => {
    triggerConfirm(
      "Kategoriyi Sil",
      "Bu kategori silindiğinde bu kategoriye ait harcamalar da kaldırılacaktır. Onaylıyor musunuz?",
      () => {
        const updatedCategories = expenseCategories.filter((c) => c.id !== id);
        const updatedExpenses = expenses.filter((e) => e.categoryId !== id);
        setExpenseCategories(updatedCategories);
        setExpenses(updatedExpenses);
        saveAllToUser(debts, incomes, alarms, notifications, installmentDebts, payments, updatedExpenses, updatedCategories);
      }
    );
  };

  const handleSaveInstallment = (instData: Partial<InstallmentDebt>) => {
    let updated: InstallmentDebt[] = [];
    let updatedPayments = [...payments];

    if (instData.id) {
      updated = installmentDebts.map((i) => (i.id === instData.id ? (instData as InstallmentDebt) : i));
      
      const inst = updated.find((i) => i.id === instData.id);
      if (inst) {
        const perMonth = inst.totalAmount / (inst.installmentCount || 1);
        updatedPayments = syncInstallmentPayments(
          inst.id,
          inst.paidInstallmentCount,
          perMonth,
          inst.firstDueDate,
          updatedPayments
        );
      }
    } else {
      const newId = generateId(installmentDebts);
      const newInst: InstallmentDebt = {
        id: newId,
        name: instData.name || "Yeni Taksit Planı",
        totalAmount: instData.totalAmount || 0,
        installmentCount: instData.installmentCount || 1,
        paidInstallmentCount: instData.paidInstallmentCount || 0,
        firstDueDate: instData.firstDueDate || new Date().toISOString().slice(0, 10)
      };
      updated = [...installmentDebts, newInst];

      if (newInst.paidInstallmentCount > 0) {
        const perMonth = newInst.totalAmount / (newInst.installmentCount || 1);
        updatedPayments = syncInstallmentPayments(
          newId,
          newInst.paidInstallmentCount,
          perMonth,
          newInst.firstDueDate,
          updatedPayments
        );
      }
    }
    setInstallmentDebts(updated);
    setPayments(updatedPayments);
    saveAllToUser(debts, incomes, alarms, notifications, updated, updatedPayments, expenses, expenseCategories);
  };

  const handleDeleteInstallment = (id: number) => {
    triggerConfirm(
      "Taksit Planını Sil",
      "Taksit planı tamamen silinecektir, devam edilsin mi?",
      () => {
        const updated = installmentDebts.filter((i) => i.id !== id);
        const updatedPayments = payments.filter((p) => !(p.debtId === id && p.type === "installment"));
        setInstallmentDebts(updated);
        setPayments(updatedPayments);
        saveAllToUser(debts, incomes, alarms, notifications, updated, updatedPayments, expenses, expenseCategories);
      }
    );
  };

  const handlePayInstallment = (id: number) => {
    let updatedPayments = [...payments];
    const updated = installmentDebts.map((inst) => {
      if (inst.id === id && inst.paidInstallmentCount < inst.installmentCount) {
        const perMonth = inst.totalAmount / inst.installmentCount;
        const updatedPaidCount = inst.paidInstallmentCount + 1;
        
        // Push payment logs
        const newPayment: PaymentLog = {
          id: generateId(updatedPayments),
          debtId: id,
          amount: perMonth,
          date: new Date().toISOString(),
          type: "installment"
        };
        updatedPayments.push(newPayment);
        
        return {
          ...inst,
          paidInstallmentCount: updatedPaidCount
        };
      }
      return inst;
    });
    setInstallmentDebts(updated);
    setPayments(updatedPayments);
    saveAllToUser(debts, incomes, alarms, notifications, updated, updatedPayments, expenses, expenseCategories);
    triggerToast("Taksit Ödemesi Kaydedildi");
  };

  const handleRevertInstallmentPayment = (id: number) => {
    let updatedPayments = [...payments];
    const updated = installmentDebts.map((inst) => {
      if (inst.id === id && inst.paidInstallmentCount > 0) {
        const updatedPaidCount = inst.paidInstallmentCount - 1;
        const perMonth = inst.totalAmount / inst.installmentCount;
        
        updatedPayments = syncInstallmentPayments(
          id,
          updatedPaidCount,
          perMonth,
          inst.firstDueDate,
          updatedPayments
        );
        
        return {
          ...inst,
          paidInstallmentCount: updatedPaidCount
        };
      }
      return inst;
    });
    setInstallmentDebts(updated);
    setPayments(updatedPayments);
    saveAllToUser(debts, incomes, alarms, notifications, updated, updatedPayments, expenses, expenseCategories);
    triggerToast("Son Ödeme Geri Alındı");
  };

  const handleAddAlarm = (titleString: string, dateString: string) => {
    const newA: Alarm = {
      id: generateId(alarms),
      title: titleString,
      date: dateString
    };
    const updated = [...alarms, newA];

    // Atomically create a Notification Item to be stored in the "Bildirim Paneli" list
    const newNotifId = notifications.length > 0 ? Math.max(...notifications.map((n) => n.id)) + 1 : 1;
    const newNotif: NotificationItem = {
      id: newNotifId,
      title: `⏰ Ödeme Hatırlatıcısı Kuruldu - ${titleString} (${dateString ? new Date(dateString).toLocaleDateString("tr-TR") : "Tarih Belirtilmedi"})`
    };
    const updatedNotifs = [newNotif, ...notifications];

    setAlarms(updated);
    setNotifications(updatedNotifs);
    saveAllToUser(debts, incomes, updated, updatedNotifs, installmentDebts, payments, expenses, expenseCategories);
    
    // Trigger OS alert sounds/visuals (persist is false here because we saved it already in the line above)
    sendSystemNotification(
      "Ödeme Hatırlatıcısı Kuruldu! ⏰",
      `"${titleString}" başlıklı alarmınız başarıyla oluşturuldu ve cihazınıza tanımlandı.`,
      false
    );
  };

  const handleDeleteAlarm = (id: number) => {
    const updated = alarms.filter((a) => a.id !== id);
    setAlarms(updated);
    saveAllToUser(debts, incomes, updated, notifications, installmentDebts, payments, expenses, expenseCategories);
  };

  const handleDeleteNotif = (id: number) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveAllToUser(debts, incomes, alarms, updated, installmentDebts, payments, expenses, expenseCategories);
  };

  const handleClearNotifs = () => {
    setNotifications([]);
    saveAllToUser(debts, incomes, alarms, [], installmentDebts, payments, expenses, expenseCategories);
  };

  const handleSaveContactTx = (contactName: string, amount: number, type: "receivable" | "payable", description?: string) => {
    try {
      const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
      const contactsKey = `${spaceKey}_contacts_directory`;
      const txsKey = `${spaceKey}_contacts_transactions`;

      let oldContacts: any[] = [];
      let oldTxs: any[] = [];

      try {
        oldContacts = JSON.parse(localStorage.getItem(contactsKey) || "[]");
      } catch {}
      try {
        oldTxs = JSON.parse(localStorage.getItem(txsKey) || "[]");
      } catch {}

      // Find or create contact
      let contactObj = oldContacts.find(
        (c) => c.name.toLowerCase().trim() === contactName.toLowerCase().trim()
      );

      if (!contactObj) {
        const gradients = [
          "from-emerald-500 to-teal-600",
          "from-indigo-500 to-indigo-700",
          "from-amber-500 to-orange-600",
          "from-pink-500 to-rose-600",
          "from-sky-500 to-blue-700",
          "from-purple-500 to-fuchsia-700"
        ];
        const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];
        contactObj = {
          id: "cont_" + Date.now(),
          name: contactName,
          phone: "Belirtilmemiş 📞",
          category: "friend",
          avatarColor: randomGrad,
          createdAt: new Date().toISOString()
        };
        oldContacts = [contactObj, ...oldContacts];
        localStorage.setItem(contactsKey, JSON.stringify(oldContacts));
      }

      // Add transaction
      const newTx = {
        id: "tx_" + Date.now(),
        contactId: contactObj.id,
        type: type,
        amount: Number(amount) || 0,
        description: description || "Sesli asistan kaydı",
        dueDate: new Date().toISOString().split("T")[0],
        isPaid: false,
        createdAt: new Date().toISOString()
      };

      oldTxs = [newTx, ...oldTxs];
      localStorage.setItem(txsKey, JSON.stringify(oldTxs));

      // Force state sync to update lifetime stats in App.tsx
      setContactSyncTrigger((prev) => prev + 1);
    } catch (e) {
      console.error("Error in handleSaveContactTx:", e);
    }
  };

  // ---------------- Backup Utilities ----------------
  const handleExportBackup = () => {
    const contactsKey = `${spaceKey}_contacts_directory`;
    const contactTxsKey = `${spaceKey}_contacts_transactions`;
    
    let contactsData = [];
    let contactTxsData = [];
    
    try {
      contactsData = JSON.parse(localStorage.getItem(contactsKey) || "[]");
    } catch {}
    try {
      contactTxsData = JSON.parse(localStorage.getItem(contactTxsKey) || "[]");
    } catch {}

    const bag = { 
      debts, 
      incomes, 
      alarms, 
      notifications, 
      installmentDebts, 
      payments, 
      expenses, 
      expenseCategories,
      contacts: contactsData,
      contactTransactions: contactTxsData
    };
    
    const blob = new Blob([JSON.stringify(bag, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `borc_takip_yedek_${currentUser || "kullanici"}.json`;
    link.click();
    localStorage.setItem("last_backup_export_date", new Date().toISOString());
    triggerToast("Veri Yedeği İndirildi");
  };

  const handleDownloadCSV = (startDate?: string, endDate?: string) => {
    const esc = (val: any) => {
      const str = String(val === undefined || val === null ? "" : val);
      return `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    const isWithinRange = (dateStr?: string) => {
      if (!dateStr) return true; // keep undated items, or map safely
      const dVal = dateStr.slice(0, 10);
      if (startDate && dVal < startDate) return false;
      if (endDate && dVal > endDate) return false;
      return true;
    };

    // Filter data based on date ranges
    const filteredIncomes = incomes.filter(inc => isWithinRange(inc.date));
    const filteredExpenses = expenses.filter(exp => isWithinRange(exp.date));
    const filteredDebts = debts.filter(d => isWithinRange(d.dueDate));
    const filteredInstallments = installmentDebts.filter(inst => isWithinRange(inst.firstDueDate));

    // Calculate sum statistics for the filtered period
    const filteredTotalIncome = filteredIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const filteredTotalExpense = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const filteredTotalDebt = filteredDebts.reduce((sum, item) => sum + (item.amount || 0), 0);
    const filteredTotalPaid = filteredDebts.reduce((sum, item) => sum + (item.paidAmount || item.paid || 0), 0);
    const filteredRemainingDebt = filteredTotalDebt - filteredTotalPaid;
    const filteredNetReserve = filteredTotalIncome - filteredTotalExpense;

    let csvContent = "";
    csvContent += "\uFEFF"; // UTF-8 BOM byte sequence to render Turkish characters elegantly in Excel

    // Header Info
    csvContent += [esc("FİNANSAL DURUM VE BÜTÇE TAKİP RAPORU"), esc("")].join(";") + "\n";
    csvContent += [esc("Rapor Oluşturma Tarihi"), esc(new Date().toLocaleDateString("tr-TR"))].join(";") + "\n";
    csvContent += [esc("Rapor Filtre Aralığı"), esc(startDate && endDate ? `${startDate} - ${endDate}` : "Tüm Dönemler (Filtresiz)")].join(";") + "\n";
    csvContent += [esc("Aktif Para Birimi"), esc(activeCurrency)].join(";") + "\n";
    csvContent += "\n";

    // Özet Tablosu (Dönemsel)
    csvContent += [esc("=== DÖNEMSEL FİNANSAL GÖSTERGELER VE DETAY ==="), esc("")].join(";") + "\n";
    csvContent += [esc("Gösterge Kalemi"), esc(`Miktar (${activeCurrency})`)].join(";") + "\n";
    csvContent += [esc("Toplam Gelir (Seçilen Dönem)"), esc(format(filteredTotalIncome))].join(";") + "\n";
    csvContent += [esc("Toplam Gider (Seçilen Dönem)"), esc(format(filteredTotalExpense))].join(";") + "\n";
    csvContent += [esc("Net Kalan Rezerv (Seçilen Dönem)"), esc(format(filteredNetReserve))].join(";") + "\n";
    csvContent += [esc("Eklenen Toplam Borç (Seçilen Dönem)"), esc(format(filteredTotalDebt))].join(";") + "\n";
    csvContent += [esc("Seçilen Dönem Borç Verilen/Ödenen"), esc(format(filteredTotalPaid))].join(";") + "\n";
    csvContent += [esc("Kalan Aktif Borç Payı (Seçilen Dönem)"), esc(format(filteredRemainingDebt))].join(";") + "\n";
    csvContent += "\n";

    // Gelirler
    csvContent += [esc("=== DETAYLI KAYITLI GELİRLER ==="), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Gelir Başlığı"), esc(`Miktar (${activeCurrency})`), esc("Gelir Kategorisi"), esc("Tarih / Not")].join(";") + "\n";
    if (filteredIncomes.length === 0) {
      csvContent += [esc("Seçilen tarih aralığında kayıtlı gelir bulunamadı."), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      filteredIncomes.forEach((inc: any) => {
        csvContent += [esc(inc.title || inc.name || "İsimsiz Gelir"), esc(inc.amount), esc(inc.category || "Genel"), esc(inc.date || "")].join(";") + "\n";
      });
    }
    csvContent += "\n";

    // Giderler
    csvContent += [esc("=== DETAYLI HARCAMA VE GİDERLER ==="), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Harcama Başlığı"), esc(`Miktar (${activeCurrency})`), esc("Kategori"), esc("Harcama Tarihi")].join(";") + "\n";
    if (filteredExpenses.length === 0) {
      csvContent += [esc("Seçilen tarih aralığında kayıtlı gider bulunamadı."), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      filteredExpenses.forEach((exp: any) => {
        csvContent += [esc(exp.title || exp.description || "İsimsiz Gider"), esc(exp.amount), esc(exp.category || "Genel"), esc(exp.date || "")].join(";") + "\n";
      });
    }
    csvContent += "\n";

    // Borçlar
    csvContent += [esc("=== DETAYLI BORÇ LİSTESİ VE DURUMLARI ==="), esc(""), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Borç Açıklaması"), esc("Toplam Borç"), esc("Ödenen Kısım"), esc("Kalan Tutar"), esc("Alacaklı Kurum/Kişi"), esc("Vade Tarihi"), esc("Ödeme Durumu")].join(";") + "\n";
    if (filteredDebts.length === 0) {
      csvContent += [esc("Seçilen tarih aralığında kayıtlı borç kaydı bulunamadı."), esc(""), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      filteredDebts.forEach((d: any) => {
        const paidVal = d.paidAmount !== undefined ? d.paidAmount : (d.paid || 0);
        csvContent += [
          esc(d.title || d.name || "Borç"),
          esc(d.amount),
          esc(paidVal),
          esc(d.amount - paidVal),
          esc(d.creditor || "-"),
          esc(d.dueDate || ""),
          esc(d.isPaid || paidVal >= d.amount ? "ÖDENDİ" : "BEKLEYEN ÖDEME")
        ].join(";") + "\n";
      });
    }
    csvContent += "\n";

    // Taksitler
    csvContent += [esc("=== AKTİF KREDİ VE TAKSİTLİ HARCAMA PLANLARI ==="), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Kredi/Taksit Adı"), esc("Aylık Ödeme"), esc("Toplam Taksit"), esc("Kalan Taksit"), esc("Toplam Tutar"), esc("Başlangıç Tarihi")].join(";") + "\n";
    if (filteredInstallments.length === 0) {
      csvContent += [esc("Seçilen tarih aralığında kayıtlı taksitli borç bulunamadı."), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      filteredInstallments.forEach((inst: any) => {
        const monthly = inst.monthlyPayment || (inst.totalAmount / (inst.installmentCount || 1));
        const remaining = inst.remainingInstallments !== undefined ? inst.remainingInstallments : (inst.installmentCount - inst.paidInstallmentCount);
        csvContent += [
          esc(inst.title || inst.name || "Taksit Planı"),
          esc(monthly),
          esc(inst.installmentCount),
          esc(remaining),
          esc(inst.totalAmount),
          esc(inst.firstDueDate || inst.startDate || "")
        ].join(";") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateSuffix = startDate && endDate ? `${startDate}_${endDate}` : `${new Date().toISOString().split('T')[0]}`;
    link.setAttribute("download", `Finansal_Rapor_Filtreli_${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast("Filtrelenmiş Finansal Rapor başarıyla CSV olarak indirildi! 📊");
  };

  const handleImportBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          
          const rawDebts = parsed.debts || parsed.allDebts || parsed.debtList || [];
          const rawIncomes = parsed.incomes || parsed.allIncomes || parsed.incomeList || [];
          const rawAlarms = parsed.alarms || parsed.allAlarms || parsed.alarmList || [];
          const rawNotifs = parsed.notifications || parsed.allNotifications || parsed.notificationList || [];
          const rawInstallments = parsed.installmentDebts || parsed.installments || parsed.installmentList || [];
          const rawPayments = parsed.payments || parsed.payments_logs || parsed.paymentList || [];
          const rawExpenses = parsed.expenses || parsed.allExpenses || parsed.expenseList || [];
          const rawCategoriesTemp = parsed.expenseCategories || parsed.categories || parsed.categoryList || [];
          const defaultCategories = [
            { id: 1, name: "Kira", color: "#3b82f6", icon: "🏠" },
            { id: 2, name: "Market", color: "#10b981", icon: "🛒" },
            { id: 3, name: "Ulaşım", color: "#f59e0b", icon: "🚗" },
            { id: 4, name: "Yeme İçme", color: "#ec4899", icon: "🍔" },
            { id: 5, name: "Faturalar", color: "#ef4444", icon: "⚡" }
          ];
          const rawCategories = (rawCategoriesTemp && rawCategoriesTemp.length > 0) ? rawCategoriesTemp : defaultCategories;
          
          setDebts(rawDebts);
          setIncomes(rawIncomes);
          setAlarms(rawAlarms);
          setNotifications(rawNotifs);
          setInstallmentDebts(rawInstallments);
          setPayments(rawPayments);
          setExpenses(rawExpenses);
          setExpenseCategories(rawCategories);
          
          saveAllToUser(
            rawDebts,
            rawIncomes,
            rawAlarms,
            rawNotifs,
            rawInstallments,
            rawPayments,
            rawExpenses,
            rawCategories
          );
          
          const rawContacts = parsed.contacts || parsed.contacts_directory || parsed.contactsDirectory || [];
          const rawContactTxs = parsed.contactTransactions || parsed.contacts_transactions || parsed.contactTransactionsList || [];
          
          localStorage.setItem(`${spaceKey}_contacts_directory`, JSON.stringify(rawContacts));
          localStorage.setItem(`${spaceKey}_contacts_transactions`, JSON.stringify(rawContactTxs));
          
          triggerToast("Veri Yedek Dosyası Başarıyla İçe Aktarıldı... Sayfa Güncelleniyor! 📊");
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (err: any) {
          alert(`Yedek yüklenirken hata oluştu: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleResetAllData = () => {
    triggerConfirm(
      "TÜM VERİLERİ SIFIRLA",
      "BU KULLANICIYA AİT TÜM VERİLER SİLİNECEK! Bu işlem geri alınamaz. Onaylıyor musunuz?",
      () => {
        setDebts([]);
        setIncomes([]);
        setAlarms([]);
        setNotifications([]);
        setInstallmentDebts([]);
        setPayments([]);
        setExpenses([]);
        setExpenseCategories([]);
        const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
        localStorage.removeItem(spaceKey);
        triggerToast("Bütün veriler sıfırlandı!");
      }
    );
  };

  // Navigation target mappings
  const sidebarItems = [
    { id: "overview", label: "GENEL BAKIŞ", icon: LayoutDashboard },
    { id: "monthly", label: "AYLIK TAKİP", icon: Calendar },
    { id: "yearly", label: "YILLIK TAKİP", icon: Activity },
    { id: "debts", label: "BORÇ LİSTESİ", icon: Coins },
    { id: "contacts", label: "KİŞİ ALACAK/VERECEK", icon: Users, isPro: true },
    { id: "income", label: "GELİRLER", icon: Wallet },
    { id: "expenses", label: "GİDERLER", icon: ShoppingCart },
    { id: "installments", label: "TAKSİTLİ BORÇLAR", icon: Calendar },
    { id: "gplay_enhancements", label: "PRO BULUT & ARAÇLAR", icon: Sparkles, isPro: true },
    { id: "notifications", label: "BİLDİRİM & GÜVENLİK", icon: Shield },
    { id: "aiStrategy", label: "YAPAY ZEKA ASİSTAN", icon: Sparkles, isPro: true },
    { id: "financialTools", label: "FİNANSAL ARAÇLAR", icon: TrendingUp, isPro: true },
    { id: "help", label: "KULLANIM REHBERİ", icon: HelpCircle },
    { id: "blog", label: "FİNANS KILAVUZLARI", icon: BookOpen },
    { id: "feedback", label: "GERİ BİLDİRİM", icon: MessageSquare },
    { id: "about", label: "HAKKINDA", icon: Star },
    { id: "privacy", label: "GİZLİLİK POLİTİKASI", icon: Shield },
    { id: "public_landing", label: "TANITIM & AÇILIŞ", icon: Compass }
  ];

  const handleNavClick = (tabId: string) => {
    if (tabId === "public_landing") {
      setShowPublicView("landing");
      setIsSidebarOpen(false);
      return;
    }

    const clickedItem = sidebarItems.find(item => item.id === tabId);
    if (clickedItem?.isPro && !isPremium) {
      setPromoFeature(clickedItem.label);
      setIsUpgradeModalOpen(true);
      triggerToast(`👑 ${clickedItem.label} özelliği yalnızca Pro üyelerimize özeldir!`);
      return;
    }

    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  if (showPublicView === "landing") {
    return (
      <div className={`min-h-screen font-sans transition-all duration-300 bg-[#f8fafc] dark:bg-[#0f172a] theme-${colorTheme}`}>
        <PublicLanding
          onStartApp={() => {
            localStorage.setItem("skip_landing", "true");
            setShowPublicView(null);
          }}
          onNavigateToBlog={() => setShowPublicView("blog")}
          onNavigateToPost={(id) => {
            setSelectedPublicPostId(id);
            setShowPublicView("blog");
          }}
        />
      </div>
    );
  }

  if (showPublicView === "blog") {
    return (
      <div className={`min-h-screen font-sans transition-all duration-300 bg-[#f8fafc] dark:bg-[#0f172a] theme-${colorTheme}`}>
        <PublicBlog
          selectedPostId={selectedPublicPostId}
          onSelectPost={setSelectedPublicPostId}
          onStartApp={() => {
            localStorage.setItem("skip_landing", "true");
            setShowPublicView(null);
          }}
          onBackToLanding={() => setShowPublicView("landing")}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-16 md:pb-6 font-sans transition-all duration-300 bg-[#f8fafc] dark:bg-[#0f172a] theme-${colorTheme}`}>
      <AnimatePresence mode="wait">
        {splashVisible && (
          <motion.div
            key="premium-splash-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-950 text-white p-6 select-none overflow-hidden"
          >
            {/* Background floating visual aesthetics (100% stable, no Math.random hydration bugs) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              {[
                { left: "12%", top: "20%", duration: 22, text: "₺", delay: 0 },
                { left: "85%", top: "15%", duration: 18, text: "%", delay: 1 },
                { left: "75%", top: "78%", duration: 25, text: "$", delay: 2 },
                { left: "18%", top: "65%", duration: 20, text: "₺", delay: 0.5 },
                { left: "45%", top: "85%", duration: 28, text: "€", delay: 1.5 },
                { left: "55%", top: "10%", duration: 24, text: "+", delay: 3 },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  animate={{ 
                    y: [0, -15, 0],
                    x: [0, 10, 0],
                    opacity: [0.15, 0.4, 0.15]
                  }}
                  transition={{ 
                    duration: p.duration, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: p.delay 
                  }}
                  className="absolute text-indigo-400 text-3xl font-black font-mono"
                  style={{ left: p.left, top: p.top }}
                >
                  {p.text}
                </motion.div>
              ))}
            </div>

            {/* Glowing gradient backdrops */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none animate-pulse [animation-delay:2s]" />

            <div className="text-center space-y-6 max-w-sm w-full relative z-10">
              {/* Golden Rotating Coin & Neon Multi-Ring Loader */}
              <div className="relative inline-flex items-center justify-center mx-auto mb-2">
                {/* Outer pulsing ring shadow */}
                <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-3xl scale-150 animate-pulse pointer-events-none" />
                
                {/* Outer spinning ring (Clockwise) with dashes */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="w-28 h-28 border border-dashed border-indigo-500/40 rounded-full absolute"
                />

                {/* Middle fast counter-spinning ring with dots */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  className="w-24 h-24 border-2 border-dotted border-emerald-500/30 rounded-full absolute"
                />

                {/* Inner glowing element */}
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative w-20 h-20 bg-slate-900 border border-indigo-500/30 rounded-full flex items-center justify-center cursor-pointer shadow-inner shadow-indigo-500/50"
                >
                  <Coins className="w-10 h-10 text-indigo-400 rotate-12 drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
                  
                  {/* Concentric shining dot */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                </motion.div>
                
                {/* Absolute center ring */}
                <div className="absolute flex items-center justify-center pointer-events-none">
                  <span className="w-4 h-4 rounded-full bg-emerald-400/20 animate-ping absolute" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 relative" />
                </div>
              </div>
              
              {/* Splendid Title Card */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                className="space-y-3 select-none"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 font-black text-3xl sm:text-4xl tracking-tight drop-shadow-[0_0_15px_rgba(99,102,241,0.55)]">
                  {"BÜTÇEM".split("").map((char, index) => (
                    <motion.span
                      key={`butcem-${index}`}
                      variants={{
                        hidden: { opacity: 0, y: -25, rotateY: 90, scale: 0.5 },
                        visible: { opacity: 1, y: 0, rotateY: 0, scale: 1 }
                      }}
                      transition={{ type: "spring", stiffness: 220, damping: 11 }}
                      className="bg-gradient-to-b from-white via-slate-100 to-indigo-250 bg-clip-text text-transparent inline-block font-black"
                    >
                      {char}
                    </motion.span>
                  ))}
                  
                  <span className="w-2" />

                  {"PRO".split("").map((char, index) => (
                    <motion.span
                      key={`pro-${index}`}
                      variants={{
                        hidden: { opacity: 0, y: 25, scale: 1.4, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                      }}
                      transition={{ type: "spring", stiffness: 280, damping: 9, delay: 0.4 }}
                      style={{ textShadow: "0 0 12px rgba(52,211,153,0.75)" }}
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent inline-block font-black"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
                  className="w-44 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto relative"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-300 rounded-full blur-[2px] animate-ping" />
                </motion.div>

                {/* Animated and highly professional Bütçe Takip Sub-heading */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                  className="space-y-1 flex flex-col items-center justify-center"
                >
                  <p className="text-[11px] sm:text-xs font-black tracking-[0.25em] text-emerald-400 uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]">
                    PROFESYONEL BÜTÇE TAKİBİ
                  </p>
                  
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    className="text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5"
                  >
                    <span>💡 LİMİTSİZ YÖNETİM</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AI DESTEKLİ MOTOR</span>
                  </motion.p>
                </motion.div>
              </motion.div>

              {/* Progress Slider */}
              <div className="space-y-3 pt-1">
                <div className="w-full h-3 bg-slate-900/95 rounded-full border border-white/10 relative p-[2px] overflow-hidden">
                  {/* Glowing ambient flow back track */}
                  <div className="absolute inset-x-0 h-full bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-emerald-400/5" />
                  
                  <motion.div 
                    className="h-full rounded-full relative flex items-center justify-end"
                    initial={{ width: "4%" }}
                    animate={{ width: `${Math.max(4, splashProgress)}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.05 }}
                    style={{ 
                      background: "linear-gradient(90deg, #4f46e5 0%, #a855f7 50%, #10b981 100%)"
                    }}
                  >
                    {/* Glowing front lead cursor tip */}
                    {splashProgress > 1 && (
                      <span className="w-1.5 h-1.5 mr-0.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] shrink-0 inline-block animate-pulse" />
                    )}
                  </motion.div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
                  <span className="animate-pulse flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping inline-block" />
                    {splashStatus}
                  </span>
                  <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/10 shadow-md">{splashProgress}%</span>
                </div>
              </div>

              {/* Real-time Loading Systems Checklist */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2.5 text-left max-w-xs mx-auto text-[10px] font-bold tracking-wider">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{splashProgress >= 30 ? "⚡" : "⏳"}</span>
                    <span className={splashProgress >= 30 ? "text-slate-400 line-through decoration-emerald-500/50" : "text-slate-300"}>
                      GÜVENLİ VERİ YAPILANDIRMASI
                    </span>
                  </div>
                  <span className={splashProgress >= 30 ? "text-emerald-400 font-extrabold flex items-center gap-1" : "text-indigo-400 animate-pulse font-extrabold"}>
                    {splashProgress >= 30 ? "TAMAMLANDI ✓" : "YAPILANDIRILIYOR..."}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{splashProgress >= 65 ? "🧠" : "⏳"}</span>
                    <span className={splashProgress >= 65 ? "text-slate-400 line-through decoration-emerald-500/50" : "text-slate-300"}>
                      AKILLI FİNANS MOTORU
                    </span>
                  </div>
                  <span className={splashProgress >= 65 ? "text-emerald-400 font-extrabold flex items-center gap-1" : splashProgress >= 30 ? "text-indigo-400 animate-pulse font-extrabold" : "text-slate-500"}>
                    {splashProgress >= 65 ? "HAZIR ✓" : splashProgress >= 30 ? "YÜKLENİYOR" : "BEKLENİYOR"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{splashProgress >= 90 ? "📡" : "⏳"}</span>
                    <span className={splashProgress >= 90 ? "text-slate-400 line-through decoration-emerald-500/50" : "text-slate-300"}>
                      PUSH ALARM SUNUCUSU
                    </span>
                  </div>
                  <span className={splashProgress >= 90 ? "text-emerald-400 font-extrabold flex items-center gap-1" : splashProgress >= 65 ? "text-indigo-400 animate-pulse font-extrabold" : "text-slate-500"}>
                    {splashProgress >= 90 ? "BAĞLANDI ✓" : splashProgress >= 65 ? "YÜKLENİYOR" : "BEKLENİYOR"}
                  </span>
                </div>
              </div>

              {/* Fast forward skip button for super fast launch */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSplashProgress(100);
                  setSplashStatus("Sistemler Kısayolla Başlatıldı!");
                  setTimeout(() => {
                    setSplashVisible(false);
                  }, 80);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-indigo-100 text-[10px] font-black uppercase text-indigo-600 tracking-wider shadow-xs hover:bg-slate-50 cursor-pointer select-none transition-all flex items-center gap-1.5 mx-auto"
              >
                <span>Hemen Başla</span>
                <span>⚡</span>
              </motion.button>
            </div>

            {/* Footer info lock */}
            <div className="absolute bottom-6 text-[9px] text-slate-400 tracking-widest uppercase font-black text-center space-y-0.5">
              <div>Bütçem Pro v5.0 Ultimate Edition</div>
              <div className="text-[7.5px] text-slate-500 font-mono tracking-normal text-center">Secure AES-256 Workspace Ingress • Verified</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Simulated iOS/Android System Push Notification banner */}
      {isPhoneAlert.visible && (
        <div className="fixed top-4 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none">
          <div 
            className="w-full max-w-sm bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/15 flex items-start gap-3.5 animate-phone-alert cursor-pointer select-none pointer-events-auto"
            onClick={() => setIsPhoneAlert({ visible: false, title: "", body: "" })}
          >
            <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 animate-pulse">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-400 tracking-wider uppercase">BÜTÇEM PRO • SİSTEM</span>
                <span className="text-[9px] text-slate-400 font-bold font-mono">ŞİMDİ</span>
              </div>
              <h4 className="text-xs font-black text-slate-100 truncate">{isPhoneAlert.title}</h4>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{isPhoneAlert.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal to bypass browser modal blocking inside sandboxed iframe previews */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 transform scale-100 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-base font-bold">💡</span>
                <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 text-[11px] font-black tracking-wider uppercase bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-2xl transition cursor-pointer select-none"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 text-[11px] font-black tracking-wider uppercase bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md transition cursor-pointer select-none"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Alerts */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700/50 text-white rounded-full px-5 py-2.5 shadow-lg text-xs font-bold leading-relaxed flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> {toastMessage}
        </div>
      )}

      {/* Real-time Interactive Google and Hotmail Login Portal */}
      <ProviderLoginModal
        isOpen={providerLoginOpen}
        provider={selectedProvider}
        onClose={() => {
          setProviderLoginOpen(false);
          setSelectedProvider(null);
        }}
        onLoginSuccess={handleProviderLoginSuccess}
      />

      {/* Header Container - Premium Glossy Mesh Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950 via-[#0b132b] to-[#1c2541] dark:from-slate-950 dark:via-black dark:to-slate-950 border-b border-indigo-500/20 text-white shadow-2xl px-4 sm:px-8 py-5 md:py-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between backdrop-blur-lg transition-all duration-300 relative overflow-hidden group">
        
        {/* Decorative ambient lighting overlays */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/80 to-emerald-400/80 animate-pulse duration-[3000ms]" />
        <div className="absolute top-[-40%] right-[10%] w-72 h-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[2%] w-56 h-16 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Inner layout for logo and title */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 sm:p-2.5 shrink-0 focus:outline-none bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black/30"
              title="Menüyü Aç/Kapat"
            >
              <Menu className="w-5 h-5 text-indigo-200 group-hover:text-white transition" />
            </button>
            
            <div className="space-y-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-black tracking-normal flex items-center select-none whitespace-nowrap gap-1.5 sm:gap-3 leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">
                <span className="animate-wave-flag inline-block shrink-0 select-none">
                  <svg viewBox="0 0 1200 800" className="w-[18px] h-[12px] sm:w-[32px] sm:h-[21.5px] md:w-[38px] md:h-[25.5px] rounded-xs shadow-md overflow-hidden shrink-0 inline-block border border-white/10" style={{ minWidth: "18px" }}>
                    <rect width="1200" height="800" fill="#e30a17"/>
                    <circle cx="400" cy="400" r="200" fill="#ffffff"/>
                    <circle cx="450" cy="400" r="160" fill="#e30a17"/>
                    <polygon points="585,400 643.78,419.1 607.45,369.1 607.45,430.9 643.78,380.9" fill="#ffffff" transform="rotate(-30 585 400)"/>
                  </svg>
                </span>
                <span>
                  BÜTÇEM
                </span> 
                <span className="text-[8px] sm:text-[10px] md:text-xs px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg font-black tracking-widest uppercase animate-pulse">
                  PRO
                </span>
              </h1>
              <p className={`text-[7px] sm:text-[10px] font-black tracking-wider uppercase flex items-center gap-1 sm:gap-1.5 select-none leading-none ${isOfflineMode ? "text-amber-400" : "text-emerald-400/90"}`}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  {isOfflineMode ? (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 animate-pulse"></span>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_4px_#10b981]"></span>
                    </>
                  )}
                </span>
                <span className="hidden sm:inline">{isOfflineMode ? "ÇEVRİMDIŞI MOD (YEREL VERİ GÜVENLİĞİ)" : "BÜTÇEM PRO & AKILLI FINANSAL TAKİP"}</span>
                <span className="sm:hidden">{isOfflineMode ? "ÇEVRİMDIŞI" : "AKILLI FINANS TAKİBİ"}</span>
              </p>
            </div>
          </div>

          {/* Clock visible on mobile & desktop in the upper bar to save spacing */}
          <div className="flex items-center shrink-0">
            {isClockVisible ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 dark:bg-black/80 text-[9px] sm:text-xs font-black font-mono tracking-widest px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-emerald-400 border border-white/10 shadow-lg shadow-black/40 select-none animate-clock-pulse shrink-0">
                <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_#34d399]"></span>
                </span>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{liveClock}</span>
                <button
                  onClick={() => setIsClockVisible(false)}
                  title="Saati Gizle ✖"
                  className="p-0.5 px-1 ml-0.5 sm:ml-1 bg-white/5 hover:bg-white/15 hover:text-white rounded text-emerald-400 transition cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsClockVisible(true)}
                title="Saati Göster"
                className="flex p-1 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 hover:border-emerald-500/20 active:scale-95 text-[9px] sm:text-xs font-black rounded-lg transition-all cursor-pointer items-center gap-0.5 sm:gap-1 shrink-0"
              >
                <Clock className="w-3 h-3 select-none animate-pulse" />
                <span>SAATİ AÇ</span>
              </button>
            )}
          </div>
        </div>

        {/* Right side navigation toolbar / tools */}
        <div className="flex items-center overflow-x-auto scrollbar-none gap-2 shrink-0 relative z-10 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 justify-between md:justify-end">
          <div className="flex items-center gap-1.5 sm:gap-2 select-none shrink-0">
            {/* Animated Contacts Directory Logo */}
            <motion.button
              onClick={() => {
                handleNavClick("contacts");
                triggerToast("Cari Hesaplar & Kişi Rehberi Açıldı! 👤📖");
              }}
              title="Kişi Rehberi & Cari Hesaplar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                y: [0, -2, 0],
                rotate: [0, -1, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`p-1.5 sm:p-2 lg:p-2.5 rounded-xl transition-all duration-305 flex items-center justify-center border cursor-pointer shrink-0 relative ${
                activeTab === "contacts"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:border-indigo-500/30"
              }`}
            >
              {/* Binder spiral rings of directory book */}
              <div className="absolute left-1 top-1 bottom-1 w-0.5 rounded flex flex-col justify-around py-0.5">
                <div className="w-[3px] h-[3px] bg-indigo-400/80 rounded-full" />
                <div className="w-[3px] h-[3px] bg-indigo-400/80 rounded-full" />
                <div className="w-[3px] h-[3px] bg-indigo-400/80 rounded-full" />
              </div>
              
              <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 text-indigo-300 group-hover:text-white ${activeTab === "contacts" ? "animate-pulse" : "animate-bounce"}`} style={{ animationDuration: "2.5s" }} />
              
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
            </motion.button>

            <button
              onClick={() => {
                const nextPrem = !isPremium;
                setIsPremium(nextPrem);
                localStorage.setItem("is_premium", nextPrem ? "true" : "false");
                triggerToast(nextPrem ? "👑 Bütçem Pro Premium Sürüm Etkin!" : "⭐ Ücretsiz Sürüm (Reklamlı) Aktif!");
              }}
              title="Test için Sürümü Değiştir"
              className={`p-1.5 sm:p-2 lg:p-2.5 rounded-xl border transition-all flex items-center justify-center space-x-1 duration-300 cursor-pointer shrink-0 active:scale-95 ${
                isPremium 
                  ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border-amber-500/30 shadow-xs" 
                  : "bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border-slate-500/20"
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-black tracking-wide uppercase">
                {isPremium ? "🏆 PREMİUM SÜRÜM" : "⭐ ÜCRETSİZ SÜRÜM"}
              </span>
            </button>

            <button
              onClick={() => setIsSecurityModalOpen(true)}
              title="Güvenlik ve Kilit Ayarları"
              className="p-1.5 sm:p-2 lg:p-2.5 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-600/30 text-indigo-400 dark:text-indigo-300 active:scale-95 rounded-xl transition-all flex items-center justify-center space-x-1 duration-300 cursor-pointer shrink-0"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 animate-spin [animation-duration:30s]" />
              <span className="hidden sm:inline text-[9px] sm:text-[10px] font-black tracking-wide uppercase text-indigo-300">Güvenlik</span>
            </button>


            <button
              onClick={() => setDarkMode((prev) => !prev)}
              title="Arka Plan Teması"
              className="p-1.5 sm:p-2 lg:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-xl transition-all text-white flex items-center justify-center duration-300 cursor-pointer shadow-inner shrink-0"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-200" />}
            </button>

            <button
              onClick={() => {
                triggerToast("Uygulama Yenileniyor... 🔄");
                setTimeout(() => {
                  window.location.reload();
                }, 350);
              }}
              title="Sayfayı Yenile"
              className="p-1.5 sm:p-2 lg:p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 active:scale-95 rounded-xl transition-all flex items-center justify-center duration-300 cursor-pointer shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 animate-spin [animation-duration:15s]" />
            </button>

            <button
              onClick={() => {
                handleNavClick("notifications");
                const el = document.getElementById("main-nav-tabs") || document.getElementById("notifications-container");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              title={`Bildirimler ve Alarmlar (${notifications.length})`}
              className="p-1.5 sm:p-2 lg:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-xl transition-all text-white flex items-center justify-center duration-300 cursor-pointer shadow-inner relative shrink-0"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[8px] sm:text-[9px] font-black h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center ring-1 ring-slate-900">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative shrink-0">
              <select
                value={colorTheme}
                onChange={(e) => {
                  setColorTheme(e.target.value);
                  localStorage.setItem("colorTheme", e.target.value);
                }}
                className="appearance-none pl-2.5 pr-6 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 dark:bg-slate-900 text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs font-black tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer transition active:scale-95 text-center min-w-[65px] sm:min-w-[85px]"
              >
                <option value="default" className="text-slate-900 bg-white">MAVİ 🔵</option>
                <option value="green" className="text-slate-900 bg-white">YEŞİL 🟢</option>
                <option value="purple" className="text-slate-900 bg-white">MOR 🟣</option>
                <option value="orange" className="text-slate-900 bg-white">TURUNCU 🟠</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-white/50 text-[7px]" style={{ right: "6px" }}>
                ▼
              </div>
            </div>

            {/* Currency (Döviz) Selector Dropdown */}
            <div className="relative shrink-0">
              <select
                value={activeCurrency}
                onChange={(e) => {
                  setActiveCurrency(e.target.value as any);
                  triggerToast(`Hesaplama Birimi Değiştirildi: ${e.target.value}`);
                }}
                title="Para Birimi Değiştir"
                className="appearance-none pl-2.5 pr-6 py-1.5 sm:py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs font-black tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer transition active:scale-95 text-center min-w-[65px] sm:min-w-[85px]"
              >
                <option value="TRY" className="text-slate-900 bg-white">TRY (₺)</option>
                <option value="USD" className="text-slate-900 bg-white">USD ($)</option>
                <option value="EUR" className="text-slate-900 bg-white font-mono">EUR (€)</option>
                <option value="GBP" className="text-slate-900 bg-white font-mono">GBP (£)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-emerald-300/60 text-[7px]" style={{ right: "6px" }}>
                ▼
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Drawer Overlay for Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Side drawer panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-800 border-r border-slate-200/50 dark:border-slate-700/50 z-50 transform transition-transform duration-300 flex flex-col justify-between overflow-y-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Animated fluid floating vector blobs for premium backdrop depth (100% stable, zero Math.random hydration hazards) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06] dark:opacity-[0.14] z-0">
          <motion.div
            animate={{
              x: [0, 24, -14, 0],
              y: [0, -35, 25, 0],
              scale: [1, 1.18, 0.92, 1],
              rotate: [0, 90, 180, 0]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-450 blur-2xl"
          />
          <motion.div
            animate={{
              x: [0, -28, 18, 0],
              y: [0, 30, -22, 0],
              scale: [1, 0.88, 1.12, 1],
              rotate: [0, -90, -180, 0]
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
            className="absolute top-1/3 -right-12 w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 blur-2xl"
          />
          <motion.div
            animate={{
              y: [0, 50, -35, 0],
              scale: [0.93, 1.16, 0.93]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-12 left-6 w-38 h-38 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 blur-2xl"
          />
        </div>

        <div className="p-5 space-y-5 relative z-10">
          {/* Workspace Title */}
          <div className="flex items-center gap-2 border-b dark:border-slate-700 pb-3">
            <Coins className="w-6 h-6 text-indigo-500 animate-pulse animate-spin [animation-duration:15s]" />
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-50 tracking-wide uppercase">
                {language === "tr" ? "Hesap Asistanı" : "Account Advisor"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400">v5.0 Ultimate</p>
            </div>
          </div>

          {/* Local User Login profile area */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col gap-2 relative overflow-hidden border border-slate-200/55 dark:border-slate-800">
            {isQuickLoggingIn ? (
              <div className="py-6 text-center space-y-3">
                <span className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin inline-block" />
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                  {isQuickLoggingIn === "google" ? "Gmail'e Bağlanılıyor..." : "Hotmail'e Bağlanılıyor..."}
                </p>
                <p className="text-[9px] text-slate-400 font-medium tracking-wide">Lütfen bekleyin...</p>
              </div>
            ) : !currentUser ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Profil Tanımlama</p>
                <div className="space-y-1.5 text-center">
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Adınız veya kullanıcı adı"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-center"
                  />
                  <button
                    onClick={handleLogin}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-[10px] font-extrabold text-white rounded-xl flex items-center justify-center gap-1 transition-all pointer-events-auto"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Profili Aç
                  </button>
                </div>

                {/* Styled alternative Quick Login dividers */}
                <div className="flex items-center gap-1.5 py-1">
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">VEYA BULUT HESAP</span>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>

                {/* Platforms Container */}
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("google")}
                    className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/15"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>BULUT GİRİŞİ (E-POSTA)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-center animate-fade-in">
                {/* Visual Circle Profile Photo with upload trigger */}
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <div className="relative group/avatar inline-block">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Profil"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-md block"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 text-white flex items-center justify-center text-md font-black shadow-md uppercase">
                        {(currentUser || "G").substring(0, 2)}
                      </div>
                    )}
                    <button
                      onClick={() => setIsAvatarPickerOpen((prev) => !prev)}
                      type="button"
                      className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full border border-white dark:border-slate-800 shadow-md active:scale-90 transition cursor-pointer flex items-center justify-center"
                      title="Fotoğraf Ekle / Değiştir"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isAvatarPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-slate-100/70 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center space-y-1.5"
                    >
                      <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 block">PROFİL RESMİ GÜNCELLE</span>
                      
                      {/* Upload Button */}
                      <label className="block w-full py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition shadow-xs text-center">
                        📸 RESİM SEÇ
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </label>
                      
                      {/* Quick preset colors */}
                      <div className="flex items-center justify-center gap-1">
                        {[
                          "from-amber-400 to-rose-500",
                          "from-blue-500 to-purple-600",
                          "from-emerald-400 to-teal-600",
                          "from-pink-500 to-red-600",
                          "from-indigo-600 to-slate-800"
                        ].map((grad, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const colors = [
                                ["#fbbf24", "#f43f5e"],
                                ["#3b82f6", "#9333ea"],
                                ["#34d399", "#0d9488"],
                                ["#ec4899", "#dc2626"],
                                ["#4f46e5", "#1e293b"]
                              ];
                              const selectedColor = colors[i];
                              const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g${i}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${selectedColor[0]}"/><stop offset="100%" stop-color="${selectedColor[1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g${i})"/><text x="50" y="55" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${(currentUser || "G").substring(0, 2).toUpperCase()}</text></svg>`;
                              const base64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
                              setUserAvatar(base64Svg);
                              const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";
                              localStorage.setItem(`${spaceKey}_avatar`, base64Svg);
                              setIsAvatarPickerOpen(false);
                              triggerToast("Yeni profil rengi uygulandı! 🎨");
                            }}
                            className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${grad} border border-white dark:border-slate-850 shadow-xs cursor-pointer active:scale-90 transition`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!currentUser ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Profil Tanımlama</p>
                    <div className="space-y-1.5 text-center">
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Adınız veya kullanıcı adı"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-center"
                      />
                      <button
                        onClick={handleLogin}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-[10px] font-extrabold text-white rounded-xl flex items-center justify-center gap-1 transition-all pointer-events-auto"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Profili Aç
                      </button>
                    </div>

                    {/* Styled alternative Quick Login dividers */}
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">VEYA BULUT HESAP</span>
                      <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    </div>

                    {/* Platforms Container */}
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin("google")}
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/15"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>BULUT GİRİŞİ (E-POSTA)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Aktif Profil</p>
                    <div className="px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/30 dark:border-indigo-900/20">
                      <div className="flex items-center justify-between gap-1 flex-wrap pb-1 border-b border-slate-200/40 dark:border-slate-800/85 mb-1">
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                          {currentUser.includes("@") ? (
                            <>
                              <Shield className="w-3 h-3 text-indigo-400 shrink-0" /> Bulut Hesap
                            </>
                          ) : (
                            "Yerel Hesap"
                          )}
                        </span>
                        {isPremium ? (
                          <span
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="px-1.5 py-0.5 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-white rounded-md text-[8px] font-black tracking-wider animate-pulse cursor-pointer shadow-xs flex items-center gap-0.5"
                            title="Abonelik Yönetimi"
                          >
                            PREMIUM 👑
                          </span>
                        ) : (
                          <span
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white rounded-md text-[8px] font-black tracking-wider cursor-pointer transition flex items-center gap-0.5"
                            title="Premium'a Geç"
                          >
                            ÜCRETSİZ ⭐
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 truncate text-left">{currentUser}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Oturumu Kapat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation link directories */}
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isProFeatured = (item as any).isPro;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold leading-normal transition-all ${
                    activeTab === item.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-l-[4px] border-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isProFeatured ? "text-amber-500" : "text-slate-400"}`} />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  {isProFeatured && (
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border border-amber-300 tracking-widest font-mono shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0 ml-1.5"
                    >
                      PRO
                    </motion.span>
                  )}
                </button>
              );
            })}

            {/* Compact AdMob Banner immediately under navigation menus */}
            {!isPremium && (
              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800">
                <AdMobBanner unitType="banner" className="opacity-95" />
              </div>
            )}
          </nav>
        </div>

        {/* Database backup controllers inside side panel footer */}
        <div className="p-4 border-t dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 relative z-10">
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
            <button
              onClick={() => {
                handleExportBackup();
              }}
              className="py-1.5 px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <Download className="w-3 h-3" /> DIŞA AKTAR
            </button>
            <button
              onClick={() => {
                handleImportBackup();
              }}
              className="py-1.5 px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <Upload className="w-3 h-3" /> İÇE AKTAR
            </button>
          </div>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="w-full py-2 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs hover:shadow-xs cursor-pointer uppercase tracking-tight"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> FİNANSAL RAPORU İNDİR (.CSV)
          </button>
          <button
            onClick={handleResetAllData}
            className="w-full py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[9px] font-extrabold flex items-center justify-center gap-1 transition-all border border-dashed border-rose-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" /> TÜM VERİLERİ SIFIRLA
          </button>


        </div>
      </aside>

      {/* Central View Dashboard Grid content container */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Global Month/Period Scoper Widget */}
        {["debts", "income", "expenses", "installments"].includes(activeTab) && (() => {
          let themeCardBg = "bg-white dark:bg-slate-800";
          let themeBorder = "border-slate-200/60 dark:border-slate-700/60";
          let themeIconBg = "bg-indigo-50 dark:bg-slate-900";
          let themeIconText = "text-indigo-500";
          let themeFocusRing = "focus:ring-indigo-500";
          let themeBtnHover = "hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400";
          
          if (colorTheme === "green") {
            themeCardBg = "bg-emerald-500/[0.04] dark:bg-emerald-950/10";
            themeBorder = "border-emerald-500/20 dark:border-emerald-800/40";
            themeIconBg = "bg-emerald-500/20 dark:bg-emerald-950/60";
            themeIconText = "text-emerald-600 dark:text-emerald-400";
            themeFocusRing = "focus:ring-emerald-500";
            themeBtnHover = "hover:bg-emerald-500/10 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
          } else if (colorTheme === "purple") {
            themeCardBg = "bg-purple-500/[0.04] dark:bg-purple-950/10";
            themeBorder = "border-purple-500/20 dark:border-purple-800/40";
            themeIconBg = "bg-purple-500/20 dark:bg-purple-950/60";
            themeIconText = "text-purple-600 dark:text-purple-400";
            themeFocusRing = "focus:ring-purple-500";
            themeBtnHover = "hover:bg-purple-500/10 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400";
          } else if (colorTheme === "orange") {
            themeCardBg = "bg-amber-500/[0.04] dark:bg-amber-950/10";
            themeBorder = "border-amber-500/20 dark:border-amber-800/40";
            themeIconBg = "bg-amber-500/20 dark:bg-amber-950/60";
            themeIconText = "text-amber-600 dark:text-amber-400";
            themeFocusRing = "focus:ring-amber-500";
            themeBtnHover = "hover:bg-amber-500/10 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400";
          } else {
            themeCardBg = "bg-indigo-500/[0.04] dark:bg-indigo-950/10";
            themeBorder = "border-indigo-500/20 dark:border-indigo-805/40";
            themeIconBg = "bg-indigo-500/20 dark:bg-indigo-950/60";
            themeIconText = "text-indigo-600 dark:text-indigo-400";
          }

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-5 p-4 rounded-3xl border ${themeCardBg} ${themeBorder} shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all duration-300 relative overflow-hidden`}
            >
              {/* Decorative dynamic neon fluid bubble backing */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <div className={`p-2.5 rounded-2xl shrink-0 transition-colors duration-300 ${themeIconBg} ${themeIconText}`}>
                  <Calendar className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block leading-none tracking-widest mb-1">FİLTRELENEN DÖNEM</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                    {selectedMonth !== null && selectedYear !== null 
                      ? `${["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][selectedMonth]} ${selectedYear}`
                      : "🔒 TÜM ZAMANLAR BİRİKİMLİ"}
                    <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMonth === null || selectedYear === null) {
                      const now = new Date();
                      setSelectedMonth(now.getMonth());
                      setSelectedYear(now.getFullYear());
                    } else if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                  disabled={selectedMonth === null}
                  className={`px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer disabled:opacity-40 select-none text-[10.5px] font-extrabold transition-all duration-300 ${themeBtnHover}`}
                >
                  ← Önceki
                </button>

                <select
                  value={selectedMonth === null ? "all" : selectedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") {
                      setSelectedMonth(null);
                    } else {
                      setSelectedMonth(parseInt(val));
                      if (selectedYear === null) setSelectedYear(new Date().getFullYear());
                    }
                  }}
                  className={`px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer text-[10.5px] focus:outline-none focus:ring-1 ${themeFocusRing}`}
                >
                  <option value="all">Tüm Dönemler</option>
                  {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear === null ? "all" : selectedYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all") {
                      setSelectedYear(null);
                      setSelectedMonth(null);
                    } else {
                      setSelectedYear(parseInt(val));
                      if (selectedMonth === null) setSelectedMonth(new Date().getMonth());
                    }
                  }}
                  disabled={selectedMonth === null}
                  className={`px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/85 rounded-xl font-extrabold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer text-[10.5px] focus:outline-none focus:ring-1 ${themeFocusRing}`}
                >
                  <option value="all">Yıl</option>
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedMonth === null || selectedYear === null) {
                      const now = new Date();
                      setSelectedMonth(now.getMonth());
                      setSelectedYear(now.getFullYear());
                    } else if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                  disabled={selectedMonth === null}
                  className={`px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-655 dark:text-slate-300 rounded-xl cursor-pointer disabled:opacity-40 select-none text-[10.5px] font-extrabold transition-all duration-300 ${themeBtnHover}`}
                >
                  Sonraki →
                </button>
              </div>
            </motion.div>
          );
        })()}

        {activeTab === "overview" && (
          <DashboardOverview
            stats={statsBag}
            onNavigate={handleNavClick}
            monthlyPaymentsCount={currentMonthTotalPaymentsCount}
            monthlyInstallmentsDue={monthlyInstallmentsDue}
            isPremium={isPremium}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
            incomes={filteredIncomesByMonth}
            expenses={filteredExpensesByMonth}
            expenseCategories={expenseCategories}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            setSelectedMonth={setSelectedMonth}
            setSelectedYear={setSelectedYear}
            colorTheme={colorTheme}
            language={language}
          />
        )}

        {activeTab === "monthly" && (
          <FollowUpMonthlyYearly
            debts={debts}
            incomes={incomes}
            expenses={expenses}
            payments={payments}
            viewMode="monthly"
            language={language}
          />
        )}

        {activeTab === "yearly" && (
          <FollowUpMonthlyYearly
            debts={debts}
            incomes={incomes}
            expenses={expenses}
            payments={payments}
            viewMode="yearly"
            language={language}
          />
        )}

        {activeTab === "debts" && (
          <DebtList
            debts={debts}
            expenses={expenses}
            totalIncome={statsBag.totalIncome}
            onSaveDebt={handleSaveDebt}
            onDeleteDebt={handleDeleteDebt}
            onToggleDebtPaid={handleToggleDebtPaid}
            onAddAlarm={handleAddAlarm}
            themeColor={colorTheme}
            onSaveInstallment={handleSaveInstallment}
            installmentDebts={installmentDebts}
            isPremium={isPremium}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            setSelectedMonth={setSelectedMonth}
            setSelectedYear={setSelectedYear}
            stats={statsBag}
            language={language}
          />
        )}

        {activeTab === "contacts" && (
          <ContactsDebtPanel
            currentUser={currentUser}
            format={format}
            triggerToast={triggerToast}
            onAddAlarm={handleAddAlarm}
            language={language}
          />
        )}

        {activeTab === "income" && (
          <IncomesList
            incomes={filteredIncomesByMonth}
            onSaveIncome={handleSaveIncome}
            onDeleteIncome={handleDeleteIncome}
            isPremium={isPremium}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
            carryOverBalance={statsBag.carryOverBalance}
            language={language}
          />
        )}

        {activeTab === "expenses" && (
          <ExpensesList
            expenses={filteredExpensesByMonth}
            expenseCategories={expenseCategories}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateAllCategories={handleSaveAllCategories}
            netBalance={statsBag.netIncome}
            isPremium={isPremium}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
            language={language}
          />
        )}

        {activeTab === "installments" && (
          <InstallmentsList
            installmentDebts={installmentDebts}
            onSaveInstallment={handleSaveInstallment}
            onDeleteInstallment={handleDeleteInstallment}
            onPayInstallment={handlePayInstallment}
            onRevertPayment={handleRevertInstallmentPayment}
            isPremium={isPremium}
            language={language}
          />
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <motion.h2
                animate={{ y: [0, -1.2, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-wide"
              >
                <Bell className="w-5 h-5 text-indigo-500 animate-swing" /> Alarmlar ve Bildirimler
              </motion.h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAddingAlarmNew(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  🔔 Hatırlatma Ekle
                </button>
                <button
                  onClick={handleClearNotifs}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-black rounded-xl transition hover:bg-rose-100 cursor-pointer"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Premium Interactive Inline Alarm Ekleme Formu */}
            {isAddingAlarmNew && (
              <div className="p-5 bg-white dark:bg-slate-800 border border-indigo-500/20 rounded-3xl shadow-xl space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Yeni Ödeme Hatırlatıcısı / Alarm Kur
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alarm Başlığı / Konusu</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="Ör: Kredi ödemesi yaklaşma uyarısı"
                      value={newAlarmTitle}
                      onChange={(e) => setNewAlarmTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hatırlatma Tarihi ve Saati</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                      value={newAlarmDate}
                      onChange={(e) => setNewAlarmDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setIsAddingAlarmNew(false);
                      setNewAlarmTitle("");
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => {
                      if (!newAlarmTitle.trim()) {
                        triggerToast("Lütfen bir alarm başlığı girin.");
                        return;
                      }
                      handleAddAlarm(newAlarmTitle.trim(), newAlarmDate);
                      setNewAlarmTitle("");
                      setIsAddingAlarmNew(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-90 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    Alarmı Kaydet ⏰
                  </button>
                </div>
              </div>
            )}

            {/* Mobile / Browser Phone Notification Controller Panel */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden border border-indigo-500/10 space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold tracking-wider rounded-full uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    MOBİL ENTEGRASYON SÜRÜMÜ
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {hasNotificationPermission === "granted" ? "DURUM: İZİN VERİLDİ ✔" : "DURUM: KURULUM GEREKLİ ⚠️"}
                  </span>
                </div>
                
                <h3 className="text-sm sm:text-base font-black">Borç Hatırlatıcılarını Doğrudan Cihazınızda Alın</h3>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                  Alarmları kurduğunuzda, ödeme günü yaklaştığında ve bütçe analizleri tamamlandığında, uygulamanın arka planda veya ön planda olduğuna bakılmaksızın cihazınıza anlık sistem bildirimi ulaştırılır.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition active:scale-95 text-white shadow-md shadow-indigo-600/20"
                  >
                    <span>🔔 Telefon Bildirim İznini Etkinleştir</span>
                  </button>
                  <button
                    onClick={() => sendSystemNotification(
                      "Test Hatırlatıcısı 🚀",
                      "Bütçem Pro sesli bildirim sinyali başarıyla alındı! Ödeme vadelerinde ve önemli alarmlarda bu uyarıyı alacaksınız."
                    )}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition active:scale-95 text-slate-100"
                  >
                    <span>🎯 Anlık Yerel Test</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Sound and Alert Configuration Panel */}
            <div className="p-5 bg-white dark:bg-slate-800 border border-slate-250/20 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                Sesli Sinyal ve Bildirim Zil Sesi Ayarları
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Yaklaşan ödemelerin otomatik alarmlarında ve uyarı mesajlarında duyulacak bildirim zil sesini ayarlayabilirsiniz. Sistem seslerini simüle eden modern tınılar ya da klasik yüksek volümlü dijital saat uyarısını seçebilirsiniz.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Zil Sesi Durumu</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">Test ve hatırlatma bip sesleri</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      localStorage.setItem("soundEnabled", next ? "1" : "0");
                      triggerToast(next ? "Zil Sesi Aktif Edildi 🔔" : "Zil Sesi Sessize Alındı 🔕");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition select-none ${
                      soundEnabled
                        ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/10"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {soundEnabled ? "AÇIK 🔔" : "KAPALI 🔕"}
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Melodi Türü (5 Alternatif)</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">Zil sesi melodi alternatifi</span>
                  </div>
                  <select
                    value={alarmSoundType}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setAlarmSoundType(selected);
                      localStorage.setItem("alarmSoundType", selected);
                      // Set useSystemSound as well to maintain backward compatibility in case other parts of the system read it
                      localStorage.setItem("useSystemSound", selected === "system" ? "1" : "0");
                      setUseSystemSound(selected === "system");
                      
                      const names: Record<string, string> = {
                        digital: "Dijital Saat Sinyali ⏰",
                        system: "Yumuşak Sistem Tınısı ⚙️",
                        crystal: "Kristal Çan Melodisi 💎",
                        victory: "Başarı & Ödeme Efekti 🏆",
                        arcade: "Retro Atari Sesi 👾"
                      };
                      triggerToast(`${names[selected] || selected} Seçildi ve Test Ediliyor...`);
                      
                      // Immediately trigger a test playback so the user can preview the selected melody
                      setTimeout(() => {
                        sendSystemNotification("Zil Sesi Test Edildi! 🔔", `Seçilen Melodi: ${names[selected]}`, false);
                      }, 200);
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition focus:outline-none"
                  >
                    <option value="digital">Dijital Saat Bipi ⏰</option>
                    <option value="system">Yumuşak Sistem Tınısı ⚙️</option>
                    <option value="crystal">Kristal Çan Melodisi 💎</option>
                    <option value="victory">Başarı ve Ödeme Zili 🏆</option>
                    <option value="arcade">Retro Atari Melodisi 👾</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between sm:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Akıllı Sesli Asistan Servisi</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">Ekrandaki mikrofon ikonu ile sesli ve yazılı asistanı yönetin</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !voiceAssistantEnabled;
                      setVoiceAssistantEnabled(next);
                      localStorage.setItem("voiceAssistantEnabled", next ? "1" : "0");
                      triggerToast(next ? "Sesli Asistan Servisi Aktifleştirildi 🎙️" : "Sesli Asistan Servisi Devre Dışı Bırakıldı 🔕");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition select-none ${
                      voiceAssistantEnabled
                        ? "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {voiceAssistantEnabled ? "AÇIK 🎙️" : "KAPALI 🔕"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aktif Hatırlatmalar (Alarmlar)</h4>
                {alarms.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-405 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">Aktif zamanlı alarm bulunmuyor.</div>
                ) : (
                  alarms.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        🔔 {a.title} {a.date && `(${new Date(a.date).toLocaleString("tr-TR", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })})`}
                      </span>
                      <button onClick={() => handleDeleteAlarm(a.id)} className="text-rose-500 font-black hover:underline px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition">Sil</button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    💌 Bildirim Paneli
                  </h4>
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl">
                    <button
                      onClick={() => setNotifFilter("all")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                        notifFilter === "all"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                      }`}
                    >
                      Tümü ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter("alarm")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                        notifFilter === "alarm"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                      }`}
                    >
                      Alarmlar ({notifications.filter(n => !(n.type === "system" || n.title.includes("Hoş Geldiniz") || n.title.includes("Veritabanı") || n.title.includes("Sistem") || n.title.includes("Yedek") || n.title.includes("Temizlendi") || n.title.includes("Test"))).length})
                    </button>
                    <button
                      onClick={() => setNotifFilter("system")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                        notifFilter === "system"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                      }`}
                    >
                      Sistem ({notifications.filter(n => (n.type === "system" || n.title.includes("Hoş Geldiniz") || n.title.includes("Veritabanı") || n.title.includes("Sistem") || n.title.includes("Yedek") || n.title.includes("Temizlendi") || n.title.includes("Test"))).length})
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-405 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">Yeni bildirim bulunmuyor.</div>
                ) : notifications.filter((n) => {
                  const isSys = n.type === "system" || n.title.includes("Hoş Geldiniz") || n.title.includes("Veritabanı") || n.title.includes("Sistem") || n.title.includes("Yedek") || n.title.includes("Temizlendi") || n.title.includes("Test");
                  if (notifFilter === "alarm") return !isSys;
                  if (notifFilter === "system") return isSys;
                  return true;
                }).length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-105">Seçilen filtrede bildirim bulunmuyor.</div>
                ) : (
                  notifications.filter((n) => {
                    const isSys = n.type === "system" || n.title.includes("Hoş Geldiniz") || n.title.includes("Veritabanı") || n.title.includes("Sistem") || n.title.includes("Yedek") || n.title.includes("Temizlendi") || n.title.includes("Test");
                    if (notifFilter === "alarm") return !isSys;
                    if (notifFilter === "system") return isSys;
                    return true;
                  }).map((n) => {
                    const isSys = n.type === "system" || n.title.includes("Hoş Geldiniz") || n.title.includes("Veritabanı") || n.title.includes("Sistem") || n.title.includes("Yedek") || n.title.includes("Temizlendi") || n.title.includes("Test");
                    return (
                      <div
                        key={n.id}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs animate-fade-in"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          {isSys ? (
                            <span className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 font-mono text-[9px] font-black rounded uppercase">SİSTEM</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-mono text-[9px] font-black rounded uppercase">ALARM</span>
                          )}
                          💌 {n.title}
                        </span>
                        <button onClick={() => handleDeleteNotif(n.id)} className="text-rose-500 font-black hover:underline px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition">Sil</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "aiStrategy" && (
          <AIChat
            debts={debts}
            incomes={incomes}
            expenses={expenses}
            installmentDebts={installmentDebts}
            stats={statsBag}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            expenseCategories={expenseCategories}
            language={language}
          />
        )}

        {activeTab === "financialTools" && (
          <FinancialTools
            debts={debts}
            incomes={incomes}
            expenses={expenses}
            installmentDebts={installmentDebts}
            currentUser={currentUser}
            format={format}
            language={language}
          />
        )}

        {activeTab === "gplay_enhancements" && (
          <GPlayEnhancements
            language={language}
            setLanguage={setLanguage}
            expenseCategories={expenseCategories}
            onUpdateAllCategories={handleSaveAllCategories}
            expenses={expenses}
            statsBag={{
              totalDebt: statsBag.totalDebt,
              totalPaid: statsBag.totalPaid,
              remaining: statsBag.remaining,
              totalIncome: statsBag.totalIncome,
              totalExpense: statsBag.totalExpense,
              netIncome: statsBag.netIncome
            }}
            currentUser={currentUser}
            triggerToast={triggerToast}
            debts={debts}
            installmentDebts={installmentDebts}
            format={format}
            onRestoreBackup={handleRestoreBackup}
          />
        )}

        {["help", "blog", "feedback", "about", "privacy"].includes(activeTab) && (
          <HelpAndGuides activeTab={activeTab} onNavigate={handleNavClick} />
        )}

        {/* Enerjik ve Optimize Edilmiş Web Sayfası Footer Kartı (SEO & Sosyal Paylaşım & Kanallar) */}
        <footer className="mt-16 pt-8 pb-6 border-t border-slate-200/60 dark:border-slate-800/80 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Sol Blok: Sosyal Medya Takip Alanı & Haberdar Ol Bülteni */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="space-y-1.5 w-full flex flex-col items-center text-center">
                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                  Resmi Kanallarımız'ı Takip Edin
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm leading-relaxed">
                  Finansal tüyolar, akıllı bütçe stratejileri ve sistem güncellemelerinden anında haberdar olmak için topluluklarımıza katılın.
                </p>
              </div>
              
              {/* Dairesel Takip Linkleri */}
              <div className="flex items-center justify-center gap-3.5">
                <motion.a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: 5, 
                    color: "#ffffff", 
                    backgroundColor: "#ff0000",
                    borderColor: "#ff0000",
                    boxShadow: "0 10px 15px -3px rgba(255, 0, 0, 0.3)" 
                  }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-rose-500 shadow-xs transition-colors duration-300 cursor-pointer"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </motion.a>

                <motion.a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: -5, 
                    color: "#ffffff", 
                    backgroundColor: "#e1306c",
                    borderColor: "#e1306c",
                    boxShadow: "0 10px 15px -3px rgba(225, 48, 108, 0.3)" 
                  }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-pink-500 shadow-xs transition-colors duration-300 cursor-pointer"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </motion.a>

                <motion.a
                  href="https://telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: 5, 
                    color: "#ffffff", 
                    backgroundColor: "#0088cc",
                    borderColor: "#0088cc",
                    boxShadow: "0 10px 15px -3px rgba(0, 136, 204, 0.3)" 
                  }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-sky-500 shadow-xs transition-colors duration-300 cursor-pointer"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </motion.a>

                <motion.a
                  href="mailto:nettenkazanma2@gmail.com"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: -5, 
                    color: "#ffffff", 
                    backgroundColor: "#6366f1",
                    borderColor: "#6366f1",
                    boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)" 
                  }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-indigo-500 shadow-xs transition-colors duration-300 cursor-pointer"
                  title="E-Posta Gönder"
                >
                  <Mail className="w-4 h-4" />
                </motion.a>
              </div>

              {/* 'Haberdar Ol' Bülten Kayıt Alanı */}
              <div className="w-full max-w-sm pt-2">
                <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2 text-center">
                  🔔 HABERDAR OL (BÜLTEN)
                </span>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newsletterEmail.trim()) return;
                    setIsNewsletterSubscribed(true);
                    triggerToast("Bültene başarıyla abone oldunuz! Kampanyalar ve yeni finansal tüyolar anında e-postanıza gelecek. 🔔");
                    setNewsletterEmail("");
                    setTimeout(() => setIsNewsletterSubscribed(false), 5500);
                  }}
                  className="relative flex items-center bg-white/70 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 rounded-full p-1 focus-within:ring-4 focus-within:ring-indigo-500/15 focus-within:border-indigo-550 transition-all shadow-2xs header-glass"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="E-posta adresiniz..."
                    className="w-full pl-4 pr-24 py-2 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                    whileTap={{ scale: 0.94 }}
                    className="absolute right-1 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    Katıl <Bell className="w-3 h-3 text-white" />
                  </motion.button>
                </form>
                {isNewsletterSubscribed && (
                  <motion.p 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black mt-2 text-center"
                  >
                    ✓ Bültene başarıyla kaydoldunuz! Topluluğumuza hoş geldiniz. 🎉
                  </motion.p>
                )}
              </div>
            </div>

            {/* Sağ Blok: Sosyal Medya Paylaşım Alanı */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="space-y-1.5 w-full flex flex-col items-center text-center">
                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-center text-center">
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" /> Sistemi Arkadaşlarınla Paylaş
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm leading-relaxed">
                  Finansal özgürlüğe giden bu harika bütçe ve borç takip aracını tek tıkla sevdilerinizle paylaşarak onlara destek olun.
                </p>
              </div>

              {/* Dairesel Paylaşım Linkleri */}
              <div className="flex items-center gap-3.5">
                {/* WhatsApp Share */}
                <motion.a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Bütçe yönetimi, borç takibi, yapay zeka destekli bütçe analizleri ve akıllı hesap asistanı! Hemen dene: " + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: 3, 
                    backgroundColor: "#25d366", 
                    color: "#ffffff", 
                    borderColor: "#25d366",
                    boxShadow: "0 10px 15px -3px rgba(37, 211, 102, 0.3)" 
                  }}
                  whileTap={{ scale: 0.90 }}
                  className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 cursor-pointer transition-all duration-300"
                  title="WhatsApp'ta Paylaş"
                >
                  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.705 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </motion.a>

                {/* Twitter Share */}
                <motion.a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Kişisel finans bütçemi yapay zeka destekli Bütçem Pro ile tam kontrol altına aldım! Mutlaka inceleyin:")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: -3, 
                    backgroundColor: "#1da1f2", 
                    color: "#ffffff", 
                    borderColor: "#1da1f2",
                    boxShadow: "0 10px 15px -3px rgba(29, 161, 242, 0.3)" 
                  }}
                  whileTap={{ scale: 0.90 }}
                  className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-450 cursor-pointer transition-all duration-300"
                  title="Twitter (X)'da Paylaş"
                >
                  <Twitter className="w-4 h-4" />
                </motion.a>

                {/* Telegram Share */}
                <motion.a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Bütçem Pro ile bütçeni ve borçlarını kolayca kontrol altına al!")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: 3, 
                    backgroundColor: "#0088cc", 
                    color: "#ffffff", 
                    borderColor: "#0088cc",
                    boxShadow: "0 10px 15px -3px rgba(0, 136, 204, 0.3)" 
                  }}
                  whileTap={{ scale: 0.90 }}
                  className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 cursor-pointer transition-all duration-300"
                  title="Telegram'da Paylaş"
                >
                  <Send className="w-4 h-4 rotate-45" />
                </motion.a>

                {/* Facebook Share */}
                <motion.a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: -3, 
                    backgroundColor: "#1877f2", 
                    color: "#ffffff", 
                    borderColor: "#1877f2",
                    boxShadow: "0 10px 15px -3px rgba(24, 119, 242, 0.3)" 
                  }}
                  whileTap={{ scale: 0.90 }}
                  className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 cursor-pointer transition-all duration-300"
                  title="Facebook'ta Paylaş"
                >
                  <Facebook className="w-4 h-4" />
                </motion.a>

                {/* Copy Link Share */}
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    triggerToast("Bütçem Pro web site bağlantısı panoya kopyalandı! 🔗");
                  }}
                  whileHover={{ 
                    scale: 1.18, 
                    rotate: 3, 
                    backgroundColor: "#6366f1", 
                    color: "#ffffff", 
                    borderColor: "#6366f1",
                    boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)" 
                  }}
                  whileTap={{ scale: 0.90 }}
                  className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 cursor-pointer transition-all duration-300"
                  title="Bağlantıyı Kopyala"
                >
                  <Link className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200/40 dark:border-slate-800/80 text-center sm:text-left">
            <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
              © 2026 BÜTÇEM PRO • TÜM HAKLARI SAKLIDIR
            </div>
            <div className="flex gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <motion.span 
                whileHover={{ scale: 1.05, color: "#6366f1" }} 
                whileTap={{ scale: 0.95 }}
                className="transition-colors cursor-pointer select-none" 
                onClick={() => handleNavClick("about")}
              >
                Hakkımızda
              </motion.span>
              <span>•</span>
              <motion.span 
                whileHover={{ scale: 1.05, color: "#6366f1" }} 
                whileTap={{ scale: 0.95 }}
                className="transition-colors cursor-pointer select-none" 
                onClick={() => handleNavClick("privacy")}
              >
                Gizlilik Sözleşmesi
              </motion.span>
              <span>•</span>
              <motion.span 
                whileHover={{ scale: 1.05, color: "#6366f1" }} 
                whileTap={{ scale: 0.95 }}
                className="transition-colors cursor-pointer select-none" 
                onClick={() => handleNavClick("feedback")}
              >
                Geri Bildirim
              </motion.span>
            </div>
          </div>
        </footer>
      </main>

      {/* Fixed bottom navigation panel optimized for mobile view on cellphones */}
      {(() => {
        const getBottomTabClass = (tabId: string) => {
          const isActive = activeTab === tabId;
          if (!isActive) {
            return "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:scale-105 cursor-pointer";
          }
          switch (colorTheme) {
            case "green":
              return "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 dark:border-emerald-900/30 scale-105 shadow-xs font-black cursor-pointer";
            case "purple":
              return "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-100/30 dark:border-purple-900/30 scale-105 shadow-xs font-black cursor-pointer";
            case "orange":
              return "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100/30 dark:border-amber-900/30 scale-105 shadow-xs font-black cursor-pointer";
            default:
              return "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 dark:border-indigo-900/30 scale-105 shadow-xs font-black cursor-pointer";
          }
        };

        return (
          <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/80 p-2 flex justify-around select-none shadow-xl">
            <button
              onClick={() => handleNavClick("overview")}
              className={getBottomTabClass("overview")}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[9px] font-bold">{language === "tr" ? "Genel" : "Dashboard"}</span>
            </button>
            <button
              onClick={() => handleNavClick("income")}
              className={getBottomTabClass("income")}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[9px] font-bold">{language === "tr" ? "Gelirler" : "Incomes"}</span>
            </button>
            <button
              onClick={() => handleNavClick("debts")}
              className={getBottomTabClass("debts")}
            >
              <Coins className="w-4 h-4" />
              <span className="text-[9px] font-bold">{language === "tr" ? "Borçlar" : "Debts"}</span>
            </button>
            <button
              onClick={() => handleNavClick("expenses")}
              className={getBottomTabClass("expenses")}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[9px] font-bold">{language === "tr" ? "Giderler" : "Expenses"}</span>
            </button>
            <button
              onClick={() => handleNavClick("installments")}
              className={getBottomTabClass("installments")}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[9px] font-bold">{language === "tr" ? "Taksitler" : "Installments"}</span>
            </button>
            <button
              onClick={() => handleNavClick("aiStrategy")}
              className={getBottomTabClass("aiStrategy")}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[9px] font-bold">{language === "tr" ? "Asistan" : "AI Advisor"}</span>
            </button>
          </footer>
        );
      })()}

      {/* Security Settings Modal Overlay */}
      <AnimatePresence>
        {isSecurityModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500" />
              
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-200/50 dark:border-indigo-500/30">
                    <Shield className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">
                      GÜVENLİK AYARLARI
                    </h3>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Uygulama Giriş Kilidi
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="p-2 px-3 text-xs font-black rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition cursor-pointer"
                >
                  Kapat ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
                <SecuritySettingsPanel onSuccessToast={(msg) => {
                  triggerToast(msg);
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APK Sync Companion Confirmation Overlay */}
      <AnimatePresence>
        {syncCodeToApprove && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
              
              <div className="p-6 text-center space-y-4">
                <div className="inline-flex p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full border border-indigo-500/20 text-indigo-500">
                  <Shield className="w-8 h-8 animate-pulse" />
                </div>
                
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">
                    APK MOBİL BAĞLANTI KÖPRÜSÜ
                  </h3>
                  <h2 className="text-[15px] font-black text-slate-800 dark:text-slate-100 mt-1 leading-snug">
                    Google Giriş Onayı Talebi
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-2 mt-1 leading-relaxed">
                    Telefonunuzdaki APK uygulamasını bu cihazın veritabanı ile eşleştirmek üzeresiniz.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono">
                  <div className="text-left">
                    <span className="text-[9px] font-black tracking-wider text-slate-400 block uppercase">TALEP KODU</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                      {syncCodeToApprove.slice(0, 3)} {syncCodeToApprove.slice(3)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black tracking-wider text-emerald-500 block uppercase">● BEKLENİYOR</span>
                  </div>
                </div>

                {currentUser ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-left leading-relaxed">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">AKTİF OTURUM</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate">{currentUser}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">
                        Girişi onayladığınızda, APK uygulamanız otomatik olarak bu hesaba bağlanacaktır.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setSyncCodeToApprove(null)}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        İptal Et
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveSync}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-97 animate-pulse"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Onayla</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-left leading-relaxed">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">GİRİŞ YAPILMAMIŞ</p>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-semibold mt-1 leading-relaxed">
                        Öncelikle uygulamada yetkili bir hesaba giriş yapmış olmanız gerekir. Aşağıdaki butonu kullanarak Google ile giriş yapabilirsiniz.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuthForSync}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 dark:bg-red-650 dark:hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/15 cursor-pointer active:scale-98"
                    >
                      <Chrome className="w-4.5 h-4.5" />
                      <span>Google Girişi Yap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSyncCodeToApprove(null)}
                      className="w-full py-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 text-[11px] font-bold transition"
                    >
                      Pencereyi Kapat
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Filter and Range Download Modal */}
      <AnimatePresence>
        {isCsvModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
              id="csv-filter-modal"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 relative">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  📊 DETAYLI CSV RAPORU HAZIRLA
                </h3>
                <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-tight">
                  Tarih aralığı seçerek gelir, gider ve borç kayıtlarınızı filtreleyin.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Presets Grid */}
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block mb-2 tracking-widest leading-none">
                    HIZLI DÖNEM SEÇENEKLERİ
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        setCsvStartDate(firstDay.toISOString().slice(0, 10));
                        setCsvEndDate(lastDay.toISOString().slice(0, 10));
                      }}
                      className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition border border-transparent hover:border-emerald-500/30 text-[11px] text-left shrink-0 cursor-pointer"
                    >
                      📅 Bu Ay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                        setCsvStartDate(firstDay.toISOString().slice(0, 10));
                        setCsvEndDate(lastDay.toISOString().slice(0, 10));
                      }}
                      className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition border border-transparent hover:border-emerald-500/30 text-[11px] text-left shrink-0 cursor-pointer"
                    >
                      📅 Geçen Ay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setCsvStartDate(start.toISOString().slice(0, 10));
                        setCsvEndDate(now.toISOString().slice(0, 10));
                      }}
                      className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition border border-transparent hover:border-emerald-500/30 text-[11px] text-left shrink-0 cursor-pointer"
                    >
                      📅 Son 30 Gün
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvStartDate("");
                        setCsvEndDate("");
                      }}
                      className="py-1.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition border border-transparent hover:border-emerald-500/30 text-[11px] text-left shrink-0 cursor-pointer"
                    >
                      🚀 Tüm Zamanlar
                    </button>
                  </div>
                </div>

                {/* Custom Date Picker Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 block mb-1">
                      BAŞLANGIÇ TARİHİ
                    </label>
                    <input
                      type="date"
                      value={csvStartDate}
                      onChange={(e) => setCsvStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 block mb-1">
                      BİTİŞ TARİHİ
                    </label>
                    <input
                      type="date"
                      value={csvEndDate}
                      onChange={(e) => setCsvEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Info Tip */}
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-2xl flex gap-2 border border-emerald-100 dark:border-emerald-950/40 text-[10.5px] leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Detaylı CSV çıktısı seçtiğiniz aralıktaki tüm harcamalar, gelirler, borç ödemeleri ve taksitli işlemleri ayrı ayrı gruplandırarak size tam bir tablo sunar.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition cursor-pointer"
                >
                  {language === "tr" ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadCSV(csvStartDate, csvEndDate);
                    setIsCsvModalOpen(false);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-black text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer border-transparent"
                >
                  <Download className="w-4 h-4" /> {language === "tr" ? "RAPORU İNDİR (.CSV)" : "DOWNLOAD EXPORT (.CSV)"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Plan Upgrade / Subscription Management Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative my-8 text-left"
            >
              {/* Decorative golden/amber premium header gradient */}
              <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse" />
              
              <div className="p-6 space-y-6">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-full border border-amber-500/20 text-amber-500 animate-bounce">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
                    BÜTÇEM PRO PREMIUM
                  </h3>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    Sınırları Ortadan Kaldırın 👑
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium px-4 leading-relaxed">
                    Finansal bütçe yönetimini profesyonel seviyeye yükselten gelişmiş özellikleri keşfedin.
                  </p>
                </div>

                {/* Promo Feature notice if navigated specifically */}
                {promoFeature && (
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ⚠️ <span className="font-black text-indigo-600 dark:text-indigo-400">{promoFeature}</span> özelliğine erişmek için Premium üye olmanız gerekmektedir.
                  </div>
                )}

                {/* Features list */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs leading-none shrink-0 font-bold">📸</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Kamera / AI Fiş & Makbuz Taraması
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                        Kameradan veya dosya yükleme ile bütçe girdilerinizi yapay zeka yardımıyla anında otomatik oluşturun.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/60">
                    <span className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs leading-none shrink-0 font-bold">📄</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Yazıcı & Sınırsız PDF Dışa Aktarma
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                        Borç raporlarınızı, ödeme geçmişinizi ve bütçenizi tek tıkla resmi, temiz ve paylaşılabilir PDF raporu yapın.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/60">
                    <span className="p-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg text-xs leading-none shrink-0 font-bold">☁️</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Güvenli Bulut ve Widget Entegrasyonu
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                        Verilerinizi Google Drive ile senkronize edin ve telefon ekranınıza bütçe takip araçları (Widget'lar) ekleyin.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/60">
                    <span className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs leading-none shrink-0 font-bold">🚫</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        %100 Reklamsız Kullanım
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                        Uygulama genelindeki sponsorlu banka reklam panolarını ve yönlendirmeleri tamamen gizleyin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Plans Select / Activation block */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">
                    Fiyatlandırma Paketleri
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">AYLIK</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">₺29,99</p>
                    </div>
                    <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl text-center relative overflow-hidden">
                      <span className="absolute top-0 right-0 left-0 bg-amber-500 text-white text-[6px] font-black py-0.5">EN İYİSİ</span>
                      <p className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase pt-1.5 font-sans">YILLIK</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-202 mt-0.5">₺199,99</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">ÖMÜR BOYU</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-202 mt-0.5">₺299,99</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {isPremium ? (
                    <div className="space-y-2.5">
                      <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-center font-bold text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 font-sans">
                        <span>👑 PREMİUM LİSANSINIZ ETKİN</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPremium(false);
                          localStorage.setItem("is_premium", "false");
                          triggerToast("Ücretsiz plana geçiş yapıldı ⭐");
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-97 border border-dashed border-slate-300 dark:border-slate-700"
                      >
                        Ücretsiz Sürümü Test Et
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPremium(true);
                        localStorage.setItem("is_premium", "true");
                        setIsUpgradeModalOpen(false);
                        triggerToast("👑 Premium Sürüm Aktif Edildi! Tüm Sınırlar Kaldırıldı!");
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-650 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-97"
                    >
                      <span>PREMİUM SÜRÜMÜ ETKİNLEŞTİR ⚡</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="w-full py-2 text-center text-slate-400 hover:text-slate-600 dark:text-slate-500 text-xs font-bold transition block cursor-pointer"
                  >
                    Kapat, Vazgeç
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Voice Assistant Speech-to-Text Module */}
      {isUnlocked && voiceAssistantEnabled && (
        <VoiceAssistant
          debts={debts}
          incomes={incomes}
          expenses={expenses}
          installmentDebts={installmentDebts}
          onSaveDebt={handleSaveDebt}
          onSaveIncome={handleSaveIncome}
          onSaveExpense={handleSaveExpense}
          onSaveInstallment={handleSaveInstallment}
          onSaveContactTx={handleSaveContactTx}
          currentUser={currentUser}
          userApiKey={localStorage.getItem("user_gemini_api_key") || undefined}
          triggerToast={triggerToast}
        />
      )}

      {/* Dynamic Security Screen Lock Barrier */}
      {!isUnlocked && (
        <SecurityLockOverlay onUnlockSuccess={() => setIsUnlocked(true)} />
      )}
    </div>
  );
}
