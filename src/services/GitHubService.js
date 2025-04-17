// src/services/GitHubService.js
import { Octokit } from "octokit";

class GitHubService {
  /**
   * Parse a GitHub repository URL to extract owner and repo
   */
  parseGitHubUrl(url) {
    try {
      // Handle different GitHub URL formats
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        throw new Error('URL is not a GitHub repository');
      }
      
      // The path should be something like /owner/repo
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length < 2) {
        throw new Error('Invalid GitHub repository URL format');
      }
      
      return {
        owner: pathParts[0],
        repo: pathParts[1]
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
   * Trigger a GitHub Actions workflow using the repository dispatch event
   */
  async triggerWorkflow(owner, repo, workflowFile, ref, token, payload) {
    try {
      const octokit = new Octokit({ auth: token });
      
      console.log("Triggering workflow with payload:", payload);
      
      // Create a repository dispatch event to trigger the workflow
      await octokit.request('POST /repos/{owner}/{repo}/dispatches', {
        owner,
        repo,
        event_type: 'quality-tracker-test-run',
        client_payload: payload,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      console.log("Repository dispatch event sent successfully");
      
      // Get the latest workflow run for the specified workflow file
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
        owner,
        repo,
        workflow_id: workflowFile,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      if (!data.workflow_runs || data.workflow_runs.length === 0) {
        throw new Error('No workflow runs found. The workflow may not exist or has not been triggered yet.');
      }
      
      console.log("Found latest workflow run:", data.workflow_runs[0].id);
      
      // Return the most recent workflow run
      return {
        id: data.workflow_runs[0].id,
        status: data.workflow_runs[0].status,
        html_url: data.workflow_runs[0].html_url,
        // Store the payload with the run for later reference
        client_payload: payload
      };
    } catch (error) {
      console.error('Error triggering workflow:', error);
      if (error.response) {
        throw new Error(`GitHub API Error: ${error.response.status} - ${error.response.data.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the status of a GitHub Actions workflow run
   */
  async getWorkflowStatus(owner, repo, runId, token) {
    try {
      const octokit = new Octokit({ auth: token });
      
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
        owner,
        repo,
        run_id: runId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      console.log("Workflow status:", data.status, "conclusion:", data.conclusion);
      
      return {
        id: data.id,
        status: data.status,
        conclusion: data.conclusion,
        html_url: data.html_url
      };
    } catch (error) {
      console.error('Error getting workflow status:', error);
      if (error.response) {
        throw new Error(`GitHub API Error: ${error.response.status} - ${error.response.data.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the results of a GitHub Actions workflow run
   * This would typically parse test results from workflow artifacts or job outputs
   */
  async getWorkflowResults(owner, repo, runId, token, clientPayload) {
    try {
      const octokit = new Octokit({ auth: token });
      
      // First check if the run completed successfully
      const { data: runData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
        owner,
        repo,
        run_id: runId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
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
      
      // Check if there's a test results artifact
      const testResultsArtifact = artifactsData.artifacts.find(artifact => 
        artifact.name === 'test-results' || artifact.name.includes('test-results')
      );
      
      if (testResultsArtifact) {
        // In a real implementation, you would download and parse the test results artifact
        console.log('Found test results artifact:', testResultsArtifact.name);
      }
      
      // For demonstration purposes, we're using the original client payload to generate
      // simulated test results when we can't access actual results from artifacts
      if (!clientPayload || !clientPayload.testCases) {
        throw new Error('Test case information not found in client payload');
      }
      
      // Generate simulated test results based on the test case IDs
      return clientPayload.testCases.map(testId => {
        const isPassed = Math.random() > 0.2;
        return {
          id: testId,
          name: `Test case ${testId}`,
          status: isPassed ? 'Passed' : 'Failed',
          duration: Math.floor(Math.random() * 1000) + 100,
          logs: `Executing test ${testId}\nTest completed with ${isPassed ? 'success' : 'failure'}.`
        };
      });
    } catch (error) {
      console.error('Error getting workflow results:', error);
      if (error.response) {
        throw new Error(`GitHub API Error: ${error.response.status} - ${error.response.data.message}`);
      }
      throw error;
    }
  }
}

export default new GitHubService();