import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, Shield, Settings, Info } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3A2418] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3A2418] tracking-tight mb-4 flex items-center gap-4">
            <Cookie className="w-10 h-10 text-[#C65A28]" />
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-black/5 prose prose-lg max-w-none">
          <p className="lead text-xl text-gray-700 mb-8">
            At OdaMarket, we believe in being clear and open about how we collect and use data related to you. 
            This Cookie Policy provides detailed information about how and when we use cookies on our platform.
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
                <Info className="w-6 h-6 text-[#D9A62E]" />
                What are cookies?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Cookies do not typically contain any information that personally identifies a user, but personal information that we store about you may be linked to the information stored in and obtained from cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#3A2418] mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-[#C65A28]" />
                How we use cookies
              </h2>
              <div className="grid gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-[#3A2418] mb-2">1. Essential Cookies</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    These cookies are strictly necessary to provide you with services available through our website and to use some of its features. Because these cookies are strictly necessary to deliver the website, you cannot refuse them without impacting how our site functions.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-[#3A2418] mb-2">2. Analytics Cookies</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website and application for you in order to enhance your experience.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-[#3A2418] mb-2">3. Marketing Cookies</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-[#3A2418] mb-2">4. Personalization Cookies</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    These cookies allow our website to remember choices you make when you use our website, such as remembering your login details or language preference. The purpose of these cookies is to provide you with a more personal experience.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#D9A62E]" />
                Managing your cookies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
              </p>
              <Button 
                onClick={() => {
                  localStorage.removeItem('oda_cookie_consent');
                  window.location.reload();
                }}
                className="bg-[#3A2418] hover:bg-[#2A1810] text-white"
              >
                Reset Cookie Preferences
              </Button>
            </section>

            <section className="border-t border-gray-200 pt-8 mt-8">
              <h2 className="text-xl font-bold text-[#3A2418] mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@odamarket.co.ke" className="text-[#C65A28] hover:underline">privacy@odamarket.co.ke</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
