const scrollLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('[data-scroll]');
const navLinks: HTMLAnchorElement[] = Array.from(document.querySelectorAll('[data-nav]'));
const sections: HTMLElement[] = Array.from(document.querySelectorAll('[data-section]'));
const tabButtons: HTMLButtonElement[] = Array.from(document.querySelectorAll('[data-tab-target]'));
const tabPanels: HTMLElement[] = Array.from(document.querySelectorAll('[data-tab-panel]'));

scrollLinks.forEach((link) => {
  link.addEventListener('click', (event: MouseEvent) => {
    const target = link.getAttribute('href');
    if (!target || !target.startsWith('#')) return;

    event.preventDefault();
    const destination = document.querySelector<HTMLElement>(target);
    destination?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

if (sections.length && navLinks.length) {
  const setActive = (id: string | null) => {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const matches = href?.startsWith('#') && href.slice(1) === id;
      link.classList.toggle('active', Boolean(matches));
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      threshold: 0.45,
      rootMargin: '-30% 0px -40% 0px',
    },
  );

  sections.forEach((section) => observer.observe(section));
}

const setActiveTab = (targetId: string | null) => {
  if (!targetId) return;

  tabButtons.forEach((button) => {
    const isMatch = button.dataset.tabTarget === targetId;
    button.classList.toggle('active', isMatch);
    button.setAttribute('aria-selected', String(isMatch));
    button.tabIndex = isMatch ? 0 : -1;
  });

  tabPanels.forEach((panel) => {
    const isMatch = panel.id === targetId;
    panel.classList.toggle('active', isMatch);
    panel.toggleAttribute('hidden', !isMatch);
  });
};

if (tabButtons.length && tabPanels.length) {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tabTarget ?? null));
    button.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setActiveTab(button.dataset.tabTarget ?? null);
    });
  });

  const initiallyActive = tabButtons.find((button) => button.classList.contains('active'))?.dataset
    .tabTarget;
  setActiveTab(initiallyActive ?? tabButtons[0]?.dataset.tabTarget ?? null);
}

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}
