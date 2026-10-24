import { Order } from '../types';
import { LOGO_DATA_URI } from './logoDataUri';
import { SEAL_SIGNATURE_DATA_URI } from './sealDataUri';

/**
 * Helper to safely parse any date format (Firestore Timestamp, object with seconds/_seconds, ISO string, or number)
 */
export function parseOrderDate(dateVal: any): Date {
  if (!dateVal) return new Date();
  
  // 1. If it's a Date instance, verify validity
  if (dateVal instanceof Date) {
    return !isNaN(dateVal.getTime()) ? dateVal : new Date();
  }

  // 2. Firestore Timestamp instance (has toDate function)
  if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    try {
      const d = dateVal.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch (e) {}
  }

  // 3. Serialized Firestore timestamp object ({ seconds: 123 } or { _seconds: 123 })
  const seconds = dateVal?.seconds ?? dateVal?._seconds;
  if (seconds !== undefined && seconds !== null) {
    const secNum = Number(seconds);
    if (!isNaN(secNum) && secNum > 0) {
      return new Date(secNum * 1000);
    }
  }

  // 4. Millisecond timestamp number or numeric string
  if (typeof dateVal === 'number' || (typeof dateVal === 'string' && !isNaN(Number(dateVal)) && Number(dateVal) > 1000000000)) {
    const num = Number(dateVal);
    const d = new Date(num);
    if (!isNaN(d.getTime())) return d;
  }

  // 5. String or ISO representation
  try {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {}

  // 6. Absolute fallback: current Date
  return new Date();
}

/**
 * Formats the invoice as a plain text string similar to the demo template.
 */
export function generateInvoiceText(order: Order): string {
  const dateObj = parseOrderDate(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-IN');
  const paymentMethodLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';

  let itemsSection = '';
  order.items.forEach((item) => {
    const qty = item.quantity;
    const desc = item.productName;
    const price = item.price.toFixed(2);
    const amount = (item.price * item.quantity).toFixed(2);
    itemsSection += `${qty.toString().padEnd(5)}${desc.padEnd(40)}₹ ${price.padEnd(10)}₹ ${amount}\n`;
  });

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return `
A2Zee Microgreenz Pvt. Ltd.
No. 1, Sivaswamy Avenue, MGR Salai, Palavakkam, Chennai - 600041
Phone / WhatsApp: +91 73388 40084
FSSAI Lic No: 22426550001482

--------------------------------------------------
INVOICE - ORGANIC SOIL-LESS HYDROPONIC SUPERFOODS
--------------------------------------------------

BILL TO:
Name: ${order.userName}
Phone: ${order.userPhone}
Email: ${order.userEmail || 'N/A'}
Address:
${order.address.line1}
${order.address.line2 ? order.address.line2 + '\n' : ''}${order.address.city}, ${order.address.state} - ${order.address.pincode}

--------------------------------------------------
Invoice #: ${order.id}
Invoice Date: ${dateStr}
Payment Terms: ${paymentMethodLabel}
--------------------------------------------------

QTY  DESCRIPTION                             UNIT PRICE  AMOUNT (₹)
${itemsSection}
--------------------------------------------------
Subtotal:                                       ₹ ${subtotal.toFixed(2)}
Delivery Fee:                                   FREE
TOTAL AMOUNT:                                   ₹ ${order.totalAmount.toFixed(2)}
==================================================
Thank you for supporting fresh, organic microgreen superfoods towards a healthy India!
`.trim();
}

/**
 * Formats the invoice as a beautiful, dark-mode PDF/Print layout.
 */
export function generateInvoiceHTML(order: Order, logoSrc: string = LOGO_DATA_URI, sealSrc: string = SEAL_SIGNATURE_DATA_URI): string {
  const dateObj = parseOrderDate(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-IN');
  const dueDateObj = new Date(dateObj);
  dueDateObj.setDate(dueDateObj.getDate() + 7);
  const dueDateStr = dueDateObj.toLocaleDateString('en-IN');

  let itemsRows = '';
  order.items.forEach((item) => {
    const rowAmount = (item.price * item.quantity).toFixed(2);
    const unitLabel = item.productName.toLowerCase().includes('box') || item.productName.toLowerCase().includes('gms') ? 'boxes' : 'Kg';
    
    itemsRows += `
      <tr style="border-bottom: 1px solid #333333;">
        <td style="padding: 12px; text-align: center; color: #ffffff; font-family: sans-serif; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 12px; text-align: left; color: #ffffff; font-family: sans-serif; font-size: 13px;">${item.productName}</td>
        <td style="padding: 12px; text-align: right; color: #ffffff; font-family: sans-serif; font-size: 13px;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: center; color: #ffffff; font-family: sans-serif; font-size: 13px;">${unitLabel}</td>
        <td style="padding: 12px; text-align: right; color: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 700;">₹${rowAmount}</td>
      </tr>
    `;
  });

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeLogo = logoSrc || LOGO_DATA_URI;
  const activeSeal = sealSrc || SEAL_SIGNATURE_DATA_URI;

  return `
    <div style="font-family: sans-serif; width: 100%; max-width: 794px; min-height: 1000px; margin: 0 auto; padding: 30px 25px 25px 25px; background-color: #1a1a1a; color: #ffffff; box-sizing: border-box; position: relative; border-radius: 16px;">
      <!-- Header Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="vertical-align: middle; text-align: left;">
            <div style="background-color: #ffffff; padding: 6px; border-radius: 12px; width: 72px; height: 72px; display: inline-block; vertical-align: middle; margin-right: 15px; box-sizing: border-box; overflow: hidden;">
              <img src="${activeLogo}" alt="A2Zee Logo" width="60" height="60" style="width: 60px; height: 60px; min-width: 60px; min-height: 60px; display: block; border: none;" />
            </div>
            <div style="display: inline-block; vertical-align: middle; text-align: left;">
              <strong style="font-size: 18px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 4px; font-family: sans-serif;">A2Zee Microgreenz Pvt. Ltd.</strong>
              <span style="font-size: 11px; color: #a3a3a3; display: block; margin-bottom: 2px; font-family: sans-serif;">No. 1, Sivaswamy Avenue, MGR Salai, Palavakkam, Chennai - 600041</span>
              <span style="font-size: 11px; color: #a3a3a3; display: block; margin-bottom: 2px; font-family: sans-serif;">Phone / WhatsApp: +91 73388 40084</span>
              <span style="font-size: 11px; color: #a3a3a3; display: block; font-family: sans-serif;">FSSAI Lic No: 22426550001482</span>
            </div>
          </td>
          <td style="vertical-align: middle; text-align: right; width: 140px;">
            <h2 style="margin: 0; font-size: 28px; font-weight: 900; color: #82bda1; font-family: sans-serif; letter-spacing: 0.5px;">INVOICE</h2>
            <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: 800; display: block; margin-top: 4px; font-family: sans-serif;">Organic Soil-less Hydroponic Superfoods</span>
          </td>
        </tr>
      </table>

      <!-- Middle Info block -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="width: 55%; vertical-align: top; text-align: left; padding-right: 15px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: 800; display: block; margin-bottom: 8px; font-family: sans-serif;">BILL TO</span>
            <strong style="font-size: 16px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 6px; font-family: sans-serif;">${order.userName}</strong>
            <span style="font-size: 12px; color: #a3a3a3; display: block; line-height: 1.4; font-family: sans-serif;">
              ${order.address.line1}${order.address.line2 ? ' ,' + order.address.line2 : ''}<br />
              ${order.address.city}, ${order.address.state} - ${order.address.pincode}
            </span>
            <span style="font-size: 12px; color: #a3a3a3; display: block; margin-top: 6px; font-family: sans-serif;">GST: 33AAQFT9606F1ZW</span>
          </td>
          <td style="width: 45%; vertical-align: top; text-align: right;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #a3a3a3; font-size: 12px; font-family: sans-serif; text-align: right; font-weight: 600;">Invoice #:</td>
                <td style="padding: 4px 0; color: #ffffff; font-size: 12px; font-family: monospace; font-weight: 700; text-align: right;">${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #a3a3a3; font-size: 12px; font-family: sans-serif; text-align: right; font-weight: 600;">Invoice Date:</td>
                <td style="padding: 4px 0; color: #ffffff; font-size: 12px; font-family: sans-serif; font-weight: 700; text-align: right;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #a3a3a3; font-size: 12px; font-family: sans-serif; text-align: right; font-weight: 600;">Due Date:</td>
                <td style="padding: 4px 0; color: #ffffff; font-size: 12px; font-family: sans-serif; font-weight: 700; text-align: right;">${dueDateStr}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #a3a3a3; font-size: 12px; font-family: sans-serif; text-align: right; font-weight: 600;">Payment Terms:</td>
                <td style="padding: 4px 0; color: #ffffff; font-size: 12px; font-family: sans-serif; font-weight: 700; text-align: right;">Due within 7 days</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="background-color: #a3c3b2;">
            <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; font-family: sans-serif; width: 60px;">QTY</th>
            <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; font-family: sans-serif;">DESCRIPTION</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; font-family: sans-serif;">UNIT PRICE</th>
            <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; font-family: sans-serif;">UNIT</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; font-family: sans-serif;">AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totals Table -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%; padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 12px; text-align: right; color: #a3a3a3; font-size: 12px; font-family: sans-serif; font-weight: 600;">Subtotal</td>
                <td style="padding: 6px 12px; text-align: right; color: #ffffff; font-size: 12px; font-family: sans-serif; font-weight: 700; width: 100px;">₹${subtotal.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #2e3b2f;">
                <td style="padding: 10px 12px; text-align: right; color: #a3cbb6; font-size: 13px; font-family: sans-serif; font-weight: 800; letter-spacing: 0.5px;">TOTAL</td>
                <td style="padding: 10px 12px; text-align: right; color: #ffffff; font-size: 13px; font-family: sans-serif; font-weight: 800; width: 100px;">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Terms & Conditions + Seal & Signature Footer -->
      <div style="border-top: 1px solid #333333; padding-top: 15px; margin-top: 15px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 55%; vertical-align: top; text-align: left; padding-right: 15px;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: 800; display: block; margin-bottom: 6px; font-family: sans-serif;">TERMS & CONDITIONS</span>
              <span style="font-size: 11px; color: #a3a3a3; display: block; margin-bottom: 3px; font-family: sans-serif;">Payment is due within 7 days of invoice date.</span>
              <span style="font-size: 11px; color: #a3a3a3; display: block; margin-bottom: 12px; font-family: sans-serif;">Please make payments to A2Zee Microgreenz Pvt. Ltd. via bank transfer or UPI.</span>
            </td>
            <td style="width: 45%; vertical-align: bottom; text-align: right;">
              <div style="display: inline-block; text-align: center;">
                <div style="background-color: #ffffff; padding: 6px 10px; border-radius: 10px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  <img src="${activeSeal}" alt="A2Zee Seal & Signature" style="height: 55px; width: auto; max-width: 190px; display: block; border: none;" />
                </div>

                <span style="font-size: 10px; color: #a3a3a3; display: block; margin-top: 4px; font-family: sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Authorized Signatory</span>
              </div>
            </td>
          </tr>
        </table>
        
        <p style="margin-top: 20px; margin-bottom: 0; font-style: italic; color: #82bda1; font-weight: 600; font-size: 12px; font-family: sans-serif; text-align: center;">Thank you for supporting fresh, organic microgreen superfoods towards a healthy India!</p>
      </div>

    </div>
  `;
}

/**
 * Generates an ultra-premium, responsive HTML email template matching the A2ZEE Microgreens design layout.
 */
export function generateOrderNotificationHTML(order: Order, statusOverride?: string): string {
  const currentStatus = statusOverride || order.status || 'accepted';
  const dateObj = parseOrderDate(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const isLocal = typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'));
  const baseOrigin = typeof window !== 'undefined' 
    ? (isLocal ? 'https://a2zee-8c9b1.web.app/' : `${window.location.origin}${window.location.pathname}`)
    : 'https://a2zee-8c9b1.web.app/';
  const cleanOrigin = baseOrigin.endsWith('/') ? baseOrigin : `${baseOrigin}/`;
  const invoiceWebUrl = `${cleanOrigin}#/invoice/${order.id}`;

  const statusConfig: Record<string, { mainTitle: string; subText: string; desc: string }> = {
    pending: {
      mainTitle: 'Pending Approval',
      subText: 'Once your order is accepted, we will update you via email.',
      desc: 'Thank you for shopping with A2ZEE Microgreens. Your order has been successfully received and is currently pending review. Once your order is accepted, we will update you with processing and delivery details.'
    },
    accepted: {
      mainTitle: 'Accepted!',
      subText: "We'll notify you once it's packed & shipped.",
      desc: 'Great news! Your order has been accepted by A2ZEE Microgreens and is now being processed for packing.'
    },
    packed: {
      mainTitle: 'Packed & Sealed!',
      subText: 'Your order is ready for delivery partner pickup.',
      desc: 'Your organic microgreens have been freshly harvested, hygienically packed, and sealed for delivery.'
    },
    out_for_delivery: {
      mainTitle: 'Out for Delivery!',
      subText: 'Our delivery partner will arrive at your address shortly.',
      desc: 'Great news! Your fresh microgreen package is on its way to your doorstep right now.'
    },
    delivered: {
      mainTitle: 'Delivered!',
      subText: 'Thank you for supporting healthy living!',
      desc: 'Your order has been delivered successfully. Enjoy your fresh, nutrient-rich organic superfoods!'
    },
    cancelled: {
      mainTitle: 'Cancelled',
      subText: 'Please contact support if you need assistance.',
      desc: 'Your order status has been updated to Cancelled. If you have any questions, please reach out to our support team.'
    }
  };

  const statusInfo = statusConfig[currentStatus] || {
    mainTitle: `${currentStatus.replace('_', ' ').toUpperCase()}!`,
    subText: 'Thank you for shopping with A2ZEE Microgreens.',
    desc: `Your order status has been updated to ${currentStatus.replace('_', ' ')}.`
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let itemRowsHtml = '';
  order.items.forEach((item) => {
    const itemImg = item.imageUrl || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200';
    itemRowsHtml += `
      <tr style="border-bottom: 1px solid #eef2f0;">
        <td style="padding: 12px; text-align: left; vertical-align: middle;">
          <table style="border-collapse: collapse;">
            <tr>
              <td style="width: 50px; padding-right: 12px; vertical-align: middle;">
                <img src="${itemImg}" alt="${item.productName}" width="50" height="50" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; display: block; border: 1px solid #e2e8f0;" />
              </td>
              <td style="vertical-align: middle;">
                <span style="font-weight: 800; font-size: 14px; color: #1e293b; font-family: sans-serif; display: block;">${item.productName}</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 12px; text-align: center; vertical-align: middle; font-weight: 700; font-size: 14px; color: #475569; font-family: sans-serif;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; vertical-align: middle; font-weight: 800; font-size: 14px; color: #0f172a; font-family: sans-serif;">₹${(item.price * item.quantity).toFixed(0)}</td>
      </tr>
    `;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A2ZEE Microgreens Order Email</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">

    <!-- Top Bar -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; color: #718096;">
      <tr>
        <td style="text-align: left; font-family: sans-serif;">Thank you for choosing A2ZEE Microgreens!</td>
        <td style="text-align: right; font-family: sans-serif;">
          <a href="${invoiceWebUrl}" target="_blank" style="color: #718096; text-decoration: underline;">View this email in your browser</a>
        </td>
      </tr>
    </table>

    <!-- Header Logo & Social Bar -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #edf2f7;">
      <tr>
        <td style="text-align: left; vertical-align: middle;">
          <table style="border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle; padding-right: 8px;">
                <div style="background-color: #2e7d32; width: 32px; height: 32px; border-radius: 10px; text-align: center; line-height: 32px; color: #ffffff; font-size: 18px; font-weight: bold;">🌱</div>
              </td>
              <td style="vertical-align: middle;">
                <span style="font-size: 22px; font-weight: 900; color: #2e7d32; letter-spacing: -0.5px; font-family: sans-serif;">A2ZEE</span>
                <span style="font-size: 11px; font-weight: 800; color: #166534; display: block; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;">MICROGREENS</span>
              </td>
            </tr>
          </table>
        </td>
        <td style="text-align: right; vertical-align: middle;">
          <a href="https://facebook.com" style="text-decoration: none; margin-left: 6px;">
            <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background-color: #2e7d32; text-align: center; line-height: 32px; color: #ffffff; font-size: 14px; font-weight: bold;">f</span>
          </a>
          <a href="https://instagram.com" style="text-decoration: none; margin-left: 6px;">
            <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background-color: #2e7d32; text-align: center; line-height: 32px; color: #ffffff; font-size: 14px;">📸</span>
          </a>
          <a href="https://wa.me/917338840084" style="text-decoration: none; margin-left: 6px;">
            <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background-color: #2e7d32; text-align: center; line-height: 32px; color: #ffffff; font-size: 14px;">💬</span>
          </a>
        </td>
      </tr>
    </table>

    <!-- Hero Status Card (Soft Mint Green Background #f0faf4) -->
    <div style="background-color: #f0faf4; border-radius: 24px; padding: 28px; margin-bottom: 24px; border: 1px solid #dcfce7;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; text-align: left; padding-right: 15px;">
            <!-- Circle Checkmark Icon -->
            <div style="width: 34px; height: 34px; border-radius: 50%; background-color: #2e7d32; color: #ffffff; font-size: 18px; font-weight: bold; line-height: 34px; text-align: center; margin-bottom: 12px; display: inline-block;">✓</div>
            
            <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; color: #1b4332; line-height: 1.2; font-family: sans-serif;">
              Your Order is<br />
              <span style="color: #2e7d32;">${statusInfo.mainTitle}</span>
            </h1>

            <p style="margin: 12px 0 6px 0; font-size: 15px; font-weight: 800; color: #1b4332; font-family: sans-serif;">
              Hello <span style="color: #2e7d32;">${order.userName}</span>,
            </p>

            <p style="margin: 0 0 10px 0; font-size: 13px; color: #374151; line-height: 1.5; font-family: sans-serif;">
              ${statusInfo.desc}
            </p>

            <p style="margin: 0 0 16px 0; font-size: 12px; color: #4b5563; font-weight: 600; font-family: sans-serif;">
              ${statusInfo.subText}
            </p>

            <!-- Green Pill Badge -->
            <div style="display: inline-block; background-color: #2e7d32; color: #ffffff; padding: 7px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; font-family: sans-serif;">
              🌱 We Grow. You Glow.
            </div>
          </td>
          <!-- Hero Graphic Image -->
          <td style="width: 170px; vertical-align: middle; text-align: right;">
            <img src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400" alt="Fresh Microgreens" width="160" height="160" style="width: 160px; height: 160px; object-fit: cover; border-radius: 20px; display: block; margin-left: auto; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(46,125,50,0.15);" />
          </td>
        </tr>
      </table>
    </div>

    <!-- Order Summary Box -->
    <div style="border: 1px solid #e2e8f0; border-radius: 20px; padding: 22px; margin-bottom: 24px; background-color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="text-align: left; vertical-align: middle;">
            <table style="border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle; padding-right: 8px; font-size: 20px;">📋</td>
                <td style="vertical-align: middle;">
                  <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #1b4332; font-family: sans-serif;">Order Summary</h2>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align: right; vertical-align: middle; font-family: sans-serif;">
            <div style="font-size: 13px; font-weight: 800; color: #1b4332;">Order ID: #${order.id}</div>
            <div style="font-size: 11px; color: #718096; margin-top: 2px;">Date: ${dateStr}</div>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f0faf4;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 800; color: #166534; border-radius: 10px 0 0 10px; font-family: sans-serif;">Product</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 800; color: #166534; font-family: sans-serif;">Quantity</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 800; color: #166534; border-radius: 0 10px 10px 0; font-family: sans-serif;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- Subtotal, Delivery, Total Amount -->
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 12px; text-align: right; font-size: 13px; color: #4a5568; font-weight: 600; font-family: sans-serif;">Subtotal</td>
          <td style="padding: 6px 12px; text-align: right; font-size: 13px; color: #1a202c; font-weight: 800; width: 110px; font-family: sans-serif;">₹${subtotal.toFixed(0)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; text-align: right; font-size: 13px; color: #4a5568; font-weight: 600; font-family: sans-serif;">Delivery Charges</td>
          <td style="padding: 6px 12px; text-align: right; font-size: 13px; color: #1a202c; font-weight: 800; width: 110px; font-family: sans-serif;">FREE</td>
        </tr>
        <tr style="background-color: #f0faf4;">
          <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: 900; color: #1b4332; border-radius: 10px 0 0 10px; font-family: sans-serif;">Total Amount</td>
          <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 900; color: #1b4332; border-radius: 0 10px 10px 0; width: 110px; font-family: sans-serif;">₹${order.totalAmount.toFixed(0)}</td>
        </tr>
      </table>
    </div>

    <!-- GPay Payment QR Code Banner -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle; text-align: center; font-family: sans-serif;">
            <div style="font-size: 13px; font-weight: 800; color: #1b4332; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
              💳 Google Pay (GPay) Payment QR
            </div>
            <div style="font-size: 12px; color: #4b5563; margin-bottom: 12px;">
              Scan the QR code below using Google Pay or any UPI app to complete your payment:
            </div>
            <img src="${cleanOrigin}gpay_qr.png" alt="GPay Payment QR Code" width="180" height="180" style="width: 180px; height: 180px; border-radius: 16px; border: 1px solid #cbd5e1; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" />
            <div style="font-size: 12px; font-weight: 800; color: #2e7d32; margin-top: 10px;">
              Amount to Pay: ₹${order.totalAmount.toFixed(0)}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Download Invoice Banner -->
    <div style="background-color: #f8faf9; border: 1px solid #e2e8f0; border-radius: 20px; padding: 16px 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle; text-align: left;">
            <table style="border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle; padding-right: 10px; font-size: 24px;">📄</td>
                <td style="vertical-align: middle; font-family: sans-serif;">
                  <div style="font-size: 13px; font-weight: 700; color: #2d3748;">Your invoice is attached with this email.</div>
                  <div style="font-size: 12px; color: #718096; margin-top: 2px;">You can also download it using the button.</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="vertical-align: middle; text-align: right; width: 160px; font-family: sans-serif;">
            <a href="${invoiceWebUrl}" target="_blank" style="display: inline-block; background-color: #2e7d32; color: #ffffff; font-weight: 800; font-size: 12px; padding: 10px 16px; border-radius: 12px; text-decoration: none; text-align: center;">
              📥 Download Invoice
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Trust Features Bar (4 Columns) -->
    <div style="background-color: #f0faf4; border-radius: 20px; padding: 18px 10px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; text-align: center;">
        <tr>
          <td style="width: 25%; vertical-align: top; padding: 0 4px; font-family: sans-serif;">
            <div style="font-size: 20px; margin-bottom: 4px;">🚚</div>
            <div style="font-size: 11px; font-weight: 800; color: #1b4332; margin-bottom: 2px;">Fast Delivery</div>
            <div style="font-size: 10px; color: #4a5568; line-height: 1.2;">Fresh microgreens delivered to you</div>
          </td>
          <td style="width: 25%; vertical-align: top; padding: 0 4px; border-left: 1px solid #dcfce7; font-family: sans-serif;">
            <div style="font-size: 20px; margin-bottom: 4px;">🍃</div>
            <div style="font-size: 11px; font-weight: 800; color: #1b4332; margin-bottom: 2px;">100% Organic</div>
            <div style="font-size: 10px; color: #4a5568; line-height: 1.2;">Grown with care without chemicals</div>
          </td>
          <td style="width: 25%; vertical-align: top; padding: 0 4px; border-left: 1px solid #dcfce7; font-family: sans-serif;">
            <div style="font-size: 20px; margin-bottom: 4px;">💚</div>
            <div style="font-size: 11px; font-weight: 800; color: #1b4332; margin-bottom: 2px;">Rich in Nutrition</div>
            <div style="font-size: 10px; color: #4a5568; line-height: 1.2;">Packed with vitamins & antioxidants</div>
          </td>
          <td style="width: 25%; vertical-align: top; padding: 0 4px; border-left: 1px solid #dcfce7; font-family: sans-serif;">
            <div style="font-size: 20px; margin-bottom: 4px;">🎧</div>
            <div style="font-size: 11px; font-weight: 800; color: #1b4332; margin-bottom: 2px;">Customer Support</div>
            <div style="font-size: 10px; color: #4a5568; line-height: 1.2;">We're here to help<br /><strong>+91 73388 40084</strong></div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Thank You & Footer -->
    <div style="text-align: center; padding-top: 6px; font-family: sans-serif;">
      <h3 style="margin: 0 0 4px 0; font-family: Georgia, serif; font-style: italic; font-size: 24px; color: #2e7d32; font-weight: 600;">
        Thank you ♡
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #4a5568; font-weight: 600; font-family: sans-serif;">
        for supporting healthy living!
      </p>

      <div style="font-size: 11px; color: #718096; margin-bottom: 10px; font-family: sans-serif;">
        ✉ a2zeemicrogreenz@gmail.com &nbsp;•&nbsp; 🌐 https://a2zeemicrogreenz.com/ &nbsp;•&nbsp; 📍 Chennai, Tamil Nadu, India
      </div>

      <div style="font-size: 10px; color: #a0aec0; font-family: sans-serif;">
        © 2026 A2ZEE Microgreens. All rights reserved.
      </div>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Helper to dispatch emails via Brevo REST API (Primary) with fallback to SMTPJS / Gmail.
 */
export async function sendEmailDispatch(params: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}): Promise<{ success: boolean; message: string }> {
  const { toEmail, toName, subject, htmlContent } = params;

  const rawBrevoKey = (import.meta.env.VITE_BREVO_API_KEY || import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '').trim();
  const senderEmail = (import.meta.env.VITE_SENDER_EMAIL || 'a2zeemicrogreenz@gmail.com').trim();

  // 1. Try Brevo HTTPS REST API first (Bypasses browser CORS & port blocks)
  if (rawBrevoKey && (rawBrevoKey.startsWith('xkeysib-') || rawBrevoKey.startsWith('xsmtpsib-') || rawBrevoKey.length > 20)) {
    try {
      console.log('Dispatching email via Brevo HTTPS REST API…');
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': rawBrevoKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'A2ZEE Microgreens', email: senderEmail },
          to: [{ email: toEmail, name: toName || 'Valued Customer' }],
          subject: subject,
          htmlContent: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok || response.status === 201) {
        console.log('✅ Brevo REST API Email Delivered Successfully!', data);
        return { success: true, message: 'Email delivered via Brevo API!' };
      } else {
        console.error('❌ Brevo API Error response:', data);
        if (data.message && (data.message.includes('unrecognised IP') || data.message.includes('authorised_ips'))) {
          console.warn('⚠️ Brevo IP Restriction Active: Open https://app.brevo.com/security/authorised_ips in your browser to add your IP address or disable IP restriction.');
        } else if (response.status === 401) {
          console.warn('⚠️ Brevo returned 401 Unauthorized. Make sure your API key starts with xkeysib- from https://app.brevo.com/settings/keys/api under the API Keys tab.');
        }
      }
    } catch (brevoErr) {
      console.error('❌ Brevo API dispatch failed:', brevoErr);
    }
  }

  // 2. Try EmailJS API directly (Natively supports CORS in browser)
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

  if (serviceId && templateId && publicKey && !serviceId.includes('smtp-brevo')) {
    try {
      console.log('Dispatching via EmailJS API...');
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: toEmail,
            to_name: toName,
            subject: subject,
            html_content: htmlContent,
          },
        }),
      });

      if (response.ok) {
        console.log('✅ EmailJS Email Delivered Successfully!');
        return { success: true, message: 'Email sent via EmailJS!' };
      }
    } catch (emailJsErr) {
      console.error('EmailJS dispatch error:', emailJsErr);
    }
  }

  // 3. Fallback mock log
  console.group('%cA2ZEE EMAIL DISPATCH (MOCK MODE)', 'color: #047857; font-weight: bold; font-size: 14px;');
  console.log(`To: ${toName} <${toEmail}>`);
  console.log(`Subject: ${subject}`);
  console.groupEnd();
  return { success: true, message: 'Mock email logged!' };
}

/**
 * Sends order details and the formatted email template via email using Brevo API or SMTPJS.
 */
export async function sendOrderEmail(order: Order): Promise<{ success: boolean; message: string }> {
  const currentStatus = order.status || 'pending';
  const emailHTML = generateOrderNotificationHTML(order, currentStatus);
  const recipientEmail = order.userEmail || import.meta.env.VITE_SENDER_EMAIL || 'a2zeemicrogreenz@gmail.com';

  const subject = currentStatus === 'pending'
    ? `A2ZEE Microgreens - Order Received (Pending Approval) (#${order.id})`
    : `A2ZEE Microgreens - Your Order is Accepted! (#${order.id})`;

  return await sendEmailDispatch({
    toEmail: recipientEmail,
    toName: order.userName,
    subject: subject,
    htmlContent: emailHTML
  });
}

/**
 * Sends order status updates (e.g. accepted, packed, out_for_delivery, delivered, cancelled)
 * directly to the customer's email using the template layout.
 */
export async function sendOrderStatusEmail(order: Order, status: string): Promise<{ success: boolean; message: string }> {
  if (!order.userEmail) {
    console.log(`Skipping status update email for order ${order.id}: No customer email provided.`);
    return { success: false, message: 'No email address for customer' };
  }

  const emailHTML = generateOrderNotificationHTML(order, status);
  const statusTitleMap: Record<string, string> = {
    pending: 'Order Pending Approval',
    accepted: 'Order Accepted',
    packed: 'Order Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Order Delivered',
    cancelled: 'Order Cancelled'
  };

  const statusTitle = statusTitleMap[status] || status.replace('_', ' ').toUpperCase();

  return await sendEmailDispatch({
    toEmail: order.userEmail,
    toName: order.userName,
    subject: `A2ZEE Microgreens - ${statusTitle} (#${order.id})`,
    htmlContent: emailHTML
  });
}

