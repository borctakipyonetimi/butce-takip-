/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, HelpCircle, Mail, MessageSquare, Shield, Star, User, Award, Zap, BarChart3, Layers, Lock, Settings } from "lucide-react";

interface HelpAndGuidesProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const HelpAndGuides: React.FC<HelpAndGuidesProps> = ({ activeTab, onNavigate }) => {
  const [contactName, setContactName] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const handleSendMessage = () => {
    if (!contactMsg) {
      alert("Lütfen mesajınızı yazın.");
      return;
    }
    const currentUrl = window.location.href;
    const mailtoUrl = `mailto:info.borctakipyonetimi@gmail.com?subject=Borç Takip Geri Bildirim&body=Gönderen: ${encodeURIComponent(contactName)}%0D%0AMesaj: ${encodeURIComponent(contactMsg)}%0D%0ACihaz Adresi: ${encodeURIComponent(currentUrl)}`;
    window.location.href = mailtoUrl;
    alert("E-posta istemciniz başlatılıyor...");
  };

  if (activeTab === "help") {
    return (
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        <div className="bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent p-5 rounded-3xl border border-indigo-500/10 dark:border-indigo-500/5 text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-indigo-500 mx-auto animate-bounce" />
          <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            📚 AKILLI BÜTÇE PRO - KULLANIM KILAVUZU
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
            Gelişmiş finans takip sistemimizdeki tüm modülleri, borç kapatma stratejilerini ve veri tabanı yeteneklerini keşfederek bütçenizi kontrol altına alın.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Finansal Genel Bakış */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-indigo-350 dark:hover:border-indigo-800/50 transition">
            <span className="text-xl">📊</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">1. ÖZET VE FİNANSAL YÖNETİM MERKEZİ</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Dashboard genel bakış paneli finansal sağlığınızın yönetim üssüdür. Toplam borcunuzu, ödediğiniz kısımları ve kalan borcunuzu anlık izler. Gelirleriniz ile harcama bütçenizi kıyaslayarak <strong>Net Kalan Rezervinizi</strong> hesaplar ve bütçe doluluk durumunu dinamik ilerleme çubuğuyla görselleştirir.
            </p>
          </div>

          {/* 2. Harcamalar ve Kategoriler */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-rose-350 dark:hover:border-rose-800/50 transition">
            <span className="text-xl">🛒</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">2. HARCAMA VE DİNAMİK KATEGORİ SEÇİCİ</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Kategorilerinize özel renkler ve emojiler (simgeler) tanımlayabilirsiniz. Mevcut ay harcamalarınız bütçenizin <strong>%90 limitini</strong> aştığında Expenses listesinde bir dikkat bandı belirir. Süreçlerinizi kolaylaştırmak için kategorileri sürükleyip taşıyarak yerini değiştirebilir, veri grafikleriyle dağılımı inceleyebilirsiniz.
            </p>
          </div>

          {/* 3. Borçlar ve Geri Ödemeler */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-emerald-350 dark:hover:border-emerald-800/50 transition">
            <span className="text-xl">💳</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">3. BORÇ VE DETAYLI GERİ ÖDEME PLANI</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Tek seferlik kişisel veya kurumsal tüm borçlarınızı buraya kaydedin. Bölümdeki <strong>Geri Ödeme Ekle</strong> butonu ile borçlarınızı parça parça ödeyebilir ve ödeme geçmişi loglarıyla her bir ödemenin tarihini takip edebilirsiniz. "Ödendi" butonu ile borç durumunu sıfırlayabilirsiniz.
            </p>
          </div>

          {/* 4. Gelir Kaynakları */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-sky-350 dark:hover:border-sky-800/50 transition">
            <span className="text-xl">🏦</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">4. GELİR VE AKTİF REZERV YÖNETİMİ</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Maaş, ek kazançlar veya kira geliri gibi kaynaklarınızı kaydedin. Bu veriler toplam borç/ödeme dengesi raporlama motoruna anlık aktarılır. Asistan analiz algoritmasında gelirinize düşen borç yükünü oranlayarak en rasyonel verileri sağlamaya yardımcı olur.
            </p>
          </div>

          {/* 5. Taksitli Alışverişler */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-purple-350 dark:hover:border-purple-800/50 transition">
            <span className="text-xl">📈</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">5. TAKSİTLİ HARCAMA VE KREDİLER</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Kredi kartı taksitleri, taşıt/konut kredileri gibi vadeli ödeme planlarınız için bu modülü kullanın. Toplam taksit adedini ve ödenen taksit miktarını girdiğinizde kalan borç anlık gösterilir. <strong>Taksit Öde</strong> butonu tek tıkla yeni taksit kaydetmenizi sağlar.
            </p>
          </div>

          {/* 6. AI Asistan */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-amber-350 dark:hover:border-amber-800/50 transition">
            <span className="text-xl">🤖</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">6. YAPAY ZEKA DESTEKLİ BÜTÇE ASİSTANI</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              <strong>Gemini AI</strong> motoruna dayalı anlık asistan finans durumunuzu saniyeler içinde check-up'tan geçirir. Finansal risk seviyenizi (Düşük, Orta, Yüksek, Kritik) ölçerek, gelir-gider dağılımınızı iyileştirmeniz ve borç sarmalından en hızlı şekilde kurtulmanız için özel tavsiyeler üretir.
            </p>
          </div>

          {/* 7. Alarmlar */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-teal-350 dark:hover:border-teal-800/50 transition">
            <span className="text-xl">⏰</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">7. ZAMANLI ALARMLAR VE BİLDİRİMLER</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Son ödeme vadesi yaklaşan borçlar, faturalar veya taksitler için alarm ekleyin. Vakit geldiğinde uygulama penceresi üzerinde sesli ve görsel bildirim uyarısı tetiklenir. Bu sayede geciken vade faiz maliyetlerinden tamamen korunmuş olursunuz.
            </p>
          </div>

          {/* 8. Raporlama ve Yedekleme */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-blue-350 dark:hover:border-blue-800/50 transition">
            <span className="text-xl">📂</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">8. AKILLI VERİ DIŞA/İÇE AKTAR & RAPOR</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Tüm bütçe ve borç kayıtlarınızı **detaylı .CSV formatında (Excel)** finansal rapora dönüştürüp indirebilirsiniz. Verileriniz tamamen lokaldedir; isterseniz cihazlar arası veri transferi amacıyla **JSON formatında yedek indirip** diğer telefon/bilgisayara kolayca aktarabilirsiniz.
            </p>
          </div>

          {/* 9. Ödeme Stratejileri */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-2 hover:border-indigo-350 dark:hover:border-indigo-800/50 transition">
            <span className="text-xl">🎯</span>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">9. KARTOPU VE ÇIĞ METODOLOJİLERİ</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Borç kapatmada iki rasyonel yöntem sunulur: <strong>Kartopu (Snowball)</strong> küçük borçları önce kapatarak psikolojik motivasyonu ve başarı hissini artırır. <strong>Çığ (Avalanche)</strong> ise faiz yükü ağır olan yüksek borçlardan başlayarak matematiksel fayda sağlar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => onNavigate("blog")}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-teal-600 text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Finansal Strateji Rehberlerini İnceleyin
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === "blog") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <BookOpen className="w-5 h-5 text-emerald-500" /> FİNANS REHBERLERİ
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-teal-500 space-y-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">💰 Borçlardan Kurtulmanın 5 Etkili Yolu</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <p><strong>1. Borç Envanteri Çıkarın:</strong> Tüm borçlarınızı (kredi kartı, konut, taksitli alışverişler) tek bir listede toplayın. Borç Takip Sistemi bunu hızlıca çözebilir.</p>
              <p><strong>2. Çığ Yöntemi (Avalanche):</strong> En yüksek faizli borcunuza her ay öncelik vererek faiz yükünü hafifletin.</p>
              <p><strong>3. Kartopu Yöntemi (Snowball):</strong> Psikolojik zafer için önce en küçük borçlarınızı kapatarak başlayın.</p>
              <p><strong>4. Gelir-Gider Dengesi:</strong> Giderlerinizi kontrol altında tutarak bütçenizi optimize edin.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-indigo-500 space-y-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">📊 Bütçe Yönetimi Rehberi (50/30/20 Kuralı)</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <p>📌 <strong>%50 İhtiyaçlar:</strong> Kira, faturalar, mutfak ve ulaşım gibi temel harcamalar.</p>
              <p>📌 <strong>%30 İstekler:</strong> Sosyal hayat, sinema, tatil ve hobiler.</p>
              <p>📌 <strong>%20 Gelecek:</strong> Tasarruflar ve aktif borç kapatma ödenekleri.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-purple-500 space-y-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">📈 Kredi Notu Nasıl Yükseltilir?</h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>✅ Faturalarınızı ve kredi kartı ekstrelerinizi son ödeme gününden önce ödeyin.</p>
              <p>✅ Kredi kartı limitinizin %25'inden fazlasını doldurmamaya özen gösterin.</p>
              <p>✅ Sık kredi başvurusu yapmaktan kaçının; bu puanınızı düşürür.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "feedback") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Mail className="w-5 h-5 text-rose-500" /> BİZE ULAŞIN
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Adınız Soyadınız"
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={contactMsg}
            onChange={(e) => setContactMsg(e.target.value)}
            rows={3}
            placeholder="Mesajınız ve önerileriniz..."
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSendMessage}
            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-transform active:scale-95"
          >
            <MessageSquare className="inline w-4 h-4 mr-1.5" /> MESAJ GÖNDER
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>📧 İletişim E-posta:</span>
          <span className="font-bold underline text-indigo-500">info.borctakipyonetimi@gmail.com</span>
        </div>
      </div>
    );
  }

  if (activeTab === "privacy") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Shield className="w-5 h-5 text-blue-500" /> GİZLİLİK POLİTİKASI
        </h2>
        <div className="space-y-3 text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-h-96 overflow-y-auto pr-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Son Güncelleme: 21 Mayıs 2026</p>
          <p>
            Bu mobil/web uygulaması (“Borç Takip Sistemi”) kullanıcının kişisel veri güvenliğini en ileri seviyede tutmaktadır:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Verileriniz Tamamen Yereldir:</strong> Ad, borç, gelir gibi girdiğiniz tüm veriler sadece kendi cihazınızın internet tarayıcısında (Local Storage) barındırılır. Hiçbir sunucumuza aktarılmaz.</li>
            <li><strong>JSON Yedekleme:</strong> Verilerinizi dilediğiniz gibi "Dışa Aktar" seçeneğiyle şifresiz, JSON formatında indirip saklayabilir veya başka bir cihaza "İçe Aktar" seçeneğiyle yükleyebilirsiniz.</li>
            <li><strong>Kullanıcı Profilleri:</strong> Uygulama içinde oluşturduğunuz kullanıcı adları yine yerel olarak verilerinizi ayrıştırmak için kullanılır, internete sızdırılmaz.</li>
            <li><strong>Reklamlar:</strong> Google AdSense reklam mekanizması ilgi alanlarınıza göre reklam ulaştırmak adına geçici çerezler barındırabilir.</li>
          </ul>
          <p>Her türlü soru için <span className="underline font-semibold text-indigo-500">info.borctakipyonetimi@gmail.com</span> adresinden bize direkt ulaşabilirsiniz.</p>
        </div>
      </div>
    );
  }

  // default to About ("about")
  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl shadow-md border border-indigo-500/30 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 select-none pointer-events-none">
          <Star className="w-32 h-32 text-white animate-spin-slow" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-indigo-500/40 border border-indigo-400/40 text-[10px] font-black tracking-widest uppercase rounded-lg">
            Sürüm 5.0 Ultimate Edition
          </span>
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <h3 className="text-xl font-black tracking-tight leading-none">
          Borç Takip & Bütçe Yönetim Sistemi
        </h3>
        <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-xl">
          Bireysel ve hanehalkı bütçe akışınızı planlamak, borç yükünüzü optimize etmek ve yapay zeka entegrasyonuyla finansal riskleri erkenden saptamak üzere geliştirilmiş üstün asistanlık yazılımı.
        </p>
      </div>

      {/* Core Systems Feature Bento Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          SİSTEM ENTEGRASYONLARI VE YETENEKLERİ
        </h4>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Card 1: Debt Tracker */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:border-indigo-100 dark:hover:border-slate-700 transition">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Dinamik Borç Takibi</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                Tek seferlik ve taksitli borçların her birini faiz, vade (SKT) ve ödeme durumları ile kayıt altına alan altyapı.
              </p>
            </div>
          </div>

          {/* Card 2: AI Advisor */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:border-emerald-100 dark:hover:border-slate-700 transition">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Yapay Zeka Danışmanı</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                Gemini AI veri motoruyla desteklenen, gelir ve harcama profilinize analiz yapan akıllı bütçe asistanı.
              </p>
            </div>
          </div>

          {/* Card 3: Charts & Statistics */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:border-amber-100 dark:hover:border-slate-700 transition">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Görsel İstatistikler</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                Bütçe dağılımlarını, ödeme ilerleme durumlarını ve borç-gelir oranını pürüzsüz interaktif SVG grafiklerle sunan ekranlar.
              </p>
            </div>
          </div>

          {/* Card 4: Local Storage Safety */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-3 hover:border-blue-100 dark:hover:border-slate-700 transition">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Yüzde Yüz Veri Güvenliği</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                Tüm mali bilgileriniz sadece sizin tarayıcınızda (Local Storage) barındırılır, harici sunucularla kesinlikle paylaşılmaz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Developer and License Badge Block */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase leading-none">GELİŞTİRİCİ SİSTEM BİLGİSİ</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Serkan SAĞLAM tarafından MIT Açık Kaynak ile tasarlanmıştır.</p>
          </div>
        </div>
        <span className="self-start sm:self-center px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 text-[10px] font-extrabold rounded-lg">
          React SPA / ESM Engine
        </span>
      </div>
    </div>
  );
};
