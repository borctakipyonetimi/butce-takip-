/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Search,
  Tag,
  Calendar,
  Check,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Clock,
  Briefcase,
  User,
  Heart,
  Store,
  DollarSign,
  AlertCircle,
  TrendingUpDown,
  BookOpen
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  category: "friend" | "family" | "work" | "other";
  avatarColor: string;
  createdAt: string;
}

interface ContactTransaction {
  id: string;
  contactId: string;
  type: "receivable" | "payable"; // receivable: Alacak (they owe us), payable: Verecek (we owe them)
  amount: number;
  description: string;
  dueDate: string;
  isPaid: boolean;
  createdAt: string;
}

interface ContactsDebtPanelProps {
  currentUser: string | null;
  format: (amount: number) => string;
  triggerToast?: (msg: string) => void;
}

export const ContactsDebtPanel: React.FC<ContactsDebtPanelProps> = ({
  currentUser,
  format,
  triggerToast
}) => {
  const spaceKey = currentUser ? `user_${currentUser}` : "user_anonymous";

  // State Management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<ContactTransaction[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulated picker States
  const [isSimulatedPickerOpen, setIsSimulatedPickerOpen] = useState(false);
  const [simulatedSearchText, setSimulatedSearchText] = useState("");

  const showLocalToast = (msg: string) => {
    if (triggerToast) {
      triggerToast(msg);
    } else {
      alert(msg);
    }
  };

  // Create Contact Form States
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactCategory, setNewContactCategory] = useState<Contact["category"]>("friend");
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Create Transaction Form States
  const [newTxAmount, setNewTxAmount] = useState("");
  const [newTxType, setNewTxType] = useState<"receivable" | "payable">("receivable");
  const [newTxDesc, setNewTxDesc] = useState("");
  const [newTxDueDate, setNewTxDueDate] = useState(() => {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // default in +7 days
  });
  const [isAddingTx, setIsAddingTx] = useState(false);

  // Load Data
  useEffect(() => {
    const savedContacts = localStorage.getItem(`${spaceKey}_contacts_directory`);
    const savedTxs = localStorage.getItem(`${spaceKey}_contacts_transactions`);

    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      // Default placeholder contacts to offer initial life to the page
      const defaults: Contact[] = [
        { id: "c1", name: "Ahmet Yılmaz", phone: "0532 123 4567", category: "friend", avatarColor: "from-emerald-500 to-teal-600", createdAt: new Date().toISOString() },
        { id: "c2", name: "Banu Korkmaz (İş Ortağı)", phone: "0555 987 6543", category: "work", avatarColor: "from-indigo-500 to-indigo-700", createdAt: new Date().toISOString() },
        { id: "c3", name: "Mehmet Amca", phone: "0541 444 2211", category: "family", avatarColor: "from-amber-500 to-orange-600", createdAt: new Date().toISOString() }
      ];
      setContacts(defaults);
      localStorage.setItem(`${spaceKey}_contacts_directory`, JSON.stringify(defaults));
    }

    if (savedTxs) {
      setTransactions(JSON.parse(savedTxs));
    } else {
      const defaultTxs: ContactTransaction[] = [
        { id: "t1", contactId: "c1", type: "receivable", amount: 1500, description: "Haftalık borç / borç verdim", dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], isPaid: false, createdAt: new Date().toISOString() },
        { id: "t2", contactId: "c2", type: "payable", amount: 4500, description: "Ofis malzemesi tedarik ödemesi", dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], isPaid: false, createdAt: new Date().toISOString() },
        { id: "t3", contactId: "c3", type: "receivable", amount: 750, description: "Alışveriş yardımı", dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], isPaid: true, createdAt: new Date().toISOString() }
      ];
      setTransactions(defaultTxs);
      localStorage.setItem(`${spaceKey}_contacts_transactions`, JSON.stringify(defaultTxs));
    }
  }, [spaceKey]);

  // Persists
  const saveContactsData = (newConts: Contact[]) => {
    setContacts(newConts);
    localStorage.setItem(`${spaceKey}_contacts_directory`, JSON.stringify(newConts));
  };

  const saveTxsData = (newTxs: ContactTransaction[]) => {
    setTransactions(newTxs);
    localStorage.setItem(`${spaceKey}_contacts_transactions`, JSON.stringify(newTxs));
  };

  // Add Contact Handler
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const gradients = [
      "from-emerald-500 to-teal-600",
      "from-indigo-500 to-indigo-700",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-sky-500 to-blue-700",
      "from-purple-500 to-fuchsia-700"
    ];
    const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

    const added: Contact = {
      id: "cont_" + Date.now(),
      name: newContactName.trim(),
      phone: newContactPhone.trim() || "Belirtilmemiş 📞",
      category: newContactCategory,
      avatarColor: randomGrad,
      createdAt: new Date().toISOString()
    };

    const updated = [added, ...contacts];
    saveContactsData(updated);
    setIsAddingContact(false);
    setNewContactName("");
    setNewContactPhone("");
  };

  // Directory / simulated device contact list
  const simulatedDeviceContacts = [
    { name: "Serkan Sağlam", phone: "0532 999 1122", category: "work" as const },
    { name: "Ayşe Yılmaz", phone: "0543 111 2233", category: "friend" as const },
    { name: "Canan Demir", phone: "0555 444 5566", category: "family" as const },
    { name: "Esra Tekin", phone: "0533 555 4433", category: "friend" as const },
    { name: "Bülent Avcı", phone: "0542 333 4455", category: "work" as const },
    { name: "Ali Kaya", phone: "0551 222 3344", category: "other" as const },
    { name: "Fatma Nur", phone: "0532 888 7766", category: "family" as const },
    { name: "Mustafa Koç", phone: "0505 555 1212", category: "work" as const },
    { name: "Zeynep Aslan", phone: "0552 999 8877", category: "friend" as const },
    { name: "Emre Şahin", phone: "0541 666 5544", category: "other" as const },
    { name: "Merve Doğan", phone: "0533 111 9988", category: "family" as const }
  ];

  const handleSelectFromDeviceContacts = async () => {
    if (typeof window !== "undefined" && "contacts" in navigator && "select" in (navigator as any).contacts) {
      try {
        const props = ["name", "tel"];
        const opts = { multiple: false };
        const contactsSelected = await (navigator as any).contacts.select(props, opts);
        if (contactsSelected && contactsSelected.length > 0) {
          const deviceContact = contactsSelected[0];
          const selectedName = deviceContact.name?.[0] || "";
          const selectedPhone = deviceContact.tel?.[0] || "";
          if (selectedName) {
            importContactToForm(selectedName, selectedPhone);
            showLocalToast("Kişi bilgileri akıllı rehberden çekildi! 📱");
            return;
          }
        }
      } catch (err) {
        console.warn("Native Contacts Select API canceled or errored", err);
      }
    }
    // Open high fidelity address book mockup popup
    setIsSimulatedPickerOpen(true);
  };

  const importContactToForm = (name: string, phone: string, cat?: "friend" | "family" | "work" | "other") => {
    setNewContactName(name);
    setNewContactPhone(phone || "Belirtilmemiş 📞");
    if (cat) setNewContactCategory(cat);
    setIsAddingContact(true);
  };

  const handleSimulatedSelect = (simulated: typeof simulatedDeviceContacts[0]) => {
    const gradients = [
      "from-emerald-500 to-teal-600",
      "from-indigo-500 to-indigo-700",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-sky-500 to-blue-700",
      "from-purple-500 to-fuchsia-700"
    ];
    const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

    // Check if duplicate contact already exists
    const isDuplicate = contacts.some(c => c.name.toLowerCase() === simulated.name.toLowerCase());
    if (isDuplicate) {
      showLocalToast(`"${simulated.name}" zaten listenizde kayıtlı! ⚠️`);
      setIsSimulatedPickerOpen(false);
      return;
    }

    const added: Contact = {
      id: "cont_" + Date.now(),
      name: simulated.name,
      phone: simulated.phone,
      category: simulated.category,
      avatarColor: randomGrad,
      createdAt: new Date().toISOString()
    };

    const updated = [added, ...contacts];
    saveContactsData(updated);
    setIsSimulatedPickerOpen(false);
    showLocalToast(`${simulated.name} rehberden başarıyla eklendi! 📱🎉`);
  };

  // Delete Contact Handler
  const handleDeleteContact = (id: string) => {
    if (confirm("Bu kişiyi ve tüm borç/alacak kayıtlarını silmek istiyor musunuz? ⚠️")) {
      const updatedConts = contacts.filter((c) => c.id !== id);
      const updatedTxs = transactions.filter((t) => t.contactId !== id);
      saveContactsData(updatedConts);
      saveTxsData(updatedTxs);
      if (selectedContactId === id) {
        setSelectedContactId(null);
      }
    }
  };

  // Add Transaction Handler
  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || !newTxAmount || parseFloat(newTxAmount) <= 0) return;

    const added: ContactTransaction = {
      id: "tx_" + Date.now(),
      contactId: selectedContactId,
      type: newTxType,
      amount: parseFloat(newTxAmount),
      description: newTxDesc.trim() || (newTxType === "receivable" ? "Alacak Alındı / Borç Verildi" : "Borç edinildi / Ödeme Yapılacak"),
      dueDate: newTxDueDate,
      isPaid: false,
      createdAt: new Date().toISOString()
    };

    const updated = [added, ...transactions];
    saveTxsData(updated);
    setIsAddingTx(false);
    setNewTxAmount("");
    setNewTxDesc("");
  };

  // Toggle transaction pay state
  const handleToggleTxPaid = (id: string) => {
    const updated = transactions.map((t) => {
      if (t.id === id) {
        return { ...t, isPaid: !t.isPaid };
      }
      return t;
    });
    saveTxsData(updated);
  };

  // Delete Transaction
  const handleDeleteTx = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    saveTxsData(updated);
  };

  // Calculate stats
  const activeTxs = transactions.filter((t) => !t.isPaid);

  const totalReceivable = activeTxs
    .filter((t) => t.type === "receivable")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayable = activeTxs
    .filter((t) => t.type === "payable")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalReceivable - totalPayable;

  // Filtered contacts list
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  // Helper for Category Badge Icon
  const getCategoryIcon = (cat: Contact["category"]) => {
    switch (cat) {
      case "friend":
        return <Heart className="w-3.5 h-3.5 text-pink-500" />;
      case "family":
        return <Users className="w-3.5 h-3.5 text-amber-500" />;
      case "work":
        return <Briefcase className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Store className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Helper for Category Name
  const getCategoryLabel = (cat: Contact["category"]) => {
    switch (cat) {
      case "friend": return "Arkadaş";
      case "family": return "Aile / Akraba";
      case "work": return "İş / Ortaklık";
      default: return "Diğer / Cari";
    }
  };

  // Get active debt breakdown for specific contact
  const getContactTotals = (cId: string) => {
    const cTxs = transactions.filter((t) => t.contactId === cId && !t.isPaid);
    const recAll = cTxs.filter((t) => t.type === "receivable").reduce((sum, t) => sum + t.amount, 0);
    const payAll = cTxs.filter((t) => t.type === "payable").reduce((sum, t) => sum + t.amount, 0);
    return { receivable: recAll, payable: payAll, net: recAll - payAll };
  };

  // Percentage Calculations for Custom SVG Gauge
  const combinedVolume = totalReceivable + totalPayable;
  const receivablePercentage = combinedVolume > 0 ? (totalReceivable / combinedVolume) * 100 : 50;
  const payablePercentage = combinedVolume > 0 ? (totalPayable / combinedVolume) * 100 : 50;

  // Render SVG Ring Arc
  const strokeDashVal = 314; // circumference for r=50 circle roughly
  const recDashoffset = strokeDashVal - (strokeDashVal * receivablePercentage) / 100;

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Upper Welcome Header */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex flex-col items-center text-center space-y-2">
        <div className="p-3.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full">
          <Users className="w-7 h-7" />
        </div>
        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          👥 Kişi Alacak & Verecek Defteri
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-350 max-w-xl font-medium leading-relaxed">
          Borç verdiğiniz arkadaşlarınızı, ödeme bekleyen müşterilerinizi veya borçlu olduğunuz akrabalarınızı akıllı rehber ile gruplayın. Her kişi için bağımsız veri geçmişi tutun.
        </p>
      </div>

      {/* Grid Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Total Receivables */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block uppercase">Toplayacağımız Toplam Alacak</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
              {format(totalReceivable)}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium block">Aktif kişi alacak kayıtlarından</span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5 animate-bounce" />
          </div>
        </motion.div>

        {/* Card: Total Payables */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 tracking-wider block uppercase">Ödeyeceğimiz Toplam Borç</span>
            <span className="text-xl font-black text-rose-500 dark:text-rose-400 font-mono block">
              {format(totalPayable)}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium block">Aktif kişi borç ve taahhütlerden</span>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
            <TrendingDown className="w-5 h-5 animate-pulse" />
          </div>
        </motion.div>

        {/* Card: Net Status Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-2xl border flex items-center justify-between transition ${
            netBalance >= 0
              ? "bg-emerald-500/[0.04] border-emerald-100 dark:border-emerald-900/30"
              : "bg-rose-500/[0.03] border-rose-100 dark:border-rose-900/20"
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block uppercase">Net Defter Durumu</span>
            <span className={`text-xl font-black font-mono block ${netBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {netBalance >= 0 ? "+" : ""}{format(netBalance)}
            </span>
            <span className="text-[9px] text-slate-600 dark:text-slate-350 font-bold block">
              {netBalance >= 0 ? "⚠️ Finansal dengemiz artı hanesinde." : "⚠️ Alacaklardan daha fazla borç mevcut."}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl ${netBalance >= 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
            <TrendingUpDown className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Visualization Row: SVG High-End Custom Gauge Chart & Quick Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custom Interactive SVG Semi-Gauge Graph */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-850 flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              📊 BORÇ-ALACAK DAHİLİ ORAN DURUMU
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              Kişilere ait genel sermaye dağıtım dengesi
            </p>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Custom High contrast circle */}
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              {/* Back Circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-rose-500 dark:stroke-rose-950/70"
                strokeWidth="12"
                fill="none"
              />
              {/* Front Circle (Receivable percentage) */}
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-emerald-400"
                strokeWidth="12"
                strokeDasharray={strokeDashVal}
                initial={{ strokeDashoffset: strokeDashVal }}
                animate={{ strokeDashoffset: recDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                %{receivablePercentage.toFixed(0)}
              </span>
              <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                Alacak Oranı
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 pt-1 text-xs font-bold justify-center w-full">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-400 rounded-full" />
              <span className="text-slate-700 dark:text-slate-300">Alacaklar (%{receivablePercentage.toFixed(0)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded-full" />
              <span className="text-slate-700 dark:text-slate-300">Borçlar (%{payablePercentage.toFixed(0)})</span>
            </div>
          </div>
        </div>

        {/* Categories statistics breakdown bar */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-850 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              📊 KATEGORİSEL REHBER YAPISI
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              Kategorilere göre kişi rehber yoğunluğu
            </p>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {/* Category rows mapped with custom responsive bars */}
            {(["friend", "family", "work", "other"] as const).map((cat) => {
              const contsInCat = contacts.filter((c) => c.category === cat);
              const pct = contacts.length > 0 ? (contsInCat.length / contacts.length) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5 select-none text-[11px]">
                      {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{contsInCat.length} Kişi ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        cat === "friend"
                          ? "from-pink-400 to-rose-500"
                          : cat === "family"
                          ? "from-amber-400 to-orange-500"
                          : cat === "work"
                          ? "from-indigo-400 to-indigo-600"
                          : "from-slate-400 to-slate-550"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Dual Panels: Local Contacts left vs. History ledger Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Directory Contact List (5/12 columns) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
              <Users className="w-4 h-4 text-indigo-500" />
              Kişi Listesi ({contacts.length})
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSelectFromDeviceContacts}
                type="button"
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/15"
                title="Cihaz rehberinizden ya da hazır listeden hızlıca kişi aktarın"
              >
                <Phone className="w-3 h-3 text-emerald-200 animate-pulse" /> REHBERDEN SEÇ 📱
              </button>
              <button
                onClick={() => setIsAddingContact((prev) => !prev)}
                type="button"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm shadow-indigo-600/15"
              >
                <UserPlus className="w-3 h-3 text-indigo-200" /> MANUEL EKLE
              </button>
            </div>
          </div>

          {/* Inline Add Contact Form */}
          <AnimatePresence>
            {isAddingContact && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleAddContactSubmit}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-350 block">👥 YENİ KİŞİ EKLE</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Kişi Adı Soyadı</label>
                    <input
                      required
                      type="text"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="Ahmet Yılmaz"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Giriş Telefon Numarası</label>
                    <input
                      type="tel"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="0532 123 4567"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Yakınlık Grubu / Kategori</label>
                    <select
                      value={newContactCategory}
                      onChange={(e) => setNewContactCategory(e.target.value as any)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="friend">Arkadaş</option>
                      <option value="family">Aile / Akraba</option>
                      <option value="work">İş / Ticaret</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition"
                    >
                      VAZGEÇ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition"
                    >
                      KAYDET 💾
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rehberde kişi arayın... 🔎"
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Directory Contact List Items */}
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-850 font-bold text-xs italic">
                Arama kriterlerine uygun kişi bulunamadı.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const totals = getContactTotals(contact.id);
                const isSelected = selectedContactId === contact.id;

                return (
                  <motion.div
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`p-3 bg-white dark:bg-slate-800 rounded-2xl border transition duration-200 cursor-pointer flex items-center justify-between group active:scale-98 ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-md"
                        : "border-slate-150 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar visually colorful initial letter */}
                      <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-tr ${contact.avatarColor} text-white flex items-center justify-center font-black text-xs shadow-xs uppercase shrink-0`}>
                        {contact.name.charAt(0)}
                      </div>

                      <div className="min-w-0 leading-tight">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                            {contact.name}
                          </h4>
                          <span className="shrink-0 p-0.5 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800">
                            {getCategoryIcon(contact.category)}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono pt-1 truncate">
                          📞 {contact.phone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right pl-2 leading-none">
                      <div className="text-[10px] font-mono leading-tight">
                        {totals.net !== 0 ? (
                          <span className={`font-black ${totals.net > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {totals.net > 0 ? "Alacak: " : "Borç: "}{format(Math.abs(totals.net))}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300 font-extrabold text-[9px] uppercase tracking-wide">
                            DENGELİ ✔️
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Ledger history & Transaction controls (7/12 columns) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedContactId ? (() => {
              const contact = contacts.find((c) => c.id === selectedContactId);
              if (!contact) return null;

              const cTxs = transactions.filter((t) => t.contactId === contact.id);
              const activeTxs = cTxs.filter((t) => !t.isPaid);
              const totals = getContactTotals(contact.id);

              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-850 p-5 space-y-4 shadow-sm"
                >
                  {/* Selected contact profile header visual tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${contact.avatarColor} text-white flex items-center justify-center font-black text-sm uppercase shadow-sm`}>
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-350">MÜŞTERİ CARİ & AMORTİSMAN HESABI</h3>
                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          {contact.name}
                          <span className="text-[9px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-100/20">
                            {getCategoryLabel(contact.category)}
                          </span>
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/30 rounded-xl hover:bg-rose-100/50 transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="Kişiyi & Defteri Sil ⚠️"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Debt/Credit totals balance strip */}
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <div className="p-3 rounded-2xl bg-emerald-500/[0.04] border border-emerald-100/30 dark:border-emerald-900/10">
                      <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase block tracking-wider">Kişiden Alacağımız Var</span>
                      <span className="text-sm font-extrabold text-emerald-500 font-mono block mt-1">
                        {format(totals.receivable)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/[0.03] border border-rose-100/30 dark:border-rose-900/10">
                      <span className="text-[8px] font-black text-rose-500 dark:text-rose-400 uppercase block tracking-wider">Kişiye Borcumuz Var</span>
                      <span className="text-sm font-extrabold text-rose-500 font-mono block mt-1">
                        {format(totals.payable)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction add portal trigger line */}
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">
                      📜 ALIŞVERİŞ VE BORÇ GEÇMİŞİ LİSTESİ ({cTxs.length})
                    </h3>
                    <button
                      onClick={() => setIsAddingTx((prev) => !prev)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Borç/Alacak Ekle
                    </button>
                  </div>

                  {/* Transaction additions form */}
                  <AnimatePresence>
                    {isAddingTx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <form
                          onSubmit={handleAddTxSubmit}
                          className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3"
                        >
                          <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-350 block">➕ İŞLEM / FİŞ EKLEME FORMU</span>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">İşlem Yönü</label>
                              <select
                                value={newTxType}
                                onChange={(e) => setNewTxType(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="receivable">Alacak Senedi (Ona Borç Verdim)</option>
                                <option value="payable">Borç Taahhüdü (Ondan Borç Aldım)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Toplam Tutar</label>
                              <div className="relative">
                                <input
                                  required
                                  type="number"
                                  step="any"
                                  min="0.1"
                                  value={newTxAmount}
                                  onChange={(e) => setNewTxAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Açıklama / Detay</label>
                              <input
                                type="text"
                                value={newTxDesc}
                                onChange={(e) => setNewTxDesc(e.target.value)}
                                placeholder="Örn: Yemek parası, Ortak gider vb."
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Ödeme Vadesi</label>
                              <input
                                type="date"
                                value={newTxDueDate}
                                onChange={(e) => setNewTxDueDate(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1.5">
                            <button
                              type="button"
                              onClick={() => setIsAddingTx(false)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition"
                            >
                              VAZGEÇ
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition"
                            >
                              ONAYLA VE EKLE
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Ledger transactions list container */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {cTxs.length === 0 ? (
                      <div className="text-center py-8 bg-slate-550/5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1.5 p-4">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">Kişiye ait alışveriş ve finansal kayıt bulunmuyor.</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Yukarıdaki butona tıklayarak hemen alacak veya borç kaydı ekleyin.</p>
                      </div>
                    ) : (
                      cTxs.map((tx) => {
                        return (
                          <div
                            key={tx.id}
                            className={`p-3 dark:bg-slate-900 rounded-2xl border transition duration-200 relative overflow-hidden flex items-center justify-between ${
                              tx.isPaid
                                ? "bg-slate-50/75 border-slate-200/50 dark:border-slate-950 dark:opacity-60"
                                : tx.type === "receivable"
                                ? "bg-emerald-500/[0.02] border-emerald-150 dark:border-emerald-900/30"
                                : "bg-rose-500/[0.02] border-rose-150 dark:border-rose-900/20"
                            }`}
                          >
                            <div className="flex gap-2 min-w-0 flex-1 pr-2">
                              {/* Paid Status indicator box */}
                              <button
                                onClick={() => handleToggleTxPaid(tx.id)}
                                className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center transition active:scale-90 cursor-pointer ${
                                  tx.isPaid
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : tx.type === "receivable"
                                    ? "border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/10"
                                    : "border-rose-300 dark:border-rose-800 hover:bg-rose-500/10"
                                }`}
                                title={tx.isPaid ? "Ödenmedi olarak işaretle" : "Ödendi olarak işaretle"}
                              >
                                {tx.isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>

                              <div className="min-w-0">
                                <h4 className={`text-[11px] font-bold text-slate-800 dark:text-slate-100 uppercase truncate leading-tight ${tx.isPaid ? "line-through text-slate-600" : ""}`}>
                                  {tx.description}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-indigo-400" />
                                    Vade: {tx.dueDate}
                                  </span>
                                  <span>•</span>
                                  <span className={tx.type === "receivable" ? "text-emerald-500" : "text-rose-500"}>
                                    {tx.type === "receivable" ? "Bizim Alacağımız" : "Ona Ödeyeceğiz"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-2 pl-2">
                              <span className={`text-[13px] font-black font-mono ${tx.isPaid ? "line-through text-slate-600" : tx.type === "receivable" ? "text-emerald-500" : "text-rose-500"}`}>
                                {tx.type === "receivable" ? "+" : "-"}{format(tx.amount)}
                              </span>
                              <button
                                onClick={() => handleDeleteTx(tx.id)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-rose-500 shrink-0 cursor-pointer active:scale-95 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Informative advice message */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-850 text-[9.5px] leading-relaxed text-slate-600 dark:text-slate-350 font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                    <p>
                      <strong>💡 Akıllı Amorti İpuçları:</strong> Herhangi bir borcun solundaki boş yuvarlağa tıkladığınızda işlem "Ödendi" olarak etiketlenir ve üstteki toplam grafiklerden çıkartılır. Karşılıklı transfer tanzimlerinde bu özelliği kullanabilirsiniz.
                    </p>
                  </div>
                </motion.div>
              );
            })() : (
              <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-850 space-y-4">
                <div className="flex flex-col items-center justify-center space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-500 animate-pulse">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <h4 className="font-black text-sm uppercase">Cari Hesap Seçilmedi</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                    Borç hareketlerini, vade dökümünü ve detaylı finansal notlarını incelemek için sol paneldeki rehberden dilediğiniz bir kişiyi seçin.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Simulated Device Contact List Modal Overlay */}
          <AnimatePresence>
            {isSimulatedPickerOpen && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] flex flex-col overflow-hidden text-left"
                >
                  <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-805 dark:text-slate-100 flex items-center gap-1.5 uppercase">
                        📱 TELEFON REHBERİNDEN SEÇ
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">Kişilerinizi bir tıkla alacak/verecek dökümünüze aktarın</p>
                    </div>
                    <button
                      onClick={() => setIsSimulatedPickerOpen(false)}
                      type="button"
                      className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-rose-500 rounded-lg text-xs font-black cursor-pointer transition active:scale-90"
                    >
                      KAPAT ✖
                    </button>
                  </div>

                  {/* Search filter for simulated contacts */}
                  <div className="relative">
                    <input
                      type="text"
                      value={simulatedSearchText}
                      onChange={(e) => setSimulatedSearchText(e.target.value)}
                      placeholder="Rehberde kişi arayın... 🔎"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  {/* Contacts Row selection */}
                  <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 max-h-80">
                    {simulatedDeviceContacts
                      .filter((sim) =>
                        sim.name.toLowerCase().includes(simulatedSearchText.toLowerCase()) ||
                        sim.phone.includes(simulatedSearchText)
                      )
                      .map((sim, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSimulatedSelect(sim)}
                          className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-950/40 dark:hover:bg-indigo-950/30 rounded-2xl border border-slate-200/50 dark:border-slate-800/85 transition flex items-center justify-between cursor-pointer group hover:border-indigo-500/50 active:scale-[0.99] font-sans"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-450 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs">
                              {sim.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-[11.5px] font-black text-slate-800 dark:text-slate-100 leading-tight">
                                {sim.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                📞 {sim.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/15 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                              Hızlı Ekle ➔
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
