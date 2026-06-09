// Three-way theme controller for the single cycling toggle button.
// Preference is one of 'system' | 'light' | 'dark', persisted in localStorage.
// - 'system' removes the data-theme attribute so the CSS prefers-color-scheme media
//   query governs (and stays live with OS changes — no JS listener needed).
// - 'light' / 'dark' set data-theme on <html> to force that mode.
// A small inline script in each page's <head> applies the saved choice pre-paint to
// avoid a flash of the wrong theme; this module wires the button and click cycling.

type Pref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';
const ORDER: Pref[] = ['system', 'light', 'dark'];

const getPref = (): Pref => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    /* localStorage unavailable (private mode, etc.) */
  }
  return 'system';
};

const apply = (pref: Pref): void => {
  const root = document.documentElement;
  if (pref === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = pref;
  }
};

const updateButtons = (pref: Pref): void => {
  document.querySelectorAll<HTMLElement>('[data-theme-cycle]').forEach((button) => {
    button.dataset.pref = pref;
    button.setAttribute('aria-label', `Theme: ${pref}. Activate to change.`);
    button.setAttribute('title', `Theme: ${pref}`);
  });
};

const setPref = (pref: Pref): void => {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore persistence failures */
  }
  apply(pref);
  updateButtons(pref);
};

const cycle = (): void => {
  const next = ORDER[(ORDER.indexOf(getPref()) + 1) % ORDER.length];
  setPref(next);
};

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-theme-cycle]')) {
    cycle();
  }
});

// Reflect the stored preference on the button(s) once the DOM is ready.
updateButtons(getPref());
