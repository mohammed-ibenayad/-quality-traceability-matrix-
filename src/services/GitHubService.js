// src/services/GitHubService.js - Enhanced version with test import capabilities
import { Octokit } from "octokit";

class GitHubService {
  constructor() {
    this.octokit = null;
    this.rateLimitRemaining = 5000;
    this.rateLimitReset = null;
  }

  /**
   * Initialize GitHub client with token
   */
  initialize(token) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Parse a GitHub repository URL to extract owner and repo
   */
  parseGitHubUrl(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        throw new Error('URL is not a GitHub repository');
      }
      
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length < 2) {
        throw new Error('Invalid GitHub repository URL format');
      }
      
      return {
        owner: pathParts[0],
        repo: pathParts[1].replace('.git', '')
      };
    } catch (error) {
      if (error.message === 'Invalid GitHub repository URL format' || 
          error.message === 'URL is not a GitHub repository') {
        throw error;
      }
      throw new Error('Invalid URL: ' + error.message);
    }
  }

  /**
   * Test repository access and get basic info
   */
  async getRepositoryInfo(owner, repo, token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const response = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.updateRateLimit(response.headers);

      return {
        id: response.data.id,
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        language: response.data.language,
        private: response.data.private,
        size: response.data.size,
        stargazersCount: response.data.stargazers_count,
        forksCount: response.data.forks_count,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        defaultBranch: response.data.default_branch,
        topics: response.data.topics || [],
        license: response.data.license?.name,
        hasIssues: response.data.has_issues,
        hasWiki: response.data.has_wiki,
        hasPages: response.data.has_pages
      };
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Invalid GitHub token or insufficient permissions');
      } else if (error.status === 404) {
        throw new Error('Repository not found or not accessible');
      } else if (error.status === 403) {
        throw new Error('Rate limit exceeded or access forbidden');
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  /**
   * Get repository branches
   */
  async getBranches(owner, repo, token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const response = await octokit.request('GET /repos/{owner}/{repo}/branches', {
        owner,
        repo,
        per_page: 100,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.updateRateLimit(response.headers);

      return response.data.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected
      }));
    } catch (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  /**
   * Get repository contents for a specific path
   */
  async getContents(owner, repo, path = '', branch = 'main', token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        ref: branch,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.updateRateLimit(response.headers);

      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      if (error.status === 404) {
        return []; // Path doesn't exist
      }
      throw new Error(`Failed to fetch contents: ${error.message}`);
    }
  }

  /**
   * Get file content
   */
  async getFileContent(owner, repo, path, branch = 'main', token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        ref: branch,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.updateRateLimit(response.headers);

      if (response.data.type === 'file') {
        // Decode base64 content
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return {
          content,
          sha: response.data.sha,
          size: response.data.size,
          encoding: response.data.encoding
        };
      }
      
      throw new Error('Path is not a file');
    } catch (error) {
      throw new Error(`Failed to fetch file content: ${error.message}`);
    }
  }

  /**
   * Search for test files in repository
   */
  async searchTestFiles(owner, repo, branch = 'main', token, options = {}) {
    const {
      testPaths = ['tests/', 'test/', '__tests__/', 'src/test/', 'spec/'],
      filePatterns = this.getTestFilePatterns(),
      maxDepth = 3
    } = options;

    const testFiles = [];
    const processedPaths = new Set();

    // Search in specified test directories
    for (const testPath of testPaths) {
      try {
        await this.searchInDirectory(
          owner, repo, testPath, branch, token, 
          testFiles, filePatterns, processedPaths, 0, maxDepth
        );
      } catch (error) {
        console.log(`Test path ${testPath} not found or inaccessible`);
      }
    }

    // Also search root directory
    try {
      await this.searchInDirectory(
        owner, repo, '', branch, token,
        testFiles, filePatterns, processedPaths, 0, 1
      );
    } catch (error) {
      console.log('Root directory search failed');
    }

    return testFiles;
  }

  /**
   * Recursively search for test files in a directory
   */
  async searchInDirectory(owner, repo, path, branch, token, testFiles, patterns, processedPaths, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth || processedPaths.has(path)) {
      return;
    }

    processedPaths.add(path);

    try {
      const contents = await this.getContents(owner, repo, path, branch, token);
      
      for (const item of contents) {
        if (item.type === 'file' && this.isTestFile(item.name, patterns)) {
          testFiles.push({
            path: item.path,
            name: item.name,
            size: item.size,
            sha: item.sha,
            downloadUrl: item.download_url
          });
        } else if (item.type === 'dir' && this.isTestDirectory(item.name)) {
          await this.searchInDirectory(
            owner, repo, item.path, branch, token,
            testFiles, patterns, processedPaths, currentDepth + 1, maxDepth
          );
        }
      }
    } catch (error) {
      console.error(`Error searching directory ${path}:`, error.message);
    }
  }

  /**
   * Check if a file is a test file based on patterns
   */
  isTestFile(filename, patterns) {
    return patterns.some(pattern => pattern.test(filename));
  }

  /**
   * Check if a directory might contain tests
   */
  isTestDirectory(dirname) {
    const testDirPatterns = [
      /^tests?$/i,
      /^__tests__$/i,
      /^spec$/i,
      /test/i
    ];
    return testDirPatterns.some(pattern => pattern.test(dirname));
  }

  /**
   * Extract test cases from file content
   */
  extractTestCases(content, filePath, filename) {
    const tests = [];
    const lines = content.split('\n');
    let testCounter = 1;

    // Test extraction patterns for different frameworks
    const extractionRules = [
      // JavaScript/TypeScript (Jest, Mocha, Jasmine)
      {
        pattern: /(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        language: 'javascript',
        framework: this.detectJSFramework(content)
      },
      // Python (pytest, unittest)
      {
        pattern: /def\s+(test_[a-zA-Z0-9_]+)/g,
        language: 'python',
        framework: this.detectPythonFramework(content)
      },
      // Java (JUnit)
      {
        pattern: /@Test\s*\n\s*(?:public\s+)?(?:void\s+)?([a-zA-Z0-9_]+)/g,
        language: 'java',
        framework: 'JUnit'
      },
      // C# (MSTest, NUnit, xUnit)
      {
        pattern: /\[(?:Test|Fact|Theory)(?:Method)?\]\s*\n\s*(?:public\s+)?(?:void\s+)?([a-zA-Z0-9_]+)/g,
        language: 'csharp',
        framework: this.detectCSharpFramework(content)
      },
      // Go
      {
        pattern: /func\s+(Test[a-zA-Z0-9_]+)/g,
        language: 'go',
        framework: 'Go Testing'
      },
      // Ruby (RSpec, Minitest)
      {
        pattern: /(?:it|describe|context)\s+['"`]([^'"`]+)['"`]/g,
        language: 'ruby',
        framework: this.detectRubyFramework(content)
      }
    ];

    for (const rule of extractionRules) {
      const matches = [...content.matchAll(rule.pattern)];
      
      for (const match of matches) {
        const testName = match[1];
        if (testName && testName.length > 0) {
          const lineNumber = this.findLineNumber(content, match.index);
          
          // Generate unique test case ID
          const testId = `TC_${String(testCounter).padStart(3, '0')}`;
          testCounter++;

          // Extract description from comments
          const description = this.extractTestDescription(lines, lineNumber - 1, testName);

          tests.push({
            id: testId,
            name: testName,
            description,
            filePath,
            fileName: filename,
            lineNumber,
            language: rule.language,
            framework: rule.framework,
            automationStatus: 'Automated',
            status: 'Not Run',
            priority: 'Medium',
            tags: this.extractTestTags(lines, lineNumber - 1),
            lastSyncDate: new Date().toISOString()
          });
        }
      }
    }

    return tests;
  }

  /**
   * Detect JavaScript testing framework
   */
  detectJSFramework(content) {
    if (content.includes('jest') || content.includes('expect(')) return 'Jest';
    if (content.includes('mocha') || content.includes('chai')) return 'Mocha';
    if (content.includes('jasmine')) return 'Jasmine';
    if (content.includes('cypress')) return 'Cypress';
    if (content.includes('playwright')) return 'Playwright';
    return 'JavaScript';
  }

  /**
   * Detect Python testing framework
   */
  detectPythonFramework(content) {
    if (content.includes('pytest') || content.includes('@pytest')) return 'pytest';
    if (content.includes('unittest') || content.includes('TestCase')) return 'unittest';
    if (content.includes('nose')) return 'nose';
    return 'Python';
  }

  /**
   * Detect C# testing framework
   */
  detectCSharpFramework(content) {
    if (content.includes('[Test]') || content.includes('NUnit')) return 'NUnit';
    if (content.includes('[TestMethod]') || content.includes('MSTest')) return 'MSTest';
    if (content.includes('[Fact]') || content.includes('[Theory]') || content.includes('xUnit')) return 'xUnit';
    return 'C#';
  }

  /**
   * Detect Ruby testing framework
   */
  detectRubyFramework(content) {
    if (content.includes('RSpec') || content.includes('describe')) return 'RSpec';
    if (content.includes('Minitest') || content.includes('MiniTest')) return 'Minitest';
    return 'Ruby';
  }

  /**
   * Find line number for a match index
   */
  findLineNumber(content, matchIndex) {
    const beforeMatch = content.substring(0, matchIndex);
    return beforeMatch.split('\n').length;
  }

  /**
   * Extract test description from comments
   */
  extractTestDescription(lines, lineIndex, fallbackName) {
    // Look for comments in the previous few lines
    for (let i = Math.max(0, lineIndex - 3); i < lineIndex; i++) {
      const line = lines[i]?.trim();
      if (line) {
        // Match various comment styles
        const commentMatch = line.match(/(?:\/\/|#|\/\*|\*)\s*(.+?)(?:\*\/)?$/);
        if (commentMatch && commentMatch[1].trim().length > 0) {
          return commentMatch[1].trim();
        }
      }
    }
    
    // Use the test name as fallback, cleaning it up
    return fallbackName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  /**
   * Extract tags from test comments
   */
  extractTestTags(lines, lineIndex) {
    const tags = [];
    
    // Look for tag annotations in comments
    for (let i = Math.max(0, lineIndex - 5); i <= Math.min(lines.length - 1, lineIndex + 2); i++) {
      const line = lines[i]?.trim();
      if (line) {
        // Match @tag style annotations
        const tagMatches = line.matchAll(/@([a-zA-Z0-9_-]+)/g);
        for (const match of tagMatches) {
          tags.push(match[1]);
        }
        
        // Match #tag style tags
        const hashTagMatches = line.matchAll(/#([a-zA-Z0-9_-]+)/g);
        for (const match of hashTagMatches) {
          if (!match[1].match(/^\d+$/)) { // Exclude line numbers
            tags.push(match[1]);
          }
        }
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get commits for a specific file to track changes
   */
  async getFileCommits(owner, repo, path, branch = 'main', token, since = null) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const params = {
        owner,
        repo,
        path,
        sha: branch,
        per_page: 50,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      };

      if (since) {
        params.since = since;
      }

      const response = await octokit.request('GET /repos/{owner}/{repo}/commits', params);
      
      this.updateRateLimit(response.headers);

      return response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        url: commit.html_url
      }));
    } catch (error) {
      throw new Error(`Failed to fetch file commits: ${error.message}`);
    }
  }

  /**
   * Compare two commits to get changed files
   */
  async compareCommits(owner, repo, base, head, token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const response = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
        owner,
        repo,
        base,
        head,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.updateRateLimit(response.headers);

      return {
        status: response.data.status,
        aheadBy: response.data.ahead_by,
        behindBy: response.data.behind_by,
        totalCommits: response.data.total_commits,
        files: response.data.files?.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch
        })) || []
      };
    } catch (error) {
      throw new Error(`Failed to compare commits: ${error.message}`);
    }
  }

  /**
   * Update rate limit information from response headers
   */
  updateRateLimit(headers) {
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining']);
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitReset = new Date(parseInt(headers['x-ratelimit-reset']) * 1000);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      resetAt: this.rateLimitReset,
      resetIn: this.rateLimitReset ? Math.max(0, this.rateLimitReset.getTime() - Date.now()) : null
    };
  }

  /**
   * Trigger a GitHub Actions workflow (existing functionality)
   */
  async triggerWorkflow(owner, repo, workflowFile, ref, token, payload) {
    try {
      const octokit = new Octokit({ auth: token });
      
      console.log("Triggering workflow with payload:", payload);
      
      const beforeRuns = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
        owner,
        repo,
        workflow_id: workflowFile,
        per_page: 5,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      const beforeRunIds = new Set(beforeRuns.data.workflow_runs?.map(run => run.id) || []);
      
      await octokit.request('POST /repos/{owner}/{repo}/dispatches?t=' + Date.now(), {
        owner,
        repo,
        event_type: 'quality-tracker-test-run',
        client_payload: payload,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      // Wait for new workflow run to appear
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const afterRuns = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
          owner,
          repo,
          workflow_id: workflowFile,
          per_page: 10,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        
        const newRuns = afterRuns.data.workflow_runs?.filter(run => !beforeRunIds.has(run.id)) || [];
        
        if (newRuns.length > 0) {
          const latestRun = newRuns[0];
          
          return {
            id: latestRun.id,
            status: latestRun.status,
            conclusion: latestRun.conclusion,
            html_url: latestRun.html_url,
            created_at: latestRun.created_at,
            client_payload: payload
          };
        }
        
        attempts++;
      }
      
      throw new Error('Workflow run did not appear after triggering');
      
    } catch (error) {
      throw new Error(`Failed to trigger workflow: ${error.message}`);
    }
  }

  /**
   * Get workflow status (existing functionality)
   */
  async getWorkflowStatus(owner, repo, runId, token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const response = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
        owner,
        repo,
        run_id: runId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.updateRateLimit(response.headers);

      return {
        id: response.data.id,
        status: response.data.status,
        conclusion: response.data.conclusion,
        html_url: response.data.html_url,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }
  }

  /**
   * Get workflow results from artifacts (existing functionality)
   */
  async getWorkflowResults(owner, repo, runId, token, clientPayload) {
    try {
      console.log(`Fetching workflow results for run ${runId}`);
      const octokit = new Octokit({ auth: token });
      
      const requirementId = clientPayload?.requirementId;
      const requestedTestIds = clientPayload?.testCases || [];
      
      // First check if the run completed successfully
      const { data: runData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
        owner,
        repo,
        run_id: runId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      console.log(`Workflow run status: ${runData.status}, conclusion: ${runData.conclusion}`);
      
      if (runData.status !== 'completed') {
        throw new Error('Workflow run has not completed yet');
      }
      
      // Get workflow artifacts
      const { data: artifactsData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
        owner,
        repo,
        run_id: runId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      this.updateRateLimit(artifactsData.headers);
      
      console.log(`Found ${artifactsData.artifacts?.length || 0} artifacts`);
      
      // Look for test results artifacts
      const resultsArtifacts = artifactsData.artifacts?.filter(artifact => 
        artifact.name.includes('test-results') || 
        artifact.name.includes('results') ||
        artifact.name.toLowerCase().includes('junit')
      ) || [];
      
      if (resultsArtifacts.length === 0) {
        console.warn('No test results artifacts found');
        return [];
      }
      
      // Process the first results artifact
      const artifact = resultsArtifacts[0];
      console.log(`Processing artifact: ${artifact.name}`);
      
      return await this.downloadAndProcessArtifact(artifact, token, requirementId, clientPayload);
      
    } catch (error) {
      console.error('Error getting workflow results:', error);
      throw new Error(`Failed to get workflow results: ${error.message}`);
    }
  }

  /**
   * Download and process artifact content
   */
  async downloadAndProcessArtifact(artifact, token, requirementId, clientPayload) {
    try {
      const octokit = new Octokit({ auth: token });
      
      // Download the artifact
      const downloadResponse = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}', {
        owner: artifact.owner?.login,
        repo: artifact.repository?.name,
        artifact_id: artifact.id,
        archive_format: 'zip',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      // Process the downloaded content (simplified for this example)
      // In a real implementation, you would extract and parse the ZIP file
      console.log('Artifact downloaded successfully');
      
      // Return mock results for now - in production this would parse actual test results
      return [
        {
          id: 'TC_001',
          name: 'Sample Test Case',
          status: 'Passed',
          duration: 150,
          logs: 'Test executed successfully'
        }
      ];
      
    } catch (error) {
      console.error('Error downloading artifact:', error);
      throw new Error(`Failed to download artifact: ${error.message}`);
    }
  }

  /**
   * Get centralized test file patterns
   */
  getTestFilePatterns() {
    return [
      /\.test\.(js|jsx|ts|tsx)$/,
      /\.spec\.(js|jsx|ts|tsx)$/,
      /__tests__\/.*\.(js|jsx|ts|tsx)$/,
      /test_.*\.py$/,
      /.*_test\.py$/,
      /.*Test\.java$/,
      /.*Tests\.java$/,
      /.*Test\.cs$/,
      /.*_test\.go$/,
      /.*_test\.rb$/,
      /.*_spec\.rb$/
    ];
  }

  /**
   * Hash string to generate consistent IDs
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }
}

export default new GitHubService();