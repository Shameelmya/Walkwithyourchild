// Rasterised A4 PDF: html2canvas renders the browser-shaped text (Malayalam conjuncts stay correct).
export const A4W = 794; // px at 96dpi
export const A4H = 1123;

export async function elementsToPdf(els: HTMLElement[]): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  await document.fonts.ready;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let first = true;
  for (const el of els) {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: false, logging: false, windowWidth: A4W });
    const pageHpx = Math.floor((canvas.width * 297) / 210);
    for (let y = 0; y < canvas.height; y += pageHpx) {
      const h = Math.min(pageHpx, canvas.height - y);
      if (h < 40 && y > 0) break;
      const slice = document.createElement('canvas');
      slice.width = canvas.width; slice.height = pageHpx;
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (!first) pdf.addPage();
      first = false;
      pdf.addImage(slice.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297);
    }
  }
  return pdf.output('blob');
}

export function printNow() {
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}
