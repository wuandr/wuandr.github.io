import { isExternalHref } from '../utils/links.js';
const renderProjectsArchive = async () => {
    const tbody = document.querySelector('[data-archive-body]');
    if (!tbody)
        return;
    const renderEmpty = () => {
        tbody.innerHTML = '<tr><td colspan="5">No entries yet.</td></tr>';
    };
    try {
        const response = await fetch('projects.json', { cache: 'no-cache' });
        if (!response.ok)
            throw new Error('Failed to load projects');
        const projects = (await response.json());
        if (!Array.isArray(projects) || !projects.length) {
            renderEmpty();
            return;
        }
        const formatDate = (project) => project.createdDisplay || project.createdAt || project.date || 'TBD';
        const formatMeta = (project) => {
            const updated = project.updatedDisplay || project.updatedAt;
            const created = formatDate(project);
            const pieces = [];
            if (project.status)
                pieces.push(project.status);
            if (updated && updated !== created)
                pieces.push(`Updated ${updated}`);
            return pieces.filter(Boolean).join(' · ');
        };
        const renderTags = (project) => {
            const tags = project.tags?.length ? project.tags : [];
            if (!tags.length)
                return '—';
            return `<div class="tags">${tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>`;
        };
        const renderLink = (project) => {
            const href = project.repo || project.href;
            if (!href)
                return '—';
            const externalAttrs = isExternalHref(href) ? ' target="_blank" rel="noreferrer"' : '';
            return `<a class="inline-link" href="${href}"${externalAttrs}>Open</a>`;
        };
        tbody.innerHTML = projects
            .map((project) => `<tr>
              <td>${formatDate(project)}</td>
              <td>
                <div class="archive-title">
                  <span>${project.title || 'Untitled'}</span>
                  ${formatMeta(project) ? `<span class="archive-meta">${formatMeta(project)}</span>` : ''}
                </div>
              </td>
              <td>${project.description || '—'}</td>
              <td>${renderTags(project)}</td>
              <td>${renderLink(project)}</td>
            </tr>`)
            .join('');
    }
    catch (err) {
        renderEmpty();
        console.error(err);
    }
};
void renderProjectsArchive();
