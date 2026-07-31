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
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none flex justify-center"
      >
        <div className="bg-[#FAF5EC] border border-[#D9A62E]/20 shadow-2xl rounded-2xl w-full max-w-[800px] pointer-events-auto overflow-hidden">
          {showSettings ? (
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#3A2418] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#C65A28]" />
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-500 hover:text-[#3A2418] transition-colors rounded-full hover:bg-black/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                {/* Essential */}
                <div className="flex items-start justify-between p-4 bg-white rounded-xl border border-gray-100">
                  <div className="pr-4">
                    <h4 className="font-semibold text-[#3A2418] mb-1">Essential Cookies</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Required for the website to function properly. They cannot be disabled.
                    </p>
                  </div>
                  <div className="flex items-center h-full pt-1">
                    <span className="text-xs font-semibold text-[#C65A28] bg-[#C65A28]/10 px-2 py-1 rounded">Always Active</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-start justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer" onClick={() => togglePreference("analytics")}>
                  <div className="pr-4">
                    <h4 className="font-semibold text-[#3A2418] mb-1">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Help us understand how visitors interact with the website by collecting and reporting information anonymously.
                    </p>
                  </div>
                  <div className="pt-1 pl-2">
                    <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${consent.analytics ? 'bg-[#C65A28]' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${consent.analytics ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>

                {/* Marketing */}
                <div className="flex items-start justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer" onClick={() => togglePreference("marketing")}>
                  <div className="pr-4">
                    <h4 className="font-semibold text-[#3A2418] mb-1">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Used to track visitors across websites to display relevant advertisements.
                    </p>
                  </div>
                  <div className="pt-1 pl-2">
                    <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${consent.marketing ? 'bg-[#C65A28]' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${consent.marketing ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
                
                {/* Personalization */}
                <div className="flex items-start justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer" onClick={() => togglePreference("personalization")}>
                  <div className="pr-4">
                    <h4 className="font-semibold text-[#3A2418] mb-1">Personalization</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Allow the website to remember choices you make and provide enhanced, more personal features.
                    </p>
                  </div>
                  <div className="pt-1 pl-2">
                    <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${consent.personalization ? 'bg-[#C65A28]' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${consent.personalization ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-black/5">
                <Button variant="outline" onClick={() => setShowSettings(false)} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button onClick={handleSavePreferences} className="bg-[#3A2418] hover:bg-[#2A1810] text-white w-full sm:w-auto">
                  Save Preferences
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#D9A62E]/20 flex items-center justify-center shrink-0 text-[#C65A28]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-[#3A2418]">We value your privacy</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies.
                </p>
                <Link to="/cookie-policy" className="text-sm text-[#C65A28] hover:text-[#D9A62E] font-medium transition-colors">
                  Read our Cookie Policy
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                <Button onClick={handleAcceptAll} className="bg-[#3A2418] hover:bg-[#2A1810] text-white w-full">
                  Accept All
                </Button>
                <Button onClick={handleRejectOptional} variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                  Reject Optional
                </Button>
                <button onClick={() => setShowSettings(true)} className="text-sm font-medium text-gray-500 hover:text-[#3A2418] transition-colors py-2">
                  Customize Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
