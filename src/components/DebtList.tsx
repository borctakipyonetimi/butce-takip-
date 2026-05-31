/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { PlusCircle, Printer, FileText, CheckCircle2, Circle, AlertCircle, Edit, Trash2, Calendar, ClipboardList, ArrowUpDown, Sparkles, Camera } from "lucide-react";
import { Debt, InstallmentDebt } from "../types";
import { useCurrency } from "../utils/CurrencyContext";
import { DoughnutChart } from "./BudgetCharts";
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
      return {
        id: inst.id,
        name: `${inst.name} (Taksitli)`,
        type: "installment" as const,
        remaining: monthly,
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
      if (activeTab === "unpaid") return d.paid < d.amount;
      if (activeTab === "paid") return d.paid >= d.amount;
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

  // Dynamically and robustly calculate true overall debt and payment aggregates for BOTH simple & installment debts
  const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0) + installmentDebts.reduce((sum, inst) => sum + inst.totalAmount, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.paid, 0) + installmentDebts.reduce((sum, inst) => sum + (inst.paidInstallmentCount * (inst.totalAmount / inst.installmentCount)), 0);
  const totalRemaining = totalAmount - totalPaid;

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
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <ClipboardList className="w-5 h-5 text-indigo-500" /> BORÇ LİSTESİ
        </h2>
        
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
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-slate-350 dark:hover:border-slate-650 transition-colors"
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
                  return (
                    <div
                      key={d.id}
                      className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border-l-[6px] border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPaid ? "border-l-emerald-500" : "border-l-rose-500"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center flex-wrap gap-2 text-slate-800 dark:text-slate-100">
                          <span className="font-bold text-sm">{d.name}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold rounded-full">
                            📁 {d.category}
                          </span>
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
                        <button
                          onClick={() => onToggleDebtPaid(d.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 ${
                            isPaid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          {isPaid ? "Ödeme Geri Al" : "Ödendi Yap"}
                        </button>
                      </div>
                    </div>
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
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/20"
                              : "border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
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
          Bu ay ödemeniz gereken toplam borç miktarı (taksitli borçların tamamı yerine sadece bu ayki taksit tutarları dahil edilmiştir): <strong className="text-slate-800 dark:text-slate-100 font-black">{format(totalRemainingDebt)}</strong> ve aylık gelir kaynağınız <strong className="text-emerald-600 dark:text-emerald-400 font-black">{format(incomeVal)}</strong>. 
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
                  Bu ayki en küçük ödemeniz olan <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"{smallestDebt.name}"</strong> ({smallestDebt.type === "installment" ? "bu ayki taksiti" : "kalan"} {format(smallestDebt.remaining)}) kaydını öncelikli kapatarak Kartopu etkisini hemen başlatabilirsiniz!
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
                  En büyük aylık borç yükünüz olan <strong className="text-amber-600 dark:text-amber-400 font-bold">"{largestDebt.name}"</strong> ({largestDebt.type === "installment" ? "bu ayki taksiti" : "kalan"} {format(largestDebt.remaining)}) kaydına asgari ödemenin üzerinde ekstra kaynak aktararak Çığ etkisinden yararlanabilirsiniz!
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

      {/* Stats Summary Panel with Doughnut Visualizer at the absolute bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700/60 shadow-xs">
        {/* Left Side: Stats Badges */}
        <div className="flex flex-col justify-center space-y-3.5">
          <h3 className="text-xs font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
            <span>📊 BORÇ DURUM ÖZETİ</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-200 rounded-2xl border border-indigo-100/10">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide font-sans">TOPLAM BORÇ</span>
              <span className="text-xs sm:text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 block truncate mt-1">{format(totalAmount)}</span>
            </div>
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 rounded-2xl border border-emerald-100/10">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide font-sans">ÖDENEN</span>
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block truncate mt-1">{format(totalPaid)}</span>
            </div>
            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 rounded-2xl border border-rose-100/10">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide font-sans">KALAN</span>
              <span className="text-xs sm:text-sm font-black font-mono text-rose-600 dark:text-rose-400 block truncate mt-1">{format(totalRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: DoughnutChart widget */}
        <div className="flex items-center justify-center p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-700/30">
          <div className="w-full max-w-xs scale-95">
            <DoughnutChart
              data={[
                { label: "Ödenen Borç", value: totalPaid, color: "#10b981" },
                { label: "Kalan Borç", value: totalRemaining, color: "#ef4444" },
              ]}
            />
          </div>
        </div>
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
