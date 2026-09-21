import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Terminal, Server, Mail, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import UnconfirmedUsersWidget from "@/components/admin/dashboard/UnconfirmedUsersWidget";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import { runSupabaseAuthDiagnostics, AuthDiagnosticResult } from "@/utils/supabaseAuthDiagnostics";

export default function AdminDeveloperPage() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<AuthDiagnosticResult | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    runCheck();
  }, []);

  const runCheck = async () => {
    setLoading(true);
    try {
      // First try calling our backend endpoint for full server-side context
      const res = await fetch("/api/auth/diagnostics");
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      } else {
        // Fallback to client-side diagnostics function
        const clientData = await runSupabaseAuthDiagnostics();
        setDiagnostics(clientData);
      }
    } catch (err) {
      const clientData = await runSupabaseAuthDiagnostics();
      setDiagnostics(clientData);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/auth/diagnostics/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  if (profile?.role !== "super_admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Developer Tools</h1>
          <p className="text-muted-foreground">Supabase Auth diagnostics, SMTP delivery verification, and system status</p>
        </div>
        <button
          id="btn-refresh-diagnostics"
          onClick={runCheck}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D96A27] hover:bg-[#C65A28] text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Run Auth & SMTP Diagnostics
        </button>
      </div>

      {/* Supabase Auth & SMTP Diagnostics Card */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-[#D96A27]" />
              Supabase Auth & SMTP Delivery Diagnostics
            </CardTitle>
            {diagnostics && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                diagnostics.summary.status === 'healthy' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                  : diagnostics.summary.status === 'warning'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                {diagnostics.summary.status === 'healthy' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {diagnostics.summary.status.toUpperCase()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {loading && !diagnostics ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#D96A27]" />
              <span>Analyzing Supabase Auth configuration and SMTP settings...</span>
            </div>
          ) : diagnostics ? (
            <>
              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-card border border-border space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Confirm Email</span>
                  <div className="flex items-center gap-2">
                    {diagnostics.confirmEmailEnabled ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-foreground">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-foreground">Disabled (Auto-Confirm)</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {diagnostics.confirmEmailEnabled 
                      ? "Requires email verification link upon registration." 
                      : "Users auto-confirmed; Supabase skips email sending."}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Email Provider</span>
                  <div className="flex items-center gap-2">
                    {diagnostics.emailProviderEnabled ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-foreground">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-rose-600" />
                        <span className="text-sm font-semibold text-foreground">Inactive</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supabase email/password auth channel.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">SMTP Delivery Readiness</span>
                  <div className="flex items-center gap-2">
                    {diagnostics.smtpStatus.resendFallbackAvailable ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-foreground">Resend Configured</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-foreground">Check Supabase SMTP</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {diagnostics.smtpStatus.resendFallbackAvailable
                      ? "Bypasses Supabase 3-4 emails/hr rate cap."
                      : "May hit Supabase 3-4/hr rate limits without custom SMTP."}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Action Link Pipeline</span>
                  <div className="flex items-center gap-2">
                    {diagnostics.adminLinkGenerationTest.success ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-foreground">Verified Working</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-foreground">Check Service Key</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {diagnostics.adminLinkGenerationTest.message}
                  </p>
                </div>
              </div>

              {/* Recommendation & Guidance Box */}
              <div className="p-4 rounded-lg bg-[#FAF5EC] dark:bg-stone-900 border border-[#E8DCC8] dark:border-stone-800 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-full bg-[#D96A27]/10 text-[#D96A27] mt-0.5">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Supabase Dashboard SMTP & Confirm Email Settings Checklist
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      If customer registration emails are not arriving in inboxes, check these two sections in the Supabase Dashboard:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                  <div className="p-3 bg-white dark:bg-stone-950 rounded border border-stone-200 dark:border-stone-800 space-y-1.5">
                    <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#D96A27] text-white flex items-center justify-center text-[10px]">1</span>
                      Confirm Email Toggle
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Navigation:</strong> Supabase Dashboard &gt; <em>Authentication</em> &gt; <em>Providers</em> &gt; <em>Email</em>.
                    </p>
                    <p className="text-muted-foreground">
                      Ensure <strong>"Confirm email"</strong> is enabled if you want Supabase to issue confirmation links. If toggled off, signups log in immediately without confirmation.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-950 rounded border border-stone-200 dark:border-stone-800 space-y-1.5">
                    <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#D96A27] text-white flex items-center justify-center text-[10px]">2</span>
                      Custom SMTP Provider
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Navigation:</strong> Supabase Dashboard &gt; <em>Project Settings</em> &gt; <em>Authentication</em> &gt; <em>SMTP Settings</em>.
                    </p>
                    <p className="text-muted-foreground">
                      Turn on <strong>"Enable Custom SMTP"</strong> with your transactional provider (e.g. Resend, SendGrid) to remove the default 3 emails/hr restriction.
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Dispatch Form */}
              <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#D96A27]" />
                  Live Diagnostic Email Delivery Test
                </h4>
                <p className="text-xs text-muted-foreground">
                  Send a test diagnostic verification email to any address to verify end-to-end delivery:
                </p>
                <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="input-diagnostic-test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to test (e.g. your-email@gmail.com)"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#D96A27]"
                    required
                  />
                  <button
                    id="btn-send-diagnostic-test-email"
                    type="submit"
                    disabled={sendingTest}
                    className="px-4 py-2 bg-[#D96A27] hover:bg-[#C65A28] text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className={`h-4 w-4 ${sendingTest ? "animate-pulse" : ""}`} />
                    {sendingTest ? "Sending Test..." : "Send Test Email"}
                  </button>
                </form>

                {testResult && (
                  <div className={`p-3 rounded text-xs font-mono mt-2 ${
                    testResult.success 
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200" 
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200"
                  }`}>
                    {testResult.success ? (
                      <div>
                        ✅ Test email dispatched successfully to <strong>{testResult.email}</strong> via configured mail pipeline!
                      </div>
                    ) : (
                      <div>
                        ❌ Error sending test email: {testResult.error || "Unknown error"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Unconfirmed Email Registrations Diagnostic Widget */}
      <UnconfirmedUsersWidget />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5"/> Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Node ENV:</span> <span className="text-[#C65A28]">production</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uptime:</span> <span>14 days, 3 hours</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Memory Usage:</span> <span>184 MB / 512 MB</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5"/> Recent Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/80 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
{`[2026-06-30T17:15:22Z] INFO: Server started on port 3000
[2026-06-30T17:21:40Z] WARN: Rate limit triggered for IP 192.168.1.1
[2026-06-30T17:25:11Z] INFO: GCS Upload successful (file: invoice.pdf)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

