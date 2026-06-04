/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlusCircle, Printer, FileText, CheckCircle2, Circle, AlertCircle, Edit, Trash2, Calendar, ClipboardList, ArrowUpDown, Sparkles, Camera } from "lucide-react";
import { Debt, InstallmentDebt } from "../types";
import { useCurrency } from "../utils/CurrencyContext";
import { DoughnutChart, BarChart } from "./BudgetCharts";
import { AdMobBanner } from "./AdMobBanner";
import ReceiptScanner from "./ReceiptScanner";
import { DebtTimelineChart } from "./DebtTimelineChart";

interface DebtListProps {
  debts: Debt[];
  totalIncome?: number;
  onSaveDebt: (debt: Partial<Debt>, createAlarm?: boolean) => void;
  onDeleteDebt: (id: number) => void;
  onToggleDebtPaid: (id: number) => void;
  onAddAlarm: (title: string, date: string) => void;
  themeColor: string;
  onSaveInstallment?: (installment: Partial<InstallmentDebt>) => void;
  installmentDebts?: InstallmentDebt[];
  isPremium?: boolean;
  onUpgradeClick?: () => void;

  // Selected period control props
  selectedMonth: number | null;
  selectedYear: number | null;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedYear: React.Dispatch<React.SetStateAction<number | null>>;
  stats?: any;
}

export const DebtList: React.FC<DebtListProps> = ({
  debts,
  totalIncome = 0,
  onSaveDebt,
  onDeleteDebt,
  onToggleDebtPaid,
  onAddAlarm,
  themeColor,
  onSaveInstallment,
  installmentDebts = [],
  isPremium = false,
  onUpgradeClick,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  stats,
}) => {
  const { format, currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<"unpaid" | "paid" | "all">("unpaid");
  const [sortBy, setSortBy] = useState<"none" | "amount_desc" | "amount_asc" | "due_date_asc" | "due_date_desc">("none");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortBy]);
  
  // Edit & Add Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Yeni Borç Ekle");
  const [debtId, setDebtId] = useState<number | undefined>(undefined);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [category, setCategory] = useState("Diğer");
  const [dueDate, setDueDate] = useState("");
  const [createAlarm, setCreateAlarm] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("12");

  // AI OCR scanner state and callback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const handleScanCompleted = (result: any) => {
    setName(result.title);
    setAmount(result.amount.toString());
    setPaid("0");
    if (result.date) {
      setDueDate(result.date);
    }
    // Suggest category
    if (result.categorySuggestion) {
      const suggested = result.categorySuggestion.toLowerCase();
      const match = ["Kredi Kartı", "Konut", "Araç", "Sağlık", "Eğitim", "Diğer"].find(
        (c) =>
          c.toLowerCase().includes(suggested) ||
          suggested.includes(c.toLowerCase())
      );
      if (match) {
        setCategory(match);
      } else {
        setCategory("Diğer");
      }
    }
    setIsScannerOpen(false);
    setIsModalOpen(true);
  };

  const categories = ["Kredi Kartı", "Konut", "Araç", "Sağlık", "Eğitim", "Diğer"];

  // Choose recommended strategy based on financial parameters
  // Combine both simple debts and remaining installments to ensure all outstanding obligations are computed
  const activeUnpaidSingleDebts = debts.filter(d => d.paid < d.amount);
  const activeUnpaidInstallmentDebts = installmentDebts.filter(
    inst => inst.paidInstallmentCount < inst.installmentCount
  );

  const unifiedUnpaidDebts = [
    ...activeUnpaidSingleDebts.map(d => ({
      id: d.id,
      name: d.name,
      type: "direct" as const,
      remaining: d.amount - d.paid,
      total: d.amount,
      paid: d.paid
    })),
    ...activeUnpaidInstallmentDebts.map(inst => {
      const monthly = inst.totalAmount / inst.installmentCount;
      const paidValue = inst.paidInstallmentCount * monthly;
      const remainingTotal = inst.totalAmount - paidValue;
      return {
        id: inst.id,
        name: `${inst.name} (Taksitli)`,
        type: "installment" as const,
        remaining: remainingTotal,
        total: inst.totalAmount,
        paid: paidValue
      };
    })
  ];

  const totalRemainingDebt = unifiedUnpaidDebts.reduce((sum, ud) => sum + ud.remaining, 0);
  const incomeVal = totalIncome || 0;
  
  const debtToIncomeRatio = incomeVal > 0 ? totalRemainingDebt / incomeVal : 0;
  const hasSmallDebts = unifiedUnpaidDebts.some(ud => ud.remaining < 2000);
  const recommendedStrategy = (debtToIncomeRatio > 3 || !hasSmallDebts) ? "avalanche" : "snowball";

  const [activeStrategyView, setActiveStrategyView] = useState<"snowball" | "avalanche" | null>(null);
  const currentStrategyView = activeStrategyView || recommendedStrategy;

  const smallestDebt = unifiedUnpaidDebts.length > 0 
    ? [...unifiedUnpaidDebts].sort((a,b) => a.remaining - b.remaining)[0] 
    : null;
  const largestDebt = unifiedUnpaidDebts.length > 0
    ? [...unifiedUnpaidDebts].sort((a,b) => b.remaining - a.remaining)[0]
    : null;

  const filteredDebts = [...debts]
    .filter((d) => {
      // 1. Tab filter
      if (activeTab === "unpaid" && d.paid >= d.amount) return false;
      if (activeTab === "paid" && d.paid < d.amount) return false;

      // 2. Period filter
      if (selectedMonth !== null && selectedYear !== null) {
        if (!d.dueDate) return false;
        try {
          const dDate = new Date(d.dueDate);
          const dMonth = dDate.getMonth();
          const dYear = dDate.getFullYear();
          
          if (dMonth === selectedMonth && dYear === selectedYear) {
            return true;
          }
          
          const selectedTime = selectedYear * 12 + selectedMonth;
          const dueTime = dYear * 12 + dMonth;
          const isUnpaid = d.paid < d.amount;
          return selectedTime > dueTime && isUnpaid;
        } catch {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "amount_desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount_asc") {
        return a.amount - b.amount;
      }
      if (sortBy === "due_date_asc") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "due_date_desc") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      return 0;
    });

  // Helpers for formatting numbers with dots (e.g., 100.000.000)
  const formatNumberWithDots = (val: string): string => {
    // Strip everything except digits
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumberFromDots = (val: string): number => {
    const cleaned = val.replace(/\./g, "");
    return parseFloat(cleaned) || 0;
  };

  // Selected period calculations
  const selectedYearVal = selectedYear !== null ? selectedYear : new Date().getFullYear();
  const selectedMonthVal = selectedMonth !== null ? selectedMonth : new Date().getMonth();

  const debtsInPeriod = debts.filter((d) => {
    if (selectedMonth === null || selectedYear === null) return true;
    if (!d.dueDate) return false;
    try {
      const dDate = new Date(d.dueDate);
      return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    } catch { return false; }
  });

  const installmentsInPeriod = installmentDebts.map((inst) => {
    const perMonth = inst.totalAmount / (inst.installmentCount || 1);
    if (selectedMonth === null || selectedYear === null) {
      return {
        due: inst.totalAmount,
        paid: inst.paidInstallmentCount * perMonth,
      };
    }
    const startDate = new Date(inst.firstDueDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const monthDiffCalc = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);
    const isCurrentlyActive = monthDiffCalc >= 0 && monthDiffCalc < inst.installmentCount;
    const isCurrentlyPaid = inst.paidInstallmentCount > monthDiffCalc;
    return {
      due: isCurrentlyActive ? perMonth : 0,
      paid: (isCurrentlyActive && isCurrentlyPaid) ? perMonth : 0,
    };
  });

  // Monthly filtered stats (used as fallback or extra if needed)
  const totalAmount = debtsInPeriod.reduce((sum, d) => sum + d.amount, 0) + 
    installmentsInPeriod.reduce((sum, item) => sum + item.due, 0);

  const totalPaid = debtsInPeriod.reduce((sum, d) => sum + d.paid, 0) + 
    installmentsInPeriod.reduce((sum, item) => sum + item.paid, 0);

  const totalRemaining = totalAmount - totalPaid;

  // True lifetime overall aggregates (un-filtered by period, representing actual total debt burden including contact-based payables)
  const currentUserLocal = localStorage.getItem("currentUser") || "anonymous";
  const spaceKeyLocal = currentUserLocal !== "anonymous" ? `user_${currentUserLocal}` : "user_anonymous";
  const savedContactTxsStrLocal = localStorage.getItem(`${spaceKeyLocal}_contacts_transactions`);
  let contactPayablesTotalLocal = 0;
  let contactPayablesPaidLocal = 0;
  if (savedContactTxsStrLocal) {
    try {
      const txs = JSON.parse(savedContactTxsStrLocal);
      if (Array.isArray(txs)) {
        txs.forEach((t: any) => {
          if (t.type === "payable") {
            const amt = Number(t.amount) || 0;
            contactPayablesTotalLocal += amt;
            if (t.isPaid) {
              contactPayablesPaidLocal += amt;
            }
          }
        });
      }
    } catch (e) {
      console.error("Error loading contact transactions in DebtList:", e);
    }
  }

  const allTimeTotalAmount = debts.reduce((sum, d) => sum + d.amount, 0) + 
    installmentDebts.reduce((sum, inst) => sum + inst.totalAmount, 0) +
    contactPayablesTotalLocal;

  const allTimeTotalPaid = debts.reduce((sum, d) => sum + d.paid, 0) + 
    installmentDebts.reduce((sum, inst) => sum + (inst.paidInstallmentCount * (inst.totalAmount / (inst.installmentCount || 1))), 0) +
    contactPayablesPaidLocal;

  const allTimeRemaining = allTimeTotalAmount - allTimeTotalPaid;

  const simpleDebtsDueThisMonth = debts.filter(d => {
    if (!d.dueDate) return false;
    try {
      const dDate = new Date(d.dueDate);
      const dMonth = dDate.getMonth();
      const dYear = dDate.getFullYear();
      
      const isUnpaid = d.paid < d.amount;
      const isDueThisMonth = dYear === selectedYearVal && dMonth === selectedMonthVal;
      
      const selectedTime = selectedYearVal * 12 + selectedMonthVal;
      const dueTime = dYear * 12 + dMonth;
      const isOverdue = selectedTime > dueTime && isUnpaid;
      
      return isDueThisMonth || isOverdue;
    } catch { return false; }
  });
  const simpleDueThisMonthAmount = simpleDebtsDueThisMonth.reduce((sum, d) => sum + (d.amount - d.paid), 0);

  const installmentsDueThisMonthAmount = installmentDebts.reduce((sum, inst) => {
    const startDate = new Date(inst.firstDueDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const monthDiff = (selectedYearVal - startYear) * 12 + (selectedMonthVal - startMonth);
    const isActiveThisMonth = monthDiff >= 0 && monthDiff < inst.installmentCount;
    const isPaidThisMonth = inst.paidInstallmentCount > monthDiff;
    if (isActiveThisMonth && !isPaidThisMonth) {
      return sum + (inst.totalAmount / inst.installmentCount);
    }
    return sum;
  }, 0);

  let periodContactPayablesRemainingLocal = 0;
  if (savedContactTxsStrLocal) {
    try {
      const txs = JSON.parse(savedContactTxsStrLocal);
      if (Array.isArray(txs)) {
        txs.forEach((t: any) => {
          if (t.type === "payable" && !t.isPaid) {
            const amt = Number(t.amount) || 0;
            if (selectedMonthVal === null || selectedYearVal === null) {
              periodContactPayablesRemainingLocal += amt;
            } else {
              if (t.dueDate) {
                try {
                  const dDate = new Date(t.dueDate);
                  const dMonth = dDate.getMonth();
                  const dYear = dDate.getFullYear();
                  if (dYear === selectedYearVal && dMonth === selectedMonthVal) {
                    periodContactPayablesRemainingLocal += amt;
                  } else {
                    const selectedTime = selectedYearVal * 12 + selectedMonthVal;
                    const dueTime = dYear * 12 + dMonth;
                    if (selectedTime > dueTime) {
                      periodContactPayablesRemainingLocal += amt;
                    }
                  }
                } catch {
                  periodContactPayablesRemainingLocal += amt;
                }
              } else {
                periodContactPayablesRemainingLocal += amt;
              }
            }
          }
        });
      }
    } catch {}
  }

  const dueThisMonthAmount = simpleDueThisMonthAmount + installmentsDueThisMonthAmount + periodContactPayablesRemainingLocal;

  const handleOpenAdd = () => {
    setModalTitle("Yeni Borç Ekle");
    setDebtId(undefined);
    setName("");
    setAmount("");
    setPaid("0");
    setCategory("Diğer");
    setDueDate("");
    setCreateAlarm(false);
    setIsInstallment(false);
    setInstallmentCount("12");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Debt) => {
    setModalTitle("Borç Düzenle");
    setDebtId(d.id);
    setName(d.name);
    setAmount(formatNumberWithDots(d.amount.toString()));
    setPaid(formatNumberWithDots(d.paid.toString()));
    setCategory(d.category);
    setDueDate(d.dueDate || "");
    setCreateAlarm(false);
    setIsInstallment(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const parsedAmount = parseNumberFromDots(amount);
    const parsedPaid = parseNumberFromDots(paid);

    if (!name.trim()) {
      alert("Lütfen geçerli bir borç adı giriniz.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Lütfen sıfırdan büyük bir borç tutarı giriniz.");
      return;
    }
    if (parsedPaid > parsedAmount) {
      alert("Ödenen tutar, toplam borç tutarından büyük olamaz.");
      return;
    }

    if (isInstallment && debtId === undefined) {
      const count = parseInt(installmentCount) || 12;
      if (count <= 0) {
        alert("Lütfen geçerli bir taksit sayısı giriniz (en az 1).");
        return;
      }
      const perMonth = parsedAmount / count;
      const paidCount = Math.min(count, Math.round(parsedPaid / perMonth));

      if (onSaveInstallment) {
        onSaveInstallment({
          name: name.trim(),
          totalAmount: parsedAmount,
          installmentCount: count,
          paidInstallmentCount: paidCount,
          firstDueDate: dueDate || new Date().toISOString().slice(0, 10),
        });
      }
    } else {
      onSaveDebt({
        id: debtId,
        name: name.trim(),
        amount: parsedAmount,
        paid: parsedPaid,
        category,
        dueDate,
      }, false);
    }

    setIsModalOpen(false);
  };

  // Plain HTML Print & PDF trigger functions
  const handlePrint = (isPdf = false) => {
    // Bypassed premium block so everyone can use PDF exports
    const filtered = filteredDebts;
    if (filtered.length === 0) {
      alert("Yazdırılacak borç kaydı bulunamadı.");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const html = `
      <html>
        <head>
          <title>Bütçem Pro Raporu</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; font-weight: bold; }
            .total { font-weight: bold; background: #f8fafc; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #64748b; }
          </style>
        </head>
        <body>
          <h2>📄 Borç Durum Raporu (${activeTab === "unpaid" ? "Ödenmemiş" : activeTab === "paid" ? "Ödenmiş" : "Tümü"})</h2>
          <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR")}</p>
          <table>
            <thead>
              <tr>
                <th>Borç Adı</th>
                <th>Kategori</th>
                <th>Son Ödeme</th>
                <th>Toplam Tutar</th>
                <th>Ödenen Tutar</th>
                <th>Kalan Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  (d) => `
                <tr>
                  <td>${d.name}</td>
                  <td>${d.category}</td>
                  <td>${d.dueDate || "Belirtilmemiş"}</td>
                  <td>${format(d.amount)}</td>
                  <td>${format(d.paid)}</td>
                  <td>${format(d.amount - d.paid)}</td>
                </tr>
              `
                )
                .join("")}
              <tr class="total">
                <td colspan="3">Toplam Genel</td>
                <td>${format(filtered.reduce((s, d) => s + d.amount, 0))}</td>
                <td>${format(filtered.reduce((s, d) => s + d.paid, 0))}</td>
                <td>${format(filtered.reduce((s, d) => s + (d.amount - d.paid), 0))}</td>
              </tr>
            </tbody>
          </table>
          <p class="footer">Bütçem Pro Finans Yönetim Sistemi | Serkan SAĞLAM | v5.0 Ultimate</p>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    
    setTimeout(() => {
      printWin.print();
    }, 300);
  };

  return (
    <div className="space-y-4">
      {/* Mini Stats and Title */}
      <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
        <motion.h2
          animate={{ y: [0, -1.2, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"
        >
          <ClipboardList className="w-5 h-5 text-indigo-500" /> BORÇ LİSTESİ
        </motion.h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrint(false)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Yazdır
          </button>
          <button
            onClick={() => handlePrint(true)}
            className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-amber-600 transition"
          >
            <FileText className="w-3.5 h-3.5" /> PDF Al
          </button>
          <button
            onClick={() => {
              setIsScannerOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-600/20 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" /> Fatura Tara (AI)
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Ekle
          </button>
        </div>
      </div>

      {/* Top Level Key Debt Aggregates Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-gradient-to-br from-indigo-500/5 to-indigo-600/[0.02] dark:from-indigo-500/10 dark:to-transparent rounded-2xl border border-indigo-100/40 dark:border-indigo-900/30 shadow-xs relative overflow-hidden">
          <div className="absolute right-3.5 top-3.5 p-1 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <ClipboardList className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest block">GENEL LİMİT TOPLAMI</span>
          <span className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">{format(stats?.totalDebt ?? allTimeTotalAmount)}</span>
          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">Tüm aktif & taksitli genel borçlar</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-amber-500/5 to-amber-600/[0.02] dark:from-amber-500/10 dark:to-transparent rounded-2xl border border-amber-100/40 dark:border-amber-900/30 shadow-xs relative overflow-hidden">
          <div className="absolute right-3.5 top-3.5 p-1 bg-amber-500/10 text-amber-500 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest block">BU AY ÖDENECEK</span>
          <span className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-550 mt-1 block">{format(stats?.thisMonthTotalBorc ?? dueThisMonthAmount)}</span>
          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">Bu ay vadesi gelen tüm taksit & borçlar</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-600/[0.02] dark:from-emerald-500/10 dark:to-transparent rounded-2xl border border-emerald-100/40 dark:border-emerald-950/30 shadow-xs relative overflow-hidden">
          <div className="absolute right-3.5 top-3.5 p-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">BU AY ÖDENEN</span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">{format(stats !== undefined ? (stats.thisMonthTotalBorc - stats.thisMonthKalanBorc) : (allTimeTotalPaid))}</span>
          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">Seçili ay kapatılan borç/taksitler</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-rose-500/5 to-rose-600/[0.02] dark:from-rose-500/10 dark:to-transparent rounded-2xl border border-rose-100/40 dark:border-rose-900/30 shadow-xs relative overflow-hidden">
          <div className="absolute right-3.5 top-3.5 p-1 bg-rose-500/10 text-rose-500 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">BU AY KALAN BORÇ</span>
          <span className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-455 mt-1 block">{format(stats?.thisMonthKalanBorc ?? dueThisMonthAmount)}</span>
          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">Bu ay ödenmesi gereken net bakiye</span>
        </div>
      </div>

      {/* Tabs list and sorting mechanism */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-700/60 shadow-sm">
        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl flex-1">
          <button
            onClick={() => setActiveTab("unpaid")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "unpaid" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            🚨 ÖDENMEMİŞ
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "paid" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            🟢 ÖDENMİŞ
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            📂 HEPSİ
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 shrink-0 self-stretch sm:self-center justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">SIRALA:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <option value="none">Varsayılan</option>
            <option value="amount_desc">En Yüksek Tutar</option>
            <option value="amount_asc">En Düşük Tutar</option>
            <option value="due_date_asc">Vade Tarihi (En Yakın Önce)</option>
            <option value="due_date_desc">Vade Tarihi (En Uzak Önce)</option>
          </select>
        </div>
      </div>

      {/* Debt Cards Listing */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-medium">
            Gösterilecek borç bulunmuyor.
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(filteredDebts.length / itemsPerPage));
            const activePage = Math.min(currentPage, totalPages);
            const startIndex = (activePage - 1) * itemsPerPage;
            const paginatedDebts = filteredDebts.slice(startIndex, startIndex + itemsPerPage);

            return (
              <>
                {paginatedDebts.map((d) => {
                  const isPaid = d.paid >= d.amount;
                  const percentage = Math.min(((d.paid / d.amount) * 100), 100);
                  const isOverdue = !isPaid && d.dueDate && (() => {
                    try {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const due = new Date(d.dueDate);
                      due.setHours(0, 0, 0, 0);
                      return due < today;
                    } catch { return false; }
                  })();
                  return (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border-l-[6px] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-300 ${
                        isPaid ? "border-l-emerald-500" : "border-l-rose-500"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center flex-wrap gap-2 text-slate-800 dark:text-slate-100">
                          <span className="font-bold text-sm">{d.name}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold rounded-full">
                            📁 {d.category}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-full border border-rose-500/30 flex items-center gap-1 animate-pulse shrink-0 uppercase tracking-tight">
                              ⚠️ Vadesi Geçmiş
                            </span>
                          )}
                          {d.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-500">
                              <Calendar className="w-3 h-3" /> SKT: {new Date(d.dueDate).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Tutar: <span className="font-bold font-mono">{format(d.amount)}</span> | Ödenen: <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{format(d.paid)}</span> | Kalan: <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{format(d.amount - d.paid)}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteDebt(d.id)}
                          className="p-2 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onToggleDebtPaid(d.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 select-none cursor-pointer transition-all duration-300 ${
                            isPaid 
                              ? "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/10" 
                              : "bg-indigo-600 text-white hover:bg-indigo-750 shadow-md shadow-indigo-600/10"
                          }`}
                        >
                          <AnimatePresence mode="wait">
                            {isPaid ? (
                              <motion.span
                                key="checked"
                                initial={{ scale: 0.4, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0.4 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="flex items-center justify-center"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="unchecked"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                className="flex items-center justify-center"
                              >
                                <Circle className="w-4 h-4" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                          <span>{isPaid ? "Ödeme Geri Al" : "Ödendi Yap"}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center flex-wrap gap-1.5 pt-4 text-xs font-bold">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={activePage === 1}
                      className="px-3 py-2 border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 cursor-pointer shadow-xs select-none"
                    >
                      ← Önceki
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer shadow-xs ${
                            activePage === pageNum
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={activePage === totalPages}
                      className="px-3 py-2 border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 cursor-pointer shadow-xs select-none"
                    >
                      Sonraki →
                    </button>
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>

      {/* Taksitli Borç Planları - Hızlı Erişim Paneli */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
              📊 Aktif Taksitli Borç Planlarınız (Hızlı Erişim)
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold rounded-full">
            {installmentDebts.length} Aktif Plan
          </span>
        </div>

        {installmentDebts.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold italic text-center py-2">
            Eklenmiş taksitli borç planı bulunmamaktadır. "Taksitli Borçlar" sekmesinden veya yukarıdaki borç ekleme penceresindeki taksit seçeneğinden yeni planlar oluşturabilirsiniz.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50 pb-2 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <th className="py-2">Borç Planı</th>
                  <th className="py-2">Toplam Borç</th>
                  <th className="py-2">Ödenen Vade</th>
                  <th className="py-2">Aylık Taksit</th>
                  <th className="py-2">Kalan Ödeme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {installmentDebts.map((inst) => {
                  const monthly = inst.totalAmount / inst.installmentCount;
                  const paidValue = inst.paidInstallmentCount * monthly;
                  const remainingValue = inst.totalAmount - paidValue;
                  const isCompleted = inst.paidInstallmentCount >= inst.installmentCount;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition duration-150">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {inst.name}
                        {isCompleted && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-black rounded-lg">ÖDENDİ</span>
                        )}
                      </td>
                      <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300 font-mono">{format(inst.totalAmount)}</td>
                      <td className="py-2.5 font-bold text-slate-600 dark:text-slate-400 font-sans">
                        {inst.paidInstallmentCount} / {inst.installmentCount} Ay
                      </td>
                      <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300 font-mono">{format(monthly)}</td>
                      <td className="py-2.5 font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {isCompleted ? "₺0" : format(remainingValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Borç Kapama Stratejisi Öneri Kutusu */}
      <div id="debt_strategy_advisor" className="p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/60 rounded-3xl border border-indigo-100/40 dark:border-indigo-900/40 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h3 className="text-xs font-black tracking-wider text-indigo-950 dark:text-indigo-200 uppercase">
              BORÇ KAPAMA REHBERİ VE STRATEJİSİ
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold rounded-full flex items-center gap-1">
            Yük/Gelir Oranı: {debtToIncomeRatio.toFixed(1)}x
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
          Kapatılması gereken toplam kalan borç miktarınız (taksitli borçların tamamı dahil): <strong className="text-slate-800 dark:text-slate-100 font-black">{format(totalRemainingDebt)}</strong> ve aylık gelir kaynağınız <strong className="text-emerald-600 dark:text-emerald-400 font-black">{format(incomeVal)}</strong>. 
          Bu finansal verilere göre bütçeniz için en uygun borç kapatma stratejisi: <span className="text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-100/30 dark:border-indigo-900/30">{recommendedStrategy === "snowball" ? "Kartopu (Snowball) Yöntemi" : "Çığ (Avalanche) Yöntemi"}</span>.
        </p>

        {/* Strategy Selection Buttons */}
        <div className="flex bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveStrategyView("snowball")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
              currentStrategyView === "snowball" 
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ❄️ Kartopu Yöntemi
            {recommendedStrategy === "snowball" && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
            )}
          </button>
          
          <button
            onClick={() => setActiveStrategyView("avalanche")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
              currentStrategyView === "avalanche" 
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ⚡ Çığ Yöntemi
            {recommendedStrategy === "avalanche" && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
            )}
          </button>
        </div>

        {/* Explanation Card */}
        <div className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100/60 dark:border-slate-800 space-y-3 shadow-xs">
          {currentStrategyView === "snowball" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1 w-full justify-between">
                <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block">PSİKOLOJİK MOTİVASYON ODAKLI</span>
                {recommendedStrategy === "snowball" && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-black rounded-lg">BİZE GÖRE EN UYGUNU</span>}
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">❄️ Kartopu (Snowball) Yöntemi Nedir?</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Borçlarınızı faizlerinden bağımsız olarak <strong>bu ay ödenecek en küçük tutardan en büyüğe</strong> doğru sıralayıp en küçüğünü hemen kapatma üzerine kurulu psikolojik odaklı yöntemdir. Küçük borçları kapatmak size zafer hissi ve motivasyon kazandırarak büyük borçları öderken dirençli olmanızı sağlar.
              </p>
              {smallestDebt ? (
                <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/10 border-l-[3px] border-indigo-500 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-black text-[10px] text-indigo-600 dark:text-indigo-400 block uppercase tracking-wide">BUGÜNKÜ AKSİYON ADAYINIZ:</span>
                  En küçük kalan bakiyeye sahip <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"{smallestDebt.name}"</strong> (kalan toplam tutar: {format(smallestDebt.remaining)}) borç kaydını öncelikli kapatarak Kartopu etkisini hemen başlatabilirsiniz!
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Planlanacak aktif ödenmemiş borç bulunmamaktadır.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1 w-full justify-between">
                <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest block">MATEMATİKSEL FAİZ OPTİMİZASYONU</span>
                {recommendedStrategy === "avalanche" && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-black rounded-lg">BİZE GÖRE EN UYGUNU</span>}
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">⚡ Çığ (Avalanche) Yöntemi Nedir?</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Borçlarınızı <strong>bu ay ödenecek en yüksek tutara</strong> sahip olanından başlayarak kapatma üzerine kurulu rasyonel, matematiksel yöntemdir. Bütçe açısından en akılcı ve finansal maliyeti en çok düşüren yoldur.
              </p>
              {largestDebt ? (
                <div className="p-3 bg-amber-500/5 dark:bg-amber-950/10 border-l-[3px] border-amber-500 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-black text-[10px] text-amber-600 dark:text-amber-400 block uppercase tracking-wide">BUGÜNKÜ AKSİYON ADAYINIZ:</span>
                  En büyük kalan bakiyeye sahip <strong className="text-amber-600 dark:text-amber-400 font-bold">"{largestDebt.name}"</strong> (kalan toplam tutar: {format(largestDebt.remaining)}) borç kaydına ekstra kaynak katarak Çığ etkisinden yararlanabilirsiniz!
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Planlanacak aktif ödenmemiş borç bulunmamaktadır.</p>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Debt Decreasing Timeline representation built via D3 */}
        <DebtTimelineChart
          debts={debts}
          installmentDebts={installmentDebts}
          strategy={currentStrategyView}
          totalIncome={totalIncome}
        />
      </div>

      {/* Debt Add/Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h4 className="text-base font-bold flex items-center gap-1.5 border-b pb-2 dark:border-slate-700">
              <AlertCircle className="w-5 h-5 text-indigo-500" /> {modalTitle}
            </h4>

            {/* Quick scanning action */}
            <button
              onClick={() => {
                setIsModalOpen(false); // Close first to prevent backdrop overlap
                setTimeout(() => setIsScannerOpen(true), 150);
              }}
              className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-dashed border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse animate-duration-1000" /> Fatura Fotoğrafı ile Otomatik Doldur
            </button>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">BORÇ TANIMI</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kredi borcu, fatura vb."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TOPLAM TUTAR</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatNumberWithDots(e.target.value))}
                    placeholder="₺5.000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ŞİMDİ ÖDENEN (İsteğe bağlı)</label>
                  <input
                    type="text"
                    value={paid}
                    onChange={(e) => setPaid(formatNumberWithDots(e.target.value))}
                    placeholder="₺0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">BORÇ KATEGORİSİ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">VADE DETAYI (SKT)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>
              {debtId === undefined && (
                <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="installment_check"
                      checked={isInstallment}
                      onChange={(e) => setIsInstallment(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <label htmlFor="installment_check" className="text-xs font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                      📊 Taksitli Olarak Kaydet (Taksitler Bölümü)
                    </label>
                  </div>
                  
                  {isInstallment && (
                    <div className="space-y-1 animate-fade-in pl-6">
                      <label className="text-[10px] font-bold text-indigo-500 block mb-1">TAKSİT SAYISI (VADE AYI)</label>
                      <input
                        type="number"
                        min="1"
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value)}
                        placeholder="Örn: 12"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-bold font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Borç Takip Sayfası Sponsorlu Reklamı - Google AdMob Banner */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 space-y-2"
        >
          <AdMobBanner unitType="banner" />
          <div className="flex justify-end pr-2">
            <button
              onClick={onUpgradeClick}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-500 hover:text-amber-600 dark:text-amber-400 text-[9px] font-black rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1 uppercase tracking-tight"
            >
              Reklamları Kaldır 💎 Bütçem Pro'ya Geç
            </button>
          </div>
        </motion.div>
      )}

      {isScannerOpen && (
        <ReceiptScanner
          onScanCompleted={handleScanCompleted}
          onClose={() => setIsScannerOpen(false)}
          defaultType="debt"
        />
      )}
    </div>
  );
};
