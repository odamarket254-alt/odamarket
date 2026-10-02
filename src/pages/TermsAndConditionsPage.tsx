import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  UserCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  RefreshCcw,
  Star,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  CheckCircle2
} from "lucide-react";

export default function TermsAndConditionsPage() {
  const sections = [
    { id: "overview", title: "1. About ODA Market & Scope" },
    { id: "accounts", title: "2. User Accounts, Registration & OTP Security" },
    { id: "products-wholesale", title: "3. Products, Pricing, Retail & Wholesale" },
    { id: "sellers", title: "4. Sellers, Suppliers & Verification" },
    { id: "orders-checkout", title: "5. Placing Orders & WhatsApp Ordering" },
    { id: "payments", title: "6. Payments & M-Pesa Processing" },
    { id: "delivery", title: "7. Delivery, Pickup & Order Tracking" },
    { id: "cancellations-refunds", title: "8. Cancellations, Returns & Refunds" },
    { id: "rewards-coupons", title: "9. Rewards Points & Promotional Coupons" },
    { id: "reviews", title: "10. Product Ratings & Reviews" },
    { id: "support", title: "11. Customer Support & Messaging" },
    { id: "contact", title: "12. Contact Information" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-24 md:pt-28 pb-20 text-[#3A2418]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3A2418] tracking-tight mb-3 flex items-center gap-3.5">
                <FileText className="w-9 h-9 md:w-11 md:h-11 text-[#C65A28] shrink-0" />
                <span>Terms &amp; Conditions</span>
              </h1>
              <p className="text-[#5F5A54] text-base md:text-lg">
                Effective for the ODA Market platform (<span className="font-semibold text-[#3A2418]">odamarket.co.ke</span>)
              </p>
            </div>
            <div className="bg-white px-4 py-3 rounded-xl border border-[#E8DCC9] shadow-xs self-start">
              <span className="text-xs uppercase tracking-wider text-[#8B857D] block font-semibold">
                Last Updated
              </span>
              <span className="text-sm font-bold text-[#3A2418]">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Navigation / Table of Contents */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#E8DCC9] mb-8">
          <h2 className="text-lg font-bold text-[#3A2418] mb-4">
            Table of Contents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="px-3.5 py-2 rounded-lg text-[#5F5A54] hover:text-[#C65A28] hover:bg-[#FAF5EC] transition-colors font-medium flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C65A28] shrink-0" />
                <span>{sec.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-[#E8DCC9] space-y-12">
          {/* 1. Overview */}
          <section id="overview" className="scroll-mt-28">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>1. About ODA Market &amp; Scope</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <p>
                ODA Market (&ldquo;OdaMarket&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates an online marketplace accessible at{" "}
                <span className="font-semibold text-[#3A2418]">odamarket.co.ke</span>, offering fresh groceries, fresh produce, meat &amp; seafood, dairy &amp; eggs, bakery items, beverages, snacks, household goods, electronics, and wholesale products in Kenya.
              </p>
              <p>
                <strong className="text-[#3A2418]">Online-Only Operations:</strong> As stated on our Store Locator page (<Link to="/store-locator" className="text-[#C65A28] hover:underline font-medium">/store-locator</Link>), ODA Market currently operates exclusively online to deliver directly to your doorstep and does not operate physical retail storefronts at this time.
              </p>
              <p>
                By creating an account, placing an order, submitting a form, or otherwise using the ODA Market website, you agree to abide by these Terms &amp; Conditions and our{" "}
                <Link to="/cookie-policy" className="text-[#C65A28] hover:underline font-medium">
                  Cookie Policy
                </Link>.
              </p>
            </div>
          </section>

          {/* 2. Accounts & OTP Security */}
          <section id="accounts" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>2. User Accounts, Registration &amp; OTP Security</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <h3 className="text-lg font-bold text-[#3A2418]">2.1 Account Registration</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  To register an account on <Link to="/register" className="text-[#C65A28] hover:underline font-medium">/register</Link>, you must provide your First Name (minimum 2 characters), Last Name (minimum 2 characters), valid Email Address, valid Phone Number (normalized to the Kenyan <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">+254</code> format), and a Password of at least 6 characters.
                </li>
                <li>
                  Registration also collects your primary delivery address details: County, Town/City, Street Address, and optional Estate, House Number, Apartment, and Delivery Instructions (assisted by Google Maps Places Autocomplete).
                </li>
                <li>
                  You may alternatively sign in or register using <strong className="text-[#3A2418]">Google OAuth</strong> (&ldquo;Continue with Google&rdquo;).
                </li>
                <li>
                  <strong className="text-[#3A2418]">Email Confirmation:</strong> Standard account registration dispatches a confirmation link to your email address. Confirmation links expire after <strong className="text-[#3A2418]">24 hours</strong>, and you can request a resend if needed.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Checkout Modal Phone Verification:</strong> When registering directly through the Checkout Authentication Modal, a 6-digit SMS verification code (valid for 5 minutes) is sent to your phone number to verify your account.
                </li>
              </ul>

              <h3 className="text-lg font-bold text-[#3A2418] pt-2">2.2 Two-Step Login &amp; Email OTP Verification</h3>
              <p>
                To protect customer accounts, signing in with an email address (or phone number) and password requires mandatory server-side two-step verification:
              </p>
              <div className="bg-[#FAF5EC] rounded-xl p-5 border border-[#E8DCC9] grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold text-[#3A2418] block mb-1">6-Digit Email OTP</span>
                  <p>After your password is verified, a 6-digit One-Time Password (OTP) is sent to your registered email address. Session access is withheld until the OTP is verified.</p>
                </div>
                <div>
                  <span className="font-bold text-[#3A2418] block mb-1">10-Minute Code Expiry</span>
                  <p>Each login OTP code expires <strong className="text-[#3A2418]">10 minutes</strong> after it is issued. Requesting a new code or starting a new login invalidates any previous OTP.</p>
                </div>
                <div>
                  <span className="font-bold text-[#3A2418] block mb-1">Attempt &amp; Rate Limits</span>
                  <p>Each OTP allows a maximum of <strong className="text-[#3A2418]">5 verification attempts</strong>. Resending requires a <strong className="text-[#3A2418]">60-second cooldown</strong>, with a maximum of <strong className="text-[#3A2418]">6 OTP requests per 15 minutes</strong> per user.</p>
                </div>
                <div>
                  <span className="font-bold text-[#3A2418] block mb-1">Protected Route Enforcement</span>
                  <p>While an OTP challenge is pending, access to buyer, seller, and admin dashboards is blocked across all tabs and page refreshes.</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#3A2418] pt-2">2.3 Account Management &amp; Deactivation</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  You can manage your Personal Info, Delivery Addresses, and Password in your Account Dashboard (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">/buyer/dashboard/settings</code> and <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">/buyer/dashboard/addresses</code>), which also includes a Delete Account option under Security settings.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Administrative Soft Delete (Account Deactivation):</strong> ODA Market administrators may deactivate or suspend user accounts via Soft Delete. Soft-deleted accounts are immediately signed out and blocked from logging in, while historical order records, delivery addresses, and support tickets are retained in the database for record-keeping and order integrity. Administrators can restore deactivated accounts when appropriate.
                </li>
              </ul>
            </div>
          </section>

          {/* 3. Products, Pricing, Retail & Wholesale */}
          <section id="products-wholesale" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>3. Products, Pricing, Retail &amp; Wholesale</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#3A2418]">Currency &amp; VAT:</strong> All prices on ODA Market are displayed and charged in <strong className="text-[#3A2418]">Kenyan Shillings (KSh / Ksh / KES)</strong>. The Checkout summary specifies that <strong className="text-[#3A2418]">VAT is Included</strong> in the displayed prices.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Promotional &amp; Sale Pricing:</strong> Products may display a regular price alongside a discounted sale price (including Flash Sales, Best Deals of the Week, and Lowest Price Everyday sections). When a sale price is active on a product, the sale price is used as the unit price at checkout.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Wholesale &amp; Bulk Orders:</strong> Certain products are designated as <strong className="text-[#3A2418]">Wholesale</strong> (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">is_wholesale</code>) with a specified Wholesale Price, Minimum Order Quantity (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">wholesale_min_qty</code>), and Wholesale Unit. During server-side checkout validation, if a product is wholesale-enabled and the quantity ordered meets or exceeds its minimum wholesale quantity, the wholesale unit price is applied automatically.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Stock Availability:</strong> Products with zero available stock (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">stock &lt;= 0</code>) are marked &ldquo;Out of Stock&rdquo; and cannot be added to the cart or checked out.
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Sellers, Suppliers & Verification */}
          <section id="sellers" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>4. Sellers, Suppliers &amp; Verification</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#3A2418]">Platform Roles &amp; Catalog Management:</strong> The ODA Market platform supports <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">buyer</code> (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">customer</code>), <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">seller</code> (including <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">supplier</code> accounts normalized to <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">seller</code>), and administrative roles (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">admin</code>, <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">super_admin</code>, <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">moderator</code>, <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">support_agent</code>, <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">content_manager</code>). Product listings, wholesale catalog items, and inventory are managed through the Admin Dashboard.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Account &amp; Business Verification:</strong> Administrators can verify or revoke verification for user and business profiles on the platform to maintain marketplace trust.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Wholesale &amp; Supplier Inquiries:</strong> Buyers may contact ODA Market Support via the Help Center or use WhatsApp Ordering for wholesale and supplier-related inquiries.
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Placing Orders & WhatsApp Ordering */}
          <section id="orders-checkout" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>5. Placing Orders &amp; WhatsApp Ordering</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <h3 className="text-lg font-bold text-[#3A2418]">5.1 Online Checkout Process</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  You must be signed into an authenticated ODA Market account to place an order at <Link to="/checkout" className="text-[#C65A28] hover:underline font-medium">/checkout</Link>.
                </li>
                <li>
                  When you submit an order, our server verifies live product existence and checks that sufficient stock is available for each requested item (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">product.stock &gt;= item.quantity</code>). If stock is insufficient, checkout is declined with an inventory error message.
                </li>
                <li>
                  An order record is generated with a unique reference in the format <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">ODA-XXXXXXXX</code> in <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">pending</code> status.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Inventory Reservation &amp; Deduction:</strong> Product stock is deducted <strong className="text-[#3A2418]">only after payment is successfully verified</strong>. Creating a pending order without completing payment does not reserve or deduct inventory.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Receipts &amp; Invoices:</strong> Once payment is verified, you can download or share an official PNG Order Receipt directly from the order confirmation screen (or forward it to our WhatsApp line), and you can download a PDF Invoice from your <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">My Orders</code> dashboard at any time.
                </li>
              </ul>

              <h3 className="text-lg font-bold text-[#3A2418] pt-2">5.2 WhatsApp Ordering</h3>
              <p>
                ODA Market also provides a <strong className="text-[#3A2418]">WhatsApp Ordering</strong> feature (accessible via the top header bar and <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">/buyer/dashboard/whatsapp-ordering</code>) that compiles your current cart items, estimated total, delivery address, and optional notes into a formatted WhatsApp message sent to our official line (<strong className="text-[#3A2418]">+254 792 867386</strong>).
              </p>
            </div>
          </section>

          {/* 6. Payments */}
          <section id="payments" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>6. Payments &amp; M-Pesa Processing</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#3A2418]">Supported Payment Method:</strong> At checkout, ODA Market processes payments in <strong className="text-[#3A2418]">Kenyan Shillings (KES)</strong> via <strong className="text-[#3A2418]">Safaricom M-Pesa</strong> (powered by the Paystack payment gateway).
                </li>
                <li>
                  <strong className="text-[#3A2418]">Payment Verification:</strong> Every transaction is verified server-side against Paystack&apos;s verification API and/or HMAC-SHA512 signed Paystack webhooks. An order is only confirmed (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">status: &apos;processing&apos;</code>, <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">payment_status: &apos;success&apos;</code>) when Paystack confirms a successful transaction in <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">KES</code> for the exact order total.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Abandoned or Failed Payments:</strong> If the payment window is closed without reference or if Paystack reports a failed transaction, the order is marked as <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">abandoned</code> or <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">failed</code>, no stock is deducted, and an automated payment-failure notification email is sent.
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Delivery, Pickup & Tracking */}
          <section id="delivery" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <Truck className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>7. Delivery, Pickup &amp; Order Tracking</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <h3 className="text-lg font-bold text-[#3A2418]">7.1 Delivery Methods &amp; Fees</h3>
              <p>
                During Cart and Checkout, customers may select from three fulfillment options:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                  <span className="font-bold text-[#3A2418] block text-base mb-1">Standard Delivery</span>
                  <p className="text-[#C65A28] font-bold mb-1">FREE (KSh 0)</p>
                  <p>Estimated delivery: <strong className="text-[#3A2418]">Tomorrow</strong> (default window shown: 8:00 AM &ndash; 10:00 AM).</p>
                </div>
                <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                  <span className="font-bold text-[#3A2418] block text-base mb-1">Express Delivery</span>
                  <p className="text-[#3A2418] font-bold mb-1">KSh 250</p>
                  <p>Estimated delivery: <strong className="text-[#3A2418]">Today</strong>.</p>
                </div>
                <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                  <span className="font-bold text-[#3A2418] block text-base mb-1">Pickup</span>
                  <p className="text-[#C65A28] font-bold mb-1">FREE (KSh 0)</p>
                  <p>Available as a free pickup option at checkout.</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#3A2418] pt-2">7.2 Order Statuses &amp; Live Tracking</h3>
              <p>
                Customers can track orders in real time at <Link to="/track-order" className="text-[#C65A28] hover:underline font-medium">/track-order</Link> using their Order Number (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">ODA-...</code>) and receive automated SMS, email, and in-app notifications as orders move through: <strong className="text-[#3A2418]">Order Placed (Pending)</strong> &rarr; <strong className="text-[#3A2418]">Confirmed / Processing / Packed</strong> &rarr; <strong className="text-[#3A2418]">Ready for Pickup / Shipped</strong> &rarr; <strong className="text-[#3A2418]">Out for Delivery</strong> &rarr; <strong className="text-[#3A2418]">Delivered</strong>.
              </p>
            </div>
          </section>

          {/* 8. Cancellations, Returns & Refunds */}
          <section id="cancellations-refunds" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <RefreshCcw className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>8. Cancellations, Returns &amp; Refunds</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <h3 className="text-lg font-bold text-[#3A2418]">8.1 Order Cancellations</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Per our Help Center guidelines, orders may be cancelled within <strong className="text-[#3A2418]">30 minutes</strong> of placing the order, or by contacting ODA Market Support.
                </li>
                <li>
                  To cancel an order, please contact <strong className="text-[#3A2418]">ODA Market Support</strong> via a Support Ticket, WhatsApp (<strong className="text-[#3A2418]">+254 792 867386</strong>), or phone/email so our team can update the order status to <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">cancelled</code> (which dispatches an automated cancellation confirmation email).
                </li>
              </ul>

              <h3 className="text-lg font-bold text-[#3A2418] pt-2">8.2 Defective or Missing Items, Returns &amp; Refunds</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  If an item in your order is <strong className="text-[#3A2418]">defective or missing</strong>, submit a Support Request via the <Link to="/help-center" className="text-[#C65A28] hover:underline font-medium">Help Center</Link> under the <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">Return / Refund</code> or <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">Product Issue</code> category with your Order Number (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">ODA-...</code>) and we will process a refund.
                </li>
              </ul>
            </div>
          </section>

          {/* 9. Rewards & Coupons */}
          <section id="rewards-coupons" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <Star className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>9. Rewards Points &amp; Promotional Coupons</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#3A2418]">My Rewards Program:</strong> In the Buyer Dashboard (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">/buyer/dashboard/rewards</code>), customers earn <strong className="text-[#3A2418]">1 point for every Ksh 1,000 spent</strong> on eligible orders (credited upon delivery). Points may be redeemed at checkout for discounts at a rate of <strong className="text-[#3A2418]">100 points = Ksh 100 discount</strong>.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Coupon Codes:</strong> Promotional coupon codes may be entered in the Cart or Checkout order summary where applicable.
                </li>
              </ul>
            </div>
          </section>

          {/* 10. Reviews */}
          <section id="reviews" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <Star className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>10. Product Ratings &amp; Reviews</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#3A2418]">Verified Delivery Requirement:</strong> Buyers can submit product ratings (1 to 5 stars) and written reviews from the <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">My Orders</code> page (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">/buyer/dashboard/orders</code>) only after the corresponding order status is marked as <strong className="text-[#3A2418]">Delivered</strong>.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Moderation:</strong> Submitted reviews are linked to your user account, order ID, and product ID, and are subject to review moderation (approval or rejection) by ODA Market administrators.
                </li>
              </ul>
            </div>
          </section>

          {/* 11. Customer Support & Messaging */}
          <section id="support" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4 flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-[#C65A28] shrink-0" />
              <span>11. Customer Support &amp; Messaging</span>
            </h2>
            <div className="space-y-4 text-[#5F5A54] leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#3A2418]">Support Tickets:</strong> Authenticated users can submit support tickets via the <Link to="/help-center" className="text-[#C65A28] hover:underline font-medium">Help Center</Link> across categories including <em>Order Issue, Payment Issue, Delivery Issue, Product Issue, Return / Refund, Account Issue, Supplier Issue, Technical Issue,</em> and <em>Other</em>. Each ticket is assigned a reference (<code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">ODA-YYYYMMDD-XXX</code>) and can be tracked and replied to at <Link to="/help-center/track" className="text-[#C65A28] hover:underline font-medium">/help-center/track</Link> until marked <code className="text-xs bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E8DCC9]">Closed</code>.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Contact Us Form &amp; WhatsApp Support:</strong> Visitors and customers may also send inquiries via the <Link to="/contact" className="text-[#C65A28] hover:underline font-medium">Contact Us</Link> page or chat directly with ODA Market Support on WhatsApp at <strong className="text-[#3A2418]">+254 792 867386</strong>.
                </li>
                <li>
                  <strong className="text-[#3A2418]">Phone Support Hours:</strong> Phone support is available Monday to Friday from 8:00 AM to 5:00 PM at <strong className="text-[#3A2418]">+254 792 867386</strong> (<strong className="text-[#3A2418]">0792867386</strong>).
                </li>
              </ul>
            </div>
          </section>

          {/* 12. Contact Us */}
          <section id="contact" className="scroll-mt-28 border-t border-[#E8DCC9] pt-10">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-4">
              12. Contact Information
            </h2>
            <p className="text-[#5F5A54] leading-relaxed mb-6">
              For questions regarding these Terms &amp; Conditions, orders, deliveries, or support requests, you can reach ODA Market through our official channels:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF5EC] p-5 rounded-xl border border-[#E8DCC9] flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#C65A28]/10 flex items-center justify-center shrink-0 text-[#C65A28]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8B857D] block mb-1">
                    Email
                  </span>
                  <a
                    href="mailto:info@odamarket.co.ke"
                    className="text-sm font-bold text-[#3A2418] hover:text-[#C65A28] transition-colors block break-all"
                  >
                    info@odamarket.co.ke
                  </a>
                  <a
                    href="mailto:privacy@odamarket.co.ke"
                    className="text-xs text-[#5F5A54] hover:text-[#C65A28] transition-colors block mt-1 break-all"
                  >
                    privacy@odamarket.co.ke
                  </a>
                </div>
              </div>

              <div className="bg-[#FAF5EC] p-5 rounded-xl border border-[#E8DCC9] flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#C65A28]/10 flex items-center justify-center shrink-0 text-[#C65A28]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8B857D] block mb-1">
                    Phone &amp; WhatsApp
                  </span>
                  <a
                    href="tel:+254792867386"
                    className="text-sm font-bold text-[#3A2418] hover:text-[#C65A28] transition-colors block"
                  >
                    +254 792 867386
                  </a>
                  <span className="text-xs text-[#5F5A54] block mt-1">
                    0792867386 (Mon&ndash;Fri, 8am&ndash;5pm)
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF5EC] p-5 rounded-xl border border-[#E8DCC9] flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#C65A28]/10 flex items-center justify-center shrink-0 text-[#C65A28]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8B857D] block mb-1">
                    Location
                  </span>
                  <span className="text-sm font-bold text-[#3A2418] block">
                    Nairobi, Kenya
                  </span>
                  <Link
                    to="/contact"
                    className="text-xs text-[#C65A28] hover:underline font-medium block mt-1"
                  >
                    Visit Contact Page &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
