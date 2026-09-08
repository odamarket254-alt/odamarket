const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

const replacement = `          {/* 3. TRACK ORDER */}
          {stats.activeOrders > 0 ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" /> Active Delivery
                </h2>
                <Link to="/buyer/dashboard/track">
                  <Button variant="outline" size="sm">View All Tracker</Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0 hidden md:block"></div>
                <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-primary -translate-y-1/2 z-0 hidden md:block transition-all duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                  <DeliveryStep icon={CheckCircle2} title="Confirmed" date="Today, 10:00 AM" active={true} completed={true} />
                  <DeliveryStep icon={Package} title="Packed" date="Today, 10:45 AM" active={true} completed={true} />
                  <DeliveryStep icon={Truck} title="Out for Delivery" date="Estimated 2:00 PM" active={true} completed={false} />
                  <DeliveryStep icon={MapPin} title="Delivered" date="Pending" active={false} completed={false} />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 md:p-8 flex flex-col items-center justify-center text-center overflow-hidden relative bg-white dark:bg-card border shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-4xl mx-auto">
                <div className="w-full max-w-[280px] md:max-w-[340px] flex-shrink-0">
                  <img 
                    src="/images/Untitled design.png" 
                    alt="ODA Market Delivery Motorcycle" 
                    className="w-full h-auto object-contain drop-shadow-xl"
                  />
                </div>
                
                <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 max-w-md">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">No Active Delivery</h3>
                  <p className="text-muted-foreground text-base mb-8">
                    You don't have any deliveries on the way right now. Once you place an order, you can track your delivery here.
                  </p>
                  <Link to="/products" className="inline-block">
                    <Button size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all px-8 font-medium">
                      Start Shopping <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}`;

const regex = /\{\/\* 3\. TRACK ORDER \*\/\}[\s\S]*?<\/\s*Card\s*>\s*\)\s*:/;
const regexFull = /\{\/\* 3\. TRACK ORDER \*\/\}[\s\S]*?<\/\s*Link\s*>\s*<\/\s*Card\s*>\s*\)/;

code = code.replace(regexFull, replacement);

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
