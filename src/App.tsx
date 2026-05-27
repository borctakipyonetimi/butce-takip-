/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
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
  VolumeX
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

export default function App() {
  const { activeCurrency, setActiveCurrency, rates, setRates, format, convert, currencySymbol } = useCurrency();

  // Navigation & Page routing state
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const [loginUsername, setLoginUsername] = useState("");

  // Core Financial tables states
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [installmentDebts, setInstallmentDebts] = useState<InstallmentDebt[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Local Alerts indicators
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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
  const [notifFilter, setNotifFilter] = useState<"all" | "alarm" | "system">("all");

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
      const audioUrl = useSystemSound
        ? "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" // Soft professional system chime
        : "https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav"; // Bright digital watch beep alarm

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
            
            if (useSystemSound) {
              osc.type = "sine";
              const nowTime = audioCtx.currentTime;
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
            } else {
              osc.type = "sawtooth";
              const nowTime = audioCtx.currentTime;
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

  // Application Intro Loading Screen states and handlers
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatus, setSplashStatus] = useState("Veriler Güvenle Yükleniyor...");
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState<string | null>(null);
  const [providerLoginOpen, setProviderLoginOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"google" | "hotmail" | null>(null);

  useEffect(() => {
    const totalDuration = 1000; // Ultra-fast 1 second loading for optimum stability and responsiveness
    const intervalTime = 20;
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

  const handleQuickLogin = (provider: "google" | "hotmail") => {
    setSelectedProvider(provider);
    setProviderLoginOpen(true);
  };

  const handleProviderLoginSuccess = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setCurrentUser(cleanEmail);
    localStorage.setItem("currentUser", cleanEmail);
    setProviderLoginOpen(false);
    setSelectedProvider(null);
    triggerToast(`${selectedProvider === "google" ? "Gmail" : "Hotmail"} ile Giriş Yapıldı!`);
  };

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

  // Load appropriate data when user target profile changes or mounts
  useEffect(() => {
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
        setExpenseCategories(
          parsed.expenseCategories || [
            { id: 1, name: "Kira", color: "#3b82f6", icon: "🏠" },
            { id: 2, name: "Market", color: "#10b981", icon: "🛒" },
            { id: 3, name: "Ulaşım", color: "#f59e0b", icon: "🚗" },
            { id: 4, name: "Yeme İçme", color: "#ec4899", icon: "🍔" },
            { id: 5, name: "Faturalar", color: "#ef4444", icon: "⚡" }
          ]
        );
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
  }, [currentUser]);

  // General persistent workspace saver
  const saveAllToUser = (
    updatedDebts: Debt[],
    updatedIncomes: Income[],
    updatedAlarms: Alarm[],
    updatedNotifs: NotificationItem[],
    updatedInstallments: InstallmentDebt[],
    updatedPayments: PaymentLog[],
    updatedExpenses: Expense[],
    updatedCategories: ExpenseCategory[]
  ) => {
    try {
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
      localStorage.setItem(spaceKey, JSON.stringify(dataBag));
      triggerToast("Değişiklikler Kaydedildi");
    } catch (err) {
      console.error("Critical error in saveAllToUser storage write:", err);
    }
  };

  // Helper ID generators
  const generateId = (items: { id: number }[]) => {
    return items.length ? Math.max(...items.map((x) => x.id)) + 1 : 1;
  };

  // ---------------- Financial Calculations ----------------
  const totalNormalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalNormalPaid = debts.reduce((sum, d) => sum + d.paid, 0);

  // Installments total values calculated dynamically & robustly
  const totalInstallmentAmount = installmentDebts.reduce((sum, inst) => sum + inst.totalAmount, 0);
  const totalInstallmentPaid = installmentDebts.reduce((sum, inst) => sum + (inst.paidInstallmentCount * (inst.totalAmount / inst.installmentCount || 1)), 0);
  const totalInstallmentRemaining = totalInstallmentAmount - totalInstallmentPaid;

  const monthlyInstallmentsDue = installmentDebts.reduce((sum, inst) => {
    if (inst.paidInstallmentCount >= inst.installmentCount) return sum;
    return sum + inst.totalAmount / inst.installmentCount;
  }, 0);

  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();

  const isPaymentThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYearVal;
  };

  const simpleDebtsPaymentsThisMonth = debts.map((d) => {
    const paidThisMonth = payments
      .filter((p) => p.debtId === d.id && p.type === "manual" && isPaymentThisMonth(p.date))
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingNow = Math.max(0, d.amount - d.paid);
    const startingValThisMonth = remainingNow + paidThisMonth;

    return {
      id: d.id,
      startingValThisMonth,
      remainingNow,
    };
  });

  const installmentPaymentsThisMonth = installmentDebts.map((inst) => {
    const perMonth = inst.totalAmount / (inst.installmentCount || 1);
    const paidThisMonth = payments
      .filter((p) => p.debtId === inst.id && p.type === "installment" && isPaymentThisMonth(p.date))
      .reduce((sum, p) => sum + p.amount, 0);

    const isActiveThisMonth = inst.paidInstallmentCount < inst.installmentCount || paidThisMonth > 0;

    const startingValThisMonth = isActiveThisMonth ? perMonth : 0;
    const remainingNow = isActiveThisMonth ? Math.max(0, perMonth - paidThisMonth) : 0;

    return {
      id: inst.id,
      startingValThisMonth,
      remainingNow,
    };
  });

  const computedThisMonthTotalBorc =
    simpleDebtsPaymentsThisMonth.reduce((sum, item) => sum + item.startingValThisMonth, 0) +
    installmentPaymentsThisMonth.reduce((sum, item) => sum + item.startingValThisMonth, 0);

  const computedThisMonthKalanBorc =
    simpleDebtsPaymentsThisMonth.reduce((sum, item) => sum + item.remainingNow, 0) +
    installmentPaymentsThisMonth.reduce((sum, item) => sum + item.remainingNow, 0);

  const currentMonthTotalPaymentsCount = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYearVal;
  }).length;

  // Track overall sums from databases to display on summary dashboard cards
  // This mirrors what users actually see in the respective tabs, ensuring 100% intuitive and correct arithmetic
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Overall totals
  const totalDebt = totalNormalDebt + totalInstallmentAmount;
  const totalPaid = totalNormalPaid + totalInstallmentPaid;
  // Taksitli borçların tamamı kalan borç kısmına dahil edilerek gerçek toplam borç yükü hesaplanmalıdır
  const remainingDebtValue = (totalNormalDebt - totalNormalPaid) + (totalInstallmentAmount - totalInstallmentPaid);

  // Correct calculation of remaining reserve (Total Income - Total Expense - Total Paid Debt)
  const netIncomeValue = totalIncome - totalExpense - totalPaid;

  const statsBag: FinancialStats = {
    totalDebt: totalDebt,
    totalPaid: totalPaid,
    remaining: remainingDebtValue,
    totalIncome: totalIncome,
    totalExpense: totalExpense,
    netIncome: netIncomeValue,
    thisMonthTotalBorc: computedThisMonthTotalBorc,
    thisMonthKalanBorc: computedThisMonthKalanBorc
  };

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

    const debtName = debtData.name || "İsimsiz Borç";
    const dueDate = debtData.dueDate || "";

    if (debtData.id) {
      // It's an update. Check if payment changed
      const oldDebt = debts.find((d) => d.id === debtData.id);
      const oldPaid = oldDebt ? oldDebt.paid : 0;
      const newPaid = debtData.paid || 0;
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
      const newD: Debt = {
        id: newId,
        name: debtName,
        amount: debtData.amount || 0,
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
    if (instData.id) {
      updated = installmentDebts.map((i) => (i.id === instData.id ? (instData as InstallmentDebt) : i));
    } else {
      const newInst: InstallmentDebt = {
        id: generateId(installmentDebts),
        name: instData.name || "Yeni Taksit Planı",
        totalAmount: instData.totalAmount || 0,
        installmentCount: instData.installmentCount || 1,
        paidInstallmentCount: instData.paidInstallmentCount || 0,
        firstDueDate: instData.firstDueDate || new Date().toISOString().slice(0, 10)
      };
      updated = [...installmentDebts, newInst];
    }
    setInstallmentDebts(updated);
    saveAllToUser(debts, incomes, alarms, notifications, updated, payments, expenses, expenseCategories);
  };

  const handleDeleteInstallment = (id: number) => {
    triggerConfirm(
      "Taksit Planını Sil",
      "Taksit planı tamamen silinecektir, devam edilsin mi?",
      () => {
        const updated = installmentDebts.filter((i) => i.id !== id);
        setInstallmentDebts(updated);
        saveAllToUser(debts, incomes, alarms, notifications, updated, payments, expenses, expenseCategories);
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

  // ---------------- Backup Utilities ----------------
  const handleExportBackup = () => {
    const bag = { debts, incomes, alarms, notifications, installmentDebts, payments, expenses, expenseCategories };
    const blob = new Blob([JSON.stringify(bag, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `borc_takip_yedek_${currentUser || "kullanici"}.json`;
    link.click();
    triggerToast("Veri Yedeği İndirildi");
  };

  const handleDownloadCSV = () => {
    const esc = (val: any) => {
      const str = String(val === undefined || val === null ? "" : val);
      return `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    let csvContent = "";
    csvContent += "\uFEFF"; // UTF-8 BOM byte sequence to render Turkish characters elegantly in Excel

    // Header Info
    csvContent += [esc("FİNANSAL DURUM VE BÜTÇE TAKİP RAPORU"), esc("")].join(";") + "\n";
    csvContent += [esc("Rapor Tarihi"), esc(new Date().toLocaleDateString("tr-TR"))].join(";") + "\n";
    csvContent += [esc("Aktif Para Birimi"), esc(activeCurrency)].join(";") + "\n";
    csvContent += "\n";

    // Özet Tablosu
    csvContent += [esc("=== GENEL FİNANSAL ÖZET ==="), esc("")].join(";") + "\n";
    csvContent += [esc("Gösterge"), esc(`Miktar (${activeCurrency})`)].join(";") + "\n";
    csvContent += [esc("Toplam Birikmiş Borç"), esc(format(statsBag.totalDebt))].join(";") + "\n";
    csvContent += [esc("Ödenmiş Toplam Borç"), esc(format(statsBag.totalPaid))].join(";") + "\n";
    csvContent += [esc("Kalan Aktif Borç Tutarı"), esc(format(statsBag.remaining))].join(";") + "\n";
    csvContent += [esc("Aylık Toplam Gelir"), esc(format(statsBag.totalIncome))].join(";") + "\n";
    csvContent += [esc("Aylık Toplam Gider"), esc(format(statsBag.totalExpense))].join(";") + "\n";
    csvContent += [esc("Net Kalan Rezerv"), esc(format(statsBag.netIncome))].join(";") + "\n";
    csvContent += "\n";

    // Gelirler
    csvContent += [esc("=== KAYITLI AYLIK GELİRLER ==="), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Gelir Başlığı"), esc(`Miktar (${activeCurrency})`), esc("Gelir Kategorisi"), esc("Tarih / Not")].join(";") + "\n";
    if (incomes.length === 0) {
      csvContent += [esc("Hiç kayıtlı gelir bulunamadı."), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      incomes.forEach((inc: any) => {
        csvContent += [esc(inc.title), esc(inc.amount), esc(inc.category || "Genel"), esc(inc.date || "")].join(";") + "\n";
      });
    }
    csvContent += "\n";

    // Giderler
    csvContent += [esc("=== KAYITLI HARCAMA VE GİDERLER ==="), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Harcama Başlığı"), esc(`Miktar (${activeCurrency})`), esc("Kategori"), esc("Harcama Tarihi")].join(";") + "\n";
    if (expenses.length === 0) {
      csvContent += [esc("Hiç kayıtlı gider bulunamadı."), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      expenses.forEach((exp: any) => {
        csvContent += [esc(exp.title), esc(exp.amount), esc(exp.category || "Genel"), esc(exp.date || "")].join(";") + "\n";
      });
    }
    csvContent += "\n";

    // Borçlar
    csvContent += [esc("=== AKTİF VE ÖDENEN BORÇ DETAYLARI ==="), esc(""), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Borç Açıklaması"), esc("Toplam Borç"), esc("Ödenen Kısım"), esc("Kalan Tutar"), esc("Alacaklı Kurum/Kişi"), esc("Vade Tarihi"), esc("Ödeme Durumu")].join(";") + "\n";
    if (debts.length === 0) {
      csvContent += [esc("Kayıtlı borç bulunamadı."), esc(""), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      debts.forEach((d: any) => {
        csvContent += [
          esc(d.title),
          esc(d.amount),
          esc(d.paidAmount || 0),
          esc(d.amount - (d.paidAmount || 0)),
          esc(d.creditor || "-"),
          esc(d.dueDate || ""),
          esc(d.isPaid ? "ÖDENDİ" : "BEKLEYEN ÖDEME")
        ].join(";") + "\n";
      });
    }
    csvContent += "\n";

    // Taksitler
    csvContent += [esc("=== TAKSİTLİ DETAYLI HARCAMALAR VE KREDİLER ==="), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    csvContent += [esc("Kredi/Taksit Adı"), esc("Aylık Ödeme"), esc("Toplam Taksit"), esc("Kalan Taksit"), esc("Toplam Tutar"), esc("Başlangıç Tarihi")].join(";") + "\n";
    if (installmentDebts.length === 0) {
      csvContent += [esc("Kayıtlı taksitli borç bulunamadı."), esc(""), esc(""), esc(""), esc(""), esc("")].join(";") + "\n";
    } else {
      installmentDebts.forEach((inst: any) => {
        csvContent += [
          esc(inst.title),
          esc(inst.monthlyPayment),
          esc(inst.totalInstallments),
          esc(inst.remainingInstallments),
          esc(inst.totalAmount),
          esc(inst.startDate || "")
        ].join(";") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Finansal_Rapor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast("Finansal Rapor başarıyla CSV olarak indirildi! 📊");
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
          setDebts(parsed.debts || []);
          setIncomes(parsed.incomes || []);
          setAlarms(parsed.alarms || []);
          setNotifications(parsed.notifications || []);
          setInstallmentDebts(parsed.installmentDebts || []);
          setPayments(parsed.payments || []);
          setExpenses(parsed.expenses || []);
          setExpenseCategories(parsed.expenseCategories || []);
          saveAllToUser(
            parsed.debts || [],
            parsed.incomes || [],
            parsed.alarms || [],
            parsed.notifications || [],
            parsed.installmentDebts || [],
            parsed.payments || [],
            parsed.expenses || [],
            parsed.expenseCategories || []
          );
          triggerToast("Bütçe Tabanı Yüklendi!");
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
    { id: "income", label: "GELİRLER", icon: Wallet },
    { id: "expenses", label: "GİDERLER", icon: ShoppingCart },
    { id: "installments", label: "TAKSİTLİ BORÇLAR", icon: Calendar },
    { id: "notifications", label: "ALARM VE BİLDİRİMLER", icon: Bell },
    { id: "aiStrategy", label: "YAPAY ZEKA ASİSTAN", icon: Sparkles },
    { id: "help", label: "KULLANIM REHBERİ", icon: HelpCircle },
    { id: "blog", label: "FİNANS KILAVUZLARI", icon: BookOpen },
    { id: "feedback", label: "GERİ BİLDİRİM", icon: MessageSquare },
    { id: "about", label: "HAKKINDA", icon: Star },
    { id: "privacy", label: "GİZLİLİK POLİTİKASI", icon: Shield }
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

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
                  className="relative w-20 h-20 bg-slate-900 border border-indigo-505/30 rounded-full flex items-center justify-center cursor-pointer shadow-inner shadow-indigo-500/50"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-1"
              >
                <h1 className="text-3xl sm:text-4xl font-black tracking-widest bg-gradient-to-r from-indigo-200 via-white to-emerald-300 bg-clip-text text-transparent uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  BÜTÇEM PRO
                </h1>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <span>💡 LİMİTSİZ YÖNETİM</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI DESTEKLİ</span>
                </p>
              </motion.div>

              {/* Progress Slider */}
              <div className="space-y-3 pt-1">
                <div className="w-full h-2 bg-slate-900/90 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${splashProgress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
                  <span className="animate-pulse flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping inline-block" />
                    {splashStatus}
                  </span>
                  <span className="font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/10">{splashProgress}%</span>
                </div>
              </div>

              {/* Real-time Loading Systems Checklist */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2 text-left max-w-xs mx-auto text-[10px] font-bold tracking-wider">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{splashProgress >= 30 ? "🔒" : "⏳"}</span>
                    <span className={splashProgress >= 30 ? "text-slate-400 line-through decoration-emerald-500/50" : "text-slate-300"}>
                      VERİ TABANI ŞİFRELEME
                    </span>
                  </div>
                  <span className={splashProgress >= 30 ? "text-emerald-400 font-extrabold" : "text-indigo-400 animate-pulse"}>
                    {splashProgress >= 30 ? "BAŞARILI ✓" : "YÜKLENİYOR"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{splashProgress >= 65 ? "🤖" : "⏳"}</span>
                    <span className={splashProgress >= 65 ? "text-slate-400 line-through decoration-emerald-500/50" : "text-slate-300"}>
                      AI FİNANS ANALİZ MOTORU
                    </span>
                  </div>
                  <span className={splashProgress >= 65 ? "text-emerald-400 font-extrabold" : splashProgress >= 30 ? "text-indigo-400 animate-pulse" : "text-slate-500"}>
                    {splashProgress >= 65 ? "HAZIR ✓" : splashProgress >= 30 ? "YÜKLENİYOR" : "BEKLENİYOR"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{splashProgress >= 90 ? "🔔" : "⏳"}</span>
                    <span className={splashProgress >= 90 ? "text-slate-400 line-through decoration-emerald-500/50" : "text-slate-300"}>
                      BİLDİRİM & ALARM SİNYALLERİ
                    </span>
                  </div>
                  <span className={splashProgress >= 90 ? "text-emerald-400 font-extrabold" : splashProgress >= 65 ? "text-indigo-400 animate-pulse" : "text-slate-500"}>
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
                className="flex-1 py-3 text-[11px] font-black tracking-wider uppercase bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 rounded-2xl transition cursor-pointer select-none"
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
        <div className="flex items-center justify-between md:justify-start gap-4 min-w-0 relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 sm:p-2.5 shrink-0 focus:outline-none bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black/30"
              title="Menüyü Aç/Kapat"
            >
              <Menu className="w-5 h-5 text-indigo-200 group-hover:text-white transition" />
            </button>
            
            <div className="space-y-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-2xl lg:text-3xl font-black tracking-normal flex items-center select-none whitespace-nowrap gap-2 sm:gap-3 leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">
                <span className="animate-wave-flag inline-block shrink-0 select-none">
                  <svg viewBox="0 0 1200 800" className="w-[20px] h-[13.5px] sm:w-[32px] sm:h-[21.5px] md:w-[38px] md:h-[25.5px] rounded-xs shadow-md overflow-hidden shrink-0 inline-block border border-white/10" style={{ minWidth: "20px" }}>
                    <rect width="1200" height="800" fill="#e30a17"/>
                    <circle cx="400" cy="400" r="200" fill="#ffffff"/>
                    <circle cx="450" cy="400" r="160" fill="#e30a17"/>
                    <polygon points="585,400 643.78,419.1 607.45,369.1 607.45,430.9 643.78,380.9" fill="#ffffff" transform="rotate(-30 585 400)"/>
                  </svg>
                </span>
                <span>
                  BORÇ <span className="text-indigo-400 font-extrabold">TAKİP</span>
                </span> 
                <span className="text-[9px] sm:text-[10px] md:text-xs px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg font-black tracking-widest uppercase animate-pulse">
                  PRO
                </span>
              </h1>
              <p className="text-[8px] sm:text-[10px] font-black tracking-wider text-emerald-400/90 uppercase flex items-center gap-1.5 select-none leading-none">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                BÜTÇEM PRO & AKILLI FINANSAL TAKİP
              </p>
            </div>
          </div>

          {/* Clock visible on mobile row next to title to save bottom row space */}
          {isClockVisible && (
            <div className="flex md:hidden items-center gap-1 bg-black/60 text-[9px] font-black font-mono tracking-widest px-2 py-1 rounded-lg text-emerald-400 border border-white/10 shadow-md">
              <span>{liveClock.split(" ")[1] || liveClock}</span>
            </div>
          )}
        </div>

        {/* Right side navigation toolbar / tools */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 shrink-0 relative z-10 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
          <div className="flex items-center gap-2 select-none">
            {isClockVisible && (
              <div className="hidden md:flex items-center gap-1.5 bg-black/60 dark:bg-black/80 text-[10px] sm:text-xs font-black font-mono tracking-widest px-3 sm:px-4 py-2 rounded-xl text-emerald-400 border border-white/10 shadow-lg shadow-black/40 select-none animate-clock-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] inline-block shrink-0 animate-ping duration-[1.5s]" />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{liveClock}</span>
              </div>
            )}
            
            <button
              onClick={() => setIsClockVisible((prev) => !prev)}
              title="Saati Göster/Gizle"
              className={`p-2 lg:p-2.5 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center border border-white/10 cursor-pointer shrink-0 ${
                isClockVisible 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20" 
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Clock className={`w-4 h-4 ${isClockVisible ? "animate-spin [animation-duration:25s]" : ""}`} />
            </button>
            
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              title="Arka Plan Teması"
              className="p-2 lg:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-xl transition-all text-white flex items-center justify-center duration-300 cursor-pointer shadow-inner shrink-0"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-200" />}
            </button>

            <button
              onClick={() => {
                triggerToast("Uygulama Yenileniyor... 🔄");
                setTimeout(() => {
                  window.location.reload();
                }, 350);
              }}
              title="Sayfayı Yenile"
              className="p-2 lg:p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 active:scale-95 rounded-xl transition-all flex items-center justify-center duration-300 cursor-pointer shrink-0"
            >
              <RotateCw className="w-4 h-4 text-indigo-400 animate-spin [animation-duration:15s]" />
            </button>

            <button
              onClick={() => {
                setActiveTab("notifications");
                const el = document.getElementById("main-nav-tabs") || document.getElementById("notifications-container");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              title={`Bildirimler ve Alarmlar (${notifications.length})`}
              className="p-2 lg:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-xl transition-all text-white flex items-center justify-center duration-300 cursor-pointer shadow-inner relative shrink-0"
            >
              <Bell className="w-4 h-4 text-indigo-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-slate-900">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={colorTheme}
                onChange={(e) => {
                  setColorTheme(e.target.value);
                  localStorage.setItem("colorTheme", e.target.value);
                }}
                className="appearance-none pl-3 pr-7 py-2 lg:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 dark:bg-slate-900 text-white rounded-xl text-[10px] md:text-xs font-black tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer transition active:scale-95 text-center min-w-[75px] sm:min-w-[90px]"
              >
                <option value="default" className="text-slate-900 bg-white">MAVİ</option>
                <option value="green" className="text-slate-900 bg-white">YEŞİL</option>
                <option value="purple" className="text-slate-900 bg-white">MOR</option>
                <option value="orange" className="text-slate-900 bg-white">TURUNCU</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/50 text-[8px]" style={{ right: "8px" }}>
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
                className="appearance-none pl-3 pr-7 py-2 lg:py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] md:text-xs font-black tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer transition active:scale-95 text-center min-w-[75px] sm:min-w-[90px]"
              >
                <option value="TRY" className="text-slate-900 bg-white">TRY (₺)</option>
                <option value="USD" className="text-slate-900 bg-white">USD ($)</option>
                <option value="EUR" className="text-slate-900 bg-white">EUR (€)</option>
                <option value="GBP" className="text-slate-900 bg-white">GBP (£)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-emerald-300/60 text-[8px]" style={{ right: "8px" }}>
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
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-50 tracking-wide uppercase">Hesap Asistanı</h2>
              <p className="text-[10px] font-bold text-slate-400">v5.0 Ultimate</p>
            </div>
          </div>

          {/* Local User Login profile area */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col gap-2 relative overflow-hidden border border-slate-200/55 dark:border-slate-805">
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
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-705 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-center"
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
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">VEYA TEK TIKLA GİRİŞ</span>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>

                {/* Platforms Container */}
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("google")}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Chrome className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>Gmail ile Giriş</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("hotmail")}
                    className="w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-sky-700 dark:text-sky-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Hotmail ile Giriş</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Aktif Profil</p>
                <div className="px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/30 dark:border-indigo-900/20">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                    {currentUser.includes("@") ? (
                      currentUser.includes("gmail") ? (
                        <>
                          <Chrome className="w-3.5 h-3.5 text-red-400 shrink-0" /> G-Suite
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Live Mail
                        </>
                      )
                    ) : (
                      "Yerel Hesap"
                    )}
                  </span>
                  <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 truncate mt-1">{currentUser}</p>
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

          {/* Navigation link directories */}
          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold leading-normal transition-all ${
                    activeTab === item.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-l-[4px] border-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database backup controllers inside side panel footer */}
        <div className="p-4 border-t dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 relative z-10">
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
            <button
              onClick={handleExportBackup}
              className="py-1.5 px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <Download className="w-3 h-3" /> DIŞA AKTAR
            </button>
            <button
              onClick={handleImportBackup}
              className="py-1.5 px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <Upload className="w-3 h-3" /> İÇE AKTAR
            </button>
          </div>
          <button
            onClick={handleDownloadCSV}
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
        {activeTab === "overview" && (
          <DashboardOverview
            stats={statsBag}
            onNavigate={setActiveTab}
            monthlyPaymentsCount={currentMonthTotalPaymentsCount}
            monthlyInstallmentsDue={monthlyInstallmentsDue}
          />
        )}

        {activeTab === "monthly" && (
          <FollowUpMonthlyYearly
            debts={debts}
            incomes={incomes}
            expenses={expenses}
            payments={payments}
            viewMode="monthly"
          />
        )}

        {activeTab === "yearly" && (
          <FollowUpMonthlyYearly
            debts={debts}
            incomes={incomes}
            expenses={expenses}
            payments={payments}
            viewMode="yearly"
          />
        )}

        {activeTab === "debts" && (
          <DebtList
            debts={debts}
            totalIncome={statsBag.totalIncome}
            onSaveDebt={handleSaveDebt}
            onDeleteDebt={handleDeleteDebt}
            onToggleDebtPaid={handleToggleDebtPaid}
            onAddAlarm={handleAddAlarm}
            themeColor={colorTheme}
            onSaveInstallment={handleSaveInstallment}
            installmentDebts={installmentDebts}
          />
        )}

        {activeTab === "income" && (
          <IncomesList incomes={incomes} onSaveIncome={handleSaveIncome} onDeleteIncome={handleDeleteIncome} />
        )}

        {activeTab === "expenses" && (
          <ExpensesList
            expenses={expenses}
            expenseCategories={expenseCategories}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateAllCategories={handleSaveAllCategories}
            netBalance={statsBag.netIncome}
          />
        )}

        {activeTab === "installments" && (
          <InstallmentsList
            installmentDebts={installmentDebts}
            onSaveInstallment={handleSaveInstallment}
            onDeleteInstallment={handleDeleteInstallment}
            onPayInstallment={handlePayInstallment}
          />
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                <Bell className="w-5 h-5 text-indigo-500 animate-swing" /> Alarmlar ve Bildirimler
              </h2>
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
                
                <h3 className="text-sm sm:text-base font-black">Borç Hatırlatıcılarını Doğrudan Telefonunuzda Alın</h3>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                  Alarmları kurduğunuzda, ödeme günü yaklaştığında ve bütçe analizleri tamamlandığında, uygulamanın arka planda veya ön planda olduğuna bakılmaksızın cihazınıza sistem bildirimi gönderilir.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition active:scale-95 text-white"
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
                    <span>🎯 Test Bildirimi Gönder</span>
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
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Melodi Türü</span>
                    <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">Zil sesi melodi alternatifi</span>
                  </div>
                  <select
                    value={useSystemSound ? "system" : "digital"}
                    onChange={(e) => {
                      const next = e.target.value === "system";
                      setUseSystemSound(next);
                      localStorage.setItem("useSystemSound", next ? "1" : "0");
                      triggerToast(next ? "Sistem Melodisi Seçildi" : "Dijital Saat Sinyali Seçildi");
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition focus:outline-none"
                  >
                    <option value="digital">Dijital Saat Bipi</option>
                    <option value="system">Sistem Melodisi (Simüle)</option>
                  </select>
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
          />
        )}

        {["help", "blog", "feedback", "about", "privacy"].includes(activeTab) && (
          <HelpAndGuides activeTab={activeTab} onNavigate={setActiveTab} />
        )}

        {/* Enerjik ve Optimize Edilmiş Web Sayfası Footer Kartı (SEO & Sosyal Paylaşım & Kanallar) */}
        <footer className="mt-16 pt-8 pb-6 border-t border-slate-200/60 dark:border-slate-800/80 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Sol Blok: Sosyal Medya Takip Alanı */}
            <div className="flex flex-col items-center md:items-start space-y-3">
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Resmi Kanallarımız'ı Takip Edin
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center md:text-left max-w-sm">
                Finansal tüyolar, akıllı bütçe stratejileri ve sistem güncellemelerinden anında haberdar olmak için topluluklarımıza katılın.
              </p>
              <div className="flex items-center gap-3">
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
                  className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-rose-500 shadow-xs transition-colors duration-300 cursor-pointer"
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
                  className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-pink-500 shadow-xs transition-colors duration-300 cursor-pointer"
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
                  className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-sky-500 shadow-xs transition-colors duration-300 cursor-pointer"
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
                  className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-indigo-500 shadow-xs transition-colors duration-300 cursor-pointer"
                  title="E-Posta Gönder"
                >
                  <Mail className="w-4 h-4" />
                </motion.a>
              </div>
            </div>

            {/* Sağ Blok: Sosyal Medya Paylaşım Alanı */}
            <div className="flex flex-col items-center md:items-end space-y-3">
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-end">
                <Share2 className="w-3.5 h-3.5 text-indigo-500" /> Sistemi Arkadaşlarınla Paylaş
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center md:text-right max-w-sm">
                Finansal özgürlüğe giden bu harika bütçe ve borç takip aracını tek tıkla sevdiklerinizle paylaşarak onlara destek olun.
              </p>
              <div className="flex items-center gap-2">
                {/* WhatsApp Share */}
                <motion.a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Bütçe yönetimi, borç takibi, yapay zeka destekli bütçe analizleri ve akıllı hesap asistanı! Hemen dene: " + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, rotate: 3, backgroundColor: "#25d366", color: "#ffffff", boxShadow: "0 8px 12px -3px rgba(37, 211, 102, 0.3)" }}
                  className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 cursor-pointer transition-colors duration-300"
                  title="WhatsApp'ta Paylaş"
                >
                  <span className="text-[10px] font-bold">WA</span>
                </motion.a>

                {/* Twitter Share */}
                <motion.a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Kişisel finans bütçemi yapay zeka destekli Bütçem Pro ile tam kontrol altına aldım! Mutlaka inceleyin:")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, rotate: -3, backgroundColor: "#1da1f2", color: "#ffffff", boxShadow: "0 8px 12px -3px rgba(29, 161, 242, 0.3)" }}
                  className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-450 cursor-pointer transition-colors duration-300"
                  title="Twitter (X)'da Paylaş"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </motion.a>

                {/* Telegram Share */}
                <motion.a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Bütçem Pro ile bütçeni ve borçlarını kolayca kontrol altına al!")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, rotate: 3, backgroundColor: "#0088cc", color: "#ffffff", boxShadow: "0 8px 12px -3px rgba(0, 136, 204, 0.3)" }}
                  className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 cursor-pointer transition-colors duration-300"
                  title="Telegram'da Paylaş"
                >
                  <Send className="w-3.5 h-3.5 rotate-45" />
                </motion.a>

                {/* Facebook Share */}
                <motion.a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, rotate: -3, backgroundColor: "#1877f2", color: "#ffffff", boxShadow: "0 8px 12px -3px rgba(24, 119, 242, 0.3)" }}
                  className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors duration-300"
                  title="Facebook'ta Paylaş"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </motion.a>

                {/* Copy Link Share */}
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    triggerToast("Bütçem Pro web site bağlantısı panoya kopyalandı! 🔗");
                  }}
                  whileHover={{ scale: 1.15, rotate: 3, backgroundColor: "#6366f1", color: "#ffffff", boxShadow: "0 8px 12px -3px rgba(99, 102, 241, 0.3)" }}
                  className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors duration-300"
                  title="Bağlantıyı Kopyala"
                >
                  <Link className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200/40 dark:border-slate-800/80 text-center sm:text-left">
            <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
              © 2026 BÜTÇEM PRO • TÜM HAKLARI SAKLIDIR
            </div>
            <div className="flex gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <span className="hover:text-indigo-500 transition cursor-pointer" onClick={() => handleNavClick("about")}>Hakkımızda</span>
              <span>•</span>
              <span className="hover:text-indigo-500 transition cursor-pointer" onClick={() => handleNavClick("privacy")}>Gizlilik Sözleşmesi</span>
              <span>•</span>
              <span className="hover:text-indigo-500 transition cursor-pointer" onClick={() => handleNavClick("feedback")}>Geri Bildirim</span>
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
              <span className="text-[9px] font-bold">Genel</span>
            </button>
            <button
              onClick={() => handleNavClick("income")}
              className={getBottomTabClass("income")}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[9px] font-bold">Gelirler</span>
            </button>
            <button
              onClick={() => handleNavClick("debts")}
              className={getBottomTabClass("debts")}
            >
              <Coins className="w-4 h-4" />
              <span className="text-[9px] font-bold">Borçlar</span>
            </button>
            <button
              onClick={() => handleNavClick("expenses")}
              className={getBottomTabClass("expenses")}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[9px] font-bold">Giderler</span>
            </button>
            <button
              onClick={() => handleNavClick("installments")}
              className={getBottomTabClass("installments")}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[9px] font-bold">Taksitler</span>
            </button>
            <button
              onClick={() => handleNavClick("aiStrategy")}
              className={getBottomTabClass("aiStrategy")}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[9px] font-bold">Asistan</span>
            </button>
          </footer>
        );
      })()}
    </div>
  );
}
