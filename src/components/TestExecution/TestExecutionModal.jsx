// src/components/TestExecution/TestExecutionModal.jsx - Fixed Version with Webhook Updates
import React, { useState, useEffect, useRef } from 'react';
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

  // Add this with other useState declarations
  const waitingForWebhookRef = useRef(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
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
      waitingForWebhookRef.current = false; // Sync ref
      setResults(null);
      setError(null);
      setProcessingStatus(null);
      setIsProcessing(false);
      setCurrentRequestId(null);

      // Clear intervals and timeouts
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
        console.log("%c🧹 Cleared existing poll interval on modal open", "color: gray;");
      }
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
        console.log("%c🧹 Cleared existing webhook timeout on modal open", "color: gray;");
      }

      console.log('Test execution modal opened for:', requirement ? requirement.id : 'bulk execution');
      console.log('Test cases to run:', testCases);
    }
  }, [isOpen, testCases, requirement]);

  // Add this useEffect to sync the ref
  useEffect(() => {
    waitingForWebhookRef.current = waitingForWebhook;
    console.log(`%c🔄 waitingForWebhook state changed: ${waitingForWebhook} -> ref.current: ${waitingForWebhookRef.current}`, "color: #17A2B8; font-size: 10px;");
  }, [waitingForWebhook]);

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

  // Check backend availability when modal opens
  useEffect(() => {
    if (isOpen) {
      checkBackend();
    }
  }, [isOpen]);

  // ✅ FIXED: Set up webhook listeners with proper dependencies
  useEffect(() => {
    if (!isOpen || !currentRequestId) return;

    const handleWebhookResults = (webhookData) => {
      console.log("%c🔔 WEBHOOK RECEIVED:", "background: #03A9F4; color: white; font-weight: bold; padding: 5px 10px;", webhookData);

      // Check if this webhook matches our current execution
      const expectedRequirementId = requirement?.id || `bulk_req_${currentRequestId?.split('_')[1]}_${currentRequestId?.split('_')[2]}`;
      const matchesRequirement = webhookData?.requirementId === expectedRequirementId;
      const matchesRequest = webhookData?.requestId === currentRequestId;

      if (matchesRequirement || matchesRequest) {
        console.log("✅ Webhook matches current execution - processing results");
        console.log("Expected:", { requirementId: expectedRequirementId, requestId: currentRequestId });
        console.log("Received:", { requirementId: webhookData?.requirementId, requestId: webhookData?.requestId });
        processWebhookResults(webhookData);
      } else {
        console.log("❌ Webhook doesn't match current execution - ignoring");
        console.log("Expected:", { requirementId: expectedRequirementId, requestId: currentRequestId });
        console.log("Received:", { requirementId: webhookData?.requirementId, requestId: webhookData?.requestId });
      }
    };

    // Set up webhook listener based on backend support
    if (hasBackendSupport && webhookService) {
      console.log(`🎯 Setting up webhook listener for request: ${currentRequestId}`);

      // Subscribe to this specific request ID for precise targeting
      webhookService.subscribeToRequest(currentRequestId, handleWebhookResults);

      // Also subscribe to the general requirement (backup)
      if (requirement?.id) {
        webhookService.subscribeToRequirement(requirement.id, handleWebhookResults);
      }
    } else {
      // Fallback to window-based listener
      console.log(`🎯 Setting up fallback webhook listener (window.onTestWebhookReceived)`);
      window.onTestWebhookReceived = handleWebhookResults;
    }

    // ✅ FIXED: Proper cleanup that doesn't trigger prematurely
    return () => {
      console.log(`🧹 Cleaning up webhook listeners for request: ${currentRequestId}`);
      
      if (hasBackendSupport && webhookService) {
        webhookService.unsubscribeFromRequest(currentRequestId);
        if (requirement?.id) {
          webhookService.unsubscribeFromRequirement(requirement.id);
        }
      } else {
        window.onTestWebhookReceived = null;
      }

      // Clear timeouts and intervals to prevent memory leaks
      if (webhookTimeout) {
        console.log("%c🧹 Clearing webhookTimeout on effect cleanup", "color: gray;");
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
      }
      if (pollInterval) {
        console.log("%c🧹 Clearing pollInterval on effect cleanup", "color: gray;");
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [currentRequestId, hasBackendSupport, requirement?.id]); // ✅ FIXED: Stable dependencies

  // ✅ ADD: Monitor testResults changes for debugging
  useEffect(() => {
    console.log("🔄 testResults state updated:", testResults.map(r => `${r.id}: ${r.status} (${r.duration}ms)`));
  }, [testResults]);

  // Save configuration
  const saveConfiguration = () => {
    localStorage.setItem('testRunnerConfig', JSON.stringify(config));
    setShowSettings(false);
    console.log("⚙️ Configuration saved:", config);
  };

  // ✅ FIXED: Process webhook results with proper UI updates
  const processWebhookResults = (webhookData) => {
    console.log("%c🔧 PROCESSING WEBHOOK RESULTS:", "background: #673AB7; color: white; font-weight: bold; padding: 5px 10px;", webhookData);
    console.log("🔍 WEBHOOK DATA STRUCTURE:", JSON.stringify(webhookData, null, 2));
    console.log("🔍 CURRENT TEST RESULTS STATE:", testResults?.map(r => `${r.id}: ${r.status}`));
    console.log("🔍 WAITING FOR WEBHOOK STATE:", waitingForWebhook);
    console.log("🔍 MODAL STATE CHECK:", { isOpen, isRunning, waitingForWebhook, currentRequestId }); 
  
    if (!webhookData?.results || !Array.isArray(webhookData.results)) {
      console.warn("⚠️ Invalid webhook data received");
      return;
    }

    // ✅ CHECK: Determine if this is an incremental update or final completion
    const finalStatuses = ['Passed', 'Failed', 'Cancelled', 'Skipped', 'Not Run'];
    const allTestsComplete = webhookData.results.every(result => 
      finalStatuses.includes(result.status)
    );
    
    const hasRunningTests = webhookData.results.some(result => 
      result.status === 'Running'
    );
    
    const isIncrementalUpdate = hasRunningTests || !allTestsComplete;

    console.log(`📊 Webhook Analysis:`, {
      totalResults: webhookData.results.length,
      allTestsComplete,
      hasRunningTests,
      isIncrementalUpdate,
      statusCounts: webhookData.results.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {})
    });

    // ✅ CRITICAL FIX: Update testResults state immediately and force re-render
    setTestResults(prevResults => {
      const updatedResults = prevResults.map(existingResult => {
        const newResult = webhookData.results.find(r => r.id === existingResult.id);
        
        if (newResult) {
          console.log(`📝 Updating ${existingResult.id}: ${existingResult.status} → ${newResult.status} (duration: ${newResult.duration || 0})`);
          return {
            id: existingResult.id,
            name: existingResult.name,
            status: newResult.status || 'Not Run',
            duration: newResult.duration || existingResult.duration || 0,
            logs: newResult.logs || existingResult.logs || '',
            startTime: existingResult.startTime,
            endTime: existingResult.endTime
          };
        } else {
          // Keep existing result if no update found
          console.log(`📝 No update for ${existingResult.id}, keeping existing status: ${existingResult.status}`);
          return existingResult;
        }
      });
      
      console.log("📊 Test results after incremental merge:", updatedResults.map(r => `${r.id}: ${r.status} (${r.duration}ms)`));
      return updatedResults;
    });

    // ✅ ALWAYS update the results state (for compatibility with existing code)
    setResults(webhookData.results);

    // ✅ ONLY stop listening if ALL tests are truly complete
    if (allTestsComplete && !hasRunningTests) {
      console.log("🏁 ALL TESTS COMPLETED - Stopping webhook listener");
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
      setIsRunning(false);
      setProcessingStatus('completed');
      
      // Clear timeouts only on final completion
      if (webhookTimeout) {
        clearTimeout(webhookTimeout);
        setWebhookTimeout(null);
        console.log("%c🧹 Cleared webhookTimeout upon final completion", "color: gray;");
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
        console.log("%c🧹 Cleared pollInterval upon final completion", "color: gray;");
      }
    } else {
      console.log("📈 INCREMENTAL UPDATE - Continuing to wait for more results");
      setProcessingStatus('running');
      // DO NOT clear webhookTimeout or pollInterval yet - keep listening!
    }

    // ✅ UPDATE DataStore incrementally
    webhookData.results.forEach(result => {
      const testCase = testCases.find(tc => tc.id === result.id);
      if (testCase) {
        dataStore.updateTestCase(testCase.id, {
          ...testCase,
          status: result.status,
          lastRun: new Date().toISOString()
        });
        console.log(`📀 DataStore updated for ${testCase.id}: status=${result.status}`);
      } else {
        console.warn(`Test case ${result.id} not found in original list during DataStore update.`);
      }
    });

    console.log("✅ Incremental results processed and DataStore updated");

    // ✅ ONLY call onTestComplete when everything is truly done
    if (allTestsComplete && !hasRunningTests && onTestComplete) {
      console.log("🎯 All tests completed - firing onTestComplete callback with updated results");
      onTestComplete(webhookData.results);
    }

    // Always refresh quality gates for live updates
    refreshQualityGates();
    console.log("Quality gates refreshed after incremental processing.");

    // ✅ CRITICAL: Force UI refresh after processing
    setTimeout(() => {
      console.log("🔄 Forcing UI refresh to ensure modal updates");
      // Trigger a small state change to force re-render of the component
      setProcessingStatus(current => current);
    }, 50);
  };

  // Execute GitHub workflow
  const executeTestsGitHub = async () => {
    console.log("%c🐙 GITHUB EXECUTION STARTED", "background: #24292E; color: white; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    
    try {
      setIsRunning(true);
      setWaitingForWebhook(true);
      waitingForWebhookRef.current = true; // Sync ref
      setError(null);
      setProcessingStatus('starting');

      const [owner, repo] = config.repoUrl.replace('https://github.com/', '').split('/');

      // Generate unique request ID for this execution
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setCurrentRequestId(requestId);

      const payload = {
        requirementId: requirement?.id || `bulk_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        requirementName: requirement?.name || 'Bulk Test Execution',
        testCases: testCases.map(tc => tc.id),
        callbackUrl: config.callbackUrl,
        requestId: requestId
      };

      console.log(`📋 Generated payload for GitHub workflow:`, payload);

      // Check if we should use simulated results (development mode)
      const condition1 = !config.repoUrl;
      const condition2 = config.repoUrl.includes('example');
      const condition3 = !hasBackendSupport && config.callbackUrl.includes('webhook.site');
      const useSimulatedResults = condition1 || condition2 || condition3;

      console.log("🔍 Determining execution path:");
      console.log("  1. No repo URL (!config.repoUrl):", condition1);
      console.log("  2. Contains 'example' (config.repoUrl.includes('example')):", condition2);
      console.log("  3. Backend unavailable + webhook.site ((!hasBackendSupport && config.callbackUrl.includes('webhook.site'))):", condition3);
      console.log("Backend Support:", hasBackendSupport);
      console.log("Webhook URL:", config.callbackUrl || "(empty)");
      console.log("Repository URL:", config.repoUrl || "(empty)");

      console.log("Final Decision: useSimulatedResults =", useSimulatedResults);
      console.log("Execution Path:", useSimulatedResults ? "🎭 Simulated Results" : "🐙 Real GitHub Workflow → Artifact Download");

      if (useSimulatedResults) {
        const reason = condition1 ? "No repo URL" : condition2 ? "Contains 'example'" : "Backend unavailable + webhook.site callback";
        console.log("Reason for simulation:", reason);
        console.log('Using simulated GitHub results (will fire in 5 seconds)');
        setWaitingForWebhook(true);
        waitingForWebhookRef.current = true; // Sync ref

        const timeout = setTimeout(() => {
          console.log("%c⏰ SIMULATED WEBHOOK TIMEOUT REACHED (Triggering simulated results)", "background: #FF5722; color: white; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
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

      setWorkflowRun(run);
      setWaitingForWebhook(true);
      waitingForWebhookRef.current = true; // Sync ref

      console.log(`✅ Workflow triggered: ${run.id}. URL: ${run.html_url}`);
      console.log(`⏳ Waiting for webhook at: ${config.callbackUrl || '(not configured)'}`);
      console.log(`📝 Request ID: ${requestId}`);

      // Enhanced webhook timeout logic with GitHub API polling fallback
      const webhookTimeoutDuration = hasBackendSupport ? 120000 : 30000; // 2 min vs 30 sec

      console.log("%c⏰ WEBHOOK TIMEOUT CONFIGURATION", "background: #FF5722; color: white; font-weight: bold; padding: 5px 10px;");
      console.log("Timeout Duration:", webhookTimeoutDuration + "ms");
      console.log("Timeout Reason:", hasBackendSupport ? "Backend available (2 min)" : "Backend unavailable (30 sec)");
      console.log("Waiting for webhook at:", config.callbackUrl || "(empty - will timeout and poll)");

      const timeout = setTimeout(async () => {
        console.log("%c🚨 WEBHOOK TIMEOUT REACHED", "background: #F44336; color: white; font-size: 14px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
        
        // Check if we're still waiting for webhook (important to prevent double processing)
        if (!waitingForWebhookRef.current) {
          console.log("⚠️ No longer waiting for webhook (already processed), exiting timeout callback.");
          return;
        }

        if (!run || !run.id) {
          console.error("❌ No workflow run available for polling. This is unexpected.");
          setError('Cannot poll workflow status: Missing workflow run data');
          setIsRunning(false);
          setWaitingForWebhook(false);
          waitingForWebhookRef.current = false;
          return;
        }

        // STEP 1: Try backend polling first (if available)
        if (hasBackendSupport && webhookService) {
          console.log("%c🔄 ATTEMPTING BACKEND POLLING (after webhook timeout)", "background: #3F51B5; color: white; font-weight: bold; padding: 5px 10px;");
          try {
            console.log("🔍 Polling backend for specific request results (requestId:", requestId, ")");
            const polledResults = await webhookService.fetchResultsByRequestId(requestId);

            if (polledResults) {
              console.log("✅ Found results via backend polling (by requestId). Processing...", polledResults);
              processWebhookResults(polledResults);
              return;
            } else {
              console.log("❌ No results found via backend polling for specific requestId. Trying general requirement polling.");
            }

            const generalResults = await webhookService.fetchLatestResultsForRequirement(
              requirement?.id || payload.requirementId
            );

            if (generalResults) {
              console.log("⚠️ Found results via general requirement polling (may not be from current execution). Processing...", generalResults);
              processWebhookResults(generalResults);
              return;
            } else {
              console.log("❌ No results found via general requirement polling.");
            }

            console.log("❌ No results found via any backend polling method.");
          } catch (pollError) {
            console.error("❌ Backend polling failed (error during fetch):", pollError);
          }
        } else {
          console.log("%c⏭️ SKIPPING BACKEND POLLING", "background: #607D8B; color: white; font-weight: bold; padding: 5px 10px;");
          console.log("Reason: hasBackendSupport =", hasBackendSupport, "| webhookService available =", !!webhookService);
        }

        // STEP 2: GitHub API polling fallback
        console.log("%c🔄 STARTING GITHUB API POLLING FALLBACK", "background: #24292E; color: white; font-weight: bold; padding: 5px 10px;");
        setProcessingStatus('polling');

        let pollCount = 0;
        const maxPolls = 90; // 3 minutes of polling at 2s intervals

        const interval = setInterval(async () => {
          pollCount++;
          console.log(`🔄 GitHub API Poll #${pollCount}/${maxPolls} for workflow ${run.id}`);

          try {
            const status = await GitHubService.getWorkflowStatus(owner, repo, run.id, config.ghToken);
            console.log(`📊 Workflow status: ${status.status}, conclusion: ${status.conclusion}`);

            if (status.status === 'completed') {
              console.log("%c✅ WORKFLOW COMPLETED", "background: #4CAF50; color: white; font-weight: bold; padding: 5px 10px;");
              console.log(`Final status: ${status.status}, conclusion: ${status.conclusion}`);

              clearInterval(interval);
              setPollInterval(null);

              try {
                console.log("📥 Starting artifact download and processing...");

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
                
                setError(`Tests completed but results could not be retrieved: ${resultsError.message}. Check GitHub Actions logs and ensure artifacts are generated.`);
                setIsRunning(false);
                setWaitingForWebhook(false);
                waitingForWebhookRef.current = false;
                setProcessingStatus('error');
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
              waitingForWebhookRef.current = false;
              setProcessingStatus('error');
            }

          } catch (pollError) {
            console.error(`❌ Poll #${pollCount} failed:`, pollError);

            if (pollCount >= maxPolls) {
              clearInterval(interval);
              setPollInterval(null);
              setError(`Polling failed after ${pollCount} attempts: ${pollError.message}`);
              setIsRunning(false);
              setWaitingForWebhook(false);
              waitingForWebhookRef.current = false;
              setProcessingStatus('error');
            }
            // Continue polling on error unless max attempts reached
          }
        }, 2000); // Poll every 2 seconds

        setPollInterval(interval);

      }, webhookTimeoutDuration);

      console.log("%c⏰ WEBHOOK TIMEOUT SET", "background: #FF5722; color: white; font-weight: bold; padding: 5px 10px;");
      setWebhookTimeout(timeout);

    } catch (error) {
      console.error("❌ GitHub execution failed:", error);
      setError(`Failed to execute tests: ${error.message}`);
      setIsRunning(false);
      setWaitingForWebhook(false);
      waitingForWebhookRef.current = false;
      setProcessingStatus('error');
    }
  };

  // Main execute function
  const executeTests = () => {
    executeTestsGitHub();
  };

  // Cancel execution
  const handleCancel = () => {
    console.log("%c🛑 EXECUTION CANCELLED", "background: #D32F2F; color: white; font-size: 16px; font-weight: bold; padding: 8px 15px; border-radius: 5px;");
    setCancelled(true);
    setExecuting(false);
    setIsRunning(false);
    setWaitingForWebhook(false);
    waitingForWebhookRef.current = false;
    setProcessingStatus('cancelled');

    if (webhookTimeout) {
      console.log("Clearing webhookTimeout due to cancellation.");
      clearTimeout(webhookTimeout);
      setWebhookTimeout(null);
    }

    if (pollInterval) {
      console.log("Clearing pollInterval due to cancellation.");
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    const iconProps = { size: 16, className: "inline" };

    switch (status) {
      case 'Passed':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'Failed':
        return <XCircle {...iconProps} className="text-red-500" />;
      case 'Running':
        return <Loader2 {...iconProps} className="text-blue-500 animate-spin" />;
      case 'Not Started':
        return <Clock {...iconProps} className="text-gray-400" />;
      case 'Cancelled':
        return <XCircle {...iconProps} className="text-orange-500" />;
      default:
        return <Clock {...iconProps} className="text-gray-400" />;
    }
  };

  // Helper function for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  // Check execution states
  const isExecuting = executing || isRunning || waitingForWebhook;
  const isWaiting = waitingForWebhook && !executing;

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
                {backendStatus === 'checking' ? (
                  <Loader2 className="text-gray-500 animate-spin mr-2" size={16} />
                ) : hasBackendSupport ? (
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

              {/* GitHub Configuration */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository URL
                  </label>
                  <input
                    type="text"
                    name="repoUrl"
                    value={config.repoUrl}
                    onChange={handleInputChange}
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
                      name="branch"
                      value={config.branch}
                      onChange={handleInputChange}
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
                      name="workflowId"
                      value={config.workflowId}
                      onChange={handleInputChange}
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
                    name="ghToken"
                    value={config.ghToken}
                    onChange={handleInputChange}
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
                    name="callbackUrl"
                    value={config.callbackUrl}
                    onChange={handleInputChange}
                    placeholder="http://localhost:3001/api/webhook/test-results"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

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
          {workflowRun && (
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
                      'Waiting for webhook (up to 2 min timeout), then GitHub API polling...' :
                      'Waiting for webhook (up to 30 sec timeout), then GitHub API polling...'}
                </div>
              )}
            </div>
          )}

          {/* Execution Controls */}
          {!executionStarted && !isRunning && !isWaiting && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={executeTests}
                disabled={!config.repoUrl || !config.ghToken}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="mr-2" size={16} />
                Start Execution
              </button>
            </div>
          )}

          {/* Progress bar */}
          {(executionStarted || isWaiting || isRunning) && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {isWaiting ?
                    (hasBackendSupport ?
                      'Waiting for webhook (up to 2 minutes)...' :
                      'Waiting for webhook (up to 30 seconds)...') :
                    (isRunning ? 'Polling GitHub Workflow...' :
                    `Progress: ${completedTests}/${testCases.length}`)
                  }
                </span>
                <span>
                  {isWaiting ? 'GitHub Actions' :
                   isRunning ? 'GitHub Actions' :
                   `${Math.round((completedTests / testCases.length) * 100)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isWaiting || isRunning ? 'bg-blue-600 animate-pulse' : 'bg-green-600'
                  }`}
                  style={{
                    width: isWaiting || isRunning ? '100%' : `${(completedTests / testCases.length) * 100}%`
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
                ) : processingStatus === 'cancelled' ? (
                  <X className="text-orange-500 mr-2" size={16} />
                ) : (
                  <Loader2 className="text-blue-600 mr-2 animate-spin" size={16} />
                )}
                <span className="text-blue-800 text-sm font-medium">
                  {processingStatus === 'starting' ? 'Starting execution...' :
                   processingStatus === 'waiting' ? 'Waiting for results...' :
                   processingStatus === 'polling' ? 'Polling GitHub API...' :
                   processingStatus === 'running' ? 'Tests in progress...' :
                   processingStatus === 'completed' ? 'Execution completed' :
                   processingStatus === 'cancelled' ? 'Execution cancelled' :
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
                {testResults.map((result, index) => {
                  const isCurrentTest = index === currentTestIndex;
                  const isRunning = result.status === 'Running';
                  
                  return (
                    <tr 
                      key={result.id} 
                      className={`
                        ${isCurrentTest ? 'bg-blue-50' : ''} 
                        ${isRunning ? 'bg-yellow-50' : ''}
                        transition-colors duration-200
                      `}
                    >
                      <td className="px-4 py-2 text-sm font-mono text-gray-600">{result.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.name}
                        {isRunning && (
                          <span className="ml-2 text-xs text-blue-600 animate-pulse">
                            ⚡ Running...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className="ml-2">{result.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {result.duration > 0 ? `${result.duration}ms` : 
                         result.status === 'Running' ? '⏱️' : '-'}
                      </td>
                    </tr>
                  );
                })}
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

export default TestExecutionModal;