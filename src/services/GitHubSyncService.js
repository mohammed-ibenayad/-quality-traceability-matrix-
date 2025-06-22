// src/services/GitHubSyncService.js - Service for managing GitHub repository synchronization
import GitHubService from './GitHubService';
import dataStore from './DataStore';

class GitHubSyncService {
  constructor() {
    this.syncConfigurations = new Map();
    this.activeSyncs = new Map();
    this.lastSyncResults = new Map();
    this.syncWorker = null;
    
    // Load saved configurations
    this.loadSyncConfigurations();
    
    // Start sync worker if any configurations exist
    if (this.syncConfigurations.size > 0) {
      this.startSyncWorker();
    }
  }

  /**
   * Add or update a sync configuration
   */
  addSyncConfiguration(config) {
    const configId = `${config.owner}/${config.repo}/${config.branch}`;
    
    const syncConfig = {
      id: configId,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch || 'main',
      token: config.token,
      testPaths: config.testPaths || ['tests/', 'test/', '__tests__/', 'src/test/', 'spec/'],
      enabled: config.enabled !== false,
      frequency: config.frequency || 'daily', // hourly, daily, weekly
      autoImport: config.autoImport !== false,
      lastSync: config.lastSync || null,
      lastCommitSha: config.lastCommitSha || null,
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.syncConfigurations.set(configId, syncConfig);
    this.saveSyncConfigurations();
    
    // Restart sync worker to pick up new configuration
    if (syncConfig.enabled) {
      this.startSyncWorker();
    }
    
    return syncConfig;
  }

  /**
   * Remove a sync configuration
   */
  removeSyncConfiguration(configId) {
    this.syncConfigurations.delete(configId);
    this.activeSyncs.delete(configId);
    this.lastSyncResults.delete(configId);
    this.saveSyncConfigurations();
  }

  /**
   * Get all sync configurations
   */
  getSyncConfigurations() {
    return Array.from(this.syncConfigurations.values());
  }

  /**
   * Get a specific sync configuration
   */
  getSyncConfiguration(configId) {
    return this.syncConfigurations.get(configId);
  }

  /**
   * Update sync configuration
   */
  updateSyncConfiguration(configId, updates) {
    const existing = this.syncConfigurations.get(configId);
    if (!existing) {
      throw new Error(`Sync configuration ${configId} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.syncConfigurations.set(configId, updated);
    this.saveSyncConfigurations();
    
    return updated;
  }

  /**
   * Manually trigger sync for a configuration
   */
  async triggerSync(configId) {
    const config = this.syncConfigurations.get(configId);
    if (!config) {
      throw new Error(`Sync configuration ${configId} not found`);
    }

    return await this.performSync(config);
  }

  /**
   * Perform synchronization for a repository
   */
  async performSync(config) {
    const syncId = `${config.id}_${Date.now()}`;
    
    try {
      console.log(`Starting sync for ${config.id}`);
      
      this.activeSyncs.set(config.id, {
        id: syncId,
        startTime: new Date().toISOString(),
        status: 'running',
        progress: 0
      });

      // Get current repository state
      const repoInfo = await GitHubService.getRepositoryInfo(config.owner, config.repo, config.token);
      const branches = await GitHubService.getBranches(config.owner, config.repo, config.token);
      
      // Check if branch exists
      const targetBranch = branches.find(b => b.name === config.branch);
      if (!targetBranch) {
        throw new Error(`Branch '${config.branch}' not found in repository`);
      }

      // Check for changes since last sync
      let hasChanges = false;
      let changedFiles = [];
      
      if (config.lastCommitSha) {
        try {
          const comparison = await GitHubService.compareCommits(
            config.owner, 
            config.repo, 
            config.lastCommitSha, 
            targetBranch.sha, 
            config.token
          );
          
          hasChanges = comparison.totalCommits > 0;
          changedFiles = comparison.files.filter(file => 
            GitHubService.isTestFile(file.filename, GitHubService.getTestFilePatterns())
          );
          
          console.log(`Found ${changedFiles.length} changed test files since last sync`);
        } catch (error) {
          console.warn('Could not compare commits, performing full sync:', error.message);
          hasChanges = true; // Assume changes if we can't compare
        }
      } else {
        hasChanges = true; // First sync
      }

      this.updateSyncProgress(config.id, 25, 'Checking for changes');

      let syncResult = {
        id: syncId,
        configId: config.id,
        startTime: new Date().toISOString(),
        status: 'success',
        hasChanges,
        changedFiles: changedFiles.length,
        discovered: 0,
        imported: 0,
        updated: 0,
        errors: [],
        endTime: null
      };

      if (hasChanges) {
        // Discover test files
        this.updateSyncProgress(config.id, 50, 'Discovering test files');
        
        const testFiles = await GitHubService.searchTestFiles(
          config.owner, 
          config.repo, 
          config.branch, 
          config.token,
          { testPaths: config.testPaths }
        );

        syncResult.discovered = testFiles.length;
        console.log(`Discovered ${testFiles.length} test files`);

        // Extract test cases from files
        this.updateSyncProgress(config.id, 75, 'Extracting test cases');
        
        const allTestCases = [];
        
        for (let i = 0; i < testFiles.length; i++) {
          try {
            const fileContent = await GitHubService.getFileContent(
              config.owner,
              config.repo,
              testFiles[i].path,
              config.branch,
              config.token
            );

            const extractedTests = GitHubService.extractTestCases(
              fileContent.content,
              testFiles[i].path,
              testFiles[i].name
            );

            // Add GitHub metadata to each test case
            extractedTests.forEach(test => {
              test.github = {
                repository: `${config.owner}/${config.repo}`,
                branch: config.branch,
                filePath: testFiles[i].path,
                fileName: testFiles[i].name,
                commitSha: targetBranch.sha,
                lastSyncDate: new Date().toISOString(),
                syncConfigId: config.id
              };
            });

            allTestCases.push(...extractedTests);
            
            this.updateSyncProgress(
              config.id, 
              75 + Math.round((i / testFiles.length) * 20), 
              `Processing ${testFiles[i].name}`
            );
            
          } catch (error) {
            console.error(`Error processing file ${testFiles[i].path}:`, error);
            syncResult.errors.push(`Failed to process ${testFiles[i].path}: ${error.message}`);
          }
        }

        // Import or update test cases if auto-import is enabled
        if (config.autoImport && allTestCases.length > 0) {
          this.updateSyncProgress(config.id, 90, 'Importing test cases');
          
          try {
            // Get existing test cases to check for updates
            const existingTestCases = dataStore.getTestCases();
            const existingGitHubTests = existingTestCases.filter(tc => 
              tc.github && tc.github.syncConfigId === config.id
            );

            // Merge with existing test cases
            const { imported, updated } = this.mergeTestCases(existingGitHubTests, allTestCases);
            
            syncResult.imported = imported;
            syncResult.updated = updated;
            
            console.log(`Sync completed: ${imported} imported, ${updated} updated`);
            
          } catch (error) {
            console.error('Error importing test cases:', error);
            syncResult.errors.push(`Failed to import test cases: ${error.message}`);
            syncResult.status = 'error';
          }
        }

        // Update last sync information
        this.updateSyncConfiguration(config.id, {
          lastSync: new Date().toISOString(),
          lastCommitSha: targetBranch.sha
        });
      } else {
        console.log('No changes detected since last sync');
      }

      syncResult.endTime = new Date().toISOString();
      this.lastSyncResults.set(config.id, syncResult);
      
      this.updateSyncProgress(config.id, 100, 'Sync completed');
      
      // Remove from active syncs
      setTimeout(() => {
        this.activeSyncs.delete(config.id);
      }, 2000);

      return syncResult;

    } catch (error) {
      console.error(`Sync failed for ${config.id}:`, error);
      
      const errorResult = {
        id: syncId,
        configId: config.id,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'error',
        error: error.message,
        hasChanges: false,
        discovered: 0,
        imported: 0,
        updated: 0,
        errors: [error.message]
      };

      this.lastSyncResults.set(config.id, errorResult);
      this.activeSyncs.delete(config.id);
      
      throw error;
    }
  }

  /**
   * Merge new test cases with existing ones
   */
  mergeTestCases(existingTests, newTests) {
    const existingById = new Map(existingTests.map(tc => [tc.id, tc]));
    const newById = new Map(newTests.map(tc => [tc.id, tc]));
    
    let imported = 0;
    let updated = 0;
    
    const allTestCases = dataStore.getTestCases().filter(tc => 
      !tc.github || tc.github.syncConfigId !== newTests[0]?.github?.syncConfigId
    );

    // Add or update test cases
    for (const newTest of newTests) {
      const existing = existingById.get(newTest.id);
      
      if (existing) {
        // Update existing test case
        const updatedTest = {
          ...existing,
          ...newTest,
          // Preserve certain fields from existing test case
          status: existing.status, // Keep current test status
          lastExecuted: existing.lastExecuted,
          requirementIds: existing.requirementIds || newTest.requirementIds
        };
        
        allTestCases.push(updatedTest);
        updated++;
      } else {
        // Import new test case
        allTestCases.push(newTest);
        imported++;
      }
    }

    // Update datastore
    dataStore.setTestCases(allTestCases);
    
    return { imported, updated };
  }

  /**
   * Update sync progress
   */
  updateSyncProgress(configId, progress, message) {
    const activeSync = this.activeSyncs.get(configId);
    if (activeSync) {
      activeSync.progress = progress;
      activeSync.message = message;
      activeSync.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Get active sync status
   */
  getActiveSyncStatus(configId) {
    return this.activeSyncs.get(configId);
  }

  /**
   * Get last sync result
   */
  getLastSyncResult(configId) {
    return this.lastSyncResults.get(configId);
  }

  /**
   * Start the sync worker for scheduled syncs
   */
  startSyncWorker() {
    if (this.syncWorker) {
      clearInterval(this.syncWorker);
    }

    // Check for scheduled syncs every minute
    this.syncWorker = setInterval(() => {
      this.checkScheduledSyncs();
    }, 60000);
  }

  /**
   * Stop the sync worker
   */
  stopSyncWorker() {
    if (this.syncWorker) {
      clearInterval(this.syncWorker);
      this.syncWorker = null;
    }
  }

  /**
   * Check for syncs that need to be executed
   */
  async checkScheduledSyncs() {
    const now = new Date();
    
    for (const config of this.syncConfigurations.values()) {
      if (!config.enabled || this.activeSyncs.has(config.id)) {
        continue; // Skip disabled configs or already running syncs
      }

      const shouldSync = this.shouldPerformSync(config, now);
      
      if (shouldSync) {
        console.log(`Triggering scheduled sync for ${config.id}`);
        try {
          await this.performSync(config);
        } catch (error) {
          console.error(`Scheduled sync failed for ${config.id}:`, error);
        }
      }
    }
  }

  /**
   * Determine if a sync should be performed based on frequency
   */
  shouldPerformSync(config, now) {
    if (!config.lastSync) {
      return true; // Never synced before
    }

    const lastSync = new Date(config.lastSync);
    const timeDiff = now.getTime() - lastSync.getTime();

    switch (config.frequency) {
      case 'hourly':
        return timeDiff >= 60 * 60 * 1000; // 1 hour
      case 'daily':
        return timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return false;
    }
  }

  /**
   * Save sync configurations to localStorage
   */
  saveSyncConfigurations() {
    try {
      const configs = Array.from(this.syncConfigurations.entries());
      localStorage.setItem('githubSyncConfigurations', JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save sync configurations:', error);
    }
  }

  /**
   * Load sync configurations from localStorage
   */
  loadSyncConfigurations() {
    try {
      const saved = localStorage.getItem('githubSyncConfigurations');
      if (saved) {
        const configs = JSON.parse(saved);
        this.syncConfigurations = new Map(configs);
      }
    } catch (error) {
      console.error('Failed to load sync configurations:', error);
      this.syncConfigurations = new Map();
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics() {
    const configs = Array.from(this.syncConfigurations.values());
    const results = Array.from(this.lastSyncResults.values());
    
    return {
      totalConfigurations: configs.length,
      enabledConfigurations: configs.filter(c => c.enabled).length,
      activeSyncs: this.activeSyncs.size,
      successfulSyncs: results.filter(r => r.status === 'success').length,
      failedSyncs: results.filter(r => r.status === 'error').length,
      totalTestCasesDiscovered: results.reduce((sum, r) => sum + (r.discovered || 0), 0),
      totalTestCasesImported: results.reduce((sum, r) => sum + (r.imported || 0), 0),
      lastSyncTime: Math.max(...results.map(r => new Date(r.endTime || r.startTime).getTime()), 0)
    };
  }

  /**
   * Export sync configuration
   */
  exportSyncConfiguration(configId) {
    const config = this.syncConfigurations.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    // Remove sensitive information
    const exportConfig = { ...config };
    delete exportConfig.token;
    
    return exportConfig;
  }

  /**
   * Import sync configuration
   */
  importSyncConfiguration(configData, token) {
    const config = {
      ...configData,
      token,
      updatedAt: new Date().toISOString()
    };

    return this.addSyncConfiguration(config);
  }
}

export default new GitHubSyncService();