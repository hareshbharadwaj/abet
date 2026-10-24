import { useState, useMemo } from 'react';
import { Order } from '../../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  X, 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  Package,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { LOGO_DATA_URI } from '../../../utils/logoDataUri';
import { parseOrderDate } from '../../../utils/emailService';

interface MonthlyReportModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthlyReportModal({ orders, isOpen, onClose }: MonthlyReportModalProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Available years from orders data (or default to past 3 years to current year)
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentDate.getFullYear()]);
    orders.forEach(order => {
      if (order.createdAt) {
        const yr = parseOrderDate(order.createdAt).getFullYear();
        if (!isNaN(yr)) years.add(yr);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, currentDate]);

  // Filter orders for selected month & year
  const monthlyOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const d = parseOrderDate(order.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [orders, selectedMonth, selectedYear]);

  // Calculations for summary metrics
  const totalRevenue = useMemo(() => {
    return monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [monthlyOrders]);

  const totalOrdersCount = monthlyOrders.length;

  const deliveredOrdersCount = useMemo(() => {
    return monthlyOrders.filter(o => o.status === 'delivered').length;
  }, [monthlyOrders]);

  const cancelledOrdersCount = useMemo(() => {
    return monthlyOrders.filter(o => o.status === 'cancelled').length;
  }, [monthlyOrders]);

  const codCount = useMemo(() => {
    return monthlyOrders.filter(o => o.paymentMethod === 'cod').length;
  }, [monthlyOrders]);

  const onlineCount = useMemo(() => {
    return monthlyOrders.filter(o => o.paymentMethod !== 'cod').length;
  }, [monthlyOrders]);

  const whatsappCount = useMemo(() => {
    return monthlyOrders.filter(o => (o.orderSource || 'whatsapp') === 'whatsapp').length;
  }, [monthlyOrders]);

  const offlineCount = useMemo(() => {
    return monthlyOrders.filter(o => o.orderSource === 'offline').length;
  }, [monthlyOrders]);

  const webAppCount = useMemo(() => {
    return monthlyOrders.filter(o => o.orderSource === 'app').length;
  }, [monthlyOrders]);

  // Product sales aggregation
  const productSales = useMemo(() => {
    const map: { [name: string]: { name: string; quantity: number; totalRevenue: number; avgPrice: number } } = {};
    let totalUnits = 0;

    monthlyOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = item.quantity || 1;
          const price = item.price || 0;
          const itemTotal = price * qty;
          totalUnits += qty;

          if (!map[item.productName]) {
            map[item.productName] = {
              name: item.productName,
              quantity: 0,
              totalRevenue: 0,
              avgPrice: price,
            };
          }
          map[item.productName].quantity += qty;
          map[item.productName].totalRevenue += itemTotal;
        });
      }
    });

    const list = Object.values(map).map(p => ({
      ...p,
      sharePercent: totalRevenue > 0 ? ((p.totalRevenue / totalRevenue) * 100).toFixed(1) : '0.0'
    }));

    // Sort by revenue descending
    list.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return { list, totalUnits };
  }, [monthlyOrders, totalRevenue]);

  if (!isOpen) return null;

  const monthLabel = MONTH_NAMES[selectedMonth];
  const reportFilename = `A2Zee_Sales_Report_${monthLabel}_${selectedYear}`;

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (monthlyOrders.length === 0) {
      toast.error('No orders found for the selected month to export.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary & Product Breakdown
      const summaryData: (string | number)[][] = [
        ['A2ZEE MICROGREENZ - MONTHLY SALES REPORT'],
        ['Report Period:', `${monthLabel} ${selectedYear}`],
        ['Generated On:', new Date().toLocaleString()],
        [],
        ['EXECUTIVE SUMMARY METRICS'],
        ['Metric', 'Value'],
        ['Total Revenue (₹)', totalRevenue],
        ['Total Orders Placed', totalOrdersCount],
        ['Delivered Orders', deliveredOrdersCount],
        ['Cancelled Orders', cancelledOrdersCount],
        ['Total Units Sold', productSales.totalUnits],
        ['Cash on Delivery (COD) Orders', codCount],
        ['Online Payment Orders', onlineCount],
        ['WhatsApp Form Orders', whatsappCount],
        ['Buy Offline Orders', offlineCount],
        [],
        ['PRODUCT SALES BREAKDOWN'],
        ['Product Name', 'Units Sold', 'Total Revenue (₹)']
      ];

      productSales.list.forEach(item => {
        summaryData.push([
          item.name,
          item.quantity,
          item.totalRevenue
        ]);
      });

      // Add Grand Total row for product sales breakdown
      summaryData.push([
        'GRAND TOTAL',
        productSales.totalUnits,
        totalRevenue
      ]);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Auto-fit column widths
      wsSummary['!cols'] = [
        { wch: 35 },
        { wch: 18 },
        { wch: 22 }
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Sales Summary & Products');

      // Sheet 2: Detailed Orders Log
      const orderHeaders = [
        'Order ID',
        'Date & Time',
        'Customer Name',
        'Phone',
        'Email',
        'Delivery Address',
        'Items Summary',
        'Payment Method',
        'Status',
        'Order Source',
        'Total Amount (₹)'
      ];

      const orderRows: (string | number)[][] = monthlyOrders.map(order => [
        order.id,
        parseOrderDate(order.createdAt).toLocaleString('en-IN'),
        order.userName,
        order.userPhone,
        order.userEmail || 'N/A',
        `${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
        order.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
        order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        order.status.toUpperCase(),
        order.orderSource === 'offline' ? 'Buy Offline' : order.orderSource === 'whatsapp' ? 'WhatsApp Form' : 'Web Store App',
        order.totalAmount
      ]);

      // Add Grand Total row for detailed orders sheet
      orderRows.push([
        'GRAND TOTAL',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        `Total ${monthlyOrders.length} Orders`,
        totalRevenue
      ]);

      const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
      wsOrders['!cols'] = [
        { wch: 22 },
        { wch: 20 },
        { wch: 22 },
        { wch: 15 },
        { wch: 25 },
        { wch: 45 },
        { wch: 40 },
        { wch: 18 },
        { wch: 15 },
        { wch: 16 },
        { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(wb, wsOrders, 'Detailed Orders Log');

      // Write file
      XLSX.writeFile(wb, `${reportFilename}.xlsx`);
      toast.success(`Excel report exported successfully! (${monthlyOrders.length} orders)`);
    } catch (err) {
      console.error('Excel Export Error:', err);
      toast.error('Failed to export Excel report.');
    }
  };

  // Export PDF (.pdf) using html2pdf.js iframe renderer
  const handleExportPDF = async () => {
    if (monthlyOrders.length === 0) {
      toast.error('No orders found for the selected month to export.');
      return;
    }

    setIsExportingPdf(true);
    toast.loading('Generating PDF report...', { id: 'monthly-pdf-gen' });
    let iframe: HTMLIFrameElement | null = null;

    try {
      // Build HTML template for PDF
      const productRowsHtml = productSales.list.map((item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${item.name}</td>
          <td style="padding: 10px 12px; text-align: center; color: #334155; font-weight: 600;">${item.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; color: #047857; font-weight: 700;">₹${item.totalRevenue.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const orderRowsHtml = monthlyOrders.slice(0, 50).map((order, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; font-weight: bold; color: #0f172a;">${order.id}</td>
          <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${parseOrderDate(order.createdAt).toLocaleDateString('en-IN')}</td>
          <td style="padding: 8px 10px; font-size: 11px; font-weight: 600; color: #1e293b;">${order.userName}</td>
          <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}</td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; ${
              order.status === 'delivered' ? 'background: #dcfce7; color: #15803d;' :
              order.status === 'cancelled' ? 'background: #fee2e2; color: #b91c1c;' :
              'background: #fef3c7; color: #b45309;'
            }">${order.status.toUpperCase()}</span>
          </td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: 700; color: #047857;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; color: #1e293b; padding: 28px; width: 794px; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .logo { height: 48px; width: auto; object-fit: contain; }
            .title { font-size: 22px; font-weight: 800; color: #064e3b; margin-bottom: 2px; }
            .subtitle { font-size: 13px; color: #047857; font-weight: 600; }
            .meta { text-align: right; font-size: 12px; color: #64748b; }
            .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; text-align: left; }
            .metric-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            .metric-val { font-size: 20px; font-weight: 800; color: #0f172a; }
            .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 10px; margin-top: 20px; display: flex; align-items: center; gap: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 10px 12px; text-align: left; border-bottom: 1px solid #cbd5e1; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="${LOGO_DATA_URI}" class="logo" alt="Logo" />
              <div>
                <div class="title">A2Zee Microgreenz</div>
                <div class="subtitle">Monthly Sales & Product Performance Report</div>
              </div>
            </div>
            <div class="meta">
              <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${monthLabel} ${selectedYear}</div>
              <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <!-- Metrics Cards -->
          <div class="metrics-grid">
            <div class="metric-card" style="border-left: 4px solid #10b981;">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-val" style="color: #047857;">₹${totalRevenue.toLocaleString('en-IN')}</div>
            </div>
            <div class="metric-card" style="border-left: 4px solid #3b82f6;">
              <div class="metric-label">Total Orders</div>
              <div class="metric-val">${totalOrdersCount}</div>
            </div>
            <div class="metric-card" style="border-left: 4px solid #8b5cf6;">
              <div class="metric-label">Units Sold</div>
              <div class="metric-val">${productSales.totalUnits}</div>
            </div>
            <div class="metric-card" style="border-left: 4px solid #f59e0b;">
              <div class="metric-label">Delivered</div>
              <div class="metric-val">${deliveredOrdersCount}</div>
            </div>
          </div>

          <!-- Breakdown Summary -->
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 12px; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: space-between;">
            <div><strong>Payment Methods:</strong> COD (${codCount}) | Online (${onlineCount})</div>
            <div><strong>Order Channels:</strong> WhatsApp (${whatsappCount}) | Offline (${offlineCount})</div>
          </div>

          <!-- Product Sales Table -->
          <div class="section-title">📦 Product Sales Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th style="text-align: center;">Units Sold</th>
                <th style="text-align: right;">Total Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${productRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #ecfdf5; font-weight: 800; border-top: 2px solid #10b981;">
                <td style="padding: 10px 12px; color: #064e3b;">GRAND TOTAL</td>
                <td style="padding: 10px 12px; text-align: center; color: #064e3b;">${productSales.totalUnits}</td>
                <td style="padding: 10px 12px; text-align: right; color: #047857;">₹${totalRevenue.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Orders Table -->
          <div class="section-title">📋 Monthly Orders Log (Top 50)</div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items Purchased</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${orderRowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>A2Zee Microgreenz • Confidential Internal Report</div>
            <div>Page 1 of 1</div>
          </div>
        </body>
        </html>
      `;

      // Render offscreen iframe
      iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1120px;border:none;z-index:-9999;opacity:0.01;pointer-events:none;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(reportHtml);
      iframeDoc.close();

      // Wait for scripts and images inside iframe
      await new Promise<void>((resolve) => setTimeout(resolve, 800));

      const iframeWin = iframe.contentWindow as any;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `${reportFilename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfDataUri: string = await iframeWin.html2pdf()
        .from(iframeDoc.body)
        .set(opt)
        .output('datauristring');

      // Trigger download
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${reportFilename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PDF report downloaded successfully!', { id: 'monthly-pdf-gen' });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Failed to export PDF report.', { id: 'monthly-pdf-gen' });
    } finally {
      setIsExportingPdf(false);
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-emerald-900 text-white p-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Monthly Sales & Product Report</h2>
              <p className="text-xs text-emerald-100/80 font-medium">Generate total amount, product breakdown & export to Excel or PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {/* Controls Bar: Month & Year Selector */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Select Report Period:
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-10 px-3 text-xs font-bold border border-gray-300 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none flex-1 sm:w-40"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-10 px-3 text-xs font-bold border border-gray-300 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none sm:w-28"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Performance Indicators for Selected Month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Total Revenue</p>
                  <p className="text-lg font-extrabold text-emerald-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Total Orders</p>
                  <p className="text-lg font-extrabold text-gray-900">{totalOrdersCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-700">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Units Sold</p>
                  <p className="text-lg font-extrabold text-gray-900">{productSales.totalUnits}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Delivered</p>
                  <p className="text-lg font-extrabold text-gray-900">{deliveredOrdersCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-gray-400 font-bold uppercase text-[10px]">Channels & Payment:</span>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">COD: {codCount}</Badge>
            <Badge className="bg-blue-50 text-blue-800 border-blue-200">Online: {onlineCount}</Badge>
            <Badge className="bg-purple-50 text-purple-800 border-purple-200">WhatsApp: {whatsappCount}</Badge>
            <Badge className="bg-amber-50 text-amber-900 border-amber-300 font-bold">Buy Offline: {offlineCount}</Badge>
          </div>

          {/* Product Breakdown Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Product Sales Breakdown ({productSales.list.length} Products)
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">
                {monthLabel} {selectedYear}
              </Badge>
            </div>

            {productSales.list.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                No product sales recorded in {monthLabel} {selectedYear}.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-bold sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-center">Units Sold</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productSales.list.map((item, idx) => (
                      <tr key={item.name} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          ₹{item.totalRevenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-200 font-extrabold text-emerald-900 sticky bottom-0">
                    <tr>
                      <td className="py-3 px-4">GRAND TOTAL</td>
                      <td className="py-3 px-4 text-center">{productSales.totalUnits}</td>
                      <td className="py-3 px-4 text-right">₹{totalRevenue.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium text-center sm:text-left">
            Total {monthlyOrders.length} order{monthlyOrders.length !== 1 ? 's' : ''} available for export
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportExcel}
              disabled={monthlyOrders.length === 0}
              className="flex-1 sm:flex-initial bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-2.5 px-4 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel (.xlsx)
            </Button>

            <Button
              onClick={handleExportPDF}
              disabled={monthlyOrders.length === 0 || isExportingPdf}
              className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 px-4 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {isExportingPdf ? 'Exporting...' : 'Export PDF (.pdf)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
