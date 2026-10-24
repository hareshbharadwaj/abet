import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { Order } from '../../../types';
import { Button } from '../ui/button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoiceHTML } from '../../../utils/emailService';
import { LOGO_DATA_URI } from '../../../utils/logoDataUri';
import { SEAL_SIGNATURE_ORIGINAL_DATA_URI } from '../../../utils/sealDataUri';

export function PublicInvoicePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const orderRef = doc(firestore, 'orders', orderId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          const data = snap.data();
          const createdAt = data.createdAt?.toDate 
            ? data.createdAt.toDate().toISOString() 
            : (data.createdAt?.seconds 
                ? new Date(data.createdAt.seconds * 1000).toISOString() 
                : data.createdAt);
          setOrder({ id: snap.id, ...data, createdAt } as Order);
        } else {
          toast.error('Invoice not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        toast.error('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const downloadPDF = async () => {
    if (!order) return;
    toast.loading('Generating invoice PDF...', { id: 'pdf-gen' });
    let iframe: HTMLIFrameElement | null = null;
    try {
      iframe = document.createElement('iframe');
      iframe.style.cssText =
        'position:fixed;left:0;top:0;width:794px;height:1080px;border:none;z-index:-9999;opacity:0.01;pointer-events:none;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 794px; height: 1080px; overflow: hidden; background: #1a1a1a; font-family: sans-serif; }
        </style>
      </head><body>${generateInvoiceHTML(order, LOGO_DATA_URI, SEAL_SIGNATURE_ORIGINAL_DATA_URI)}</body></html>`);
      iframeDoc.close();

      // Wait for images to load
      await new Promise<void>((resolve) => {
        const imgs = Array.from(iframeDoc.querySelectorAll('img')) as HTMLImageElement[];
        if (imgs.length === 0) { resolve(); return; }
        let done = 0;
        const checkDone = () => {
          done++;
          if (done >= imgs.length) resolve();
        };
        imgs.forEach(img => {
          if (img.complete && img.naturalWidth > 0) {
            checkDone();
          } else {
            img.onload = checkDone;
            img.onerror = checkDone;
          }
        });
        setTimeout(resolve, 800);
      });

      // Convert img elements into canvas elements inside iframeDoc so html2canvas renders them with 100% fidelity
      const imgsToConvert = Array.from(iframeDoc.querySelectorAll('img')) as HTMLImageElement[];
      imgsToConvert.forEach(img => {
        try {
          const canvas = iframeDoc.createElement('canvas');
          const nw = img.naturalWidth || img.width || 200;
          const nh = img.naturalHeight || img.height || 200;
          canvas.width = nw;
          canvas.height = nh;
          canvas.style.cssText = img.style.cssText;
          if (img.getAttribute('width')) canvas.style.width = img.getAttribute('width') + 'px';
          if (img.getAttribute('height')) canvas.style.height = img.getAttribute('height') + 'px';
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, nw, nh);
            img.parentNode?.replaceChild(canvas, img);
          }
        } catch (e) {
          console.error('Failed to convert image to canvas:', e);
        }
      });


      const iframeWin = iframe.contentWindow as any;
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const check = setInterval(() => {
          if (iframeWin?.html2pdf) {
            clearInterval(check);
            resolve();
          } else if (++attempts > 80) {
            clearInterval(check);
            reject(new Error('PDF library failed to load'));
          }
        }, 100);
      });

      const opt = {
        margin: 0,
        filename: `A2Zee-Invoice-${order.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          imageTimeout: 0,
          backgroundColor: '#1a1a1a',
          logging: false,
          width: 794,
          height: 1080,
          onclone: (clonedDoc: Document) => {
            const imgs = Array.from(clonedDoc.querySelectorAll('img')) as HTMLImageElement[];
            imgs.forEach(img => {
              try {
                const canvas = clonedDoc.createElement('canvas');
                const w = img.offsetWidth || parseInt(img.style.width) || img.width || 200;
                const h = img.offsetHeight || parseInt(img.style.height) || img.height || 70;
                canvas.width = w * 2;
                canvas.height = h * 2;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                canvas.style.display = 'block';
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  img.parentNode?.replaceChild(canvas, img);
                }
              } catch (e) {
                console.error('onclone canvas error:', e);
              }
            });
          }
        },

        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' },
      };

      const invoiceEl = (iframeDoc.body.firstElementChild as HTMLElement) || iframeDoc.body;
      const pdfDataUri: string = await iframeWin.html2pdf()
        .from(invoiceEl)
        .set(opt)
        .output('datauristring');

      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `A2Zee-Invoice-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Invoice PDF downloaded!', { id: 'pdf-gen' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please use the Print option instead.', { id: 'pdf-gen' });
    } finally {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-bold">Loading invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Invoice Not Found</h2>
        <p className="text-gray-500 mb-6 max-w-sm">We couldn't retrieve the invoice details for this order. Please verify the link or contact support.</p>
        <Link to="/">
          <Button className="bg-green-800 hover:bg-green-700 text-white rounded-xl px-6 py-2.5 font-bold text-sm">
            Go to Shop
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-2 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a1a1a] p-4 rounded-2xl border border-[#2e2e2e] shadow-md">
          <Link to="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice - ${order.id}</title>
                        <style>
                          body { margin: 20px; background-color: #1a1a1a; font-family: sans-serif; }
                        </style>
                      </head>
                      <body>
                        ${generateInvoiceHTML(order)}
                        <script>
                          window.onload = function() { window.print(); }
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }}
              variant="outline"
              className="rounded-xl font-bold text-xs h-9 border-[#333333] bg-[#1a1a1a] text-white hover:bg-[#252525] flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Full A4 Invoice Container (Zero Scroll, Responsive Fit) */}
        <div className="bg-[#1a1a1a] rounded-3xl shadow-2xl border border-[#2e2e2e] flex justify-center p-2 sm:p-6 w-full overflow-hidden">
          <div className="w-full max-w-[794px]" dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(order) }} />
        </div>
      </div>
    </div>
  );
}
