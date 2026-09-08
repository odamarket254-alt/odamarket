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
            <Card className="p-8 flex flex-col items-center justify-center text-center overflow-hidden relative border-dashed bg-gradient-to-b from-orange-50/50 to-white">
              <div className="relative w-full max-w-md mx-auto h-32 flex items-center justify-center mb-4">
                {/* Moving road lines */}
                <div className="absolute bottom-4 left-0 w-full h-[3px] overflow-hidden flex opacity-30">
                  <motion.div 
                    className="w-[200%] h-full flex gap-8"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ ease: "linear", duration: 1.5, repeat: Infinity }}
                  >
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-12 h-full bg-primary rounded-full shrink-0"></div>
                    ))}
                  </motion.div>
                </div>
          
                {/* Boda Boda SVG */}
                <motion.div
                  initial={{ x: -10, y: 0 }}
                  animate={{ 
                    x: [0, 8, 0, -8, 0], 
                    y: [0, -6, 0, -3, 0] 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="relative z-10 text-primary drop-shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Frame & Wheels */}
                    <circle cx="5.5" cy="17.5" r="3.5" />
                    <circle cx="18.5" cy="17.5" r="3.5" />
                    <path d="M5.5 14H3v-2l1.5-4h3.5" />
                    <path d="m15 10-2.5-4h-3" />
                    <path d="m15 10 2.5 4H18.5v2" />
                    <path d="M11 14h4" />
                    {/* Handlebars */}
                    <path d="m12.5 6 2-2h2" />
                    {/* Package on the back */}
                    <rect x="1" y="5.5" width="5" height="5" rx="1" fill="currentColor" opacity="0.15" />
                    <rect x="1" y="5.5" width="5" height="5" rx="1" />
                    <path d="M1 8h5" />
                    {/* Rider simple abstract shape */}
                    <path d="M9.5 8c0-1.5.5-2.5 1.5-3" />
                    <circle cx="11.5" cy="4" r="1.5" fill="currentColor" opacity="0.9" />
                  </svg>
                </motion.div>
                
                {/* Small speed lines */}
                <motion.div 
                  className="absolute right-4 top-10 h-1 w-8 bg-gray-200 rounded-full"
                  animate={{ x: [100, -200], opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="absolute right-8 top-16 h-1 w-12 bg-gray-200 rounded-full"
                  animate={{ x: [100, -200], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.5 }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Deliveries</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Your boda boda rider is waiting! Place an order and we'll get it to you fast.
              </p>
              <Link to="/products" className="mt-6 inline-block">
                <Button className="rounded-full shadow-md hover:shadow-lg transition-all px-8">
                  Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          )}`;

const regex = /\{\/\* 3\. TRACK ORDER \(If active\) \*\/\}[\s\S]*?<\/\s*Card\s*>\s*\)\}/;
code = code.replace(regex, replacement);

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
