const scrollLinks = document.querySelectorAll('[data-scroll]');

scrollLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = link.getAttribute('href');
    if (!target || !target.startsWith('#')) {
      return;
    }

    event.preventDefault();
    const destination = document.querySelector(target);
    destination?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}
