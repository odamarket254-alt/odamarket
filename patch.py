import re

with open("src/components/home/sections/HeroBannerSection.tsx", "r") as f:
    content = f.read()

# Replace fallback
content = content.replace(
    'className="max-w-[180px] sm:max-w-[280px] md:max-w-2xl"',
    'className="max-w-[210px] min-[375px]:max-w-[240px] sm:max-w-[280px] md:max-w-2xl"'
)
content = content.replace(
    'text-[8px] sm:text-[10px]',
    'text-[9px] min-[375px]:text-[10px] sm:text-[11px]'
)
content = content.replace(
    'text-[16px] leading-[1.1]',
    'text-[18px] min-[375px]:text-[22px] leading-[1.15]'
)
content = content.replace(
    'text-[9px] sm:text-xs',
    'text-[10px] min-[375px]:text-[12px] sm:text-xs'
)
content = content.replace(
    'max-w-[160px] sm:max-w-[240px]',
    'max-w-[190px] min-[375px]:max-w-[220px] sm:max-w-[240px]'
)
content = content.replace(
    'px-2.5 py-1',
    'px-3 py-1.5'
)

with open("src/components/home/sections/HeroBannerSection.tsx", "w") as f:
    f.write(content)

