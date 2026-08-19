const fs = require('fs');
const file = 'src/components/home/sections/ProductGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

if (content.includes("import { ArrowRight, Flame } from 'lucide-react';")) {
  content = content.replace("import { ArrowRight, Flame } from 'lucide-react';", "import { Flame, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';\nimport { useRef } from 'react';");
} else if (content.includes("import { useState, useEffect } from 'react';")) {
  content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, useRef } from 'react';");
  content = content.replace("import { ArrowRight, Flame } from 'lucide-react';", "import { ArrowRight, Flame, ChevronLeft, ChevronRight } from 'lucide-react';");
}

fs.writeFileSync(file, content);
