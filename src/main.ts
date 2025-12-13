const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type SectionId = 'about' | 'experience' | 'projects' | 'writing';

const selectNavLinks = (): Map<SectionId, HTMLAnchorElement> => {
  const entries = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section]')).map((link) => [
    link.dataset.section as SectionId,
    link,
  ] as const);

  return new Map(entries);
};

const setActiveNav = (links: Map<SectionId, HTMLAnchorElement>, activeId: SectionId | null) => {
  links.forEach((link, id) => {
    const isActive = id === activeId;
    link.dataset.active = String(isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const setupScrollSpy = () => {
  const navLinks = selectNavLinks();
  const sections = Array.from(navLinks.keys())
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => Boolean(section));

  if (!sections.length || !('IntersectionObserver' in window)) {
    return;
  }

  let current: SectionId | null = null;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      const topEntry = visible[0];
      if (!topEntry?.target.id) return;

      const next = topEntry.target.id as SectionId;
      if (next !== current) {
        current = next;
        setActiveNav(navLinks, current);
      }
    },
    {
      rootMargin: '-40% 0px -40% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  sections.forEach((section) => observer.observe(section));
};

const setupNavClicks = () => {
  const navLinks = selectNavLinks();
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      if (prefersReducedMotion) {
        return;
      }

      const supportsSmoothScroll = 'scrollBehavior' in document.documentElement.style;
      if (!supportsSmoothScroll) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      link.focus({ preventScroll: true });
    });
  });
};

const init = () => {
  setActiveNav(selectNavLinks(), 'about');
  setupScrollSpy();
  setupNavClicks();
};

window.addEventListener('DOMContentLoaded', init);
