const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

// 1. Remove mock savings generation logic
const mockLogicRegex = /\s*\/\/ 6\. Mock Savings Chart Data[\s\S]*?setSavingsData\(mockSavings\);\s*setStats\(s => \(\{\s*\.\.\.s,\s*rewardPoints: totalPoints,\s*totalSavings: mockSavings\.reduce\(\(sum, item\) => sum \+ item\.amount, 0\)\s*\}\)\);/;
code = code.replace(mockLogicRegex, `
      // 6. Savings (Coming Soon)
      setStats(s => ({
        ...s,
        rewardPoints: totalPoints,
        totalSavings: 0
      }));
      setSavingsData([]);
`);

// 2. Update the StatCard value to say "Coming Soon"
code = code.replace(
  /<StatCard icon=\{TrendingUp\} label="Savings" value=\{`Ksh \$\{stats\.totalSavings\}`\} link="\/buyer\/dashboard\/rewards" \/>/,
  `<StatCard icon={TrendingUp} label="Savings" value="Coming Soon" link="/buyer/dashboard/rewards" />`
);

// 3. Update the Monthly Savings Card UI
const oldCardRegex = /<Card className="p-6">\s*<h2 className="text-lg font-bold mb-4 flex items-center gap-2">\s*<TrendingUp className="w-5 h-5 text-primary" \/> Monthly Savings\s*<\/h2>\s*<div className="mb-6 flex items-baseline gap-2">\s*<span className="text-3xl font-black">Ksh \{stats\.totalSavings\.toLocaleString\(\)\}<\/span>\s*<span className="text-sm text-green-600 font-medium">\+12% this month<\/span>\s*<\/div>\s*<div className="h-48 w-full">\s*<ResponsiveContainer width="100%" height="100%">\s*<AreaChart data=\{savingsData\}>\s*<defs>\s*<linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">\s*<stop offset="5%" stopColor="#C65A28" stopOpacity=\{0\.3\}\/>\s*<stop offset="95%" stopColor="#C65A28" stopOpacity=\{0\}\/>\s*<\/linearGradient>\s*<\/defs>\s*<XAxis dataKey="name" axisLine=\{false\} tickLine=\{false\} tick=\{\{ fontSize: 12 \}\} \/>\s*<Tooltip \/>\s*<Area type="monotone" dataKey="amount" stroke="#C65A28" strokeWidth=\{3\} fillOpacity=\{1\} fill="url\(#colorSavings\)" \/>\s*<\/AreaChart>\s*<\/ResponsiveContainer>\s*<\/div>\s*<\/Card>/;

const newCard = `<Card className="p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-primary text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Coming Soon!
              </span>
            </div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Monthly Savings
            </h2>
            <div className="mb-6 flex items-baseline gap-2 opacity-30">
              <span className="text-3xl font-black text-gray-400">Ksh 0</span>
              <span className="text-sm text-gray-400 font-medium">Track your discounts</span>
            </div>
            <div className="h-48 w-full opacity-30 pointer-events-none filter grayscale">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{name: 'Mon', amount: 100}, {name: 'Tue', amount: 300}, {name: 'Wed', amount: 200}, {name: 'Thu', amount: 400}, {name: 'Fri', amount: 150}, {name: 'Sat', amount: 500}, {name: 'Sun', amount: 350}]}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="amount" stroke="#9ca3af" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>`;

code = code.replace(oldCardRegex, newCard);

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
