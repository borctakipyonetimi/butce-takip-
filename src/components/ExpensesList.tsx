/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  ShoppingCart,
  Folder,
  Edit,
  Trash2,
  Calendar,
  ClipboardList,
  BarChart3,
  Check,
  AlertTriangle,
  Sparkles,
  X,
  Lightbulb,
} from "lucide-react";
import { motion } from "motion/react";
import { Expense, ExpenseCategory } from "../types";
import { DoughnutChart, BarChart } from "./BudgetCharts";
import { useCurrency } from "../utils/CurrencyContext";
import ReceiptScanner from "./ReceiptScanner";
import { Camera } from "lucide-react";

interface ExpensesListProps {
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  onSaveExpense: (expense: Partial<Expense>) => void;
  onDeleteExpense: (id: number) => void;
  onSaveCategory: (category: Partial<ExpenseCategory>) => void;
  onDeleteCategory: (id: number) => void;
  onUpdateAllCategories?: (categories: ExpenseCategory[]) => void;
}

const getSavingTipForCategory = (name: string, icon: string): string => {
  const norm = name.toLowerCase();

  // Keyword mapping
  if (
    norm.includes("market") ||
    norm.includes("mutfak") ||
    norm.includes("gıda") ||
    norm.includes("bakkal") ||
    norm.includes("manav") ||
    icon === "🛒"
  ) {
    return "Market alışverişlerinize gitmeden önce mutlaka haftalık menü planlayın ve tok karnına bir liste ile gidin. Özel markalı (Private Label) ürünlere şans vererek sepet tutarını %30'a kadar düşürebilirsiniz.";
  }
  if (
    norm.includes("yemek") ||
    norm.includes("restoran") ||
    norm.includes("kafe") ||
    norm.includes("burger") ||
    norm.includes("kebap") ||
    norm.includes("dışarı") ||
    icon === "🍔" ||
    icon === "🥩" ||
    icon === "🍷"
  ) {
    return "Dışarıda yemek siparişlerini haftada maksimum 1 güne düşürün. İş yerinde öğle yemeğini evden götürmek veya kendi kahvenizi termosta taşımak, bütçenizde devasa bir tasarruf alanı açacaktır.";
  }
  if (
    norm.includes("kira") ||
    norm.includes("ev") ||
    norm.includes("konut") ||
    norm.includes("site") ||
    norm.includes("aidat") ||
    icon === "🏠"
  ) {
    return "Evinizdeki enerji tüketimini optimize edin. LED ampuller kullanmak, akıllı prizler tercih etmek ve kullanılmayan cihazları fişten çekmek elektrik faturanızı yaklaşık %15 oranında iyileştirecektir.";
  }
  if (
    norm.includes("ulaşım") ||
    norm.includes("yol") ||
    norm.includes("otobüs") ||
    norm.includes("metro") ||
    norm.includes("taksi") ||
    icon === "🚗" ||
    icon === "✈️"
  ) {
    return "Toplu taşıma kullanırken aylık abonman paketlerini tercih edin. Kısa mesafelerde taksi yerine yürümek hem sağlığınıza hem de cüzdanınıza doğrudan katkı sağlayacaktır.";
  }
  if (
    norm.includes("araba") ||
    norm.includes("araç") ||
    norm.includes("yakıt") ||
    norm.includes("akaryakıt") ||
    norm.includes("benzin") ||
    norm.includes("bakım") ||
    norm.includes("sigorta") ||
    icon === "🔧"
  ) {
    return "Akaryakıt tasarrufu için aracınızı stabil hızlarda sürün, ani fren ve kalkışlardan kaçının. Lastik havalarını düzenli kontrol etmek yakıt tüketimini %3-4 oranında azaltır.";
  }
  if (
    norm.includes("fatura") ||
    norm.includes("elektrik") ||
    norm.includes("su") ||
    norm.includes("doğalgaz") ||
    norm.includes("internet") ||
    norm.includes("telefon") ||
    icon === "⚡"
  ) {
    return "Otomatik ödeme talimatlarınızı kontrol edin. Kullanmadığınız TV/müzik aboneliklerini (Netflix, Spotify vb.) askıya alın veya aile planlarıyla ortaklaşa kullanarak harcamayı paylaşın.";
  }
  if (
    norm.includes("giyim") ||
    norm.includes("elbise") ||
    norm.includes("ayakkabı") ||
    norm.includes("moda") ||
    norm.includes("alışveriş") ||
    icon === "🎒" ||
    icon === "🛍️" ||
    icon === "💇"
  ) {
    return "Giymediğiniz kıyafetleri ikinci el uygulamalarında satarak bütçenize ek katkı sağlayın. Yeni bir şey almadan önce kapsül gardırop yaklaşımını inceleyerek gereksiz tüketimin önüne geçebilirsiniz.";
  }
  if (
    norm.includes("eğlence") ||
    norm.includes("sinema") ||
    norm.includes("konser") ||
    norm.includes("tiyatro") ||
    norm.includes("aktivite") ||
    norm.includes("oyun") ||
    icon === "🍿" ||
    icon === "🎸"
  ) {
    return "Belediyelerin ücretsiz kültür-sanat etkinliklerini ve ücretsiz müze günlerini takip edin. Arkadaş gruplarınızla dışarıda buluşmak yerine ev ortamında tematik aktiviteler düzenleyebilirsiniz.";
  }
  if (
    norm.includes("sağlık") ||
    norm.includes("ilaç") ||
    norm.includes("hastane") ||
    norm.includes("doktor") ||
    norm.includes("eczane") ||
    icon === "💊"
  ) {
    return "Koruyucu sağlık önlemlerine (düzenli spor, dengeli beslenme) yatırım yaparak uzun vadeli tedavi masraflarını önleyin. İlaç alımlarında devlet katkı payları ve muadil ilaç seçeneklerini sorun.";
  }
  if (
    norm.includes("eğitim") ||
    norm.includes("kurs") ||
    norm.includes("kitap") ||
    norm.includes("okul") ||
    icon === "🎓"
  ) {
    return "Ücretsiz akademik kaynaklardan (Khan Academy, Coursera vb.) yararlanın. Ders kitapları ve genel okuma kitapları için kütüphaneleri veya ikinci el kitap platformlarını tercih edin.";
  }
  if (
    norm.includes("hediye") ||
    norm.includes("bağış") ||
    norm.includes("yardım") ||
    icon === "🎁" ||
    icon === "💰"
  ) {
    return "Hediyeleşmelerde satın almak yerine el yapımı alternatifleri deneyin. Özel günler için bütçenizde her ay önceden küçük bir pay ayırıp sürpriz harcamaların önüne geçin.";
  }

  return `"${name}" harcamalarınızı azaltmak için öncelikle bu kaleme ayrılan bütçeyi haftalık olarak sınırlandırın. İhtiyaç ile istek analizini yaparak sadece zorunlu harcamaları önceliklendirmek bu kategorideki yükünüzü hızla hafifletecektir.`;
};

export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  expenseCategories,
  onSaveExpense,
  onDeleteExpense,
  onSaveCategory,
  onDeleteCategory,
  onUpdateAllCategories,
}) => {
  const { format, currencySymbol } = useCurrency();
  // Saving Advice / Tip Popover State
  const [showTipCategory, setShowTipCategory] =
    useState<ExpenseCategory | null>(null);

  // Expense Dialog states
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expModalTitle, setExpModalTitle] = useState("Gider Ekle");
  const [expenseId, setExpenseId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  // AI OCR scanner state and callback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const handleScanCompleted = (result: any) => {
    setAmount(result.amount.toString());
    setDescription(result.title);
    if (result.date) {
      setDate(result.date);
    }
    // Fuzzy match suggested category
    if (result.categorySuggestion) {
      const suggested = result.categorySuggestion.toLowerCase();
      const match = expenseCategories.find(
        (c) =>
          c.name.toLowerCase().includes(suggested) ||
          suggested.includes(c.name.toLowerCase())
      );
      if (match) {
        setCategoryId(match.id);
      }
    }
    setIsScannerOpen(false);
    setIsExpModalOpen(true);
  };

  // Category Dialog states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalTitle, setCatModalTitle] = useState("Kategori Ekle");
  const [expenseCategoryId, setExpenseCategoryId] = useState<
    number | undefined
  >(undefined);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#6366f1");
  const [categoryIcon, setCategoryIcon] = useState("🛒");
  const [isInlineEditingCategory, setIsInlineEditingCategory] = useState(false);
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState<
    number | null
  >(null);

  // Track newly added expense IDs for slide-in and glow animation
  const [prevExpenseIds, setPrevExpenseIds] = useState<number[]>([]);
  const [newlyAddedIds, setNewlyAddedIds] = useState<number[]>([]);

  useEffect(() => {
    const currentIds = expenses.map((e) => e.id);
    if (prevExpenseIds.length > 0) {
      const newIds = currentIds.filter((id) => !prevExpenseIds.includes(id));
      if (newIds.length > 0) {
        setNewlyAddedIds((prev) => [...prev, ...newIds]);
        // Remove from list after 4 seconds to stop the premium glow highlights
        const timer = setTimeout(() => {
          setNewlyAddedIds((prev) => prev.filter((id) => !newIds.includes(id)));
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
    setPrevExpenseIds(currentIds);
  }, [expenses]);

  const handleOpenAddExpense = () => {
    setExpModalTitle("Gider Ekle");
    setExpenseId(undefined);
    if (expenseCategories.length > 0) setCategoryId(expenseCategories[0].id);
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setIsExpModalOpen(true);
  };

  const handleOpenEditExpense = (e: Expense) => {
    setExpModalTitle("Gider Düzenle");
    setExpenseId(e.id);
    setCategoryId(e.categoryId);
    setAmount(e.amount.toString());
    setDescription(e.description);
    setDate(
      e.date ? e.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    );
    setIsExpModalOpen(true);
  };

  const handleSaveExpense = () => {
    const parsedAmount = parseFloat(amount);
    if (!categoryId) {
      alert("Lütfen önce bir kategori seçin.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Lütfen sıfırdan büyük geçerli bir harcama tutarı girin.");
      return;
    }

    onSaveExpense({
      id: expenseId,
      categoryId,
      amount: parsedAmount,
      description: description.trim(),
      date: date || new Date().toISOString(),
    });
    setIsExpModalOpen(false);
  };

  const handleOpenAddCategory = () => {
    setCatModalTitle("Fatura/Harcama Kategorisi Ekle");
    setExpenseCategoryId(undefined);
    setCategoryName("");
    setCategoryColor("#6366f1");
    setCategoryIcon("🛒");
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (c: ExpenseCategory) => {
    setCatModalTitle("Kategori Düzenle");
    setExpenseCategoryId(c.id);
    setCategoryName(c.name);
    setCategoryColor(c.color || "#6366f1");
    setCategoryIcon(c.icon || "🛒");
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      alert("Kategori ismi boş bırakılamaz.");
      return;
    }
    onSaveCategory({
      id: expenseCategoryId,
      name: categoryName.trim(),
      color: categoryColor,
      icon: categoryIcon,
    });
    setIsCatModalOpen(false);
  };

  const handleRandomizeColors = () => {
    try {
      if (!onUpdateAllCategories) {
        console.warn(
          "onUpdateAllCategories prop is missing in ExpensesList! Fallback to local array alert.",
        );
        return;
      }
      const palette = [
        "#ef4444",
        "#f97316",
        "#f59e0b",
        "#10b981",
        "#059669",
        "#14b8a6",
        "#06b6d4",
        "#0ea5e9",
        "#3b82f6",
        "#6366f1",
        "#8b5cf6",
        "#a855f7",
        "#d946ef",
        "#ec4899",
        "#f43f5e",
        "#84cc16",
        "#0284c7",
        "#4f46e5",
        "#b91c1c",
        "#0d9488",
      ];
      const sourceCats = expenseCategories || [];
      // Shuffle helper to assign unique colors safely
      const shuffled = [...palette].sort(() => 0.5 - Math.random());
      const randomized = sourceCats.map((c, idx) => ({
        ...c,
        color: shuffled[idx % shuffled.length],
      }));
      onUpdateAllCategories(randomized);
    } catch (err) {
      console.error("Failed to randomize colors:", err);
    }
  };

  // Drag and drop states for category badges
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (
      draggedIndex === null ||
      draggedIndex === targetIndex ||
      !onUpdateAllCategories
    )
      return;

    const reorderedCategories = [...expenseCategories];
    const [removed] = reorderedCategories.splice(draggedIndex, 1);
    reorderedCategories.splice(targetIndex, 0, removed);

    onUpdateAllCategories(reorderedCategories);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Grouping category totals for the visual stats
  const categoryTotals: Record<number, number> = {};
  expenseCategories.forEach((cat) => (categoryTotals[cat.id] = 0));
  expenses.forEach((e) => {
    if (categoryTotals[e.categoryId] !== undefined) {
      categoryTotals[e.categoryId] += e.amount;
    } else {
      categoryTotals[e.categoryId] = e.amount;
    }
  });

  const colors = [
    "#ef4444",
    "#f59e0b",
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
  ];
  const doughnutData = expenseCategories
    .map((c, idx) => ({
      label: c.name,
      value: categoryTotals[c.id] || 0,
      color: c.color || colors[idx % colors.length],
    }))
    .filter((item) => item.value > 0);

  // Giderlerin aylara göre nasıl değiştiğini gösteren son 6 aylık çubuk grafik verisi
  const last6MonthsData: { label: string; value: number; color: string }[] = [];
  const currentDate = new Date();
  const monthsList = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1,
    );
    const year = d.getFullYear();
    const monthIndex = d.getMonth();

    const monthlySum = expenses
      .filter((e) => {
        const eDate = new Date(e.date);
        return eDate.getFullYear() === year && eDate.getMonth() === monthIndex;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    last6MonthsData.push({
      label: `${monthsList[monthIndex]} ${year}`,
      value: monthlySum,
      color: "#ec4899", // Pembe/rose renk tonu
    });
  }

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  const categoryCurrentMonthTotals: Record<number, number> = {};
  expenseCategories.forEach((cat) => {
    categoryCurrentMonthTotals[cat.id] = expenses
      .filter((e) => {
        if (!e.date) return false;
        const eDate = new Date(e.date);
        return (
          eDate.getFullYear() === currentYear &&
          eDate.getMonth() === currentMonthIndex &&
          e.categoryId === cat.id
        );
      })
      .reduce((sum, item) => sum + item.amount, 0);
  });

  // Calculate current month's overall expenses total and load budget goal from local storage
  const currentMonthExpensesTotal = expenses
    .filter((e) => {
      if (!e.date) return false;
      const eDate = new Date(e.date);
      return (
        eDate.getFullYear() === currentYear &&
        eDate.getMonth() === currentMonthIndex
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const budgetGoal = (() => {
    const email = localStorage.getItem("currentUser") || "anonymous";
    const saved = localStorage.getItem(`budget_goal_${email}`);
    return saved ? parseFloat(saved) : 10000;
  })();

  const selectedFilterCategory = expenseCategories.find(
    (c) => c.id === selectedFilterCategoryId,
  );
  const selectedCategoryTotal = selectedFilterCategoryId
    ? expenses
        .filter((e) => e.categoryId === selectedFilterCategoryId)
        .reduce((sum, e) => sum + e.amount, 0)
    : totalExpenses;

  const selectedCategoryCount = selectedFilterCategoryId
    ? expenses.filter((e) => e.categoryId === selectedFilterCategoryId).length
    : expenses.length;

  const percentageOfTotal =
    totalExpenses > 0
      ? ((selectedCategoryTotal / totalExpenses) * 100).toFixed(1)
      : "0.0";

  const filteredExpenses = selectedFilterCategoryId
    ? expenses.filter((e) => e.categoryId === selectedFilterCategoryId)
    : expenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <ShoppingCart className="w-5 h-5 text-rose-500" /> AYLIK HARCAMA
          GİDERLERİ
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddCategory}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Folder className="w-4 h-4 text-slate-400" /> Kategori Ekle
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" /> AI ile Fiş Tara
          </button>
          <button
            onClick={handleOpenAddExpense}
            className="px-3.5 py-1.5 bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Gider Ekle
          </button>
        </div>
      </div>

      <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-300 rounded-2xl flex items-center justify-between font-bold text-xs">
        <span>Aylık Toplam Gider Masrafı:</span>
        <span className="text-base text-rose-600 dark:text-rose-400 font-mono">
          {format(totalExpenses)}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Listing */}
        <div className="space-y-4 shadow-sm rounded-2xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <ClipboardList className="w-4 h-4 text-rose-500" /> HARCAMA
                KAYITLARI
              </h4>
              <select
                value={selectedFilterCategoryId || ""}
                onChange={(e) =>
                  setSelectedFilterCategoryId(
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2.5 py-1 text-slate-700 dark:text-slate-200 font-semibold outline-none focus:ring-1 focus:ring-rose-500/30 transition-all cursor-pointer max-w-[150px] shadow-sm shrink-0"
              >
                <option value="">Tüm Kategoriler</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || "🛒"} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seçili Kategori Toplamı Bilgi Kartı */}
            <motion.div
              layout
              className="p-4 rounded-2xl border transition-all duration-500 overflow-hidden relative shadow-sm"
              style={{
                borderColor: selectedFilterCategory
                  ? `${selectedFilterCategory.color}60`
                  : "rgba(99, 102, 241, 0.45)",
                background: selectedFilterCategory
                  ? `linear-gradient(135deg, ${selectedFilterCategory.color}15, ${selectedFilterCategory.color}25)`
                  : "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(244, 63, 94, 0.12))",
              }}
            >
              {/* Decorative dynamic ambient glow corner */}
              <div
                className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-15 dark:opacity-25 transition-all duration-500 animate-pulse"
                style={{
                  backgroundColor: selectedFilterCategory
                    ? selectedFilterCategory.color
                    : "#6366f1",
                }}
              />

              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase block">
                    SEÇİLİ KATEGORİ TOPLAMI
                  </span>
                  <div className="flex items-center gap-1.5">
                    {selectedFilterCategory && (
                      <span
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{
                          backgroundColor: selectedFilterCategory.color,
                        }}
                      />
                    )}
                    <h5 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 transition-all duration-300">
                      {selectedFilterCategory
                        ? `${selectedFilterCategory.icon || "🛒"} ${selectedFilterCategory.name}`
                        : "Tüm Kategoriler"}
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 pt-0.5">
                    <span>{selectedCategoryCount} işlem kaydı</span>
                    <span>•</span>
                    <span className="font-bold text-rose-500 dark:text-rose-400">
                      Toplamın %{percentageOfTotal}'i
                    </span>
                  </p>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 block uppercase">
                    Tutar
                  </span>
                  <motion.div
                    key={selectedCategoryTotal}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-base sm:text-lg font-black font-mono transition-all duration-300"
                    style={{
                      color: selectedFilterCategory
                        ? selectedFilterCategory.color
                        : "#e11d48",
                    }}
                  >
                    {format(selectedCategoryTotal)}
                  </motion.div>
                </div>
              </div>

              {/* Mini visual indicator bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageOfTotal}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: selectedFilterCategory
                      ? selectedFilterCategory.color
                      : "#e11d48",
                  }}
                />
              </div>
            </motion.div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-4">
                Bu kategoride henüz bir gider harcaması kaydedilmemiş.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {filteredExpenses.map((e) => {
                  const cat = expenseCategories.find(
                    (c) => c.id === e.categoryId,
                  );
                  const isNew = newlyAddedIds.includes(e.id);
                  return (
                    <motion.div
                      key={e.id}
                      layout
                      initial={isNew ? { opacity: 0, y: 30 } : {}}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        isNew
                          ? { duration: 0.5, ease: "easeOut" }
                          : { type: "spring", stiffness: 350, damping: 25 }
                      }
                      className={`relative overflow-hidden p-3 bg-white dark:bg-slate-800 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                        isNew
                          ? "ring-2 ring-rose-500/50 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.3)] dark:shadow-[0_0_25px_rgba(244,63,94,0.2)]"
                          : "border-slate-100 dark:border-slate-700/50 shadow-sm"
                      }`}
                    >
                      {/* Premium Shimmering Shine Parıltı Effect */}
                      {isNew && (
                        <motion.div
                          initial={{ left: "-100%" }}
                          animate={{ left: "100%" }}
                          transition={{
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 1.6,
                            ease: "linear",
                          }}
                          className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-rose-500/15 to-transparent pointer-events-none transform -skew-x-12"
                        />
                      )}

                      {/* Sub-bar indicator for newly highlighted item */}
                      {isNew && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 animate-pulse" />
                      )}

                      <div className="space-y-1 relative z-10">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase transition-all duration-500 ease-in-out font-sans shrink-0"
                            style={{
                              backgroundColor: `${cat?.color || "#ec4899"}15`,
                              color: cat?.color || "#ec4899",
                            }}
                          >
                            {cat
                              ? `${cat.icon || "🛒"} ${cat.name}`
                              : "Kategorisiz"}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {e.description || "Harcama açıklaması girmediniz"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5 font-semibold">
                          <Calendar className="w-3 h-3" />{" "}
                          {new Date(e.date).toLocaleDateString("tr-TR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 relative z-10">
                        <span className="font-extrabold text-sm text-rose-500 font-mono">
                          {format(e.amount)}
                        </span>
                        <div className="flex items-center">
                          <button
                            onClick={() => handleOpenEditExpense(e)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(e.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categories Management Panel */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                KATEGORİLERİ DÜZENLE
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRandomizeColors();
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-[10px] font-extrabold rounded-lg border border-rose-200/50 dark:border-rose-900/30 shadow-xs transition-all duration-150 flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
                  title="Renk Paletini Rastgele Düzenle"
                >
                  ✨ Renk Paletini Yenile
                </button>
              </div>
            </div>
            <div
              id="expenses-category-list-container"
              className="flex flex-col gap-3 animate-fade-in bg-slate-100/40 dark:bg-slate-900/40 p-3 sm:p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-inner w-full"
            >
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 select-none">
                <div className="flex items-center gap-3">
                  <span>
                    Tanımlı Kategori Sayısı:{" "}
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                      {expenseCategories.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const config = expenseCategories.map(
                        ({ name, color }) => ({ name, color }),
                      );
                      const blob = new Blob([JSON.stringify(config, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "kategori_ayarlari.json";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Kategori konfigürasyonunu (isimler ve renkler) JSON dosyası olarak dışa aktar"
                  >
                    <span>📥 JSON DIŞA AKTAR</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setIsInlineEditingCategory(!isInlineEditingCategory)
                  }
                  className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-medium uppercase transition-all duration-300 flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    isInlineEditingCategory
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 animate-pulse"
                      : "bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/25"
                  }`}
                >
                  {isInlineEditingCategory ? (
                    <>
                      <Check className="w-3 h-3" /> Düzenlemeyi Bitir
                    </>
                  ) : (
                    <>
                      <Edit className="w-3 h-3" /> Hızlı Düzenleme Modu
                    </>
                  )}
                </button>
              </div>

              {/* Bütçe Limit Uyarısı (Dikkat Bandı) */}
              {budgetGoal > 0 &&
                currentMonthExpensesTotal >= budgetGoal * 0.9 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full p-4 rounded-2xl bg-gradient-to-tr from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/25 dark:border-rose-500/15 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-xs mb-1 text-left"
                  >
                    <div className="p-2 bg-rose-500/15 rounded-xl text-rose-600 animate-pulse mt-0.5">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-black tracking-wider uppercase font-sans text-rose-700 dark:text-rose-400">
                        🚨 BÜTÇE SINIRI / DİKKAT!
                      </p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                        Mevcut ayın bütçe hedefinin (
                        <span className="font-mono font-black">
                          {format(budgetGoal)}
                        </span>
                        ){" "}
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                          %90'ını
                        </span>{" "}
                        geçtiniz! Toplam aylık harcama:{" "}
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                          {format(currentMonthExpensesTotal)}
                        </span>{" "}
                        (Hedefe Oranı:{" "}
                        <span className="font-mono font-black">
                          %
                          {(
                            (currentMonthExpensesTotal / budgetGoal) *
                            100
                          ).toFixed(1)}
                        </span>
                        ). Bütçenizi kontrol altında tutmanızı öneririz.
                      </p>
                    </div>
                  </motion.div>
                )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full">
                {expenseCategories.map((c, idx) => {
                  const isDragged = draggedIndex === idx;
                  const isOver = dragOverIndex === idx;
                  const currentMonthTotal =
                    categoryCurrentMonthTotals[c.id] || 0;
                  const isSelected = selectedFilterCategoryId === c.id;
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                      draggable={
                        !isInlineEditingCategory && !!onUpdateAllCategories
                      }
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragLeave={() => {
                        if (dragOverIndex === idx) setDragOverIndex(null);
                      }}
                      onClick={() => {
                        if (!isInlineEditingCategory) {
                          setSelectedFilterCategoryId(isSelected ? null : c.id);
                        }
                      }}
                      whileHover={undefined}
                      whileTap={isInlineEditingCategory ? {} : { scale: 0.98 }}
                      className={`relative group flex items-center justify-between gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 border-l-[4px] rounded-xl text-xs font-semibold select-none category-card-animated ${
                        isSelected
                          ? "shadow-md ring-2 ring-indigo-500/30 dark:ring-indigo-400/20 font-bold"
                          : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60"
                      } ${
                        isInlineEditingCategory
                          ? "shadow-md ring-1 ring-indigo-500/10 inline-editing"
                          : "cursor-pointer"
                      } ${
                        isDragged
                          ? "opacity-30 border-dashed border-indigo-400 bg-indigo-50/10 scale-95"
                          : ""
                      } ${
                        isOver && !isDragged
                          ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105"
                          : ""
                      }`}
                      style={{
                        "--cat-color": c.color || "#6366f1",
                        "--cat-bg": isSelected
                          ? `${c.color || "#6366f1"}25`
                          : isDragged
                            ? "transparent"
                            : `${c.color || "#6366f1"}04`,
                        "--cat-bg-hover": isSelected
                          ? `${c.color || "#6366f1"}35`
                          : `${c.color || "#6366f1"}12`,
                        borderLeftColor: "var(--cat-color)",
                        borderTopColor: isSelected ? "var(--cat-color)" : undefined,
                        borderRightColor: isSelected ? "var(--cat-color)" : undefined,
                        borderBottomColor: isSelected ? "var(--cat-color)" : undefined,
                      } as React.CSSProperties}
                      title={
                        isInlineEditingCategory
                          ? "Kategeri ismini veya rengini doğrudan değiştirin"
                          : "Giderleri filtrelemek için tıklayın | Sürükleyip bırakarak öncelik sırasını değiştirin"
                      }
                    >
                      {/* Hover Tooltip - Monthly Category Total (only when not inline editing to save space) */}
                      {!isInlineEditingCategory && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950/95 dark:bg-slate-900/95 text-white text-[10.5px] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-2xl border border-indigo-500/15 flex flex-col items-center gap-0.5 animate-fade-in-fast">
                          <span className="text-slate-400 text-[8px] tracking-widest font-black uppercase">
                            Bu Ayın Toplamı
                          </span>
                          <span className="text-emerald-400 font-black text-xs font-mono">
                            {format(currentMonthTotal)}
                          </span>
                          <div className="w-2 h-2 bg-slate-950 dark:bg-slate-900 rotate-45 border-r border-b border-indigo-500/15 -mb-3 mt-1" />
                        </div>
                      )}

                      {isInlineEditingCategory ? (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span
                            className="text-sm select-none shrink-0"
                            title="Kategori simgesi"
                          >
                            {c.icon || "🛒"}
                          </span>
                          {/* Premium Custom Inline Color Picker Dot */}
                          <div className="relative w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <input
                              type="color"
                              value={c.color || "#6366f1"}
                              onChange={(e) => {
                                onSaveCategory({ ...c, color: e.target.value });
                              }}
                              className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0 m-0 border-0 opacity-100"
                            />
                          </div>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              onSaveCategory({ ...c, name: e.target.value });
                            }}
                            className="px-2 py-1 max-w-[90px] xs:max-w-[120px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                            placeholder="Kategori Adı"
                          />
                          <button
                            onClick={() => onDeleteCategory(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition shrink-0"
                            title="Kategoriyi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full inline-block shrink-0 transition-all duration-500 ease-in-out"
                              style={{ backgroundColor: c.color || "#6366f1" }}
                            />
                            <span
                              className="text-sm select-none shrink-0"
                              title={`${c.name} simgesi`}
                            >
                              {c.icon || "🛒"}
                            </span>
                            <span
                              className={`truncate text-xs font-bold leading-none ${isSelected ? "text-indigo-950 dark:text-indigo-250" : "text-slate-705 dark:text-slate-250"}`}
                              title={c.name}
                            >
                              {c.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold transition-all shrink-0 select-none ${
                                isSelected
                                  ? "bg-indigo-600 text-white dark:bg-indigo-500/50"
                                  : "text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-slate-900/60 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500/30"
                              }`}
                              title={`${c.name} bu ayki toplam harcaması`}
                            >
                              {format(currentMonthTotal)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTipCategory(
                                  showTipCategory?.id === c.id ? null : c,
                                );
                              }}
                              className={`p-1 rounded-lg transition shrink-0 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 ${
                                showTipCategory?.id === c.id
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 scale-110"
                                  : "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              }`}
                              title={`${c.name} için Tasarruf İpucu`}
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditCategory(c);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition shrink-0 ml-1"
                              title="Düzenle"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory(c.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-55 dark:hover:bg-rose-950/20 rounded-lg transition shrink-0"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Selected Category Saving Tip Banner (AI-powered Advice) */}
              {(() => {
                const selectedCat = expenseCategories.find(
                  (c) => c.id === selectedFilterCategoryId,
                );
                if (!selectedCat) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/40 dark:border-amber-900/40 rounded-2xl flex items-start gap-3 shadow-xs text-left"
                  >
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 shrink-0 select-none text-base">
                      💡
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h5 className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                          {selectedCat.icon || "🔑"} {selectedCat.name} Tasarruf
                          İpucu
                        </h5>
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 text-[8px] font-black tracking-widest rounded-md uppercase">
                          🤖 YAPAY ZEKA TAVSİYESİ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                        {getSavingTipForCategory(
                          selectedCat.name,
                          selectedCat.icon || "🛒",
                        )}
                      </p>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Side: Charts */}
        <div className="space-y-6">
          {/* Doughnut Chart */}
          {doughnutData.length > 0 ? (
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide text-center">
                Gider Dağılım Grafiği
              </h4>
              <DoughnutChart data={doughnutData} />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              Gider dağılım grafiği için harcama kaydı girilmelidir.
            </div>
          )}

          {/* Monthly Expense Bar Chart */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-rose-500" /> Aylık Harcama
              Değişim Analizi
            </h4>
            <div className="pt-2">
              <BarChart data={last6MonthsData} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              * Son 6 aya ait harcamalarınızın aylık toplam değişim trendini
              gösterir.
            </p>
          </div>
        </div>
      </div>

      {/* Expense Add/Edit Modal Dial */}
      {isExpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h4 className="text-base font-bold flex items-center gap-1.5 border-b pb-2 dark:border-slate-700">
              <ShoppingCart className="w-5 h-5 text-rose-500" /> {expModalTitle}
            </h4>

            {/* Quick scanning action */}
            <button
              onClick={() => {
                setIsExpModalOpen(false); // Close to avoid overlay collision
                setTimeout(() => setIsScannerOpen(true), 150);
              }}
              className="w-full py-2 sm:py-2.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-dashed border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse animate-duration-1000" /> Fiş Fotoğrafı ile Otomatik Doldur
            </button>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  KATEGORİ SEÇİN
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || "🛒"} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  HARCAMA TUTARI
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₺350"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  HARCAMA AÇIKLAMASI
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Market faturası, yakıt vb."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  HARCAMA TARİHİ
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsExpModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleSaveExpense}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Add/Edit Modal Dial */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h4 className="text-base font-bold flex items-center gap-1.5 border-b pb-2 dark:border-slate-700">
              <Folder className="w-5 h-5 text-indigo-500" /> {catModalTitle}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  KATEGORİ ADI
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Kira, faturalar, eğlence vb."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  KATEGORİ RENGİ
                </label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                  <div className="relative w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center cursor-pointer shadow-inner hover:scale-105 active:scale-95 transition-all">
                    <input
                      type="color"
                      value={categoryColor}
                      onChange={(e) => setCategoryColor(e.target.value)}
                      className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0 m-0 border-0 opacity-100"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 font-mono tracking-wider uppercase">
                      Seçilen Renk Kodu
                    </span>
                    <input
                      type="text"
                      maxLength={7}
                      value={categoryColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("#") && val.length <= 7) {
                          setCategoryColor(val);
                        } else if (!val.startsWith("#") && val.length <= 6) {
                          setCategoryColor("#" + val);
                        }
                      }}
                      className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  KATEGORİ SİMGESİ
                </label>
                <div className="grid grid-cols-6 gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 max-h-32 overflow-y-auto">
                  {[
                    "🛒",
                    "🏠",
                    "🚗",
                    "🍔",
                    "⚡",
                    "🎒",
                    "💊",
                    "🍿",
                    "✈️",
                    "🎓",
                    "🧸",
                    "💼",
                    "💰",
                    "🎁",
                    "🐾",
                    "💇",
                    "⚽",
                    "🔧",
                    "❓",
                    "🥩",
                    "🍷",
                    "📱",
                    "💻",
                    "🎸",
                  ].map((emoji) => {
                    const isSelected = categoryIcon === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCategoryIcon(emoji)}
                        className={`text-lg p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center hover:scale-110 ${
                          isSelected
                            ? "bg-indigo-500/20 border-2 border-indigo-500 scale-105"
                            : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:bg-indigo-50 dark:hover:bg-slate-755"
                        }`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleSaveCategory}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Yapay Zeka Tasarruf İpucu Popover Kutucuğu */}
      {showTipCategory && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowTipCategory(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-amber-200/40 dark:border-amber-900/40 text-left"
          >
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-xl">
                  <span className="text-xl select-none leading-none inline-block">
                    {showTipCategory.icon || "💡"}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    {showTipCategory.name} Tasarruf İpucu
                  </h4>
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold tracking-wider uppercase">
                    Yapay Zeka Bütçe Önerisi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTipCategory(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-amber-50/55 dark:bg-amber-950/20 border-l-[3px] border-amber-500 rounded-2xl space-y-2">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">
                    Bütçe Asistanı Tavsiyesi
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                  {getSavingTipForCategory(
                    showTipCategory.name,
                    showTipCategory.icon || "🛒",
                  )}
                </p>
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-normal italic text-center">
                🤖 Analiz motorumuz bu tavsiyeyi kategori profiline özel
                üretmiştir.
              </p>
            </div>

            <button
              onClick={() => setShowTipCategory(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Anladım, Kapat
            </button>
          </motion.div>
        </div>
      )}

      {isScannerOpen && (
        <ReceiptScanner
          onScanCompleted={handleScanCompleted}
          onClose={() => setIsScannerOpen(false)}
          defaultType="expense"
        />
      )}
    </div>
  );
};
