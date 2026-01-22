/**
 * GitHub Projects Configuration
 *
 * This file controls which GitHub repositories appear in your projects section.
 * To add a project to your portfolio:
 *   1. Tag the GitHub repo with 'portfolio' or 'showcase' topic
 *   2. Push to main branch to trigger rebuild
 *
 * To exclude a project:
 *   - Remove the topic tag, OR
 *   - Add the repo name to excludeRepos array below
 */

module.exports = {
  // Your GitHub username
  username: 'wuandr',

  // Repository filters
  filters: {
    // Only include repos with these topics (empty array = include all)
    includeTopics: ['portfolio', 'showcase'],

    // Never include repos with these topics
    excludeTopics: [],

    // Specific repo names to exclude
    excludeRepos: [
      'wuandr.github.io' // Exclude the portfolio site itself
    ],

    // Include forked repositories
    includeForks: false,

    // Include archived repositories (will be marked as "Archived")
    includeArchived: true,

    // Minimum number of GitHub stars (0 = no minimum)
    minStars: 0,

    // Only include repos with descriptions
    hasDescription: false
  },

  // How to sort projects: 'updated', 'created', 'name'
  sortBy: 'updated',

  // Maximum number of projects to fetch
  maxProjects: 50
};
