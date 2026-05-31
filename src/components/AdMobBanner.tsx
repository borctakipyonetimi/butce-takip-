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
  const [adSenseFailed, setAdSenseFailed] = useState(false);

  // Dynamically load Google AdSense / DFP tags in the background using the client's publisher metadata
  useEffect(() => {
    const scriptId = "google-adsense-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4449700232321088";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        setAdSenseFailed(true);
      };
      document.head.appendChild(script);
    }

    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      // Fallback if blocked by client-side browser extensions of adblockers
      setAdSenseFailed(true);
    }
  }, []);

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

  const activeOffer = adOffers[0];

  const handleAdClick = () => {
    setAdClicked(true);
    setTimeout(() => setAdClicked(false), 2200);
    window.open(activeOffer.url, "_blank", "noopener,noreferrer");
  };

  // Google AdSense direct tags (with fallback when AdSense/AdBlock is active)
  if (!adSenseFailed) {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        <div className="bg-slate-50/50 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/60 text-center relative">
          <div className="text-[7px] font-bold pointer-events-none tracking-widest text-slate-400 dark:text-slate-500 uppercase text-center select-none">
            REKLAM / SPONSORLU İÇERİK
          </div>
          {/* Official Google adsbygoogle container using user's Client ID & Slot token */}
          <ins
            className="adsbygoogle block animate-pulse"
            style={{ display: "block", minHeight: "50px", width: "100%" }}
            data-ad-client="ca-pub-4449700232321088"
            data-ad-slot="7540463727"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  // Beautiful structural fallback when live Google scripts are locally blocked inside the sandbox view
  if (unitType === "banner") {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        <div className="relative p-1.5 px-3 bg-gradient-to-r from-slate-50 to-slate-100/60 dark:from-slate-900/65 dark:to-slate-900/20 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2.5 animate-fade-in min-h-[50px]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Extremely compact value badge */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 text-white font-black text-[9px] flex items-center justify-center shadow-xs shrink-0 select-none uppercase">
              %1.9
            </div>

            <div className="min-w-0 flex-1 text-left leading-none">
              <div className="flex items-center gap-1">
                <span className="px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[6.5px] font-black uppercase tracking-wider rounded border border-amber-500/15 select-none">
                  Sponsorlu
                </span>
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-bold truncate">
                  {activeOffer.sponsor}
                </span>
              </div>
              <h4 className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 truncate max-w-xs">
                {activeOffer.title}
              </h4>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleAdClick}
              className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[8.5px] font-black uppercase tracking-tight transition active:scale-95 flex items-center gap-0.5 shadow-sm shadow-indigo-600/15 cursor-pointer leading-none"
            >
              <span>{activeOffer.cta}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Large native visual card layout
  return (
    <div className={`p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 relative shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded border border-indigo-500/15 select-none">
          Sponsorlu Akıllı Kampanya
        </span>
      </div>

      <div className="space-y-2 text-left">
        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1 leading-snug">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {activeOffer.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          {activeOffer.desc}
        </p>

        {/* Big Ad CTA Visual Bar */}
        <div 
          onClick={handleAdClick}
          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl border border-dashed border-slate-250 dark:border-slate-800 flex items-center justify-between cursor-pointer transition active:scale-98"
        >
          <div className="min-w-0 pr-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Kampanya Detayları</span>
            <span className="text-[10px] font-extrabold text-indigo-605 text-indigo-500 dark:text-indigo-400 block truncate">{activeOffer.sponsor}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0">
            {activeOffer.cta} <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
