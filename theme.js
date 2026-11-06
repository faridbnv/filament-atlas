// The reader's theme, before the first paint, under the key the old tool used, so an earlier choice carries over; the
// selector's bar and the pages' script switch it.
try { const t = localStorage.getItem('h2c-theme'); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; } catch { /* storage off */ }
