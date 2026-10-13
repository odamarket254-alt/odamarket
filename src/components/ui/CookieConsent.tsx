import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, X, Check, Globe } from "lucide-react";
import { Button } from "./Button";
import { useTranslation } from "../../context/LanguageContext";

type ConsentState = {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

type Language = "en" | "sw";

const translations = {
  en: {
    privacyTitle: "We value your privacy",
    privacyMessage: "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies.",
    policyLink: "Read our Cookie Policy",
    acceptAll: "Accept All",
    rejectOptional: "Reject Optional",
    customizeSettings: "Customize Settings",
    preferencesTitle: "Cookie Preferences",
    alwaysActive: "Always Active",
    back: "Back",
    savePreferences: "Save Preferences",
    essentialTitle: "Essential Cookies",
    essentialDesc: "Required for the website to function properly. They cannot be disabled.",
    analyticsTitle: "Analytics Cookies",
    analyticsDesc: "Help us understand how visitors interact with the website by collecting and reporting information anonymously.",
    marketingTitle: "Marketing Cookies",
    marketingDesc: "Used to track visitors across websites to display relevant advertisements.",
    personalizationTitle: "Personalization",
    personalizationDesc: "Allow the website to remember choices you make and provide enhanced, more personal features.",
    close: "Close",
  },
  sw: {
    privacyTitle: "Tunathamini faragha yako",
    privacyMessage: "Tunatumia vidakuzi kuboresha matumizi yako, kuonyesha maudhui na matangazo yanayokufaa, na kuchanganua trafiki ya tovuti yetu. Kwa kubofya \"Kubali Yote\", unakubali matumizi yetu ya vidakuzi.",
    policyLink: "Soma Sera yetu ya Vidakuzi",
    acceptAll: "Kubali Yote",
    rejectOptional: "Kataa ya Hiari",
    customizeSettings: "Binafsisha Mipangilio",
    preferencesTitle: "Mapendeleo ya Vidakuzi",
    alwaysActive: "Hufanya Kazi Daima",
    back: "Rudi Nyuma",
    savePreferences: "Hifadhi Mapendeleo",
    essentialTitle: "Vidakuzi Muhimu",
    essentialDesc: "Inahitajika ili tovuti ifanye kazi ipasavyo. Haziwezi kulemazwa.",
    analyticsTitle: "Vidakuzi vya Uchanganuzi",
    analyticsDesc: "Hutusaidia kuelewa jinsi wageni wanavyotangamana na tovuti kwa kukusanya na kuripoti taarifa bila majina.",
    marketingTitle: "Vidakuzi vya Matangazo",
    marketingDesc: "Hutumika kufuatilia wageni kwenye tovuti mbalimbali ili kuonyesha matangazo yanayokufaa.",
    personalizationTitle: "Ubinafsishaji",
    personalizationDesc: "Huruhusu tovuti kukumbuka chaguo unazofanya na kutoa vipengele vilivyoboreshwa na vya kibinafsi zaidi.",
    close: "Funga",
  },
};

const defaultConsent: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);
  const { language, setLanguage } = useTranslation();

  const t = translations[language];

  useEffect(() => {
    const savedConsent = localStorage.getItem("oda_cookie_consent");
    if (!savedConsent) {
      setIsVisible(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
        applyConsent(parsed);
      } catch (e) {
        setIsVisible(true);
      }
    }

    const handleOpen = () => {
      setIsVisible(true);
      setShowSettings(true);
    };
    window.addEventListener("oda_open_cookie_preferences", handleOpen);
    return () => window.removeEventListener("oda_open_cookie_preferences", handleOpen);
  }, []);

  const applyConsent = (currentConsent: ConsentState) => {
    // This is where you would initialize/disable analytics, marketing scripts etc.
    if (currentConsent.analytics) {
      // e.g. window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
      console.log("Analytics enabled");
    }
    if (currentConsent.marketing) {
      // e.g. load facebook pixel
      console.log("Marketing enabled");
    }
  };

  const saveConsent = (newConsent: ConsentState) => {
    localStorage.setItem("oda_cookie_consent", JSON.stringify(newConsent));
    setConsent(newConsent);
    applyConsent(newConsent);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    });
  };

  const handleRejectOptional = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
  };

  const togglePreference = (key: keyof ConsentState) => {
    if (key === "essential") return;
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-14 md:bottom-4 left-0 right-0 z-[60] px-3 sm:px-4 md:px-6 pointer-events-none flex justify-center"
      >
        <div className="bg-[#FAF5EC] border border-[#D9A62E]/25 shadow-xl rounded-xl w-full max-w-[760px] pointer-events-auto overflow-hidden">
          {showSettings ? (
            <div className="p-3.5 sm:p-4 md:p-5 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-[#3A2418] flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-[#C65A28]" />
                    {t.preferencesTitle}
                  </h3>
                  <div className="flex items-center text-[10px] sm:text-[11px] font-medium bg-[#3A2418]/5 border border-[#D9A62E]/30 rounded-full p-0.5 shrink-0 gap-1 pl-1.5" aria-label="Language selection">
                    <Globe className="w-3 h-3 text-[#C65A28]" />
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                        language === "en"
                          ? "bg-[#3A2418] text-[#FAF5EC] font-semibold shadow-xs"
                          : "text-[#3A2418]/70 hover:text-[#3A2418]"
                      }`}
                    >
                      English
                    </button>
                    <span className="text-gray-300 px-0.5 select-none">|</span>
                    <button
                      type="button"
                      onClick={() => setLanguage("sw")}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                        language === "sw"
                          ? "bg-[#3A2418] text-[#FAF5EC] font-semibold shadow-xs"
                          : "text-[#3A2418]/70 hover:text-[#3A2418]"
                      }`}
                    >
                      Kiswahili
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-gray-500 hover:text-[#3A2418] transition-colors rounded-full hover:bg-black/5"
                  aria-label={t.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {/* Essential */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-100 gap-3">
                  <div className="pr-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">{t.essentialTitle}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      {t.essentialDesc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] sm:text-xs font-semibold text-[#C65A28] bg-[#C65A28]/10 px-2 py-0.5 rounded">{t.alwaysActive}</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-100 cursor-pointer gap-3" onClick={() => togglePreference("analytics")}>
                  <div className="pr-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">{t.analyticsTitle}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      {t.analyticsDesc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${consent.analytics ? 'bg-[#C65A28]' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${consent.analytics ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-100 cursor-pointer gap-3" onClick={() => togglePreference("marketing")}>
                  <div className="pr-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">{t.marketingTitle}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      {t.marketingDesc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${consent.marketing ? 'bg-[#C65A28]' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${consent.marketing ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
                
                {/* Personalization */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-100 cursor-pointer gap-3" onClick={() => togglePreference("personalization")}>
                  <div className="pr-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">{t.personalizationTitle}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      {t.personalizationDesc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${consent.personalization ? 'bg-[#C65A28]' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${consent.personalization ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row gap-2 justify-end pt-3 border-t border-black/5">
                <Button size="sm" variant="outline" onClick={() => setShowSettings(false)} className="h-8 px-3 text-xs">
                  {t.back}
                </Button>
                <Button size="sm" onClick={handleSavePreferences} className="bg-[#3A2418] hover:bg-[#2A1810] text-white h-8 px-3.5 text-xs">
                  {t.savePreferences}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-3.5 md:p-4 flex flex-col md:flex-row gap-2.5 sm:gap-3 md:gap-4 items-start md:items-center">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D9A62E]/20 flex items-center justify-center shrink-0 text-[#C65A28]">
                      <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#3A2418] truncate">
                      {t.privacyTitle}
                    </h3>
                  </div>

                  {/* Language Switcher: English | Kiswahili */}
                  <div className="flex items-center text-[10px] sm:text-[11px] font-medium bg-[#3A2418]/5 border border-[#D9A62E]/30 rounded-full p-0.5 shrink-0 gap-1 pl-1.5" aria-label="Language selection">
                    <Globe className="w-3 h-3 text-[#C65A28]" />
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                        language === "en"
                          ? "bg-[#3A2418] text-[#FAF5EC] font-semibold shadow-xs"
                          : "text-[#3A2418]/70 hover:text-[#3A2418]"
                      }`}
                      title="English"
                    >
                      English
                    </button>
                    <span className="text-gray-300 px-0.5 select-none">|</span>
                    <button
                      type="button"
                      onClick={() => setLanguage("sw")}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                        language === "sw"
                          ? "bg-[#3A2418] text-[#FAF5EC] font-semibold shadow-xs"
                          : "text-[#3A2418]/70 hover:text-[#3A2418]"
                      }`}
                      title="Kiswahili"
                    >
                      Kiswahili
                    </button>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-gray-600 leading-snug sm:leading-relaxed">
                  {t.privacyMessage}{" "}
                  <Link to="/cookie-policy" className="text-[#C65A28] hover:text-[#D9A62E] font-medium underline transition-colors whitespace-nowrap">
                    {t.policyLink}
                  </Link>
                </p>
              </div>

              <div className="flex flex-row items-center gap-1.5 sm:gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0 justify-end flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="text-[11px] sm:text-xs font-medium text-gray-600 hover:text-[#3A2418] transition-colors py-1 px-1.5 text-center underline decoration-dotted sm:no-underline sm:hover:underline shrink-0"
                >
                  {t.customizeSettings}
                </button>
                <Button
                  size="sm"
                  onClick={handleRejectOptional}
                  variant="outline"
                  className="h-7.5 sm:h-8 px-2.5 sm:px-3 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 font-medium shrink-0"
                >
                  {t.rejectOptional}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="h-7.5 sm:h-8 px-3 sm:px-3.5 text-xs bg-[#3A2418] hover:bg-[#2A1810] text-white font-medium shadow-sm shrink-0"
                >
                  {t.acceptAll}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
