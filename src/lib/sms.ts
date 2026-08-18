import AfricasTalking from 'africastalking';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  let formatted = phone.trim().replace(/[\s\-()]/g, '');
  if (formatted.startsWith('+')) return formatted;
  if (formatted.startsWith('0')) return '+254' + formatted.substring(1);
  if (formatted.startsWith('254')) return '+' + formatted;
  if (formatted.startsWith('7') || formatted.startsWith('1')) return '+254' + formatted;
  return '+' + formatted;
}

export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  const formattedPhone = formatPhone(phone);

  const credentials = {
    apiKey: process.env.AFRICASTALKING_API_KEY || 'sandbox_key',
    username: process.env.AFRICASTALKING_USERNAME || 'sandbox'
  };

  const africastalking = AfricasTalking(credentials);
  const sms = africastalking.SMS;

  try {
    if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
      const response = await sms.send({
        to: [formattedPhone],
        message: message,
        from: process.env.AFRICASTALKING_SENDER_ID || undefined
      });
      
      console.log(`[AFRICAS TALKING] SMS sent to ${formattedPhone}`);
      
      // Extract messageId from response if possible
      let messageId = undefined;
      let hasError = false;
      let errorMsg = '';
      
      if (response && response.SMSMessageData && response.SMSMessageData.Recipients && response.SMSMessageData.Recipients.length > 0) {
        const rec = response.SMSMessageData.Recipients[0];
        messageId = rec.messageId;
        if (rec.status !== 'Success' && rec.status !== 'Sent') {
          hasError = true;
          errorMsg = rec.status;
        }
      }
      
      if (hasError) {
        console.error(`[AFRICAS TALKING] SMS to ${formattedPhone} resulted in status: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
      
      return { success: true, messageId };
    } else {
      console.log(`[AFRICAS TALKING (Simulated)] 📱 To: ${formattedPhone} | Message: ${message}`);
      return { success: true, messageId: 'simulated_id' };
    }
  } catch (error: any) {
    console.error(`[AFRICAS TALKING] ❌ Failed to send SMS to ${formattedPhone}:`, error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

export async function sendOTP(phone: string, otp: string): Promise<SMSResult> {
  const message = `ODA Market Verification Code\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nDo not share this code with anyone.`;
  return sendSMS(phone, message);
}

export async function sendOrderSMS(phone: string, customerName: string, orderNumber: string, totalAmount: number): Promise<SMSResult> {
  const message = `Hi ${customerName}, your OdaMarket order #${orderNumber} has been received. Total: KES ${totalAmount.toLocaleString()}. We will notify you when your order is confirmed.`;
  return sendSMS(phone, message);
}

export async function sendStatusNotification(phone: string, customerName: string, orderNumber: string, status: string): Promise<SMSResult> {
  const statusMessages: Record<string, string> = {
    'ORDER_RECEIVED': `Hi ${customerName}, we have received your OdaMarket order #${orderNumber}.`,
    'ORDER_CONFIRMED': `Great news ${customerName}, your OdaMarket order #${orderNumber} is confirmed and being processed!`,
    'ORDER_READY': `Hi ${customerName}, your OdaMarket order #${orderNumber} is ready for dispatch.`,
    'OUT_FOR_DELIVERY': `Hi ${customerName}, your OdaMarket order #${orderNumber} is out for delivery! Our rider will contact you soon.`,
    'ORDER_DELIVERED': `Hi ${customerName}, your OdaMarket order #${orderNumber} has been delivered successfully. Thank you for shopping with us!`,
    'ORDER_CANCELLED': `Hi ${customerName}, your OdaMarket order #${orderNumber} has been cancelled. Please contact support for more details.`
  };
  
  const message = statusMessages[status] || `Hi ${customerName}, there is an update on your OdaMarket order #${orderNumber}. Status: ${status}.`;
  return sendSMS(phone, message);
}
