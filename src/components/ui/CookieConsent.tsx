import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, X, Check } from "lucide-react";
import { Button } from "./Button";

type ConsentState = {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm sm:text-base font-bold text-[#3A2418] flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-[#C65A28]" />
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-gray-500 hover:text-[#3A2418] transition-colors rounded-full hover:bg-black/5"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {/* Essential */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-100 gap-3">
                  <div className="pr-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">Essential Cookies</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      Required for the website to function properly. They cannot be disabled.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] sm:text-xs font-semibold text-[#C65A28] bg-[#C65A28]/10 px-2 py-0.5 rounded">Always Active</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-gray-100 cursor-pointer gap-3" onClick={() => togglePreference("analytics")}>
                  <div className="pr-2 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">Analytics Cookies</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      Help us understand how visitors interact with the website by collecting and reporting information anonymously.
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
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">Marketing Cookies</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      Used to track visitors across websites to display relevant advertisements.
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
                    <h4 className="text-xs sm:text-sm font-semibold text-[#3A2418]">Personalization</h4>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      Allow the website to remember choices you make and provide enhanced, more personal features.
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
                  Back
                </Button>
                <Button size="sm" onClick={handleSavePreferences} className="bg-[#3A2418] hover:bg-[#2A1810] text-white h-8 px-3.5 text-xs">
                  Save Preferences
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-3.5 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D9A62E]/20 flex items-center justify-center shrink-0 text-[#C65A28]">
                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#3A2418]">We value your privacy</h3>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-snug sm:leading-relaxed">
                  We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.{" "}
                  <Link to="/cookie-policy" className="text-[#C65A28] hover:text-[#D9A62E] font-medium underline transition-colors whitespace-nowrap">
                    Read our Cookie Policy
                  </Link>
                </p>
              </div>
              <div className="flex flex-row items-center gap-1.5 sm:gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0 justify-end flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="text-[11px] sm:text-xs font-medium text-gray-600 hover:text-[#3A2418] transition-colors py-1 px-1.5 text-center underline decoration-dotted sm:no-underline sm:hover:underline shrink-0"
                >
                  Customize Settings
                </button>
                <Button
                  size="sm"
                  onClick={handleRejectOptional}
                  variant="outline"
                  className="h-7.5 sm:h-8 px-2.5 sm:px-3 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 font-medium shrink-0"
                >
                  Reject Optional
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="h-7.5 sm:h-8 px-3 sm:px-3.5 text-xs bg-[#3A2418] hover:bg-[#2A1810] text-white font-medium shadow-sm shrink-0"
                >
                  Accept All
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
