import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { elementsToPdf, printNow } from './pdf';

async function mount(node: ReactNode, host: HTMLElement) {
  const root = createRoot(host);
  flushSync(() => root.render(node));
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 60));
  return root;
}

export async function printNode(node: ReactNode) {
  const host = document.getElementById('print-root')!;
  const root = await mount(node, host);
  const cleanup = () => { root.unmount(); removeEventListener('afterprint', cleanup); };
  addEventListener('afterprint', cleanup);
  printNow();
}

export async function pdfFromNode(node: ReactNode): Promise<Blob> {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px;background:#fff;';
  document.body.appendChild(host);
  const root = await mount(node, host);
  try { return await elementsToPdf(Array.from(host.querySelectorAll<HTMLElement>('.a4'))); }
  finally { root.unmount(); host.remove(); }
}
