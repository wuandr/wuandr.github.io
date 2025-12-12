const scrollLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('[data-scroll]');
const navLinks: HTMLAnchorElement[] = Array.from(document.querySelectorAll('[data-nav]'));
const sections: HTMLElement[] = Array.from(document.querySelectorAll('[data-section]'));

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
      threshold: 0.4,
      rootMargin: '-40% 0px -50% 0px',
    },
  );

  sections.forEach((section) => observer.observe(section));
}

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}
