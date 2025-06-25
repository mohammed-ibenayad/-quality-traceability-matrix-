// src/components/TestExecution/TestExecutionModal.jsx - Complete Revised Version
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  GitBranch,
  Save,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';
import GitHubService from '../../services/GitHubService';
import dataStore from '../../services/DataStore';
import { refreshQualityGates } from '../../utils/calculateQualityGates';
import webhookService from '../../services/WebhookService';

const getCallbackUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/webhook/test-results';
  }
  return `${window.location.protocol}//${window.location.hostname}/api/webhook/test-results`;
};

const TestExecutionModal = ({ 
  requirement = null, // null for bulk execution from Test Cases page
  testCases = [], 
  isOpen = false, 
  onClose, 
  onTestComplete 
}) => {
  // GitHub Configuration state
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('testRunnerConfig');
    const defaultConfig = {
      repoUrl: '',
      branch: 'main',
      workflowId: 'quality-tracker-tests.yml',
      ghToken: '',
      callbackUrl: getCallbackUrl()
    };
    return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
  });

  // Backend support detection
  const [hasBackendSupport, setHasBackendSupport] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [testResults, setTestResults] = useState([]);
  const [executionStarted, setExecutionStarted] = useState(false);
  const [completedTests, setCompletedTests] = useState(0);
  
  // GitHub execution state
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  
  // Added state for polling management
  const [pollInterval, setPollInterval] = useState(null);
  const [webhookTimeout, setWebhookTimeout] = useState(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [useGitHub, setUseGitHub] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize test results when modal opens
  useEffect(() => {
    if (isOpen && testCases.length > 0) {
      const initialResults = testCases.map(testCase => ({
        id: testCase.id,
        name: testCase.name,
        status: 'Not Started',
        duration: 0,
        startTime: null,
        endTime: null
      }));
      setTestResults(initialResults);

      // Reset all states
      setExecuting(false);
      setCancelled(false);
      setCurrentTestIndex(-1);
      setExecutionStarted(false);
      setCompletedTests(0);
      setIsRunning(false);
      setWaitingForWebhook(false);
      setResults(null);
      setError(null);
      setProcessingStatus(null);
      setIsProcessing(false);
      setCurrentRequestId(null);
      
      // Clear intervals and timeouts
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
      }

      console.log('Test execution modal opened for:', requirement ? requirement.id : 'bulk execution');
      console.log('Test cases to run:', testCases);
    }
  }, [isOpen, testCases, requirement, pollInterval, webhookTimeout]);

  // Check backend availability
  const checkBackend = async () => {
    try {
      setBackendStatus('checking');
      const isHealthy = await webhookService.checkBackendHealth();
      setHasBackendSupport(isHealthy);
      setBackendStatus(isHealthy ? 'available' : 'unavailable');
      
      if (!isHealthy) {
        console.log('📡 Webhook service unavailable, using fallback mode:', 'Webhook service not healthy');
      }
    } catch (error) {
      console.error('Backend check failed:', error);
      setHasBackendSupport(false);
      setBackendStatus('unavailable');
      console.log('📡 Webhook service unavailable, using fallback mode:', 'Webhook service not healthy');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkBackend();
    }
  }, [isOpen]);

  // Set up webhook listeners
  useEffect(() => {
    if (!isOpen || !currentRequestId) return;

    const handleWebhookResults = (webhookData) => {
      console.log("🔔 WEBHOOK RECEIVED:", webhookData);
      
      // Check if this webhook matches our current execution
      const matchesRequirement = webhookData?.requirementId === (requirement?.id || `bulk_req_${currentRequestId?.split('_')[1]}_${currentRequestId?.split('_')[2]}`);
      const matchesRequest = webhookData?.requestId === currentRequestId;
      
      if (matchesRequirement || matchesRequest) {
        console.log("✅ Webhook matches current execution - processing results");
        processWebhookResults(webhookData);
      } else {
        console.log("❌ Webhook doesn't match current execution - ignoring");
        console.log("Expected:", { requirementId: requirement?.id, requestId: currentRequestId });
        console.log("Received:", { requirementId: webhookData?.requirementId, requestId: webhookData?.requestId });
      }
    };
    
    return () => {
      window.onTestWebhookReceived = null;
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [requirement?.id, hasBackendSupport, currentRequestId, webhookTimeout, pollInterval]);

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('testRunnerConfig', JSON.stringify(config));
    setShowSettings(false);
  };

  // Execute tests with simulation (original TestCases modal logic)
  const executeTestsSimulation = async () => {
    if (cancelled) return;
    
    setExecuting(true);
    setExecutionStarted(true);
    setCompletedTests(0);

    for (let i = 0; i < testCases.length; i++) {
      if (cancelled) {
        setTestResults(prev => prev.map((result, index) => 
          index >= i ? { ...result, status: 'Cancelled' } : result
        ));
        break;
      }

      setCurrentTestIndex(i);
      
      setTestResults(prev => prev.map((result, index) => 
        index === i ? { ...result, status: 'Running', startTime: new Date() } : result
      ));

      const duration = Math.random() * 3000 + 1000; // 1-4 seconds
      await new Promise(resolve => setTimeout(resolve, duration));

      if (cancelled) break;

      const passed = Math.random() > 0.2;
      const status = passed ? 'Passed' : 'Failed';

      setTestResults(prev => prev.map((result, index) => 
        index === i ? { 
          ...result, 
          status, 
          duration: Math.round(duration / 1000),
          endTime: new Date()
        } : result
      ));

      // Update test case status in DataStore
      const testCase = testCases[i];
      dataStore.updateTestCase(testCase.id, { 
        ...testCase, 
        status, 
        lastRun: new Date().toISOString()
      });

      setCompletedTests(i + 1);
    }

    setExecuting(false);
    setCurrentTestIndex(-1);

    if (onTestComplete) {
      onTestComplete(testResults);
    }

    refreshQualityGates();
  };

  // Process webhook results
  const processWebhookResults = (webhookData) => {
    console.log("🔧 PROCESSING WEBHOOK RESULTS:", webhookData);
    
    setWaitingForWebhook(false);
    setIsRunning(false);
    
    if (webhookTimeout) {
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }
    
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    if (webhookData?.results) {
      setResults(webhookData.results);
      setProcessingStatus('completed');

      // Update test results display
      const updatedResults = testCases.map(tc => {
        const result = webhookData.results.find(r => r.id === tc.id);
        return result ? {
          id: tc.id,
          name: tc.name,
          status: result.status || 'Not Run',
          duration: result.duration || 0,
          logs: result.logs || ''
        } : {
          id: tc.id,
          name: tc.name,
          status: 'Not Run',
          duration: 0,
          logs: 'No result found'
        };
      });

      setTestResults(updatedResults);

      // Update DataStore with results
      updatedResults.forEach(result => {
        const testCase = testCases.find(tc => tc.id === result.id);
        if (testCase) {
          dataStore.updateTestCase(testCase.id, {
            ...testCase,
            status: result.status,
            lastRun: new Date().toISOString()
          });
        }
      });

      console.log("✅ Results processed and DataStore updated");
      
      if (onTestComplete) {
        onTestComplete(updatedResults);
      }

      refreshQualityGates();
    } else {
      console.error("❌ No results found in webhook data");
      setError('No test results received from webhook');
    }
  };

  // Execute tests with GitHub Actions
  const executeTestsGitHub = async () => {
    console.log("%c🚀 EXECUTE TESTS GITHUB STARTED", "background: #4CAF50; color: white; font-size: 16px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    console.log("=".repeat(80));
    
    try {
      setIsRunning(true);
      setError(null);
      setResults(null);
      setProcessingStatus('triggering');

      // Generate unique request ID
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const requestId = `req_${timestamp}_${randomId}`;
      setCurrentRequestId(requestId);

      // Parse repository URL
      const repoUrl = config.repoUrl;
      const urlParts = repoUrl.replace('https://github.com/', '').split('/');
      const owner = urlParts[0];
      const repo = urlParts[1];

      // Create payload for GitHub Actions
      const payload = {
        requirementId: requirement?.id || `bulk_req_${timestamp}_${randomId}`,
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl,
        requestId: requestId
      };

      console.log('GitHub execution payload:', payload);
      console.log('Backend support:', hasBackendSupport ? 'Available' : 'Using fallback');
      console.log('Request ID:', requestId);

      // Register with webhook service if available
      if (hasBackendSupport && webhookService) {
        console.log("🔗 Registering with webhook service");
        webhookService.registerTestExecution(requirement?.id || payload.requirementId, requestId);
      } else {
        console.log("⚠️ Skipping webhook service registration (backend unavailable)");
      }

      // Enhanced decision logic from TestRunner
      const useSimulatedResults = !config.repoUrl || 
                                config.repoUrl.includes('example') ||
                                (!hasBackendSupport && config.callbackUrl.includes('webhook.site'));

      // Enhanced logging for decision process
      console.log("%c🎯 EXECUTION MODE DECISION", "background: #9C27B0; color: white; font-weight: bold; padding: 5px 10px;");
      
      const condition1 = !config.repoUrl;
      const condition2 = config.repoUrl?.includes('example');
      const condition3 = (!hasBackendSupport && config.callbackUrl?.includes('webhook.site'));
      
      console.log("Decision Conditions:");
      console.log("  1. No repo URL (!config.repoUrl):", condition1);
      console.log("  2. Contains 'example' (config.repoUrl.includes('example')):", condition2);
      console.log("  3. Backend unavailable + webhook.site ((!hasBackendSupport && config.callbackUrl.includes('webhook.site'))):", condition3);
      console.log("Backend Support:", hasBackendSupport);
      console.log("Webhook URL:", config.callbackUrl);
      console.log("Repository URL:", config.repoUrl);
      
      console.log("Final Decision: useSimulatedResults =", useSimulatedResults);
      console.log("Execution Path:", useSimulatedResults ? "🎭 Simulated Results" : "🐙 Real GitHub Workflow → Artifact Download");

      if (useSimulatedResults) {
        const reason = condition1 ? "No repo URL" : condition2 ? "Contains 'example'" : "Backend unavailable + webhook.site";
        console.log("Reason for simulation:", reason);
        console.log('Using simulated GitHub results');
        setWaitingForWebhook(true);
        
        const timeout = setTimeout(() => {
          const simulatedResults = testCases.map(tc => ({
            id: tc.id,
            name: tc.name,
            status: Math.random() > 0.2 ? 'Passed' : 'Failed',
            duration: Math.floor(Math.random() * 1000) + 100
          }));
          
          processWebhookResults({
            requirementId: payload.requirementId,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            results: simulatedResults
          });
        }, 5000);
        
        setWebhookTimeout(timeout);
        return;
      }

      console.log("📋 Will trigger real GitHub workflow and wait for webhook timeout to download artifacts");

      // Trigger real GitHub Actions workflow
      const run = await GitHubService.triggerWorkflow(
        owner, repo, config.workflowId, config.branch, config.ghToken, payload
      );

      setWorkflowRun(run); // Still set state for UI display
      setWaitingForWebhook(true);
      
      console.log(`✅ Workflow triggered: ${run.id}`);
      console.log(`⏳ Waiting for webhook at: ${config.callbackUrl}`);
      console.log(`📝 Request ID: ${requestId}`);

      // Enhanced webhook timeout logic with GitHub API polling fallback
      const webhookTimeoutDuration = hasBackendSupport ? 120000 : 30000; // 2 min vs 30 sec

      console.log("%c⏰ WEBHOOK TIMEOUT CONFIGURATION", "background: #FF5722; color: white; font-weight: bold; padding: 5px 10px;");
      console.log("Timeout Duration:", webhookTimeoutDuration + "ms");
      console.log("Timeout Reason:", hasBackendSupport ? "Backend available (2 min)" : "Backend unavailable (30 sec)");
      console.log("Waiting for webhook at:", config.callbackUrl || "(empty - will timeout and poll)");

      const timeout = setTimeout(async () => {
        console.log("%c🚨 WEBHOOK TIMEOUT REACHED", "background: #F44336; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
        console.log("=".repeat(80));
        console.log("Request ID:", requestId);
        console.log("Time elapsed:", webhookTimeoutDuration + "ms");
        
        // DEBUG: Check variables availability
        console.log("🔍 DEBUG: Checking variables availability:");
        console.log("waitingForWebhook:", waitingForWebhook);
        console.log("workflowRun (state):", workflowRun);
        console.log("run (closure):", run); // ✅ This should be available
        console.log("owner:", owner);
        console.log("repo:", repo);
        console.log("hasBackendSupport:", hasBackendSupport);
        console.log("webhookService:", !!webhookService);
        
        // Check if we're still waiting for webhook
        if (!waitingForWebhook) {
          console.log("⚠️ No longer waiting for webhook, exiting timeout");
          return;
        }

        // ✅ FIX: Use the local `run` variable instead of state `workflowRun`
        if (!run || !run.id) {
          console.error("❌ No workflow run available for polling");
          setError('Cannot poll workflow status: Missing workflow run data');
          setIsRunning(false);
          setWaitingForWebhook(false);
          return;
        }
        
        // STEP 1: Try backend polling first (if available)
        if (hasBackendSupport && webhookService) {
          console.log("%c🔄 ATTEMPTING BACKEND POLLING", "background: #3F51B5; color: white; font-weight: bold; padding: 5px 10px;");
          try {
            console.log("🔍 Polling backend for specific request results");
            const polledResults = await webhookService.fetchResultsByRequestId(requestId);
            
            if (polledResults) {
              console.log("✅ Found results via backend polling");
              processWebhookResults(polledResults);
              return;
            }
            
            console.log("🔍 Trying general requirement polling");
            const generalResults = await webhookService.fetchLatestResultsForRequirement(
              requirement?.id || payload.requirementId
            );
            
            if (generalResults) {
              console.log("⚠️ Using latest results for requirement (may not be from current execution)");
              processWebhookResults(generalResults);
              return;
            }
            
            console.log("❌ No results found via backend polling");
          } catch (pollError) {
            console.error("❌ Backend polling failed:", pollError);
          }
        } else {
          console.log("%c⏭️ SKIPPING BACKEND POLLING", "background: #607D8B; color: white; font-weight: bold; padding: 5px 10px;");
          console.log("Reason: hasBackendSupport =", hasBackendSupport, "| webhookService available =", !!webhookService);
        }
        
        // STEP 2: GitHub API polling fallback (🎯 THIS IS WHERE ARTIFACT DOWNLOAD HAPPENS!)
        console.log("%c🔄 STARTING GITHUB API POLLING", "background: #000; color: white; font-weight: bold; padding: 5px 10px;");
        console.log("Polling workflow:", run.id); // ✅ Use local `run` variable
        console.log("Repository:", owner + "/" + repo);
        console.log("Poll interval: 2 seconds");
        
        let pollCount = 0;
        const maxPolls = 150; // 5 minutes of polling (150 * 2 seconds)
        
        const interval = setInterval(async () => {
          pollCount++;
          
          try {
            console.log(`🔍 Poll #${pollCount}: Checking workflow status...`);
            
            // Check workflow status - ✅ Use local `run` variable
            const status = await GitHubService.getWorkflowStatus(owner, repo, run.id, config.ghToken);
            
            console.log(`📊 Workflow ${run.id} status: ${status.status} | conclusion: ${status.conclusion || 'N/A'}`);
            
            if (status.status === 'completed') {
              clearInterval(interval);
              setPollInterval(null);
              setIsRunning(false);
              setWaitingForWebhook(false);
              
              console.log("%c🎉 GITHUB WORKFLOW COMPLETED", "background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
              console.log("=".repeat(80));
              console.log("Final Status:", status.status);
              console.log("Conclusion:", status.conclusion);
              console.log("Total Polls:", pollCount);
              
              try {
                console.log("%c📥 FETCHING ARTIFACTS AND RESULTS", "background: #673AB7; color: white; font-weight: bold; padding: 5px 10px;");
                
                // 🎯 THIS IS THE KEY PART - Downloads and processes GitHub artifacts!
                // ✅ Use local `run` variable
                const actionResults = await GitHubService.getWorkflowResults(
                  owner, 
                  repo, 
                  run.id, 
                  config.ghToken, 
                  { 
                    requirementId: payload.requirementId,
                    testCases: payload.testCases,
                    requestId: requestId 
                  }
                );
                
                console.log("✅ Artifacts processed successfully");
                console.log("Results count:", actionResults.length);
                console.log("Detailed results:", actionResults);
                
                // Structure results for processing
                const structuredResults = {
                  requirementId: payload.requirementId,
                  requestId: requestId,
                  timestamp: new Date().toISOString(),
                  results: actionResults,
                  source: 'github-api-polling'
                };
                
                console.log("%c📤 STRUCTURED RESULTS PREPARED", "background: #2E7D32; color: white; font-weight: bold; padding: 5px 10px;");
                console.log("Structured results:", structuredResults);
                
                // Process the results using existing handler
                processWebhookResults(structuredResults);
                
              } catch (resultsError) {
                console.error("%c❌ ERROR GETTING WORKFLOW RESULTS", "background: #D32F2F; color: white; font-weight: bold; padding: 5px 10px;");
                console.error("Error details:", resultsError);
                console.error("Error stack:", resultsError.stack);
                
                // Show detailed error to user
                setError(`Tests completed but results could not be retrieved: ${resultsError.message}. Check GitHub Actions logs and ensure artifacts are generated.`);
                setIsRunning(false);
                setWaitingForWebhook(false);
              }
              
            } else if (status.status === 'failure' || status.conclusion === 'failure') {
              console.warn(`⚠️ Workflow failed but continuing to poll (status: ${status.status}, conclusion: ${status.conclusion})`);
              // Continue polling - sometimes artifacts are still generated even if workflow "fails"
              
            } else if (pollCount >= maxPolls) {
              // Timeout after maximum polls
              console.error("%c🛑 POLLING TIMEOUT", "background: #D32F2F; color: white; font-weight: bold; padding: 5px 10px;");
              console.error(`Reached maximum polls (${maxPolls}) after ${(maxPolls * 2) / 60} minutes`);
              
              clearInterval(interval);
              setPollInterval(null);
              setError(`Polling timeout: Workflow took too long to complete (${(maxPolls * 2) / 60} minutes). Check GitHub Actions for more details.`);
              setIsRunning(false);
              setWaitingForWebhook(false);
            }
            
          } catch (pollError) {
            console.error(`❌ Poll #${pollCount} failed:`, pollError);
            
            if (pollCount >= maxPolls) {
              clearInterval(interval);
              setPollInterval(null);
              setError(`Polling failed after ${pollCount} attempts: ${pollError.message}`);
              setIsRunning(false);
              setWaitingForWebhook(false);
            }
            // Continue polling on error unless max attempts reached
          }
        }, 2000); // Poll every 2 seconds
        
        setPollInterval(interval);

      }, webhookTimeoutDuration);

      setWebhookTimeout(timeout);

    } catch (error) {
      console.error("❌ GitHub execution failed:", error);
      setError(`Failed to execute tests: ${error.message}`);
      setIsRunning(false);
      setWaitingForWebhook(false);
      setProcessingStatus('error');
    }
  };

  // Main execute function
  const executeTests = () => {
    if (useGitHub) {
      executeTestsGitHub();
    } else {
      executeTestsSimulation();
    }
  };

  // Cancel execution
  const handleCancel = () => {
    setCancelled(true);
    setExecuting(false);
    setIsRunning(false);
    setWaitingForWebhook(false);
    
    if (webhookTimeout) {
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }
    
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  // Status icon helper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Passed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'Failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'Running':
        return <Loader2 className="text-blue-500 animate-spin" size={16} />;
      case 'Not Started':
        return <Clock className="text-gray-400" size={16} />;
      case 'Cancelled':
        return <X className="text-orange-500" size={16} />;
      case 'Not Run':
        return <Clock className="text-gray-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const isExecuting = executing || isRunning;
  const isWaiting = waitingForWebhook;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Test Execution: {requirement?.title || 'Bulk Test Execution'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {testCases.length} test case{testCases.length !== 1 ? 's' : ''} selected
                {requirement && ` for requirement ${requirement.id}`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center text-sm"
              >
                <Settings className="mr-1" size={14} />
                {showSettings ? 'Hide' : 'Settings'}
              </button>
            </div>
          </div>

          {/* Backend Status */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {hasBackendSupport ? (
                  <Wifi className="text-green-600 mr-2" size={16} />
                ) : (
                  <WifiOff className="text-orange-500 mr-2" size={16} />
                )}
                <span className="text-sm font-medium">
                  Backend Status: {backendStatus === 'checking' ? 'Checking...' : hasBackendSupport ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {hasBackendSupport ? 'Full webhook support' : 'Fallback mode (direct GitHub polling)'}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>
              
              {/* Execution Mode Toggle */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useGitHub}
                    onChange={(e) => setUseGitHub(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Use GitHub Actions</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {useGitHub ? 'Execute tests using GitHub Actions workflow' : 'Run simulated tests locally'}
                </p>
              </div>

              {/* GitHub Configuration */}
              {useGitHub && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={config.repoUrl}
                      onChange={(e) => setConfig({...config, repoUrl: e.target.value})}
                      placeholder="https://github.com/owner/repo"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={config.branch}
                        onChange={(e) => setConfig({...config, branch: e.target.value})}
                        placeholder="main"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workflow ID
                      </label>
                      <input
                        type="text"
                        value={config.workflowId}
                        onChange={(e) => setConfig({...config, workflowId: e.target.value})}
                        placeholder="quality-tracker-tests.yml"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Token
                    </label>
                    <input
                      type="password"
                      value={config.ghToken}
                      onChange={(e) => setConfig({...config, ghToken: e.target.value})}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      value={config.callbackUrl}
                      onChange={(e) => setConfig({...config, callbackUrl: e.target.value})}
                      placeholder="http://localhost:3001/api/webhook/test-results"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-sm"
                >
                  <Save className="mr-2" size={14} />
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Enhanced GitHub Workflow Status */}
          {useGitHub && workflowRun && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <GitBranch className="text-blue-600 mr-2" size={16} />
                  <div>
                    <p className="text-blue-800 font-medium">GitHub Workflow Triggered</p>
                    <p className="text-blue-600 text-sm">Run ID: {workflowRun.id}</p>
                    {currentRequestId && (
                      <p className="text-blue-500 text-xs">Request ID: {currentRequestId}</p>
                    )}
                  </div>
                </div>
                <a
                  href={workflowRun.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
                >
                  <GitBranch className="mr-1" size={14} />
                  View on GitHub
                </a>
              </div>
              {isWaiting && (
                <div className="mt-2 text-blue-600 text-sm">
                  ⏳ {hasBackendSupport ? 
                      'Waiting for webhook (2 min timeout) → GitHub API polling...' : 
                      'Waiting for webhook (30 sec timeout) → GitHub API polling...'}
                </div>
              )}
            </div>
          )}

          {/* Execution Controls */}
          {!executionStarted && !isRunning && !isWaiting && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={executeTests}
                disabled={useGitHub && (!config.repoUrl || !config.ghToken)}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="mr-2" size={16} />
                Start Execution
              </button>
            </div>
          )}

          {/* Progress bar */}
          {(executionStarted || isWaiting) && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {isWaiting ? 
                    (hasBackendSupport ? 
                      'Waiting for webhook (up to 2 minutes)...' : 
                      'Waiting for webhook (up to 30 seconds)...') :
                    `Progress: ${completedTests}/${testCases.length}`
                  }
                </span>
                <span>
                  {isWaiting ? 'GitHub Actions' : `${Math.round((completedTests / testCases.length) * 100)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isWaiting ? 'bg-blue-600 animate-pulse' : 'bg-green-600'
                  }`}
                  style={{ 
                    width: isWaiting ? '100%' : `${(completedTests / testCases.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center">
                <AlertTriangle className="text-red-600 mr-2" size={16} />
                <span className="text-red-800 text-sm font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Processing Status */}
          {processingStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center">
                {processingStatus === 'completed' ? (
                  <Check className="text-green-600 mr-2" size={16} />
                ) : (
                  <Loader2 className="text-blue-600 mr-2 animate-spin" size={16} />
                )}
                <span className="text-blue-800 text-sm font-medium">
                  {processingStatus === 'triggering' ? 'Triggering workflow...' :
                   processingStatus === 'waiting' ? 'Waiting for results...' :
                   processingStatus === 'polling' ? 'Polling GitHub API...' :
                   processingStatus === 'completed' ? 'Execution completed' :
                   'Processing...'}
                </span>
              </div>
            </div>
          )}

          {/* Test Results Table */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((result, index) => (
                  <tr key={result.id} className={index === currentTestIndex ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2 text-sm font-mono text-gray-600">{result.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{result.name}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className="ml-2">{result.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {result.duration > 0 ? `${result.duration}s` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {isExecuting ? 'Execution in progress...' : 
               isWaiting ? 'Waiting for GitHub Actions...' :
               executionStarted || results ? 'Execution completed' : 'Ready to execute'}
            </div>
            <div className="flex space-x-2">
              {(isExecuting || isWaiting) && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Console helper for debugging
window.logCurrentTestFlow = () => {
  console.log("%c🔍 CURRENT TEST FLOW STATE", "background: #607D8B; color: white; font-size: 16px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
  console.log("=".repeat(80));
  
  // Note: These would need to be accessed from the component instance
  console.log("Use this function inside the component for debugging");
  console.log("Available states: hasBackendSupport, config, currentRequestId, workflowRun, waitingForWebhook, isRunning, error, results");
};

export default TestExecutionModal;