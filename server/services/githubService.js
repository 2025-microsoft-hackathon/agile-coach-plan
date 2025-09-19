const axios = require('axios');
const logger = require('../config/logger');

class GitHubService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Agile-Coach-Agent'
      }
    });
  }

  async getUser() {
    try {
      const response = await this.api.get('/user');
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get user:', error);
      throw new Error('Failed to fetch user from GitHub');
    }
  }

  async getUserRepositories(page = 1, per_page = 30) {
    try {
      const response = await this.api.get('/user/repos', {
        params: {
          sort: 'updated',
          direction: 'desc',
          page,
          per_page
        }
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get repositories:', error);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  async getUserOrganizations() {
    try {
      const response = await this.api.get('/user/orgs');
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get organizations:', error);
      throw new Error('Failed to fetch organizations from GitHub');
    }
  }

  async getRepositoryIssues(owner, repo, state = 'open', page = 1, per_page = 30) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/issues`, {
        params: {
          state,
          page,
          per_page,
          sort: 'updated',
          direction: 'desc'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get repository issues:', error);
      throw new Error('Failed to fetch repository issues from GitHub');
    }
  }

  async getRepositoryProjects(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/projects`, {
        headers: {
          'Accept': 'application/vnd.github.inertia-preview+json'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get repository projects:', error);
      throw new Error('Failed to fetch repository projects from GitHub');
    }
  }

  async createRepositoryIssue(owner, repo, issueData) {
    try {
      const response = await this.api.post(`/repos/${owner}/${repo}/issues`, {
        title: issueData.title,
        body: issueData.description,
        assignees: issueData.assignees || [],
        labels: issueData.labels || [],
        milestone: issueData.milestone
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - create issue:', error);
      throw new Error('Failed to create issue on GitHub');
    }
  }

  async updateRepositoryIssue(owner, repo, issue_number, issueData) {
    try {
      const response = await this.api.patch(`/repos/${owner}/${repo}/issues/${issue_number}`, {
        title: issueData.title,
        body: issueData.description,
        state: issueData.state,
        assignees: issueData.assignees || [],
        labels: issueData.labels || []
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - update issue:', error);
      throw new Error('Failed to update issue on GitHub');
    }
  }

  async getRepositoryMilestones(owner, repo, state = 'open') {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/milestones`, {
        params: { state }
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get milestones:', error);
      throw new Error('Failed to fetch milestones from GitHub');
    }
  }

  async getRepositoryLabels(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/labels`);
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get labels:', error);
      throw new Error('Failed to fetch labels from GitHub');
    }
  }

  async getRepositoryCollaborators(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/collaborators`);
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get collaborators:', error);
      throw new Error('Failed to fetch collaborators from GitHub');
    }
  }

  async getIssueComments(owner, repo, issue_number) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/issues/${issue_number}/comments`);
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - get issue comments:', error);
      throw new Error('Failed to fetch issue comments from GitHub');
    }
  }

  async addIssueComment(owner, repo, issue_number, body) {
    try {
      const response = await this.api.post(`/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
        body
      });
      return response.data;
    } catch (error) {
      logger.error('GitHub API error - add issue comment:', error);
      throw new Error('Failed to add comment to issue on GitHub');
    }
  }
}

// Helper functions that can be used without instantiating the service
async function fetchGitHubRepos(accessToken, page = 1) {
  const githubService = new GitHubService(accessToken);
  return await githubService.getUserRepositories(page);
}

async function fetchGitHubOrganizations(accessToken) {
  const githubService = new GitHubService(accessToken);
  return await githubService.getUserOrganizations();
}

async function fetchGitHubUser(accessToken) {
  const githubService = new GitHubService(accessToken);
  return await githubService.getUser();
}

module.exports = {
  GitHubService,
  fetchGitHubRepos,
  fetchGitHubOrganizations,
  fetchGitHubUser
};