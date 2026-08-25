export const getWhatsAppLink = (message: string) => {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const encodedMessage = encodeURIComponent(message);
  
  // Create universal link that works on both mobile and web
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
};
