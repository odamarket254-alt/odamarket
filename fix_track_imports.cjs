const fs = require('fs');
let content = fs.readFileSync('src/pages/TrackOrderPage.tsx', 'utf8');

content = content.replace(
  'import { Package, Search, ChevronRight, CheckCircle2, Clock, Truck, FileText, AlertCircle, MapPin } from "lucide-react";',
  'import { Package, Search, ChevronRight, CheckCircle2, Clock, Truck, FileText, AlertCircle, MapPin, XCircle } from "lucide-react";'
);

fs.writeFileSync('src/pages/TrackOrderPage.tsx', content);
