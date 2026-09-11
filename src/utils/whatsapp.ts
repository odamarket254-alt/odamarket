import { ODAMARKET_WHATSAPP_NUMBER } from "../lib/whatsapp";

export const getWhatsAppLink = (message: string) => {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || ODAMARKET_WHATSAPP_NUMBER;
  const encodedMessage = encodeURIComponent(message);
  
  const cleanNumber = number.replace(/[^0-9]/g, '');
  const finalNumber = cleanNumber.startsWith('0') ? '254' + cleanNumber.substring(1) : cleanNumber;

  // Create universal link that works on both mobile and web
  return `https://wa.me/${finalNumber}?text=${encodedMessage}`;
};
