type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, any> | null;

/** Tiny hyperscript helper: h('div', { class: 'x', onclick }, 'text', child). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}

export function clear(el: Element): void { while (el.firstChild) el.removeChild(el.firstChild); }

export interface ModalHandle { close: () => void; body: HTMLElement; root: HTMLElement; }

let modalStack: ModalHandle[] = [];

export function modal(title: string, content: HTMLElement | ((close: () => void) => HTMLElement), opts: { wide?: boolean; onClose?: () => void; closable?: boolean; cls?: string } = {}): ModalHandle {
  const layer = document.getElementById('modal-layer')!;
  const body = h('div', { class: 'modal-body' });
  const handle: ModalHandle = { close: () => {}, body, root: body };
  const close = () => {
    root.remove();
    modalStack = modalStack.filter((m) => m !== handle);
    opts.onClose?.();
  };
  handle.close = close;
  const root = h('div', { class: 'modal-backdrop', onclick: (e: MouseEvent) => { if (e.target === root && opts.closable !== false) close(); } },
    h('div', { class: `modal panel ${opts.wide ? 'wide' : ''} ${opts.cls ?? ''}` },
      h('div', { class: 'modal-head' }, h('h2', null, title), opts.closable === false ? null : h('button', { class: 'icon-btn', title: 'Close (Esc)', onclick: close }, '✕')),
      body));
  handle.root = root;
  body.appendChild(typeof content === 'function' ? content(close) : content);
  layer.appendChild(root);
  modalStack.push(handle);
  return handle;
}

export function topModal(): ModalHandle | undefined { return modalStack[modalStack.length - 1]; }
export function closeAllModals(): void { [...modalStack].forEach((m) => m.close()); }

export function toast(text: string, kind: 'info' | 'good' | 'bad' | 'quest' | 'roll' = 'info', ms = 3200): void {
  const layer = document.getElementById('toast-layer');
  if (!layer) return;
  const el = h('div', { class: `toast ${kind}` }, text);
  layer.appendChild(el);
  setTimeout(() => el.classList.add('out'), ms - 400);
  setTimeout(() => el.remove(), ms);
}

/** Lightweight tooltip system: any element with data-tip shows it on hover. */
export function installTooltips(): void {
  const tip = h('div', { id: 'tooltip', role: 'tooltip' });
  document.body.appendChild(tip);
  // Hover tooltips are for mouse pointers only: a tap on a touch screen would leave one stuck on screen.
  let anchor: HTMLElement | null = null;
  const hide = () => { anchor = null; tip.style.display = 'none'; };
  const place = (cx: number, cy: number) => {
    const x = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 12, cx + 14));
    const y = Math.max(8, Math.min(window.innerHeight - tip.offsetHeight - 12, cy + 14));
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  };
  document.addEventListener('pointerover', (e) => {
    const t = e.pointerType === 'mouse' ? (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null : null;
    if (!t || !t.dataset.tip) { hide(); return; }
    anchor = t;
    tip.textContent = t.dataset.tip;
    tip.style.display = 'block';
    place(e.clientX, e.clientY);
  });
  document.addEventListener('pointermove', (e) => {
    if (!anchor) return;
    if (e.pointerType !== 'mouse' || !anchor.isConnected) { hide(); return; }
    place(e.clientX, e.clientY);
  });
  // Clicking, typing or scrolling usually changes what is under the pointer: drop the tooltip.
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'scroll']) document.addEventListener(ev, hide, { capture: true, passive: true });
  document.addEventListener('pointerleave', hide);
  // The hovered element can vanish without any pointer event (dialogue advances, screens change).
  new MutationObserver(() => { if (anchor && !anchor.isConnected) hide(); }).observe(document.body, { childList: true, subtree: true });
}

export function bar(value: number, max: number, cls = 'hp', label?: string): HTMLElement {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return h('div', { class: `bar ${cls}` }, h('div', { class: 'fill', style: { width: `${pct}%` } }), h('span', null, label ?? `${value}/${max}`));
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** append() that skips null/false children (for conditional UI). */
export function put(el: Element, ...kids: (Node | string | null | undefined | false)[]): void {
  el.append(...(kids.filter((k) => k !== null && k !== undefined && k !== false) as (Node | string)[]));
}
