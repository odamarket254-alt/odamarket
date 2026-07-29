import re

with open("src/components/home/HomeSections.tsx", "r") as f:
    content = f.read()

old_block = """    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banners.map((promo, idx) => (
          <motion.div key={idx} whileHover={{ y: -5 }} className={`${promo.bg_color || 'bg-[#D9A62E]/10'} rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group min-h-[220px]`}>"""

new_block = """    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-auto -mx-4 sm:mx-0 sm:w-full">
        {banners.map((promo, idx) => (
          <motion.div key={idx} whileHover={{ y: -5 }} className={`${promo.bg_color || 'bg-[#D9A62E]/10'} rounded-none sm:rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group min-h-[220px]`}>"""

content = content.replace(old_block, new_block)

with open("src/components/home/HomeSections.tsx", "w") as f:
    f.write(content)

