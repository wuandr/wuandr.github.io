const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '.github-cache.json');
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Fetch GitHub repositories and convert to ProjectEntry format
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of ProjectEntry objects
 */
async function fetchGitHubProjects(config) {
  try {
    console.log('Fetching GitHub repositories...');

    const token = config.token || process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('⚠️  No GITHUB_TOKEN provided. Using unauthenticated API (60 requests/hour limit)');
    }

    // Fetch all repositories
    const repos = await fetchUserRepos(config.username, token);
    console.log(`Found ${repos.length} repositories`);

    // Filter repositories based on config
    const filteredRepos = filterRepos(repos, config.filters);
    console.log(`Filtered to ${filteredRepos.length} repositories`);

    // Fetch topics for each repo and map to ProjectEntry format
    const projects = [];
    for (const repo of filteredRepos) {
      try {
        const topics = await fetchRepoTopics(repo.owner.login, repo.name, token);
        const project = mapRepoToProject(repo, topics);
        projects.push(project);
      } catch (error) {
        console.warn(`Failed to process ${repo.name}:`, error.message);
      }
    }

    // Sort projects
    const sorted = sortProjects(projects, config.sortBy);

    // Limit number of projects
    const limited = sorted.slice(0, config.maxProjects || 50);

    // Cache the results
    writeCache(limited);

    console.log(`✓ Successfully fetched ${limited.length} projects from GitHub`);
    return limited;

  } catch (error) {
    console.error('GitHub API Error:', error.message);

    // Try to use cached data
    const cached = readCache();
    if (cached) {
      console.warn('⚠️  Using cached GitHub data from:', cached.timestamp);
      return cached.projects;
    }

    // No cache available, return empty array
    console.warn('⚠️  No cache available, returning empty array');
    return [];
  }
}

/**
 * Fetch all repositories for a user with pagination
 * @param {string} username - GitHub username
 * @param {string} token - GitHub API token (optional)
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchUserRepos(username, token) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/users/${username}/repos?type=owner&sort=updated&per_page=${perPage}&page=${page}`;

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Portfolio-Builder'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetchWithTimeout(url, { headers }, 10000);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User '${username}' not found on GitHub`);
      }
      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        const resetDate = rateLimitReset ? new Date(rateLimitReset * 1000) : 'unknown';
        throw new Error(`GitHub API rate limit exceeded. Resets at: ${resetDate}`);
      }
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    repos.push(...data);

    if (data.length < perPage) {
      break; // Last page
    }

    page++;
  }

  return repos;
}

/**
 * Fetch topics for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} token - GitHub API token (optional)
 * @returns {Promise<Array>} Array of topic strings
 */
async function fetchRepoTopics(owner, repo, token) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/topics`;

  const headers = {
    'Accept': 'application/vnd.github.mercy-preview+json', // Required for topics API
    'User-Agent': 'Portfolio-Builder'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetchWithTimeout(url, { headers }, 5000);

  if (!response.ok) {
    // Topics are optional, don't fail if we can't fetch them
    console.warn(`Could not fetch topics for ${owner}/${repo}`);
    return [];
  }

  const data = await response.json();
  return data.names || [];
}

/**
 * Filter repositories based on configuration
 * @param {Array} repos - Array of repository objects
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered repositories
 */
function filterRepos(repos, filters = {}) {
  return repos.filter(repo => {
    // Exclude forks if configured
    if (!filters.includeForks && repo.fork) {
      return false;
    }

    // Exclude archived if configured
    if (!filters.includeArchived && repo.archived) {
      return false;
    }

    // Exclude specific repos
    if (filters.excludeRepos && filters.excludeRepos.includes(repo.name)) {
      return false;
    }

    // Check minimum stars
    if (filters.minStars && repo.stargazers_count < filters.minStars) {
      return false;
    }

    // Require description if configured
    if (filters.hasDescription && !repo.description) {
      return false;
    }

    return true;
  });
}

/**
 * Check if repo has required topics (must be done after fetching topics)
 * @param {Array} topics - Repository topics
 * @param {Object} filters - Filter configuration
 * @returns {boolean} Whether repo should be included
 */
function matchesTopicFilter(topics, filters = {}) {
  // If includeTopics is specified and not empty, repo must have at least one
  if (filters.includeTopics && filters.includeTopics.length > 0) {
    const hasRequiredTopic = topics.some(topic =>
      filters.includeTopics.includes(topic)
    );
    if (!hasRequiredTopic) {
      return false;
    }
  }

  // Exclude if has any excluded topics
  if (filters.excludeTopics && filters.excludeTopics.length > 0) {
    const hasExcludedTopic = topics.some(topic =>
      filters.excludeTopics.includes(topic)
    );
    if (hasExcludedTopic) {
      return false;
    }
  }

  return true;
}

/**
 * Map GitHub repository data to ProjectEntry format
 * @param {Object} repo - GitHub repository object
 * @param {Array} topics - Repository topics
 * @returns {Object} ProjectEntry object
 */
function mapRepoToProject(repo, topics) {
  // Determine status based on archived flag and last push
  const status = determineStatus(repo);

  // Format title (capitalize words, replace hyphens with spaces)
  const title = formatTitle(repo.name);

  // Use homepage if available, otherwise repo URL
  const href = repo.homepage || repo.html_url;

  return {
    slug: repo.name.toLowerCase(),
    title: title,
    description: repo.description || 'No description provided',
    createdAt: repo.created_at.split('T')[0], // YYYY-MM-DD
    updatedAt: repo.pushed_at.split('T')[0],  // Use pushed_at for more accurate last activity
    href: href,
    repo: repo.html_url,
    status: status,
    tags: topics.length > 0 ? topics : ['project'], // Default tag if no topics
    thumbnail: getRepoThumbnail(repo),
    thumbnailFallback: getRepoThumbnailFallback(repo)
  };
}

/**
 * Determine project status based on repository metadata
 * @param {Object} repo - GitHub repository object
 * @returns {string} Status string
 */
function determineStatus(repo) {
  if (repo.archived) {
    return 'Archived';
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const lastPush = new Date(repo.pushed_at);

  if (lastPush >= sixMonthsAgo) {
    return 'Active';
  }

  return 'Maintenance';
}

/**
 * Format repository name as title
 * @param {string} name - Repository name
 * @returns {string} Formatted title
 */
function formatTitle(name) {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Choose a thumbnail image for the repository.
 * @param {Object} repo - GitHub repository object
 * @returns {string} URL to thumbnail image
 */
function getRepoThumbnail(repo) {
  if (repo.open_graph_image_url) {
    return repo.open_graph_image_url;
  }

  if (repo.owner && repo.owner.login) {
    return `https://opengraph.githubassets.com/1/${repo.owner.login}/${repo.name}`;
  }

  return '';
}

/**
 * Choose a thumbnail fallback image for the repository.
 * @param {Object} repo - GitHub repository object
 * @returns {string} URL to fallback image
 */
function getRepoThumbnailFallback(repo) {
  if (repo.owner && repo.owner.avatar_url) {
    return repo.owner.avatar_url;
  }

  return '';
}

/**
 * Sort projects based on criteria
 * @param {Array} projects - Array of projects
 * @param {string} sortBy - Sort criteria ('updated', 'created', 'stars', 'name')
 * @returns {Array} Sorted projects
 */
function sortProjects(projects, sortBy = 'updated') {
  const sorted = [...projects];

  switch (sortBy) {
    case 'created':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'name':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'updated':
    default:
      sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      break;
  }

  return sorted;
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Write projects to cache file
 * @param {Array} projects - Array of projects
 */
function writeCache(projects) {
  try {
    const cacheData = {
      timestamp: new Date().toISOString(),
      projects: projects
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log('✓ Cached GitHub data to', CACHE_FILE);
  } catch (error) {
    console.warn('Could not write cache file:', error.message);
  }
}

/**
 * Read projects from cache file
 * @returns {Object|null} Cache data or null if not available
 */
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not read cache file:', error.message);
  }
  return null;
}

/**
 * Filter projects by topics after fetching
 * This is separate from filterRepos because topics require an additional API call
 * @param {Array} projects - Array of projects with topics
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered projects
 */
function filterByTopics(projects, filters = {}) {
  return projects.filter(project => {
    return matchesTopicFilter(project.tags || [], filters);
  });
}

// Modified main function to include topic filtering
async function fetchGitHubProjectsWithTopicFilter(config) {
  try {
    console.log('Fetching GitHub repositories...');

    const token = config.token || process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn('⚠️  No GITHUB_TOKEN provided. Using unauthenticated API (60 requests/hour limit)');
    }

    // Fetch all repositories
    const repos = await fetchUserRepos(config.username, token);
    console.log(`Found ${repos.length} repositories`);

    // Filter repositories based on config (non-topic filters)
    const filteredRepos = filterRepos(repos, config.filters);
    console.log(`After basic filtering: ${filteredRepos.length} repositories`);

    // Fetch topics for each repo and map to ProjectEntry format
    const projects = [];
    for (const repo of filteredRepos) {
      try {
        const topics = await fetchRepoTopics(repo.owner.login, repo.name, token);

        // Check topic filter
        if (!matchesTopicFilter(topics, config.filters)) {
          console.log(`  Skipping ${repo.name} (topic mismatch)`);
          continue;
        }

        const project = mapRepoToProject(repo, topics);
        projects.push(project);
        console.log(`  ✓ ${repo.name} → ${project.title} (${topics.length} topics)`);
      } catch (error) {
        console.warn(`  Failed to process ${repo.name}:`, error.message);
      }
    }

    // Sort projects
    const sorted = sortProjects(projects, config.sortBy);

    // Limit number of projects
    const limited = sorted.slice(0, config.maxProjects || 50);

    // Cache the results
    writeCache(limited);

    console.log(`✓ Successfully fetched ${limited.length} projects from GitHub`);
    return limited;

  } catch (error) {
    console.error('GitHub API Error:', error.message);

    // Try to use cached data
    const cached = readCache();
    if (cached) {
      console.warn('⚠️  Using cached GitHub data from:', cached.timestamp);
      return cached.projects;
    }

    // No cache available, return empty array
    console.warn('⚠️  No cache available, returning empty array');
    return [];
  }
}

module.exports = {
  fetchGitHubProjects: fetchGitHubProjectsWithTopicFilter,
  fetchUserRepos,
  fetchRepoTopics,
  filterRepos,
  mapRepoToProject,
  determineStatus
};
