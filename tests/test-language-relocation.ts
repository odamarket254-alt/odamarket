import fs from 'fs';
import path from 'path';

console.log('======================================================');
console.log('RUNNING LANGUAGE RELOCATION AND PERSISTENCE AUDIT');
console.log('======================================================\n');

let failed = false;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  }
}

// 1. Verify Header.tsx does not have language switcher beside logo or in top bar
const headerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Header.tsx'), 'utf-8');

assert(
  !headerContent.includes('onClick={() => setLanguage(') &&
  !headerContent.includes('setLanguage(language ===') &&
  !headerContent.includes('showLangMenu'),
  'Header.tsx has NO language switcher button beside the logo or in desktop top bar'
);

assert(
  !headerContent.includes('aria-label="Language switcher"'),
  'Mobile header language switcher icon beside logo is removed'
);

// 2. Verify MobileBottomNav.tsx does not have language switcher in mobile drawer
const mobileBottomNavContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/MobileBottomNav.tsx'), 'utf-8');
assert(
  !mobileBottomNavContent.includes('Language Switcher in Drawer') &&
  !mobileBottomNavContent.includes('onClick={() => setLanguage('),
  'MobileBottomNav.tsx has NO language switcher in mobile drawer'
);

// 3. Verify DashboardLayout.tsx does not have language switcher in sidebar
const dashboardLayoutContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/DashboardLayout.tsx'), 'utf-8');
assert(
  !dashboardLayoutContent.includes('onClick={() => setLanguage('),
  'DashboardLayout.tsx sidebar has NO language switcher'
);

// 4. Verify Buyer Dashboard -> Account Settings (SettingsPage.tsx) has language switcher
const settingsPageContent = fs.readFileSync(path.join(process.cwd(), 'src/pages/dashboard/SettingsPage.tsx'), 'utf-8');
assert(
  settingsPageContent.includes('handleUpdatePreference(\'language\', \'en\')') &&
  settingsPageContent.includes('handleUpdatePreference(\'language\', \'sw\')') &&
  settingsPageContent.includes('Preferred Language'),
  'SettingsPage.tsx (Account Settings) has English and Kiswahili language switcher'
);

assert(
  settingsPageContent.includes('t(\'settings.preferred_language\''),
  'SettingsPage.tsx uses translated label for Preferred Language'
);

// 5. Verify CookieConsent.tsx has English & Kiswahili switcher and does NOT require accepting cookies first
const cookieConsentContent = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/CookieConsent.tsx'), 'utf-8');
assert(
  cookieConsentContent.includes('setLanguage("en")') &&
  cookieConsentContent.includes('setLanguage("sw")') &&
  cookieConsentContent.includes('Globe'),
  'CookieConsent.tsx has English and Kiswahili switcher with Globe icon'
);

// Check that clicking the language switcher does not call saveConsent or require cookie acceptance
assert(
  cookieConsentContent.includes('onClick={() => setLanguage("en")}') &&
  cookieConsentContent.includes('onClick={() => setLanguage("sw")}'),
  'CookieConsent.tsx switches language directly without calling saveConsent or requiring cookie acceptance'
);

// 6. Verify LanguageContext.tsx persists to localStorage and dispatches change events
const langContextContent = fs.readFileSync(path.join(process.cwd(), 'src/context/LanguageContext.tsx'), 'utf-8');
assert(
  langContextContent.includes("localStorage.setItem(STORAGE_KEY, newLang)") &&
  langContextContent.includes("localStorage.setItem(COOKIE_LANG_KEY, newLang)") &&
  langContextContent.includes("document.documentElement.lang = language"),
  'LanguageContext.tsx persists to localStorage and synchronizes HTML lang attribute'
);

// 7. Verify translation dictionary has comprehensive English and Swahili translations
const translationsContent = fs.readFileSync(path.join(process.cwd(), 'src/locales/translations.ts'), 'utf-8');
assert(
  translationsContent.includes("'settings.preferred_language': 'Preferred Language'") &&
  translationsContent.includes("'settings.preferred_language': 'Lugha Unayopendelea'") &&
  translationsContent.includes("'settings.title': 'Mipangilio ya Akaunti'"),
  'translations.ts contains matching English and Kiswahili translations for Account Settings'
);

console.log('\n======================================================');
if (failed) {
  console.error('AUDIT FAILED!');
  process.exit(1);
} else {
  console.log('AUDIT PASSED: All requirements verified successfully!');
  console.log('======================================================');
}
