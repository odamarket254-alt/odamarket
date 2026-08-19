import AfricasTalking from 'africastalking';
import { createClient } from '@supabase/supabase-js';

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
  
  const apiKey = (process.env.AFRICASTALKING_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const username = (process.env.AFRICASTALKING_USERNAME || '').trim().replace(/^["']|["']$/g, '');
  const senderId = (process.env.AFRICASTALKING_SENDER_ID || '').trim().replace(/^["']|["']$/g, '');

  const credentials = {
    apiKey: apiKey || 'sandbox_key',
    username: username || 'sandbox'
  };

  const africastalking = AfricasTalking(credentials);
  const sms = africastalking.SMS;

  try {
    if (apiKey && username) {
      const response = await sms.send({
        to: [formattedPhone],
        message: message,
        from: senderId || undefined
      });
      
      console.log(`[AFRICAS TALKING] SMS sent to ${formattedPhone}`);
      
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
        return { success: false, error: `Africa's Talking API returned status: ${errorMsg}` };
      }
      
      return { success: true, messageId };
    } else {
      console.log(`[AFRICAS TALKING (Simulated)] 📱 To: ${formattedPhone} | Message: ${message}`);
      return { success: true, messageId: 'simulated_id' };
    }
  } catch (error: any) {
    const errorDetails = error?.response?.data || error?.message || error;
    console.error(`[AFRICAS TALKING] ❌ Failed to send SMS to ${formattedPhone}:`, errorDetails);
    return { success: false, error: `Africa's Talking API Error: ${error?.message || 'Unknown'}` };
  }
}

export async function sendOTP(phone: string, otp: string): Promise<SMSResult> {
  const message = `ODA Market Verification Code\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nDo not share this code with anyone.`;
  return sendSMS(phone, message);
}

export async function sendOrderSMS(orderId: string, phone: string, customerName: string, totalAmount: number): Promise<SMSResult> {
  // Initialize Supabase to get order details and update status
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
  
  let orderNumber = orderId;
  let currentNotes: any = {};
  let supabase = null;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    try {
      const { data: order } = await supabase.from('orders').select('notes').eq('id', orderId).single();
      if (order && order.notes) {
        currentNotes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
        if (currentNotes.orderNumber) {
          orderNumber = currentNotes.orderNumber;
        }
      }
    } catch (e) {
      console.error("Error fetching order notes for SMS:", e);
    }
  }

  // Format message
  const firstName = customerName.split(' ')[0] || 'Customer';
  const displayOrderNumber = orderNumber.startsWith('ORD-') ? orderNumber : `ODA-${orderNumber.substring(0, 8).toUpperCase()}`;
  const message = `Hello ${firstName}, your ODA Market order #${displayOrderNumber} has been received successfully. We are processing your order. Thank you for shopping with ODA Market.`;
  
  // Send SMS
  const result = await sendSMS(phone, message);
  
  // Log status to database without exposing sensitive data
  if (supabase) {
    try {
      const updatedNotes = {
        ...currentNotes,
        sms_status: result.success ? 'sent' : 'failed',
        sms_message_id: result.messageId || null,
        sms_error: result.error || null,
        sms_sent_at: new Date().toISOString()
      };
      
      await supabase
        .from('orders')
        .update({ notes: JSON.stringify(updatedNotes) })
        .eq('id', orderId);
    } catch (e) {
      console.error("Error logging SMS status to database:", e);
    }
  }

  return result;
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
