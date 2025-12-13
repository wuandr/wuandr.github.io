import { isExternalHref } from '../utils/links.js';
const renderPostsArchive = async () => {
    const tbody = document.querySelector('[data-archive-body]');
    if (!tbody)
        return;
    const renderEmpty = () => {
        tbody.innerHTML = '<tr><td colspan="4">No entries yet.</td></tr>';
    };
    const toDisplayDate = (value, fallback) => value || fallback || 'TBD';
    try {
        const response = await fetch('posts.json', { cache: 'no-cache' });
        if (!response.ok)
            throw new Error('Failed to load posts');
        const posts = (await response.json());
        if (!Array.isArray(posts) || !posts.length) {
            renderEmpty();
            return;
        }
        tbody.innerHTML = posts
            .map((post) => `<tr>
              <td>${toDisplayDate(post.createdDisplay, post.createdAt)}</td>
              <td>${toDisplayDate(post.updatedDisplay, post.updatedAt)}</td>
              <td>
                <div class="archive-title">
                  <div>${post.title || 'Untitled'}</div>
                  ${post.readTime ? `<div class="archive-meta">${post.readTime}</div>` : ''}
                </div>
              </td>
              <td>
                <a class="inline-link" href="${post.href || '#'}"${isExternalHref(post.href) ? ' target="_blank" rel="noreferrer"' : ''}>Open post</a>
                ${post.sourcePath ? `<div class="archive-meta">Source: ${post.sourcePath}</div>` : ''}
              </td>
            </tr>`)
            .join('');
    }
    catch (err) {
        renderEmpty();
        console.error(err);
    }
};
void renderPostsArchive();
