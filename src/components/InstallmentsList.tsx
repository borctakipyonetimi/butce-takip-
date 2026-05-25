/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlusCircle, CalendarDays, Wallet, Edit, Trash2, Calendar, ClipboardList } from "lucide-react";
import { InstallmentDebt } from "../types";
import { useCurrency } from "../utils/CurrencyContext";

interface InstallmentsListProps {
  installmentDebts: InstallmentDebt[];
  onSaveInstallment: (inst: Partial<InstallmentDebt>) => void;
  onDeleteInstallment: (id: number) => void;
  onPayInstallment: (id: number) => void;
}

export const InstallmentsList: React.FC<InstallmentsListProps> = ({
  installmentDebts,
  onSaveInstallment,
  onDeleteInstallment,
  onPayInstallment,
}) => {
  const { format, currencySymbol } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Yeni Taksitli Borç Planı");
  const [instId, setInstId] = useState<number | undefined>(undefined);
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [paidInstallmentCount, setPaidInstallmentCount] = useState("0");
  const [firstDueDate, setFirstDueDate] = useState("");

  const formatNumberWithDots = (val: string): string => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumberFromDots = (val: string): number => {
    const cleaned = val.replace(/\./g, "");
    return parseFloat(cleaned) || 0;
  };

  const handleOpenAdd = () => {
    setModalTitle("Yeni Taksitli Borç Planı");
    setInstId(undefined);
    setName("");
    setTotalAmount("");
    setInstallmentCount("");
    setPaidInstallmentCount("0");
    setFirstDueDate(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inst: InstallmentDebt) => {
    setModalTitle("Taksitli Borç Düzenle");
    setInstId(inst.id);
    setName(inst.name);
    setTotalAmount(formatNumberWithDots(inst.totalAmount.toString()));
    setInstallmentCount(inst.installmentCount.toString());
    setPaidInstallmentCount(inst.paidInstallmentCount.toString());
    setFirstDueDate(inst.firstDueDate ? inst.firstDueDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const parsedTotal = parseNumberFromDots(totalAmount);
    const parsedCount = parseInt(installmentCount);
    const parsedPaid = parseInt(paidInstallmentCount) || 0;

    if (!name.trim()) {
      alert("Lütfen borç planı adını belirtin.");
      return;
    }
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      alert("Lütfen toplam borç tutarını geçerli girin.");
      return;
    }
    if (isNaN(parsedCount) || parsedCount <= 0) {
      alert("Lütfen geçerli taksit sayısını belirtin.");
      return;
    }
    if (parsedPaid < 0 || parsedPaid > parsedCount) {
      alert("Ödenen taksit adedi geçerli aralıkta olmalıdır (0 ile taksit adedi arası).");
      return;
    }

    onSaveInstallment({
      id: instId,
      name: name.trim(),
      totalAmount: parsedTotal,
      installmentCount: parsedCount,
      paidInstallmentCount: parsedPaid,
      firstDueDate: firstDueDate || new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(false);
  };

  const currentMonthDue = installmentDebts.reduce((sum, inst) => {
    if (inst.paidInstallmentCount >= inst.installmentCount) return sum;
    return sum + (inst.totalAmount / inst.installmentCount);
  }, 0);

  const totalRemaining = installmentDebts.reduce((sum, inst) => {
    const single = inst.totalAmount / inst.installmentCount;
    return sum + (inst.installmentCount - inst.paidInstallmentCount) * single;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <CalendarDays className="w-5 h-5 text-indigo-500" /> TAKSİTLİ BORÇLAR
        </h2>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Taksit Planı Ekle
        </button>
      </div>

      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300 rounded-2xl grid gap-3 sm:grid-cols-2 font-bold text-xs">
        <div>💰 Toplam Kalan Taksit Borç Yükü: <span className="text-base text-rose-500 block font-mono">{format(totalRemaining)}</span></div>
        <div>🗓️ Bu Ay Ödenmesi Gereken Toplam Taksit: <span className="text-base text-indigo-600 dark:text-indigo-400 block font-mono">{format(currentMonthDue)}</span></div>
      </div>

      <div className="space-y-3">
        {installmentDebts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-medium">
            Kayıtlı aktif taksitli borç planı bulunmuyor.
          </div>
        ) : (
          installmentDebts.map((inst) => {
            const singlePayment = inst.totalAmount / inst.installmentCount;
            const remaining = (inst.installmentCount - inst.paidInstallmentCount) * singlePayment;
            const percentage = (inst.paidInstallmentCount / inst.installmentCount) * 100;
            const isCompleted = inst.paidInstallmentCount === inst.installmentCount;

            return (
              <div
                key={inst.id}
                className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/55 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted ? "border-l-[6px] border-l-emerald-500" : "border-l-[6px] border-l-amber-500"
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2 text-slate-800 dark:text-slate-100">
                    <span className="font-extrabold text-sm">{inst.name}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                      📊 {inst.paidInstallmentCount} / {inst.installmentCount} Taksit
                    </span>
                    {isCompleted && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                        ✔ Bitti
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
                    <p>
                      Aylık Taksit: <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{format(singlePayment)}</span> | Toplam: 💼 <span className="font-mono">{format(inst.totalAmount)}</span> | Kalan Borç: <span className="font-mono">{format(remaining)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Calendar className="w-3.5 h-3.5" /> İlk Vade: {new Date(inst.firstDueDate).toLocaleDateString("tr-TR")}
                    </p>
                  </div>

                  {/* Progress block */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => handleOpenEdit(inst)}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteInstallment(inst.id)}
                    className="p-2 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={() => onPayInstallment(inst.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs rounded-xl flex items-center gap-1 transition active:scale-95 shadow-sm"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Taksit Öde
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Installment Add/Edit Modal and Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h4 className="text-base font-bold flex items-center gap-1.5 border-b pb-2 dark:border-slate-700">
              <CalendarDays className="w-5 h-5 text-indigo-500" /> {modalTitle}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">BORÇ PLANI ADI</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Beyaz eşya kredisi vb."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TOPLAM TUTAR</label>
                  <input
                    type="text"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(formatNumberWithDots(e.target.value))}
                    placeholder="₺12.000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TAKSİT SAYISI</label>
                  <input
                    type="number"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÖDENMİŞ TAKSİT</label>
                  <input
                    type="number"
                    value={paidInstallmentCount}
                    onChange={(e) => setPaidInstallmentCount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">İLK ÖDEME TARİHİ</label>
                  <input
                    type="date"
                    value={firstDueDate}
                    onChange={(e) => setFirstDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>
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
    </div>
  );
};
