import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getCategoryInfo } from './CategoryItem';
import { currencySymbol } from '@/lib/currency';

const PIE_COLORS = ['#0A1F44', '#C9A45B', '#4A7CA5', '#8B7355', '#2E8B57', '#8B4513', '#4682B4', '#DAA520'];
const money = (n) => (n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (d, f) => format(parseISO(d), f);

function pieChart(byCategory, total) {
  const canvas = document.createElement('canvas');
  canvas.width = 260; canvas.height = 260;
  const ctx = canvas.getContext('2d');
  let angle = -Math.PI / 2;
  byCategory.forEach(([, value], i) => {
    if (value <= 0 || total <= 0) return;
    const slice = (value / total) * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(130, 130); ctx.arc(130, 130, 120, angle, angle + slice); ctx.closePath();
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    angle += slice;
  });
  return canvas.toDataURL('image/png');
}

function expensesPage(trip, expenses, total) {
  const range = trip.start_date && trip.end_date
    ? `${fmt(trip.start_date, 'dd/MM/yyyy')} - ${fmt(trip.end_date, 'dd/MM/yyyy')}`
    : trip.start_date ? fmt(trip.start_date, 'dd/MM/yyyy') : '';
  const th = 'padding:8px 8px;color:#C9A45B;font-size:11px;text-align:right;font-weight:600;';
  const rows = [...expenses]
    .sort((a, b) => (a.date ? (b.date ? a.date.localeCompare(b.date) : -1) : 1))
    .map((e, i) => {
      const bg = i % 2 === 0 ? '#F8F8F9' : '#FFFFFF';
      const orig = e.original_expense_amount != null && e.original_expense_currency
        ? `<span style="white-space:nowrap;">${money(e.original_expense_amount)}&nbsp;${esc(currencySymbol(e.original_expense_currency))}</span>`
        : '-';
      return `<tr style="background:${bg};">
        <td style="padding:6px 8px;color:#33363D;font-size:11px;">${e.date ? fmt(e.date, 'dd/MM/yy') : '-'}</td>
        <td style="padding:6px 8px;color:#33363D;font-size:11px;">${esc(e.title)}</td>
        <td style="padding:6px 8px;color:#50535A;font-size:11px;">${esc(getCategoryInfo(e.category).label)}</td>
        <td style="padding:6px 8px;font-size:11px;width:120px;direction:ltr;text-align:right;">${orig}</td>
        <td style="padding:6px 8px;color:#0A1F44;font-weight:bold;font-size:11px;text-align:right;">₪${money(e.amount)}</td>
      </tr>${e.notes ? `<tr style="background:${bg};"><td></td><td colspan="4" style="padding:1px 8px 6px;color:#888;font-size:10px;font-style:italic;white-space:pre-wrap;">${esc(e.notes)}</td></tr>` : ''}`;
    })
    .join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;direction:rtl;width:794px;background:#fff;">
    <div style="background:#0A1F44;color:white;padding:18px 30px 14px;">
      <div style="font-size:20px;font-weight:bold;margin-bottom:4px;">${esc(trip.name || 'דוח הוצאות')}</div>
      ${trip.destination ? `<span style="font-size:12px;color:#C9A45B;">${esc(trip.destination)}</span>` : ''}
      ${range ? `<span style="font-size:12px;color:#C9A45B;margin-right:12px;">${range}</span>` : ''}
    </div>
    <div style="background:#F3F3F4;padding:8px 30px;border-bottom:2px solid #C9A45B;display:flex;justify-content:space-between;">
      <span style="font-size:12px;color:#50535A;">${expenses.length} הוצאות</span>
      <span style="font-size:14px;font-weight:bold;color:#0A1F44;">סה"כ: ₪${money(total)}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#0A1F44;">
        <th style="${th}">תאריך</th><th style="${th}">תיאור</th><th style="${th}">קטגוריה</th>
        <th style="${th}width:120px;">הוצאה מקורית</th><th style="${th}">סכום (₪)</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="padding:10px 30px;border-top:2px solid #C9A45B;border-bottom:2px solid #E8E8EA;display:flex;justify-content:flex-start;">
      <span style="font-size:14px;font-weight:bold;color:#0A1F44;">סה"כ: ₪${money(total)}</span>
    </div>
  </div>`;
}

function summaryPage(expenses, total) {
  const byCategory = Object.entries(
    expenses.reduce((acc, e) => ((acc[e.category] = (acc[e.category] || 0) + (e.amount || 0)), acc), {})
  ).sort(([, a], [, b]) => b - a);
  const th = 'padding:7px 12px;color:#C9A45B;font-size:11px;font-weight:600;';
  const rows = byCategory.map(([cat, value], i) => `<tr>
      <td style="padding:6px 12px;vertical-align:middle;"><div style="display:inline-block;width:12px;height:12px;background:${PIE_COLORS[i % PIE_COLORS.length]};border-radius:3px;vertical-align:middle;margin-left:6px;"></div><span style="font-size:12px;color:#33363D;vertical-align:middle;">${esc(getCategoryInfo(cat).label)}</span></td>
      <td style="padding:6px 12px;font-size:12px;color:#50535A;text-align:center;">${total > 0 ? ((value / total) * 100).toFixed(1) : '0'}%</td>
      <td style="padding:6px 12px;font-size:12px;font-weight:bold;color:#0A1F44;text-align:left;">₪${money(value)}</td>
    </tr>`).join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;direction:rtl;width:794px;background:#fff;">
    <div style="background:#0A1F44;padding:14px 30px;"><span style="font-size:16px;font-weight:bold;color:white;">סיכום לפי קטגוריה</span></div>
    <div style="display:flex;align-items:center;gap:24px;padding:20px 30px;">
      <img src="${pieChart(byCategory, total)}" width="200" height="200" style="flex-shrink:0;" />
      <table style="flex:1;border-collapse:collapse;">
        <thead><tr style="background:#0A1F44;"><th style="${th}text-align:right;">קטגוריה</th><th style="${th}text-align:center;">אחוז</th><th style="${th}text-align:left;">סכום</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

async function renderToCanvas(html2canvas, html) {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'fixed', top: '-9999px', left: '-9999px', zIndex: '-1' });
  el.innerHTML = html;
  document.body.appendChild(el);
  try {
    return await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794 });
  } finally {
    document.body.removeChild(el);
  }
}

// Cuts the rendered canvas into page-height slices, each embedded once as JPEG.
// (Embedding the whole PNG on every page made long trips 30MB+, which phones fail to save.)
function addCanvas(pdf, canvas, pageW, pageH, newPage) {
  const slicePx = Math.floor((pageH * canvas.width) / pageW);
  for (let top = 0, first = true; top < canvas.height; top += slicePx, first = false) {
    const h = Math.min(slicePx, canvas.height - top);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = h;
    const ctx = slice.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, h);
    ctx.drawImage(canvas, 0, top, canvas.width, h, 0, 0, canvas.width, h);
    if (newPage || !first) pdf.addPage();
    pdf.addImage(slice.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, pageW, (h * pageW) / canvas.width);
  }
}

// Opened synchronously in the tap handler: browsers block tabs opened later, after async work.
function openViewerTab() {
  const win = window.open('', '_blank');
  if (!win) return null;
  win.document.write('<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TripFlow PDF</title></head>'
    + '<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#0A1F44;background:#F3F3F4">מכין את ה-PDF...</body></html>');
  win.document.close();
  return win;
}

// Shows the PDF in the browser's viewer (save/share from there); downloads if no tab could be opened.
function deliver(blob, filename, win) {
  const url = URL.createObjectURL(blob);
  if (win && !win.closed) {
    win.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  // The viewer tab needs the URL while it's open; free it later.
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
}

export default function ExportPDFButton({ trip, expenses }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const win = openViewerTab();
    try {
      // Loaded on demand so the PDF libraries don't slow down app start.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const page1 = await renderToCanvas(html2canvas, expensesPage(trip, expenses, total));
      const page2 = await renderToCanvas(html2canvas, summaryPage(expenses, total));
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight();
      addCanvas(pdf, page1, w, h, false);
      addCanvas(pdf, page2, w, h, true);
      deliver(pdf.output('blob'), `${(trip.name || 'trip').replace(/\s+/g, '_')}_expenses.pdf`, win);
    } catch (err) {
      console.error(err);
      win?.close();
      alert('ייצוא ה-PDF נכשל');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !expenses?.length}
      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-[#0A1F44]/20 bg-[#0A1F44]/5 hover:bg-[#0A1F44]/10 transition-colors disabled:opacity-40"
      title="ייצוא לPDF"
    >
      <FileDown className="w-2.5 h-2.5 text-[#0A1F44]/50" strokeWidth={1.5} />
      <span className="text-[9px] font-medium text-[#0A1F44]/50">{exporting ? '...' : 'PDF'}</span>
    </button>
  );
}
