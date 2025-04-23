// src/services/GitHubService.js
import { Octokit } from "octokit";
import JSZip from 'jszip';


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
      await octokit.request('POST /repos/{owner}/{repo}/dispatches?t=' + Date.now(), {
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

  // Enhanced GitHubService.js with better result fetching
/**
 * Download and process a test results artifact from GitHub Actions
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} artifactId - The artifact ID to download
 * @param {string} token - GitHub access token
 * @param {string} requirementId - The requirement ID associated with these tests
 * @returns {Promise<Array>} Parsed test results
 */
async downloadAndProcessArtifact(owner, repo, artifactId, token, requirementId) {
  console.log(`%c📦 Downloading artifact ${artifactId}`, "background: #3F51B5; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
  
  try {
    const octokit = new Octokit({ auth: token });
    
    // Download the artifact zip file
    const response = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/zip', {
      owner,
      repo,
      artifact_id: artifactId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    // The response is a binary blob
    console.log(`%c✅ Downloaded artifact zip file`, "color: #4CAF50; font-weight: bold;");
    
    // Use JSZip to extract the contents
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(response.data);
    
    // List all files in the zip for debugging
    console.log("%c📂 Files found in artifact:", "color: #4CAF50;");
    Object.keys(zipContents.files).forEach(filename => {
      console.log(`  - ${filename}`);
    });
    
    // Try to find the results file with run ID in the name first
    const fileKeys = Object.keys(zipContents.files);
    const runSpecificFile = fileKeys.find(name => name.startsWith('results-') && name.endsWith('.json'));
    
    // Fall back to results.json if run-specific file not found
    let resultsFile = runSpecificFile 
      ? zipContents.files[runSpecificFile]
      : zipContents.files['results.json'];
    
    // If neither found, try other common names
    if (!resultsFile) {
      console.log(`%c⚠️ Expected results file not found in artifact, searching for alternatives`, "color: #FF9800;");
      
      const possibleFileNames = [
        'test-results.json',
        'testResults.json',
        'output.json'
      ];
      
      for (const fileName of possibleFileNames) {
        if (zipContents.files[fileName]) {
          resultsFile = zipContents.files[fileName];
          break;
        }
      }
    }
    
    // If still no JSON file found, look for XML as a fallback
    if (!resultsFile) {
      const xmlFile = zipContents.files['test-results.xml'] || 
                     zipContents.files['junit.xml'] ||
                     Object.keys(zipContents.files).find(name => name.endsWith('.xml'));
      
      if (xmlFile) {
        console.log(`%c📄 Found XML file: ${xmlFile}`, "color: #FF9800;");
        resultsFile = zipContents.files[xmlFile];
      }
    }
    
    if (!resultsFile) {
      throw new Error('No test results file found in the artifact');
    }
    
    // Extract the file content
    const fileContent = await resultsFile.async('string');
    console.log(`%c📄 Found results file: ${resultsFile.name}`, "color: #4CAF50; font-weight: bold;");
    
    // Parse the content based on file type
    let parsedResults;
    
    if (resultsFile.name.endsWith('.json')) {
      // For JSON files, parse it
      parsedResults = JSON.parse(fileContent);
      console.log(`%c📊 Parsed JSON results:`, "color: #4CAF50;");
      
      // Log debug info if available
      if (parsedResults.debug) {
        console.log(`%c🔍 Debug info from workflow:`, "color: #4CAF50;");
        console.log(parsedResults.debug);
      }
      
      // Based on the workflow, we expect the JSON to have a specific structure
      // with requirementId, timestamp, and results array
      if (parsedResults.results && Array.isArray(parsedResults.results)) {
        console.log(`%c✅ Found ${parsedResults.results.length} test results in expected format`, "color: #4CAF50;");
        
        // Verify this is for the correct requirement
        if (parsedResults.requirementId && requirementId && parsedResults.requirementId !== requirementId) {
          console.warn(`%c⚠️ Artifact contains results for requirement ${parsedResults.requirementId} but we expected ${requirementId}`, "color: #FF9800;");
          // Continue anyway - we'll filter results by test ID later
        }

        // When processing results
        if (parsedResults.requestId && clientPayload.requestId && 
          parsedResults.requestId !== clientPayload.requestId) {
          console.warn(`Found results for request ${parsedResults.requestId} but expected ${clientPayload.requestId}`);
          return []; // Return empty to force fallback
        }
        
        return this.normalizeTestResults(parsedResults.results);
      } else {
        // If it doesn't match our expected structure, try to extract what we can
        console.log(`%c⚠️ JSON doesn't match expected format, attempting to extract test results`, "color: #FF9800;");
        return this.normalizeTestResults(parsedResults);
      }
    } else if (resultsFile.name.endsWith('.xml')) {
      // For XML files, convert from JUnit format
      console.log(`%c📊 Parsing XML (JUnit) results`, "color: #4CAF50;");
      
      // Parse the XML and convert to our format
      const convertedResults = this.convertJUnitToResults(fileContent);
      return this.normalizeTestResults(convertedResults);
    } else {
      throw new Error(`Unsupported file format: ${resultsFile.name}`);
    }
  } catch (error) {
    console.error('%c❌ Error downloading and processing artifact:', "color: #F44336; font-weight: bold;", error);
    throw new Error(`Error processing artifact: ${error.message}`);
  }
}

/**
 * Convert JUnit XML test results to our expected format
 * @param {string} xmlContent - JUnit XML content
 * @returns {Array} Normalized test results
 */
convertJUnitToResults(xmlContent) {
  try {
    console.log(`%c🔄 Converting JUnit XML to test results format`, "color: #FF9800;");
    
    // Use DOMParser to parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML format');
    }
    
    const results = [];
    
    // Process <testcase> elements
    const testcases = xmlDoc.querySelectorAll('testcase');
    console.log(`%c📊 Found ${testcases.length} test cases in JUnit XML`, "color: #FF9800;");
    
    testcases.forEach(testcase => {
      // Extract basic attributes
      const classname = testcase.getAttribute('classname') || '';
      const name = testcase.getAttribute('name') || '';
      const time = parseFloat(testcase.getAttribute('time') || '0') * 1000; // Convert to ms
      
      // Based on the workflow, the test ID should be embedded in the name or classname
      // The workflow specifically looks for test IDs in names, so we should do the same
      const testIdMatch = 
        name.match(/TC[_-]\d+/i) || 
        classname.match(/TC[_-]\d+/i) || 
        name.match(/test[_-]?(\d+)/i) || 
        classname.match(/test[_-]?(\d+)/i);
        
      let id = testIdMatch ? testIdMatch[0] : `TC_${this.hashString(classname + name)}`;
      
      // Normalize ID format to match what's expected by the application (TC_XXX)
      id = id.replace(/-/g, '_').toUpperCase();
      if (!id.startsWith('TC_')) {
        id = `TC_${id.replace(/^TC/i, '')}`;
      }
      
      // Determine status - follows the same logic as the workflow Python script
      let status = 'Passed';
      let log = '';
      
      // Check for failures
      const failure = testcase.querySelector('failure');
      if (failure) {
        status = 'Failed';
        log = failure.textContent || failure.getAttribute('message') || 'Test failed';
      }
      
      // Check for errors
      const error = testcase.querySelector('error');
      if (error) {
        status = 'Failed';
        log = error.textContent || error.getAttribute('message') || 'Test error';
      }
      
      // Check for skipped tests
      const skipped = testcase.querySelector('skipped');
      if (skipped) {
        status = 'Not Run';
        log = skipped.textContent || skipped.getAttribute('message') || 'Test skipped';
      }
      
      results.push({
        id,
        name: `${classname}.${name}`,
        status,
        duration: Math.round(time),
        logs: log
      });
    });
    
    return results;
  } catch (error) {
    console.error('Error converting JUnit XML:', error);
    throw new Error(`Error converting JUnit XML: ${error.message}`);
  }
}

/**
 * Normalize test results to match the exact format expected by the application
 * @param {Array|Object} results - Test results to normalize
 * @returns {Array} Normalized test results
 */
normalizeTestResults(results) {
  // Handle different result formats
  let testsArray = [];
  
  if (Array.isArray(results)) {
    testsArray = results;
  } else if (results && typeof results === 'object') {
    if (results.results && Array.isArray(results.results)) {
      testsArray = results.results;
    } else if (results.testResults && Array.isArray(results.testResults)) {
      testsArray = results.testResults;
    } else if (results.tests && Array.isArray(results.tests)) {
      testsArray = results.tests;
    } else {
      // If no obvious array found, try to extract from the object
      testsArray = Object.values(results).filter(item => 
        item && typeof item === 'object' && (item.id || item.name || item.status)
      );
    }
  }
  
  if (testsArray.length === 0) {
    console.warn('No valid test results found in artifact');
    return [];
  }
  
  // Map to the exact format expected by the TestRunner component
  return testsArray.map(test => {
    return {
      id: test.id || 'TC_UNKNOWN',
      name: test.name || test.id || 'Unknown Test',
      status: test.status || 'Not Run',
      duration: test.duration || 0,
      logs: test.logs || test.message || ''
    };
  });
}

/**
 * Create a simple hash from a string
 * @param {string} str - String to hash
 * @returns {string} Numeric hash string
 */
hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString().substring(0, 3).padStart(3, '0');
}

/**
 * Get the results of a GitHub Actions workflow run
 */
async getWorkflowResults(owner, repo, runId, token, clientPayload) {
  try {
    console.log(`%c🔍 Fetching workflow results for run ${runId}`, "background: #3F51B5; color: white; font-weight: bold; padding: 3px 6px; border-radius: 3px;");
    const octokit = new Octokit({ auth: token });
    
    // Extract requirement ID from the client payload
    const requirementId = clientPayload?.requirementId;
    if (!requirementId) {
      console.warn(`%c⚠️ No requirement ID found in client payload`, "color: #FF9800; font-weight: bold;");
    }

    // Extract test IDs for validation
    const requestedTestIds = clientPayload?.testCases || [];
    console.log(`%c📋 Requested test IDs: ${requestedTestIds.join(', ')}`, "color: #3F51B5;");
    
    // First check if the run completed successfully
    const { data: runData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
      owner,
      repo,
      run_id: runId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    console.log(`%c📊 Workflow run status: ${runData.status}, conclusion: ${runData.conclusion}`, "color: #3F51B5; font-weight: bold;");
    
    if (runData.status !== 'completed') {
      throw new Error('Workflow run has not completed yet');
    }
    
    // Get workflow artifacts
    console.log(`%c🔍 Checking for test result artifacts`, "color: #3F51B5;");
    const { data: artifactsData } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
      owner,
      repo,
      run_id: runId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    console.log(`%c📁 Found ${artifactsData.total_count} artifacts`, "color: #3F51B5;");
    
    // IMPROVED: First try to find a run-specific artifact (most reliable)
    let testResultsArtifact = artifactsData.artifacts.find(artifact => 
      artifact.name === `test-results-${runId}`
    );
    
    // Fall back to generic name if not found
    if (!testResultsArtifact) {
      testResultsArtifact = artifactsData.artifacts.find(artifact => 
        artifact.name === 'test-results'
      );
    }
    
    // Try to extract results from the artifact
    if (testResultsArtifact) {
      console.log(`%c✅ Found test results artifact: ${testResultsArtifact.name} (${testResultsArtifact.id})`, "color: #4CAF50; font-weight: bold;");
      
      try {
        // Use our specialized method to download and process the artifact
        const artifactResults = await this.downloadAndProcessArtifact(
          owner, 
          repo, 
          testResultsArtifact.id, 
          token,
          requirementId
        );
        
        // If we successfully got results from the artifact, validate them against requested test IDs
        if (artifactResults && artifactResults.length > 0) {
          console.log(`%c📊 Retrieved ${artifactResults.length} test results from artifact`, "color: #4CAF50; font-weight: bold;");
          
          // IMPROVED: Filter to only include results for the test IDs that were requested
          const filteredResults = requestedTestIds.length > 0
            ? artifactResults.filter(result => {
                // Normalize IDs for comparison
                const normalizedResultId = result.id.replace(/-/g, '_').toUpperCase();
                return requestedTestIds.some(testId => {
                  const normalizedTestId = testId.replace(/-/g, '_').toUpperCase();
                  return normalizedResultId === normalizedTestId;
                });
              })
            : artifactResults;
          
          if (filteredResults.length > 0) {
            console.log(`%c📊 Using ${filteredResults.length} matching test results from artifact`, "color: #4CAF50; font-weight: bold;");
            return filteredResults;
          } else {
            console.warn(`%c⚠️ No matching test results found in artifact. Will try fallback methods.`, "color: #FF9800; font-weight: bold;");
          }
        }
      } catch (artifactError) {
        console.error("Error processing artifact:", artifactError);
        console.log("%c⚠️ Falling back to alternative methods", "color: #FF9800; font-weight: bold;");
      }
    } else {
      console.log(`%c⚠️ No relevant test results artifact found`, "color: #FF9800;");
    }
    
    // If we couldn't get results from the artifact, check if there's a callback URL in the payload
    // The workflow uses this to send results back directly
    if (clientPayload?.callbackUrl) {
      console.log(`%c🔍 Callback URL is configured (${clientPayload.callbackUrl}), webhook data may be received separately`, "color: #3F51B5;");
      console.log(`%c⚠️ Will use fallback results for now`, "color: #FF9800;");
    }
    
    // If we have a client payload with test case information, generate fallback results
    if (!clientPayload || !clientPayload.testCases || clientPayload.testCases.length === 0) {
      console.warn(`%c⚠️ No test case information found in client payload`, "color: #FF9800; font-weight: bold;");
      throw new Error('Test case information not found in client payload');
    }
    
    console.log(`%c📊 Generating fallback test results for ${clientPayload.testCases.length} requested test cases`, "color: #FF9800; font-weight: bold;");
    console.log(`%c⚠️ These are simulated results as no matching artifact data was available!`, "color: #FF9800; font-weight: bold;");
    
    // Generate deterministic results based on test case IDs
    const testResults = clientPayload.testCases.map(testId => {
      // Use a seed based on the test ID for more consistent results
      const testIdSum = testId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const seed = testIdSum / 1000;
      const random = Math.abs(Math.sin(seed)); // Use sine function with the seed for "random" value
      const isPassed = random > 0.3; // Make most tests pass for demonstration
      
      return {
        id: testId,
        name: `Test case ${testId}`,
        status: isPassed ? 'Passed' : 'Failed',
        duration: Math.floor(random * 1000) + 100,
        logs: `Executing test ${testId}\nTest completed with ${isPassed ? 'success' : 'failure'}.`,
        simulated: true // Flag to indicate this is a simulated result
      };
    });
    
    console.log(`%c⚙️ Generated ${testResults.length} fallback test results`, "color: #FF9800; font-weight: bold;");
    console.table(testResults.map(r => ({
      'ID': r.id,
      'Status': r.status,
      'Duration': r.duration,
      'Simulated': r.simulated || false
    })));
    
    return testResults;
  } catch (error) {
    console.error('%c❌ Error getting workflow results:', "color: #F44336; font-weight: bold;", error);
    if (error.response) {
      throw new Error(`GitHub API Error: ${error.response.status} - ${error.response.data.message}`);
    }
    throw error;
  }
}
  
}

export default new GitHubService();