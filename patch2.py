import re

with open("src/components/home/sections/HeroBannerSection.tsx", "r") as f:
    content = f.read()

# Replace wrapper
content = content.replace(
    'className="w-full relative overflow-hidden bg-[#FAF5EC] group rounded-xl md:rounded-2xl shadow-sm aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/6]"',
    'className="w-auto -mx-4 sm:mx-0 sm:w-full relative overflow-hidden bg-[#FAF5EC] group rounded-none sm:rounded-xl md:rounded-2xl shadow-none sm:shadow-sm aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/6]"'
)

with open("src/components/home/sections/HeroBannerSection.tsx", "w") as f:
    f.write(content)

