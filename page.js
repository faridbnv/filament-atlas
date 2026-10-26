// The static pages' one script (the old pages' page.js and products.js), with no library. Every page reads in full without
// it; it adds:
// - the way back: a tab that came from the selector (m/?from=<its address>, its "Material pages" link, or its drawer's
//   "Full page" link, which keeps the address in sessionStorage 'atlas-question') keeps that question for the tab and drops
//   it from the address, so a copied link never carries it; every [data-return] link then reads "Back to your results"
//   ("Back to the selector" where the question has no requirement, shortlist or chosen product) and opens the selector with
//   the reader's question, its drawer on the material of the page in view (the index keeps the stored one), from a
//   Products page on its Products tab. Where storage is refused, the question rides on the pages' own links instead;
// - the theme button (the selector's choice, localStorage 'h2c-theme'), and a printed page in the light theme;
// - the anchor offset: the measured height of the bar (and of the Products page's sticky controls);
// - the section in view, named in the bar, and its list closing on a choice, Escape or a click outside;
// - a long card's document groups folded to their first rows, each a press from all of them;
// - a card opened at its anchor (#G… a product, #V… a value in it, its folded group opened);
// - lighting: hover or focus anything carrying a product (data-grade) or a material (data-mat), and everything else
//   carrying it lights while the rest fades; a figure's mark names itself in a tooltip; a click on a product's mark goes
//   to its card on the Products page;
// - the first screen's two columns balanced, a data table's cells named for a phone, copying the citation, printing;
// - the Products page's search and sort, and the index's search.
// The content policy allows no style element or attribute in the HTML: what the script sizes it sets through the CSSOM.
(() => {
  const doc = document, root = doc.documentElement;
  const $$ = (sel, el) => [...(el ?? doc).querySelectorAll(sel)];
  const main = doc.querySelector('main[data-page]');
  const kind = main?.dataset.page ?? '';
  const material = main?.dataset.material ?? null;

  // ---------------------------------------------------------------- the way back to the selector
  const KEY = 'atlas-question';
  // The selector's address is its question's JSON, encoded (scenario.ts toHash); a ?from= arrives decoded.
  const parse = (s) => { for (const t of [s, () => decodeURIComponent(s)]) { try { const o = JSON.parse(typeof t === 'function' ? t() : t); if (o && typeof o === 'object') return o; } catch { /* the next reading */ } } return null; };
  let stored = null, carried = false;
  const from = new URLSearchParams(location.search).get('from');
  if (from) {
    stored = from;
    try { sessionStorage.setItem(KEY, encodeURIComponent(from)); } catch { carried = true; }
    if (!carried) history.replaceState(history.state, '', location.pathname + location.hash);
  } else {
    try { stored = sessionStorage.getItem(KEY); } catch { stored = null; }
  }
  const question = stored ? parse(stored) : null;
  if (question) {
    const some = (x) => Array.isArray(x) && x.length > 0;
    const results = some(question.c) || some(question.s) || some(question.h);
    for (const a of $$('[data-return]')) {
      const base = (a.getAttribute('href') ?? '').split('#')[0];
      if (!base) continue;
      const o = { ...question };
      if (material && kind !== 'hub') o.m = material;
      a.setAttribute('href', `${base}#${encodeURIComponent(JSON.stringify(o))}`);
      const long = a.querySelector('.ret-long'), short = a.querySelector('.ret-short');
      if (long) long.textContent = results ? 'Back to your results' : 'Back to the selector';
      if (short) short.textContent = results ? 'Results' : 'Selector';
      // From a Products page the drawer opens on its Products tab (frame/session.ts reads it).
      if (kind === 'products') a.addEventListener('click', () => {
        try {
          const kept = JSON.parse(sessionStorage.getItem('atlas-scroll') ?? 'null') ?? { hash: a.getAttribute('href').split('#')[1] ?? '' };
          kept.tab = 'Grades';
          sessionStorage.setItem('atlas-scroll', JSON.stringify(kept));
        } catch { /* storage off: the drawer opens on its first tab */ }
      });
    }
    if (carried) {
      for (const a of $$('a[href]')) {
        if (a.hasAttribute('data-return')) continue;
        const u = new URL(a.getAttribute('href'), location.href);
        if (u.origin !== location.origin || !/\/(m|method)\//.test(u.pathname)) continue;
        u.searchParams.set('from', from);
        a.setAttribute('href', u.pathname + u.search + u.hash);
      }
    }
  }

  // ---------------------------------------------------------------- the theme, and a printed page
  const isDark = () => { const t = root.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  const themeButton = doc.querySelector('[data-theme-toggle]');
  const paintTheme = () => {
    const dark = isDark(), words = dark ? 'Switch to light theme' : 'Switch to dark theme';
    themeButton.setAttribute('aria-label', words);
    themeButton.setAttribute('title', words);
    themeButton.querySelector('.theme-sun')?.toggleAttribute('hidden', !dark);
    themeButton.querySelector('.theme-moon')?.toggleAttribute('hidden', dark);
  };
  if (themeButton) {
    themeButton.hidden = false;
    paintTheme();
    themeButton.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('h2c-theme', next); } catch { /* storage off */ }
      paintTheme();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintTheme);
  }
  // The printed page names its own address at the foot of every sheet.
  const here = location.href.split('#')[0].split('?')[0];
  for (const el of $$('[data-print-url]')) el.dataset.printUrl = here;
  try {
    const sheet = [...doc.styleSheets].find((s) => s.ownerNode?.matches?.('link[rel="stylesheet"]'));
    sheet?.insertRule(`@media print { @page { @bottom-left { content: ${JSON.stringify(here)}; } } }`, sheet.cssRules.length);
  } catch { /* the print line keeps the page's path */ }
  let printed = null;
  addEventListener('beforeprint', () => { printed = root.dataset.theme ?? null; root.dataset.theme = 'light'; });
  addEventListener('afterprint', () => { if (printed) root.dataset.theme = printed; else delete root.dataset.theme; printed = null; });

  // ---------------------------------------------------------------- the anchor offset
  const bar = doc.querySelector('.atlas-bar'), ctl = doc.querySelector('.pl-ctl'), plh = doc.querySelector('.pl-h');
  const GAP = 16;
  const covered = () => ({
    bar: bar ? bar.getBoundingClientRect().height : 0,
    ctl: ctl && !ctl.hidden && getComputedStyle(ctl).position === 'sticky' ? ctl.getBoundingClientRect().height : 0,
  });
  const measure = () => {
    const c = covered();
    root.style.setProperty('--bar-h', `${c.bar.toFixed(2)}px`);
    root.style.setProperty('--ctl-h', `${c.ctl.toFixed(2)}px`);
    if (plh) root.style.setProperty('--plh-h', `${(getComputedStyle(plh).position === 'sticky' ? plh.getBoundingClientRect().height : 0).toFixed(2)}px`);
    return c;
  };
  const offset = () => { const c = covered(); return c.bar + c.ctl + GAP; };
  measure();
  const ro = new ResizeObserver(measure);
  if (bar) ro.observe(bar);
  if (ctl) ro.observe(ctl);
  addEventListener('resize', measure);

  // ---------------------------------------------------------------- a long card's groups, folded
  const fold = (tb, on) => {
    tb.toggleAttribute('data-folded', on);
    const b = tb.querySelector('.pc-all');
    if (b) { b.textContent = b.getAttribute(on ? 'data-more' : 'data-less'); b.setAttribute('aria-expanded', String(!on)); }
  };
  for (const tb of $$('.pc-t tbody[data-fold]')) { fold(tb, true); const b = tb.querySelector('.pc-all'); if (b) b.hidden = false; }
  doc.addEventListener('click', (ev) => {
    const b = ev.target.closest?.('.pc-all');
    if (b) fold(b.closest('tbody'), !b.closest('tbody').hasAttribute('data-folded'));
  });

  // ---------------------------------------------------------------- a card opened at its anchor
  const reveal = (scroll) => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id || !/^[\w-]+$/.test(id)) return;
    const t = doc.getElementById(id);
    if (!t) return;
    for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
    const folded = t.closest('tr.pc-x') && t.closest('tbody[data-folded]');
    if (folded) fold(folded, false);
    if (t.matches('tr')) { for (const x of $$('tr.hit')) x.classList.remove('hit'); t.classList.add('hit'); }
    if (scroll) t.scrollIntoView();
  };
  reveal(true);
  addEventListener('hashchange', () => reveal(true));
  doc.fonts.ready.then(() => { measure(); reveal(true); });

  // ---------------------------------------------------------------- the section in view, and the bar's list
  const list = doc.querySelector('.here'), hereText = doc.querySelector('[data-here]');
  const links = $$('.here-list a[href^="#"]');
  if (list) {
    list.addEventListener('click', (ev) => { if (ev.target.closest?.('.here-list a')) list.open = false; });
    doc.addEventListener('click', (ev) => { if (list.open && !ev.target.closest?.('.here')) list.open = false; });
    doc.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && list.open) { list.open = false; list.querySelector('summary')?.focus(); } });
  }
  if (links.length) {
    const targets = links.map((a) => ({ a, el: doc.getElementById(a.getAttribute('href').slice(1)) })).filter((t) => t.el);
    let current = null, pending = false;
    const mark = () => {
      pending = false;
      const line = offset() + Math.min(160, innerHeight * 0.25);
      let top = targets[0];
      for (const t of targets) if (t.el.getBoundingClientRect().top <= line) top = t;
      if (innerHeight + scrollY >= root.scrollHeight - 2) top = targets.at(-1);
      if (!top || top === current) return;
      current = top;
      for (const a of links) a.removeAttribute('aria-current');
      top.a.setAttribute('aria-current', 'true');
      const page = list?.querySelector('summary b');
      if (hereText) hereText.textContent = page && page.textContent === top.a.textContent ? '' : top.a.textContent;
    };
    const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(mark); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    mark();
  }

  // ---------------------------------------------------------------- lighting a product or a material across the page
  const tip = doc.getElementById('tip');
  let lit = null;
  const keyOf = (el) => (el.hasAttribute('data-grade') ? 'data-grade' : 'data-mat');
  const light = (el) => {
    const attr = el ? keyOf(el) : null, value = el ? el.getAttribute(attr) : null;
    const id = el ? `${attr}=${value}` : null;
    if (id === lit) return;
    for (const x of $$('.lit')) x.classList.remove('lit');
    lit = id;
    if (!id || !value) { doc.body.classList.remove('lighting'); lit = null; return; }
    doc.body.classList.add('lighting');
    for (const x of $$(`[${attr}="${CSS.escape(value)}"]`)) {
      if (x === main) continue;
      x.classList.add('lit');
      // A lit mark is drawn over the others.
      if (x instanceof SVGElement && x.ownerSVGElement && x.parentNode.lastElementChild !== x) x.parentNode.appendChild(x);
    }
  };
  const describe = (m) => {
    const b = doc.createElement('b'), rest = doc.createElement('span');
    const t = m.getAttribute('data-t') ?? '', note = m.getAttribute('data-note') ?? '';
    if (m.hasAttribute('data-grade') || m.hasAttribute('data-mat')) {
      b.textContent = m.getAttribute('data-name') ?? m.getAttribute('data-grade') ?? m.getAttribute('data-mat');
      rest.textContent = (t ? `: ${t}` : '') + (note && m.hasAttribute('data-grade') ? ` (${note})` : '');
      return [b, rest];
    }
    rest.textContent = t + (note ? ` (${note})` : '');
    return [rest];
  };
  const showTip = (m, x, y) => {
    if (!tip) return;
    tip.replaceChildren(...describe(m));
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = `${Math.min(Math.max(8, x + 14), innerWidth - w - 8)}px`;
    tip.style.top = `${y - h - 12 < 8 ? y + 18 : y - h - 12}px`;
  };
  const hideTip = () => { if (tip) tip.hidden = true; };
  const MARKS = '[data-grade], [data-mat]';
  const FIGS = 'figure svg, .dv-fig svg, .fig-plot svg';
  // The product mark nearest the pointer, within 14 px: a line's nearest point, a dot's centre.
  const nearest = (svg, x, y) => {
    let best = null, dist = 14 * 14;
    for (const m of svg.querySelectorAll('.mk[data-grade]')) {
      const r = m.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      const line = m.matches('line, path, .wb');
      const cx = line ? Math.max(r.left, Math.min(x, r.right)) : r.left + r.width / 2;
      const cy = line ? Math.max(r.top, Math.min(y, r.bottom)) : r.top + r.height / 2;
      const d = (cx - x) ** 2 + (cy - y) ** 2;
      if (d < dist) { dist = d; best = m; }
    }
    return best;
  };
  const pick = (ev) => {
    const svg = ev.target.closest?.('svg');
    if (!svg) return null;
    const m = nearest(svg, ev.clientX, ev.clientY);
    if (m) return { m, lights: true };
    const mat = ev.target.closest('[data-mat]');
    if (mat && svg.contains(mat)) return { m: mat, lights: true };
    const tp = ev.target.closest('.tp[data-t]');
    return tp ? { m: tp, lights: false } : null;
  };
  // A product's mark opens its card: in place on the Products page, else on the material's Products page.
  const productsPage = doc.querySelector('a[data-tab="products"]')?.getAttribute('href');
  const goTo = (m) => {
    const grade = m.getAttribute('data-grade');
    if (!grade || m.closest('a[href]')) return false;
    if (kind === 'products' && doc.getElementById(grade)) { location.hash = grade; return true; }
    if (productsPage) { location.href = `${productsPage}#${encodeURIComponent(grade)}`; return true; }
    return false;
  };
  let touched = null;
  for (const svg of $$(FIGS)) {
    svg.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      const p = pick(ev);
      if (p) { light(p.lights ? p.m : null); showTip(p.m, ev.clientX, ev.clientY); svg.style.cursor = p.m.hasAttribute('data-grade') ? 'pointer' : 'default'; }
      else { light(null); hideTip(); svg.style.cursor = ''; }
    });
    svg.addEventListener('pointerleave', () => { light(null); hideTip(); });
    svg.addEventListener('click', (ev) => {
      const p = pick(ev);
      if (!p) { if (touched) { touched = null; light(null); hideTip(); } return; }
      const m = p.m, key = m.getAttribute('data-grade') ?? m.getAttribute('data-mat') ?? m.getAttribute('data-t');
      // A first touch names the mark; a second goes to it.
      if (ev.pointerType === 'touch' || (ev.pointerType == null && 'ontouchstart' in window)) {
        if (touched !== key) { touched = key; light(p.lights ? m : null); showTip(m, ev.clientX, ev.clientY); return; }
      }
      if (goTo(m)) { touched = null; hideTip(); ev.preventDefault(); }
    });
  }
  doc.addEventListener('focusin', (ev) => {
    const m = ev.target.closest?.('.mk[data-grade], svg [data-mat]');
    if (!m) return;
    const r = m.getBoundingClientRect();
    showTip(m, r.left + r.width / 2, r.top);
  });
  const outside = (el) => (el?.closest && !el.closest(FIGS) ? el.closest(MARKS) : null);
  doc.addEventListener('pointerover', (ev) => {
    if (ev.pointerType === 'touch') return;
    const el = outside(ev.target);
    if (el && el !== main) light(el);
  });
  doc.addEventListener('pointerout', (ev) => {
    const el = outside(ev.target);
    if (el && !(ev.relatedTarget && el.contains(ev.relatedTarget))) light(null);
  });
  doc.addEventListener('focusin', (ev) => { const el = ev.target.closest?.(MARKS); if (el && el !== main) light(el); });
  doc.addEventListener('focusout', () => { light(null); hideTip(); });
  doc.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { light(null); hideTip(); } });
  addEventListener('scroll', () => { if (touched || (tip && !tip.hidden)) { touched = null; light(null); hideTip(); } }, { passive: true });

  // ---------------------------------------------------------------- the first screen's two columns, balanced
  // On the H2C goes to two columns, then gives its foot to the left column, whichever leaves the columns nearest in height.
  const h2c = doc.querySelector('.first .h2c'), left = doc.querySelector('.first-left');
  const balance = () => {
    h2c.classList.remove('h2c--two', 'h2c--fill');
    const moved = left.querySelector('.h2c-foot--left');
    if (moved) { moved.classList.remove('h2c-foot--left'); h2c.appendChild(moved); }
    if (getComputedStyle(h2c.parentNode).gridTemplateColumns.split(' ').length < 2) return;
    const gap = () => Math.abs(h2c.getBoundingClientRect().height - left.getBoundingClientRect().height);
    const foot = h2c.querySelector('.h2c-foot');
    const set = (k) => {
      h2c.classList.toggle('h2c--two', k > 0);
      if (!foot) return;
      if (k === 2) { foot.classList.add('h2c-foot--left'); left.appendChild(foot); }
      else if (foot.parentNode !== h2c) { foot.classList.remove('h2c-foot--left'); h2c.appendChild(foot); }
    };
    let best = 0, least = Infinity;
    for (let k = 0; k <= (foot ? 2 : 1); k++) {
      set(k);
      const g = gap();
      if (g <= 60) { best = k; least = g; break; }
      if (g < least) { best = k; least = g; }
    }
    set(best);
    const short = left.getBoundingClientRect().height - h2c.getBoundingClientRect().height;
    if (short > 24 && short <= 120) h2c.classList.add('h2c--fill');
  };
  if (h2c && left) {
    balance();
    doc.fonts.ready.then(balance);
    addEventListener('resize', balance);
    addEventListener('beforeprint', balance);
  }

  // ---------------------------------------------------------------- a data table's cells named, for the phone
  const words = (el) => el.textContent.replace(/\s+/g, ' ').trim();
  for (const t of $$('table.grid')) {
    const rows = t.tHead ? t.tHead.rows : [];
    if (!rows.length) continue;
    let names = [];
    for (const th of rows[rows.length - 1].cells) for (let i = 0; i < (th.colSpan || 1); i++) names.push(words(th));
    if (rows.length > 1) {
      const top = [];
      for (const th of rows[0].cells) for (let i = 0; i < (th.colSpan || 1); i++) top.push({ text: words(th), rows: th.rowSpan || 1 });
      let j = 0;
      names = top.map((x) => (x.rows > 1 ? x.text : `${x.text}${names[j] ? ` ${names[j++]}` : ''}`.trim()));
    }
    for (const b of t.tBodies) for (const tr of b.rows) {
      let col = 0;
      for (const cell of tr.cells) {
        if (!cell.hasAttribute('data-label') && names[col] && cell.colSpan === 1 && col > 0) cell.setAttribute('data-label', names[col]);
        col += cell.colSpan || 1;
      }
    }
  }

  // ---------------------------------------------------------------- copying the citation, printing the page
  for (const b of $$('[data-print]')) { b.hidden = false; b.addEventListener('click', () => print()); }
  const cite = doc.querySelector('[data-cite]');
  if (cite && navigator.clipboard) for (const b of $$('[data-copy]')) {
    b.hidden = false;
    const said = b.querySelector('span');
    b.addEventListener('click', () => navigator.clipboard.writeText(cite.textContent).then(() => {
      if (!said) return;
      said.textContent = 'Copied';
      setTimeout(() => { said.textContent = 'Copy the citation'; }, 2000);
    }, () => { /* refused: the citation stays on the page to select */ }));
  }

  // ---------------------------------------------------------------- searching and sorting
  const terms = (q) => q.toLowerCase().split(/\s+/).filter(Boolean);
  const hasAll = (t, ts) => ts.every((x) => t.includes(x));
  const later = (f, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(f, ms); }; };
  const fmt = (n) => n.toLocaleString('en-CA');
  const slash = (input) => doc.addEventListener('keydown', (ev) => {
    if (ev.key === '/' && !ev.target.closest?.('input, select, textarea')) { ev.preventDefault(); input.focus(); }
  });

  // A Products page: its list's grid as the columns it has, a search over names and makers, and one sort. A column sorts
  // its products in groups: those compared, by value with a bar for each; then those shown and not compared (set apart,
  // from the guide), then Izod in Charpy's place, each under its heading; then those with none, by name.
  const pl = doc.querySelector('[data-products]');
  for (const section of $$('.pl[data-cols]')) section.style.setProperty('--pl-cols', section.dataset.cols);
  if (pl && ctl) {
    const body = pl.querySelector('.pl-body');
    const rows = $$(':scope > details.pr', body);
    const find = ctl.querySelector('[data-find]'), sel = ctl.querySelector('[data-sortby]'), counter = ctl.querySelector('[data-count]');
    const none = pl.querySelector('[data-none]'), noneQ = pl.querySelector('[data-none-q]'), clear = pl.querySelector('[data-clear]');
    const heads = $$('.pl-h [data-sort]', pl);
    const line = doc.querySelector('[data-sort-line]');
    const options = Object.fromEntries($$('option', sel).map((o) => [o.value, { text: o.textContent, title: o.dataset.title, dir: o.dataset.dir, groups: [o.dataset.g1, o.dataset.g2, o.dataset.g3] }]));
    const FIRST = { desc: ['highest first', 'high first'], asc: ['lowest first', 'low first'] };
    const state = { q: '', sort: 'docs', dir: null };
    const order = new Map(rows.map((r, i) => [r, i]));
    const text = new Map(rows.map((r) => [r, r.getAttribute('data-q') ?? '']));
    const name = new Map(rows.map((r) => [r, (r.querySelector('.pn-t') ?? r).textContent.toLowerCase()]));
    const byName = (a, b) => (name.get(a) < name.get(b) ? -1 : name.get(a) > name.get(b) ? 1 : order.get(a) - order.get(b));
    ctl.hidden = false;
    const keyd = doc.querySelector('.pl-keyd');
    if (keyd && matchMedia('(max-width: 719px)').matches) keyd.open = false;
    const noun = (n) => (n === 1 ? 'product' : 'products');
    const cellOf = (r, k) => r.querySelector(`.pv[data-k="${k}"]`);
    const num = (c) => { const v = c?.getAttribute('data-v'); return v == null || v === '' ? null : Number(v); };
    const dirOf = () => state.dir ?? options[state.sort]?.dir ?? 'asc';
    const apply = () => {
      const k = state.sort, ts = terms(state.q), dir = dirOf(), desc = dir === 'desc';
      let groups = null, ordered = [];
      if (k === 'docs') ordered = [...rows].sort((a, b) => order.get(a) - order.get(b));
      else if (k === 'name') ordered = [...rows].sort(byName);
      else {
        groups = [[], [], [], []];
        for (const r of rows) {
          const c = cellOf(r, k), g = c?.getAttribute('data-g');
          groups[g === 'c' ? 0 : g === 'o' ? (c.hasAttribute('data-izod') ? 2 : 1) : 3].push({ r, v: num(c) });
        }
        const by = (a, b) => {
          if (a.v === null || b.v === null) return a.v === b.v ? order.get(a.r) - order.get(b.r) : a.v === null ? 1 : -1;
          return (desc ? b.v - a.v : a.v - b.v) || order.get(a.r) - order.get(b.r);
        };
        groups[0].sort(by); groups[1].sort(by); groups[2].sort(by);
        groups[3].sort((a, b) => byName(a.r, b.r));
      }
      for (const x of $$('.pl-grp', body)) x.remove();
      let shown = 0;
      const place = (r) => { const on = !ts.length || hasAll(text.get(r), ts); r.hidden = !on; if (on) shown++; body.appendChild(r); return on; };
      if (groups) {
        groups.forEach((items, gi) => {
          const label = gi ? options[k]?.groups[gi - 1] : '';
          const head = label && items.length ? doc.createElement('p') : null;
          if (head) { head.className = 'pl-grp'; body.appendChild(head); }
          let n = 0;
          for (const x of items) if (place(x.r)) n++;
          if (!head) return;
          if (!n) { head.remove(); return; }
          const count = doc.createElement('span');
          count.textContent = `(${fmt(n)} ${noun(n)})`;
          head.replaceChildren(`${label} `, count);
        });
      } else ordered.forEach(place);
      for (const c of $$('.pv.sorted', pl)) { c.classList.remove('sorted'); c.style.removeProperty('--w'); }
      if (groups) {
        // Each compared value's bar, from 15 % at the lowest to the whole cell at the highest.
        const cells = $$(`.pv[data-k="${k}"]`, body);
        const vs = cells.filter((c) => c.getAttribute('data-g') === 'c').map(num).filter((v) => v !== null);
        const lo = Math.min(...vs), hi = Math.max(...vs);
        for (const c of cells) {
          c.classList.add('sorted');
          const v = num(c);
          if (v !== null && c.getAttribute('data-g') === 'c' && vs.length > 1) c.style.setProperty('--w', `${(hi > lo ? 15 + (85 * (v - lo)) / (hi - lo) : 100).toFixed(1)}%`);
        }
        // A phone shows the sorted column beside the name when it is not one of the four it shows already.
        pl.toggleAttribute('data-extra', !(cells.length && cells[0].classList.contains('pv-ph')));
      } else pl.removeAttribute('data-extra');
      for (const b of heads) {
        const on = b.getAttribute('data-sort') === k;
        b.setAttribute('aria-pressed', String(on));
        if (on) b.setAttribute('data-dir', dir); else b.removeAttribute('data-dir');
      }
      const first = FIRST[dir];
      if (sel.value !== k) sel.value = k;
      for (const o of $$('option', sel)) o.textContent = o.value === k && groups ? `${options[k].title}, ${first[1]}` : options[o.value].text;
      if (line) line.textContent = k === 'docs' ? 'Most documented first.' : k === 'name' ? 'Sorted by name.' : `Sorted by ${options[k].title}, ${first[0]}.`;
      counter.textContent = ts.length ? `${fmt(shown)} of ${fmt(rows.length)} ${noun(rows.length)}` : `${fmt(rows.length)} ${noun(rows.length)}`;
      none.hidden = shown > 0;
      if (noneQ) noneQ.textContent = state.q.trim();
    };
    find.addEventListener('input', later(() => { state.q = find.value; apply(); }, 120));
    sel.addEventListener('change', () => { state.sort = sel.value; state.dir = null; apply(); });
    for (const b of heads) b.addEventListener('click', () => {
      const k = b.getAttribute('data-sort');
      if (k === state.sort && k !== 'docs' && k !== 'name') state.dir = dirOf() === 'desc' ? 'asc' : 'desc';
      else { state.sort = k; state.dir = null; }
      apply();
    });
    clear?.addEventListener('click', () => { find.value = ''; state.q = ''; apply(); find.focus(); });
    slash(find);
    apply();
  }

  // The index: a search over every material's names, the other names it is known by, and its family.
  const ix = doc.querySelector('[data-index]'), tools = doc.querySelector('.ix-tools');
  if (ix && tools) {
    const input = tools.querySelector('[data-ix-find]'), counter = tools.querySelector('[data-count]');
    const none = doc.querySelector('[data-ix-none]'), noneQ = doc.querySelector('[data-ix-q]');
    const items = $$('[data-q]', ix), names = $$('[data-aliases] [data-q]'), blocks = $$('.fam', ix), lines = $$('.ix-line', ix);
    const all = counter.textContent;
    tools.hidden = false;
    const apply = () => {
      const ts = terms(input.value);
      for (const x of items) x.hidden = !!ts.length && !hasAll(x.getAttribute('data-q'), ts);
      const n = $$('[data-mat][data-q]', ix).filter((x) => !x.hidden).length;
      for (const l of lines) { const sp = $$('[data-q]', l); l.hidden = sp.length > 0 && sp.every((x) => x.hidden); }
      for (const b of blocks) b.hidden = !!ts.length && !$$('[data-q]', b).some((x) => !x.hidden);
      let named = 0;
      for (const x of names) { const on = !!ts.length && hasAll(x.getAttribute('data-q'), ts); x.hidden = !on; if (on) named++; }
      counter.textContent = ts.length ? `${fmt(n)} ${n === 1 ? 'material matches' : 'materials match'}` : all;
      none.hidden = !ts.length || named > 0 || blocks.some((b) => !b.hidden);
      if (noneQ) noneQ.textContent = input.value.trim();
    };
    input.addEventListener('input', later(apply, 100));
    slash(input);
  }
})();
