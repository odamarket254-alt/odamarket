import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";
import { Send, FileText, LogIn } from "lucide-react";

export default function PublicRFQPage() {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-sm font-medium mb-6">
            <FileText className="h-4 w-4" />
            Request For Quotation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
            Get multiple quotes for your business needs
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tell us what you need, and we'll connect you with top-rated
            suppliers who can fulfill your requirements.
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  Submit your request
                </h3>
                <p className="text-muted-foreground">
                  Describe the products you need, quantity, and deadline.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  Receive quotes
                </h3>
                <p className="text-muted-foreground">
                  Verified suppliers will send you competitive quotes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  Choose the best
                </h3>
                <p className="text-muted-foreground">
                  Compare quotes and select the supplier that fits your needs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border shadow-lg rounded-2xl p-6 md:p-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[64px] pointer-events-none"></div>

          <h2 className="text-2xl font-semibold mb-6 relative z-10 text-foreground">
            Start your RFQ
          </h2>

          {!user ? (
            <div className="text-center py-8 relative z-10">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-foreground">
                Sign in to request
              </h3>
              <p className="text-muted-foreground mb-6">
                You need a buyer account to submit Request for Quotations.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/login">
                  <Button className="w-full h-12 text-md bg-emerald-600 hover:bg-emerald-500 text-white">
                    Login to Account
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-md border-emerald-600/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    Create an Account
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 relative z-10">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-foreground">
                Ready to post?
              </h3>
              <p className="text-muted-foreground mb-6">
                Go to your dashboard to create a detailed Request for Quotation.
              </p>
              <Link to="/buyer/dashboard/rfqs">
                <Button className="w-full h-12 text-md gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                  Go to Dashboard <Send className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
