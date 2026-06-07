/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ExternalLink, Sparkles } from "lucide-react";

interface AdMobBannerProps {
  unitType?: "banner" | "native" | "interstitial";
  className?: string;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  unitType = "banner",
  className = ""
}) => {
  const [adClicked, setAdClicked] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Dynamically check premium status from localStorage to instantly hide ads
  useEffect(() => {
    const checkPremium = () => {
      setIsPremium(localStorage.getItem("is_premium") === "true");
    };
    checkPremium();
    const interval = setInterval(checkPremium, 1500);
    return () => clearInterval(interval);
  }, []);

  if (isPremium) return null;

  // Predefined high-performance fintech-themed visual sponsor campaigns
  const adOffers = [
    {
      title: "Finansal Yapılandırma Kredisi",
      desc: "Tüm borçlarınızı tek bankada toplayın, faiz canavarına dur deyin. %1.99'dan başlayan transfer faizleriyle rahat nefes alın.",
      cta: "Hemen Başvur",
      sponsor: "Garanti BBVA Mobil Sponsorluğunda",
      url: "https://www.garantibbva.com.tr"
    },
    {
      title: "Akıllı Yatırım & Fon Asistanı",
      desc: "Birikimlerinizi enflasyona karşı koruyun. Kolayca altın, gümüş ve borsa yatırım fonları satın alın.",
      cta: "Portföyü Keşfet",
      sponsor: "Bütçem Pro Yatırım Ortağı",
      url: "https://www.google.com"
    },
    {
      title: "Sıfır Masraflı Dijital Hesap",
      desc: "EFT, Havale ve FAST işlemlerine ücret ödemeyin. Günlük biriken faizle harcarken de kazanın.",
      cta: "Başvuru Yap",
      sponsor: "Enpara Finans Reklam Ağı",
      url: "https://www.qnbfinansbank.enpara.com"
    }
  ];

  // Rotate ads or pick the first one
  const activeOffer = adOffers[0];

  const handleAdClick = () => {
    setAdClicked(true);
    setTimeout(() => setAdClicked(false), 2200);
    window.open(activeOffer.url, "_blank", "noopener,noreferrer");
  };

  // We always show beautiful structural cards in preview/dev environment to guarantee they are 100% visible
  if (unitType === "banner") {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        <div className="relative p-3 bg-gradient-to-r from-indigo-50/90 via-slate-100/60 to-slate-50 dark:from-indigo-950/40 dark:via-slate-900/65 dark:to-slate-950 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 shadow-sm flex items-center justify-between gap-3 animate-fade-in min-h-[55px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Extremely compact value badge */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white font-black text-[10px] flex items-center justify-center shadow-sm shrink-0 select-none uppercase">
              %1.99
            </div>

            <div className="min-w-0 flex-1 text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[7px] font-black uppercase tracking-wider rounded border border-amber-500/15 select-none">
                  Sponsorlu Reklam
                </span>
                <span className="text-[8.5px] text-slate-500 dark:text-slate-400 font-bold truncate">
                  {activeOffer.sponsor}
                </span>
              </div>
              <h4 className="text-[10px] sm:text-xs font-black text-slate-850 dark:text-slate-150 mt-1 truncate">
                {activeOffer.title}
              </h4>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleAdClick}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-tight transition active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer leading-none"
            >
              <span>{activeOffer.cta}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Large native visual card layout
  return (
    <div className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/10 dark:border-slate-800 relative shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3.5">
        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded border border-indigo-500/15 select-none">
          Sponsorlu Akıllı Kampanya
        </span>
      </div>

      <div className="space-y-3.5 text-left">
        <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5 leading-snug">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          {activeOffer.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          {activeOffer.desc}
        </p>

        {/* Big Ad CTA Visual Bar */}
        <div 
          onClick={handleAdClick}
          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-2xl border border-dashed border-indigo-500/10 dark:border-slate-800 flex items-center justify-between cursor-pointer transition active:scale-98"
        >
          <div className="min-w-0 pr-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">KAMPANYA DETAYLARI</span>
            <span className="text-[10.5px] font-extrabold text-indigo-500 dark:text-indigo-400 block truncate">{activeOffer.sponsor}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm shrink-0">
            {activeOffer.cta} <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
