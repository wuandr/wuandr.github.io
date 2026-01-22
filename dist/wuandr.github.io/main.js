import { isExternalHref } from './utils/links.js';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const selectNavLinks = () => {
    const entries = Array.from(document.querySelectorAll('[data-section]')).map((link) => [
        link.dataset.section,
        link,
    ]);
    return new Map(entries);
};
const setActiveNav = (links, activeId) => {
    links.forEach((link, id) => {
        const isActive = id === activeId;
        link.dataset.active = String(isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        }
        else {
            link.removeAttribute('aria-current');
        }
    });
};
const setupScrollSpy = () => {
    const navLinks = selectNavLinks();
    const sections = Array.from(navLinks.keys())
        .map((id) => document.getElementById(id))
        .filter((section) => Boolean(section));
    if (!sections.length || !('IntersectionObserver' in window)) {
        return;
    }
    let current = null;
    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topEntry = visible[0];
        if (!topEntry?.target.id)
            return;
        const next = topEntry.target.id;
        if (next !== current) {
            current = next;
            setActiveNav(navLinks, current);
        }
    }, {
        rootMargin: '-40% 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    sections.forEach((section) => observer.observe(section));
};
const setupNavClicks = () => {
    const navLinks = selectNavLinks();
    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href')?.replace('#', '');
            if (!targetId)
                return;
            const target = document.getElementById(targetId);
            if (!target)
                return;
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
const fetchArchive = async (path) => {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok)
        throw new Error(`Failed to load ${path}`);
    const data = (await response.json());
    return Array.isArray(data) ? data : [];
};
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23273344'/%3E%3Cstop offset='100%25' stop-color='%23354259'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23g)'/%3E%3Cpath d='M180 360c120-80 200-120 320-80s140 160 280 80' fill='none' stroke='%23a6f1d8' stroke-width='12' stroke-linecap='round'/%3E%3Ccircle cx='260' cy='240' r='12' fill='%23a6f1d8'/%3E%3Ccircle cx='480' cy='260' r='12' fill='%23a6f1d8'/%3E%3Ccircle cx='700' cy='320' r='12' fill='%23a6f1d8'/%3E%3C/svg%3E";
const renderProjects = async () => {
    const container = document.querySelector('[data-projects-grid]');
    if (!container)
        return;
    const maxItems = 4;
    const emptyMessage = 'No projects yet. Check back soon.';
    const renderEmpty = () => {
        container.innerHTML = `<article class="card project"><div class="project-body"><p>${emptyMessage}</p></div></article>`;
    };
    try {
        const projects = await fetchArchive('projects/projects.json');
        const recentProjects = projects.slice(0, maxItems);
        if (!recentProjects.length) {
            renderEmpty();
            return;
        }
        const formatProjectMeta = (project) => {
            const created = project.createdDisplay || project.createdAt || project.date || 'TBD';
            const updated = project.updatedDisplay || project.updatedAt;
            const parts = [created];
            if (project.status)
                parts.push(project.status);
            if (updated && updated !== created)
                parts.push(`Updated ${updated}`);
            return parts.filter(Boolean).join(' · ');
        };
        const renderTags = (project) => {
            const tags = project.tags?.length ? project.tags : ['Project'];
            return tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
        };
        container.innerHTML = recentProjects
            .map((project) => {
            const href = project.repo || project.href || '#';
            const externalAttrs = isExternalHref(href) ? ' target="_blank" rel="noreferrer"' : '';
            const thumbnail = project.thumbnail || placeholderImage;
            const fallbackImage = project.thumbnailFallback || placeholderImage;
            return `
        <article class="card project">
          <div class="thumb">
            <img loading="lazy" decoding="async" width="480" height="270" src="${thumbnail}" alt="" onerror="this.onerror=null;this.src='${fallbackImage}';">
          </div>
          <div class="project-body">
            <p class="eyebrow">${formatProjectMeta(project)}</p>
            <h3><a href="${href}"${externalAttrs}>${project.title}</a></h3>
            <p>${project.description || 'Project description coming soon.'}</p>
            <div class="tags">
              ${renderTags(project)}
            </div>
          </div>
        </article>`;
        })
            .join('');
    }
    catch (err) {
        console.error(err);
        renderEmpty();
    }
};
const renderPosts = async () => {
    const stack = document.querySelector('[data-blog-stack]');
    if (!stack)
        return;
    const maxItems = 4;
    const emptyMessage = 'No posts yet. Check back soon.';
    const renderEmpty = () => {
        stack.innerHTML = `<article class="card"><p>${emptyMessage}</p></article>`;
    };
    try {
        const posts = await fetchArchive('posts/posts.json');
        const recentPosts = posts.slice(0, maxItems);
        if (!recentPosts.length) {
            renderEmpty();
            return;
        }
        const formatPostMeta = (post) => {
            const created = post.createdDisplay || post.createdAt || post.date || 'TBD';
            const updated = post.updatedDisplay || post.updatedAt;
            const parts = [created];
            if (updated && updated !== created)
                parts.push(`Updated ${updated}`);
            if (post.readTime)
                parts.push(post.readTime);
            return parts.filter(Boolean).join(' · ');
        };
        stack.innerHTML = recentPosts
            .map((post) => {
            const baseHref = post.href || '#';
            const isExternal = isExternalHref(baseHref);
            const isInternalPath = /^(\.|\/|#)/.test(baseHref);
            const href = isExternal || isInternalPath ? baseHref : `posts/${baseHref}`;
            const externalAttrs = isExternal ? ' target="_blank" rel="noreferrer"' : '';
            return `
        <article class="card">
          <div class="meta">
            <p class="period">${formatPostMeta(post)}</p>
            <a class="company" href="${href}"${externalAttrs}>${post.title || 'Untitled'}</a>
          </div>
          <p>${post.description || 'Read the full post in the archive.'}</p>
        </article>`;
        })
            .join('');
    }
    catch (err) {
        console.error(err);
        renderEmpty();
    }
};
const init = () => {
    setActiveNav(selectNavLinks(), 'about');
    setupScrollSpy();
    setupNavClicks();
    renderProjects();
    renderPosts();
};
window.addEventListener('DOMContentLoaded', init);
