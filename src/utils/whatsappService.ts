/**
 * Meta WhatsApp Business Cloud API Integration Service
 * Allows automatic background sending of WhatsApp messages to customers
 * using Meta Cloud API for sender number (e.g., +91 7338840084).
 */

export interface WhatsAppSendResult {
  success: boolean;
  method: 'cloud_api' | 'fallback_link';
  messageId?: string;
  error?: string;
}

export async function sendAutomatedWhatsAppMessage(
  recipientPhone: string,
  messageBody: string
): Promise<WhatsAppSendResult> {
  // Clean phone number format
  let cleanPhone = recipientPhone.replace(/\D/g, '').replace(/^0+/, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const token = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;

  // Fallback link URL if API credentials aren't set up yet
  const fallbackUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageBody)}`;

  if (!token || !phoneNumberId) {
    console.warn("Meta WhatsApp API credentials (VITE_WHATSAPP_ACCESS_TOKEN / VITE_WHATSAPP_PHONE_NUMBER_ID) missing in .env. Falling back to 1-click WhatsApp web link.");
    window.open(fallbackUrl, '_blank');
    return {
      success: true,
      method: 'fallback_link',
      error: 'API keys not set, opened WhatsApp Web'
    };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: messageBody,
        },
      }),
    });

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      console.log('Successfully sent automated WhatsApp message via Meta Cloud API:', data);
      return {
        success: true,
        method: 'cloud_api',
        messageId: data.messages[0].id,
      };
    } else {
      console.error('Meta WhatsApp API returned error, falling back to 1-click WhatsApp link:', data);
      window.open(fallbackUrl, '_blank');
      return {
        success: true,
        method: 'fallback_link',
        error: data.error?.message || 'Cloud API failed',
      };
    }
  } catch (err: any) {
    console.error('Error invoking Meta WhatsApp API, falling back to WhatsApp link:', err);
    window.open(fallbackUrl, '_blank');
    return {
      success: true,
      method: 'fallback_link',
      error: err.message || 'Network error',
    };
  }
}
