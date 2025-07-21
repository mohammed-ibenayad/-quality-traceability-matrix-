// src/services/GitHubService.js - Enhanced version with test import capabilities
import { Octokit } from "octokit";
import JSZip from 'jszip';

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
  /**
 * Update rate limit information from response headers
 */
updateRateLimit(headers) {
  // Add null/undefined check
  if (!headers) {
    return;
  }
  
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
 * Get workflow results from artifacts (updated method signature)
 */
async getWorkflowResults(owner, repo, runId, token, clientPayload) {
  console.log("%c📥 GET WORKFLOW RESULTS STARTED", "background: #673AB7; color: white; font-size: 16px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
  console.log("=".repeat(80));
  
  try {
    console.log("%c📋 INPUT PARAMETERS", "background: #3F51B5; color: white; font-weight: bold; padding: 5px 10px;");
    console.log("Owner:", owner);
    console.log("Repository:", repo);
    console.log("Run ID:", runId);
    console.log("Token provided:", !!token);
    console.log("Token type:", typeof token);
    console.log("Client Payload:", clientPayload);
    
    // Validate token
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid GitHub token provided');
    }
    
    const octokit = new Octokit({ auth: token });
    
    const requirementId = clientPayload?.requirementId;
    const requestedTestIds = clientPayload?.testCases || [];
    
    console.log("Requirement ID:", requirementId);
    console.log("Requested Test IDs:", requestedTestIds);
    
    // Check workflow status
    console.log("%c🔍 CHECKING WORKFLOW STATUS", "background: #FF9800; color: white; font-weight: bold; padding: 5px 10px;");
    const { data: runData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
      owner,
      repo,
      run_id: runId,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });
    
    console.log("✅ Workflow status check complete");
    console.log("Status:", runData.status);
    console.log("Conclusion:", runData.conclusion);
    console.log("Created at:", runData.created_at);
    console.log("Updated at:", runData.updated_at);
    console.log("HTML URL:", runData.html_url);
    
    if (runData.status !== 'completed') {
      const error = new Error(`Workflow run has not completed yet. Current status: ${runData.status}`);
      console.error("❌", error.message);
      throw error;
    }
    
    // Get artifacts
    console.log("%c📦 FETCHING ARTIFACTS", "background: #4CAF50; color: white; font-weight: bold; padding: 5px 10px;");
    const { data: artifactsData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
      owner,
      repo,
      run_id: runId,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });
    
    this.updateRateLimit(artifactsData.headers);
    
    console.log("✅ Artifacts fetch complete");
    console.log("Total artifacts found:", artifactsData.artifacts?.length || 0);
    
    if (artifactsData.artifacts?.length > 0) {
      console.log("📋 All artifacts:");
      artifactsData.artifacts.forEach((artifact, index) => {
        console.log(`  ${index + 1}. ${artifact.name} (ID: ${artifact.id}, Size: ${artifact.size_in_bytes} bytes, Expires: ${artifact.expires_at})`);
      });
    }
    
    // Filter test results artifacts
    const resultsArtifacts = artifactsData.artifacts?.filter(artifact => 
      artifact.name.includes('test-results') || 
      artifact.name.includes('results') ||
      artifact.name.toLowerCase().includes('junit')
    ) || [];
    
    console.log("%c🎯 FILTERING TEST RESULTS ARTIFACTS", "background: #9C27B0; color: white; font-weight: bold; padding: 5px 10px;");
    console.log("Test results artifacts found:", resultsArtifacts.length);
    
    if (resultsArtifacts.length > 0) {
      console.log("📋 Test results artifacts:");
      resultsArtifacts.forEach((artifact, index) => {
        console.log(`  ${index + 1}. ${artifact.name} (ID: ${artifact.id})`);
      });
    }
    
    if (resultsArtifacts.length === 0) {
      console.warn("⚠️ No test results artifacts found");
      console.log("Creating fallback results for requested test IDs:", requestedTestIds);
      return requestedTestIds.map(testId => ({
        id: testId,
        name: `Test ${testId}`,
        status: 'Not Run',
        duration: 0,
        logs: 'No test results artifacts found'
      }));
    }
    
    // Process first artifact
    const artifact = resultsArtifacts[0];
    console.log("%c🔧 PROCESSING ARTIFACT", "background: #FF5722; color: white; font-weight: bold; padding: 5px 10px;");
    console.log("Selected artifact:", artifact.name);
    console.log("Artifact ID:", artifact.id);
    console.log("Artifact size:", artifact.size_in_bytes, "bytes");
    
    // Pass owner and repo to downloadAndProcessArtifact
    const results = await this.downloadAndProcessArtifact(artifact, token, requirementId, clientPayload, owner, repo);
    
    console.log("%c✅ WORKFLOW RESULTS COMPLETE", "background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    console.log("Final results count:", results.length);
    console.log("Final results:", results);
    
    return results;
    
  } catch (error) {
    console.error("%c💥 GET WORKFLOW RESULTS ERROR", "background: #D32F2F; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    console.error("Error details:", error);
    throw new Error(`Failed to get workflow results: ${error.message}`);
  }
}

/**
 * Download and process artifact content (updated to accept owner/repo parameters)
 */
// FIX for GitHubService.js - Process ALL XML files, not just one
// Replace the downloadAndProcessArtifact method around line 860-970

/**
 * Download and process workflow artifact with enhanced multi-file XML support
 */
// CRITICAL FIX: Replace the artifact download section in downloadAndProcessArtifact method
// Find this section around line 640-680 in your GitHubService and replace it:

async downloadAndProcessArtifact(artifact, token, requirementId, clientPayload, owner, repo) {
  console.log("%c📦 PROCESSING ZIP FILE", "background: #673AB7; color: white; font-weight: bold; padding: 5px 10px;");
  
  try {
    // ✅ FIX: Use Octokit instead of fetch for artifact download
    console.log("🔧 Using Octokit to download artifact...");
    
    const octokit = new Octokit({ auth: token });
    
    const downloadStart = Date.now();
    
    // ✅ CORRECT: Use Octokit request for artifact download
    const downloadResponse = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}', {
      owner: owner,
      repo: repo,
      artifact_id: artifact.id,
      archive_format: 'zip',
      headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });

    const downloadTime = Date.now() - downloadStart;
    console.log("✅ Artifact downloaded successfully");
    console.log("Download time:", downloadTime + "ms");
    console.log("Response data type:", typeof downloadResponse.data);
    console.log("Response data size:", downloadResponse.data.byteLength || downloadResponse.data.length || 'unknown', "bytes");

    // Load JSZip    
    /**
    const JSZip = window.JSZip;
    if (!JSZip) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load JSZip library'));
      });
      
      if (!window.JSZip) {
        throw new Error('JSZip library not available. Please ensure jszip is installed or included.');
      }
    }
    **/
    // ✅ FIX: Handle ArrayBuffer conversion properly for Octokit response
    let arrayBuffer;
    if (downloadResponse.data instanceof ArrayBuffer) {
      arrayBuffer = downloadResponse.data;
    } else if (typeof downloadResponse.data === 'string') {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      arrayBuffer = encoder.encode(downloadResponse.data).buffer;
    } else {
      // For any other data type, try to convert
      arrayBuffer = await new Response(downloadResponse.data).arrayBuffer();
    }
    
    console.log("ArrayBuffer size:", arrayBuffer.byteLength, "bytes");
    
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(arrayBuffer);
    
    const fileNames = Object.keys(zipContents.files);
    console.log("✅ ZIP processed successfully");
    console.log("Files in ZIP:", fileNames.length);
    console.log("ZIP contents:", fileNames);
    
    // ✅ ENHANCED: Find ALL XML files instead of just one
    console.log("%c🔍 FINDING TEST RESULTS FILE (XML PRIORITY)", "background: #FF9800; color: white; font-weight: bold; padding: 5px 10px;");
    
    // Find all XML and JSON files
    const xmlFiles = fileNames.filter(name => 
      name.endsWith('.xml') && 
      (name.includes('junit') || name.includes('test-results') || name.includes('test'))
    );
    
    const jsonFiles = fileNames.filter(name => 
      name.endsWith('.json') && 
      (name.includes('result') || name.includes('test') || name.includes('current'))
    );
    
    console.log("XML files found:", xmlFiles);
    console.log("JSON files found:", jsonFiles);
    
    // ✅ PRIORITY: Process ALL XML files first (JUnit XML has priority)
    if (xmlFiles.length > 0) {
      console.log(`✅ Using XML files (priority): Found ${xmlFiles.length} XML files`);
      console.log("Processing all XML files...");
      
      // ✅ ENHANCED: Parse ALL XML files and combine results
      const allTestResults = [];
      
      for (const xmlFileName of xmlFiles) {
        console.log(`📄 Processing XML file: ${xmlFileName}`);
        
        const xmlFile = zipContents.files[xmlFileName];
        const xmlContent = await xmlFile.async('text');
        
        console.log(`✅ File extracted successfully: ${xmlFileName}`);
        console.log("Content length:", xmlContent.length, "characters");
        console.log("Content preview:", xmlContent.substring(0, 500) + (xmlContent.length > 500 ? '...' : ''));
        
        // Parse this XML file
        console.log("📋 Parsing as JUnit XML...");
        const parsedXML = this.parseJUnitXML(xmlContent);
        
        if (parsedXML && parsedXML.tests && parsedXML.tests.length > 0) {
          console.log(`✅ JUnit XML parsed successfully: ${parsedXML.tests.length} tests`);
          allTestResults.push(...parsedXML.tests);
        } else {
          console.log(`⚠️ No tests found in XML file: ${xmlFileName}`);
        }
      }
      
      console.log(`✅ Combined XML parsing complete: ${allTestResults.length} total tests from ${xmlFiles.length} files`);
      
      // Create combined results object
      const combinedResults = {
        tests: allTestResults,
        source: 'junit-xml',
        filesProcessed: xmlFiles.length,
        totalTests: allTestResults.length
      };
      
      // Transform results
      console.log("%c🔄 TRANSFORMING RESULTS", "background: #673AB7; color: white; font-weight: bold; padding: 5px 10px;");
      const transformedResults = this.transformTestResults(combinedResults, clientPayload);
      
      console.log("%c✅ ARTIFACT PROCESSING COMPLETE", "background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
      console.log("Transformed results count:", transformedResults.length);
      console.log("Final transformed results:", transformedResults);
      
      return transformedResults;
    }
    
    // ✅ FALLBACK: Process JSON files if no XML found
    if (jsonFiles.length > 0) {
      console.log("✅ Using JSON files (fallback)");
      
      const jsonFile = zipContents.files[jsonFiles[0]];
      const jsonContent = await jsonFile.async('text');
      
      console.log("✅ File extracted successfully");
      console.log("Content length:", jsonContent.length, "characters");
      console.log("Content preview:", jsonContent.substring(0, 500) + (jsonContent.length > 500 ? '...' : ''));
      
      // Parse JSON
      let testResults;
      try {
        testResults = JSON.parse(jsonContent);
        console.log("✅ JSON parsed successfully");
        console.log("Parsed structure keys:", Object.keys(testResults));
      } catch (parseError) {
        console.error("❌ JSON parse failed:", parseError);
        testResults = { parseError: parseError.message, rawContent: jsonContent };
      }
      
      // Transform results
      console.log("%c🔄 TRANSFORMING RESULTS", "background: #673AB7; color: white; font-weight: bold; padding: 5px 10px;");
      const transformedResults = this.transformTestResults(testResults, clientPayload);
      
      console.log("%c✅ ARTIFACT PROCESSING COMPLETE", "background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
      console.log("Transformed results count:", transformedResults.length);
      console.log("Final transformed results:", transformedResults);
      
      return transformedResults;
    }
    
    // ✅ NO RESULTS: Create fallback
    console.warn("⚠️ No test results files found in artifact");
    const requestedTestIds = clientPayload?.testCases || [];
    console.log("Creating fallback results for:", requestedTestIds);
    return requestedTestIds.map(testId => ({
      id: testId,
      name: `Test ${testId}`,
      status: 'Not Run',
      duration: 0,
      logs: 'No test results file found in artifact'
    }));
    
  } catch (error) {
    console.error("%c💥 ARTIFACT PROCESSING ERROR", "background: #D32F2F; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    
    // Log more details about what failed
    console.error("Artifact details:", {
      name: artifact?.name,
      id: artifact?.id,
      size: artifact?.size_in_bytes
    });
    console.error("Client payload:", clientPayload);
    console.error("Owner/Repo:", owner, repo);
    
    // Return fallback results
    const requestedTestIds = clientPayload?.testCases || [];
    console.log("Creating error fallback results for:", requestedTestIds);
    console.log("Error fallback - original error was:", error.message);
    
    return requestedTestIds.map(testId => ({
      id: testId,
      name: `Test ${testId}`,
      status: 'Failed',
      duration: 0,
      logs: `Error processing artifact: ${error.message}`,
      rawOutput: `Error: ${error.message}\nStack: ${error.stack}`,
      failure: {
        type: 'ArtifactProcessingError',
        message: error.message,
        source: 'downloadAndProcessArtifact',
        parsingConfidence: 'high'
      }
    }));
  }
}

/**
 * Detect actual test framework from XML content and attributes
 */
detectFrameworkFromXML(xmlContent, testsuite) {
  // Priority 1: Check testsuite attributes
  const name = testsuite.getAttribute('name')?.toLowerCase() || '';
  const generator = testsuite.getAttribute('generator')?.toLowerCase() || '';
  const hostname = testsuite.getAttribute('hostname')?.toLowerCase() || '';
  
  // Priority 2: Check XML content patterns
  const contentLower = xmlContent.toLowerCase();
  
  // Framework detection patterns
  if (generator.includes('pytest') || name.includes('pytest') || contentLower.includes('pytest')) {
    return {
      name: 'pytest',
      version: this.extractVersion(generator, 'pytest') || null,
      source: 'xml-attribute'
    };
  }
  
  if (name.includes('testng') || contentLower.includes('testng')) {
    return {
      name: 'TestNG',
      version: this.extractVersion(contentLower, 'testng') || null,
      source: 'xml-attribute'
    };
  }
  
  if (name.includes('junit') || contentLower.includes('junit')) {
    return {
      name: 'JUnit',
      version: this.extractVersion(contentLower, 'junit') || null,
      source: 'xml-attribute'
    };
  }
  
  if (name.includes('surefire') || contentLower.includes('surefire')) {
    return {
      name: 'Maven Surefire',
      version: this.extractVersion(contentLower, 'surefire') || null,
      source: 'xml-attribute'
    };
  }
  
  if (contentLower.includes('nunit')) {
    return {
      name: 'NUnit',
      version: this.extractVersion(contentLower, 'nunit') || null,
      source: 'xml-content'
    };
  }
  
  // Fallback: Unknown framework but XML format
  return {
    name: 'Unknown',
    version: null,
    source: 'xml-fallback'
  };
}

/**
 * Helper method to extract version numbers
 */
extractVersion(text, frameworkName) {
  const patterns = [
    new RegExp(`${frameworkName}[\\s-]*(\\d+\\.\\d+\\.\\d+)`, 'i'),
    new RegExp(`${frameworkName}[\\s-]*(\\d+\\.\\d+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract error location and type from stack trace
 */
extractErrorDetails(stackTrace, errorType) {
  if (!stackTrace) {
    return { location: null, assertionType: null };
  }

  const details = {
    location: null,
    assertionType: errorType || null
  };

  // Pattern 1: Python style "file.py:line:"
  const pythonLocationMatch = stackTrace.match(/([^/\s]+\.py):(\d+):/);
  if (pythonLocationMatch) {
    details.location = {
      file: pythonLocationMatch[1],
      line: parseInt(pythonLocationMatch[2]),
      display: `${pythonLocationMatch[1]}:${pythonLocationMatch[2]}`
    };
  }

  // Pattern 2: JavaScript style "at file.js:line:col"
  if (!details.location) {
    const jsLocationMatch = stackTrace.match(/at [^(]*\(([^)]+\.(?:js|ts)):(\d+):(\d+)\)/);
    if (jsLocationMatch) {
      details.location = {
        file: jsLocationMatch[1],
        line: parseInt(jsLocationMatch[2]),
        display: `${jsLocationMatch[1]}:${jsLocationMatch[2]}`
      };
    }
  }

  // Pattern 3: Java style "at Class.method(File.java:line)"
  if (!details.location) {
    const javaLocationMatch = stackTrace.match(/at [^(]+\(([^)]+\.java):(\d+)\)/);
    if (javaLocationMatch) {
      details.location = {
        file: javaLocationMatch[1],
        line: parseInt(javaLocationMatch[2]),
        display: `${javaLocationMatch[1]}:${javaLocationMatch[2]}`
      };
    }
  }

  // Enhanced assertion type detection from stack trace content
  if (!details.assertionType && stackTrace) {
    const assertionTypes = [
      'SessionNotCreatedException',
      'AssertionError',
      'TimeoutException',
      'NoSuchElementException',
      'ElementNotInteractableException',
      'StaleElementReferenceException',
      'WebDriverException',
      'ValueError',
      'TypeError',
      'AttributeError',
      'KeyError',
      'IndexError'
    ];

    for (const type of assertionTypes) {
      if (stackTrace.includes(type)) {
        details.assertionType = type;
        break;
      }
    }
  }

  return details;
}

/**
 * 🔧 NEW: Parse JUnit XML format properly
 */
parseJUnitXML(xmlContent) {
  console.log("🔍 Starting JUnit XML parsing...");
  
  // Create a basic XML parser using DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`XML parsing failed: ${parseError.textContent}`);
  }
  
  const testsuites = xmlDoc.querySelectorAll('testsuite');
  const tests = [];
  let detectedFramework = null;
  
  testsuites.forEach((testsuite, index) => {
    // Detect framework from first testsuite
    if (index === 0) {
      detectedFramework = this.detectFrameworkFromXML(xmlContent, testsuite);
      console.log("🔍 Detected framework:", detectedFramework);
    }
    
    const testcases = testsuite.querySelectorAll('testcase');
    
    testcases.forEach(testcase => {
      const name = testcase.getAttribute('name');
      const classname = testcase.getAttribute('classname');
      const time = parseFloat(testcase.getAttribute('time') || '0');
      
      // Check for failure or error
      const failure = testcase.querySelector('failure');
      const error = testcase.querySelector('error');
      const skipped = testcase.querySelector('skipped');
      
      let status = 'Passed';
      let failureInfo = null;
      
      if (failure) {
  status = 'Failed';
  const errorDetails = this.extractErrorDetails(failure.textContent, failure.getAttribute('type'));
  
  failureInfo = {
    type: failure.getAttribute('type') || 'TestFailure',
    message: failure.getAttribute('message') || failure.textContent || 'Test failed',
    stackTrace: failure.textContent || '',
    source: 'junit-xml',
    parsingSource: 'junit-xml',
    parsingConfidence: 'high',
    location: errorDetails.location,        // ← Real location from stack trace
    assertionType: errorDetails.assertionType, // ← Real assertion type
    method: name || '',
    classname: classname || '',
    assertion: this.extractAssertionFromStackTrace(failure.textContent || '')
  };
      } else if (error) {
  status = 'Failed';
  const errorDetails = this.extractErrorDetails(error.textContent, error.getAttribute('type'));
  
  failureInfo = {
    type: error.getAttribute('type') || 'TestError',
    message: error.getAttribute('message') || error.textContent || 'Test error',
    stackTrace: error.textContent || '',
    source: 'junit-xml',
    parsingSource: 'junit-xml',
    parsingConfidence: 'high',
    location: errorDetails.location,        // ← Real location from stack trace
    assertionType: errorDetails.assertionType, // ← Real assertion type
    method: name || '',
    classname: classname || '',
    assertion: this.extractAssertionFromStackTrace(error.textContent || '')
  };
} else if (skipped) {
        status = 'Skipped';
      }
      
      // Extract test ID from name (assuming format like TC_001 or test_TC_001)
      const testIdMatch = name?.match(/TC_\d+/) || classname?.match(/TC_\d+/);
      const testId = testIdMatch ? testIdMatch[0] : name;
      
      tests.push({
        id: testId,
        name: name || testId,
        classname: classname,
        status: status,
        duration: time * 1000, // Convert to milliseconds
        failure: failureInfo,
        execution: {
          totalTime: time
        },
        framework: detectedFramework  // ← ADD this line
      });
    });
  });
  
  console.log(`✅ Parsed ${tests.length} test cases from JUnit XML`);
  return { 
    tests, 
    source: 'junit-xml',           // ← KEEP this
    framework: detectedFramework   // ← ADD this line
  };
}

/**
 * 🔧 NEW: Extract assertion details from stack trace
 */
extractAssertionFromStackTrace(stackTrace) {
  if (!stackTrace) {
    return { available: false };
  }
  
  // Python assertion patterns
  const assertPatterns = [
    // assert statement: assert False
    /assert\s+(.+?)$/gm,
    // Expected/actual patterns
    /Expected:\s*(.+?)$/gm,
    /Actual:\s*(.+?)$/gm,
    // Comparison failures: "X != Y"
    /['"]([^'"]*)['"]\s*(==|!=|<=|>=|<|>)\s*['"]([^'"]*)['"]/g,
    // Number comparisons: 5 != 10
    /(\d+(?:\.\d+)?)\s*(==|!=|<=|>=|<|>)\s*(\d+(?:\.\d+)?)/g
  ];
  
  for (const pattern of assertPatterns) {
    const matches = [...stackTrace.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      
      if (match[2]) { // Comparison pattern
        return {
          available: true,
          expression: match[0],
          actual: match[1],
          operator: match[2],
          expected: match[3]
        };
      } else { // Simple assert pattern
        return {
          available: true,
          expression: match[1] || match[0],
          actual: null,
          operator: null,
          expected: null
        };
      }
    }
  }
  
  return { available: false };
}

/**
 * 🔧 UPDATED: Transform test results with XML priority
 */
/**
 * Transform raw test results to application format with enhanced JUnit XML support
 */
transformTestResults(rawResults, clientPayload) {
  console.log("%c🔄 TRANSFORM TEST RESULTS", "background: #9C27B0; color: white; font-size: 16px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
  console.log("=".repeat(80));
  
  const requestedTestIds = clientPayload?.testCases || [];
  
  console.log("%c📋 TRANSFORMATION INPUT", "background: #3F51B5; color: white; font-weight: bold; padding: 5px 10px;");
  console.log("Requested Test IDs:", requestedTestIds);
  console.log("Raw Results Type:", typeof rawResults);
  console.log("Raw Results Keys:", rawResults ? Object.keys(rawResults) : 'null');
  console.log("Raw Results Structure:", rawResults);
  
  const transformedResults = requestedTestIds.map(testId => {
    console.log(`🔍 Processing test ID: ${testId}`);
    
    // Try different result structures with enhanced JUnit XML support
    let testResult = null;
    
    // ✅ ENHANCED: JUnit XML structure (highest priority)
    if (rawResults?.tests && Array.isArray(rawResults.tests)) {
      console.log(`  🔍 Searching in JUnit XML tests array (${rawResults.tests.length} tests)`);
      
      // Try exact match first
      testResult = rawResults.tests.find(t => t.name === testId);
      if (testResult) {
        console.log(`  ✅ Found exact name match in JUnit XML: ${testResult.name}`);
      }
      
      // Try fuzzy matching for JUnit XML
      if (!testResult) {
        testResult = rawResults.tests.find(t => {
          const testName = t.name || '';
          const className = t.classname || '';
          
          // Check if test ID is contained in test name or classname
          return testName.includes(testId) || 
                 className.includes(testId) ||
                 testId.includes(testName) ||
                 // Handle pytest-style naming where test function names don't include TC_XXX
                 (testName.startsWith('test_') && testId.includes(testName));
        });
        
        if (testResult) {
          console.log(`  ✅ Found fuzzy match in JUnit XML: ${testResult.name} (class: ${testResult.classname})`);
        }
      }
    }
    
    // ✅ FALLBACK: Other structures if JUnit XML didn't match
    if (!testResult) {
      // Structure 1: Direct array of tests
      if (Array.isArray(rawResults)) {
        testResult = rawResults.find(t => 
          t.id === testId || 
          t.name?.includes(testId) ||
          t.title?.includes(testId) ||
          testId.includes(t.name || '') ||
          testId.includes(t.title || '')
        );
        if (testResult) console.log(`  ✅ Found in direct array: ${testResult.name || testResult.title}`);
      }
      
      // Structure 2: Object with results array
      if (!testResult && rawResults?.results) {
        testResult = rawResults.results.find(t => 
          t.id === testId || 
          t.name?.includes(testId) ||
          t.title?.includes(testId) ||
          testId.includes(t.name || '') ||
          testId.includes(t.title || '')
        );
        if (testResult) console.log(`  ✅ Found in .results array: ${testResult.name || testResult.title}`);
      }
    }
    
    // If no specific result found, create a "Not Found" result
    if (!testResult) {
      console.log(`  ❌ Test result not found for: ${testId}`);
      
      return {
        id: testId,
        name: `Test ${testId}`,
        status: 'Not Found',
        duration: 0,
        logs: 'Test result not found in artifacts',
        rawOutput: '',
        failure: {
          type: 'TestNotFound',
          message: 'Test result not found in the generated artifacts',
          source: 'transform-fallback',
          parsingConfidence: 'high'
        }
      };
    }
    
    // ✅ Transform JUnit XML result to standard format
    const status = this.normalizeTestStatus(testResult);
    const duration = parseFloat(testResult.time || testResult.duration || 0) * 1000; // Convert to milliseconds
    
    // Enhanced logs generation for JUnit XML
    let logs = '';
    if (testResult.system_out) {
      logs += `STDOUT:\n${testResult.system_out}\n`;
    }
    if (testResult.system_err) {
      logs += `STDERR:\n${testResult.system_err}\n`;
    }
    if (testResult.failure) {
      logs += `FAILURE:\n${testResult.failure.message || testResult.failure}\n`;
    }
    if (testResult.error) {
      logs += `ERROR:\n${testResult.error.message || testResult.error}\n`;
    }
    if (!logs) {
      logs = status === 'Passed' ? 'Test completed successfully' : 'Test execution completed';
    }
    
    // ✅ Create enhanced failure object for JUnit XML
    let enhancedFailure = null;
    if (status === 'Failed' && (testResult.failure || testResult.error)) {
      const failureData = testResult.failure || testResult.error;
      
      enhancedFailure = {
        type: failureData.type || 'TestFailure',
        message: failureData.message || failureData.text || 'Test execution failed',
        parsingSource: rawResults.source || 'junit-xml',
        parsingConfidence: 'high',
        source: 'junit-xml-transform',
        category: 'general', // Simplified
        location: failureData.location || null,              
        assertionType: failureData.assertionType || null,
        file: testResult.file,
        line: testResult.line,
        classname: testResult.classname,
        method: testResult.name,
        stackTrace: failureData.stackTrace || failureData.text
      };
    }
    
    const transformed = {
  id: testId,
  name: testResult.name || testResult.title || `Test ${testId}`,
  status: status,
  duration: Math.round(duration),
  logs: logs.trim(),
  rawOutput: logs.trim(),
  failure: enhancedFailure,
  execution: {
    totalTime: duration / 1000,
    parsingSource: rawResults.source || 'junit-xml',  // ← CHANGE this line
    framework: testResult.framework || rawResults.framework || {  // ← ADD this section
      name: 'Unknown',
      version: null,
      source: 'fallback'
    }
  },
  file: testResult.file,
  classname: testResult.classname
};
    
    console.log(`  🔄 Transformed: ${testId} → ${status} (${Math.round(duration)}ms)`);
    if (enhancedFailure) {
      console.log(`    🔍 Failure info: ${enhancedFailure.type} - ${enhancedFailure.message}`);
      console.log(`    📊 Parsing source: ${enhancedFailure.parsingSource} (${enhancedFailure.parsingConfidence} confidence)`);
    }
    
    return transformed;
  });
  
  console.log("%c📊 TRANSFORMATION SUMMARY", "background: #4CAF50; color: white; font-weight: bold; padding: 5px 10px;");
  console.log("Input test IDs:", requestedTestIds.length);
  console.log("Output results:", transformedResults.length);
  console.log("Status breakdown:");
  const statusCounts = transformedResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
  
  console.log("%c✅ TRANSFORMATION COMPLETE", "background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
  console.log("Final transformed results:", transformedResults);
  
  return transformedResults;
}

/**
 * 🔧 NEW: Normalize duration from different sources
 */
normalizeDuration(testResult) {
  if (testResult.duration) return testResult.duration;
  if (testResult.time) return testResult.time * 1000; // Convert seconds to milliseconds
  if (testResult.execution?.totalTime) return testResult.execution.totalTime * 1000;
  return 0;
}

/**
 * Normalize different test status formats
 */
normalizeTestStatus(testResult) {
  const state = testResult.status || testResult.state || testResult.result || '';
  
  if (typeof state === 'string') {
    const lowerState = state.toLowerCase();
    
    // Handle "Not Found" status from GitHub workflow
    if (lowerState.includes('not found') || lowerState === 'not found') {
      return 'Not Found';
    }
    
    if (lowerState.includes('pass') || lowerState === 'passed' || lowerState === 'ok') {
      return 'Passed';
    }
    if (lowerState.includes('fail') || lowerState === 'failed' || lowerState === 'error') {
      return 'Failed';
    }
    if (lowerState.includes('skip') || lowerState === 'skipped' || lowerState === 'pending') {
      return 'Skipped';
    }
    if (lowerState.includes('not started') || lowerState === 'not started') {
      return 'Not Started';
    }
    if (lowerState.includes('running') || lowerState === 'running') {
      return 'Running';
    }
    if (lowerState.includes('blocked') || lowerState === 'blocked') {
      return 'Blocked';
    }
    if (lowerState.includes('cancelled') || lowerState === 'cancelled') {
      return 'Cancelled';
    }
  }
  
  // Check for failure indicators
  if (testResult.failureMessage || testResult.error || testResult.failed) {
    return 'Failed';
  }
  
  // If we have a valid status from the GitHub workflow, preserve it
  if (state === 'Not Found') {
    return 'Not Found';
  }
  
  // Default to passed if no failure indicators and no explicit status
  return 'Passed';
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