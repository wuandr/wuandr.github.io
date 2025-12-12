const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const scrollLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('[data-scroll]');
const navLinks: HTMLAnchorElement[] = Array.from(document.querySelectorAll('[data-nav]'));
const sections: HTMLElement[] = Array.from(document.querySelectorAll('[data-section]'));

const smoothScrollTo = (target: HTMLElement) => {
  const behavior: ScrollBehavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
  target.scrollIntoView({ behavior, block: 'start' });
};

scrollLinks.forEach((link) => {
  link.addEventListener('click', (event: MouseEvent) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const destination = document.querySelector<HTMLElement>(href);
    if (!destination) return;

    event.preventDefault();
    smoothScrollTo(destination);
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
      // Prefer the entry with the highest intersection ratio when multiple are intersecting.
      const intersecting = entries.filter((e) => e.isIntersecting);
      if (!intersecting.length) return;

      const best = intersecting.reduce((a, b) => (b.intersectionRatio > a.intersectionRatio ? b : a));
      setActive(best.target.id);
    },
    {
      threshold: [0.25, 0.35, 0.45, 0.55, 0.65],
      rootMargin: '-20% 0px -60% 0px',
    },
  );

  sections.forEach((section) => observer.observe(section));
}

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}
