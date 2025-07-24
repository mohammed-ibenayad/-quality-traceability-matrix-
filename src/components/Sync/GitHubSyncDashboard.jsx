import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Settings,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import GitHubSyncService from '../../services/GitHubSyncService';
import BranchSelector from '../Common/BranchSelector';


const GitHubSyncDashboard = () => {
  const [syncConfigs, setSyncConfigs] = useState([]);
  const [activeSyncs, setActiveSyncs] = useState(new Map());
  const [lastSyncResults, setLastSyncResults] = useState(new Map());
  const [statistics, setStatistics] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadSyncData();
    
    // Refresh data every 10 seconds
    const interval = setInterval(loadSyncData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncData = () => {
    setSyncConfigs(GitHubSyncService.getSyncConfigurations());
    setStatistics(GitHubSyncService.getSyncStatistics());
    
    // Load active syncs and results
    const activeMap = new Map();
    const resultsMap = new Map();
    
    GitHubSyncService.getSyncConfigurations().forEach(config => {
      const activeSync = GitHubSyncService.getActiveSyncStatus(config.id);
      const lastResult = GitHubSyncService.getLastSyncResult(config.id);
      
      if (activeSync) activeMap.set(config.id, activeSync);
      if (lastResult) resultsMap.set(config.id, lastResult);
    });
    
    setActiveSyncs(activeMap);
    setLastSyncResults(resultsMap);
  };

  const handleTriggerSync = async (configId) => {
    try {
      await GitHubSyncService.triggerSync(configId);
      loadSyncData();
    } catch (error) {
      alert(`Failed to trigger sync: ${error.message}`);
    }
  };

  const handleToggleConfig = (configId, enabled) => {
    try {
      GitHubSyncService.updateSyncConfiguration(configId, { enabled });
      loadSyncData();
    } catch (error) {
      alert(`Failed to update configuration: ${error.message}`);
    }
  };

  const handleDeleteConfig = (configId) => {
    if (confirm('Are you sure you want to delete this sync configuration?')) {
      GitHubSyncService.removeSyncConfiguration(configId);
      loadSyncData();
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'hourly': return 'Every Hour';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return frequency;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GitHub Sync Management</h1>
          <p className="text-gray-600">Monitor and manage automated test case synchronization</p>
        </div>
        <button
          onClick={loadSyncData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <GitBranch className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Repositories</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalConfigurations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Syncs</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.enabledConfigurations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tests Discovered</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalTestCasesDiscovered}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tests Imported</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalTestCasesImported}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Configurations */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Repository Configurations</h2>
          <p className="text-sm text-gray-600">Manage your GitHub repository sync settings</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {syncConfigs.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <GitBranch className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No sync configurations found</p>
              <p className="text-sm text-gray-400 mt-1">
                Add repositories through the Import Test Cases page
              </p>
            </div>
          ) : (
            syncConfigs.map((config) => {
              const activeSync = activeSyncs.get(config.id);
              const lastResult = lastSyncResults.get(config.id);
              
              return (
                <div key={config.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <GitBranch className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {config.owner}/{config.repo}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>📍 {config.branch}</span>
                            <span>🕒 {getFrequencyLabel(config.frequency)}</span>
                            <span>📂 {config.testPaths.length} paths</span>
                            {config.lastSync && (
                              <span>⏰ {formatRelativeTime(config.lastSync)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Active Sync Progress */}
                      {activeSync && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600 font-medium">
                              {activeSync.message || 'Syncing...'}
                            </span>
                            <span className="text-blue-600">{activeSync.progress}%</span>
                          </div>
                          <div className="mt-1 w-full bg-blue-100 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${activeSync.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Last Sync Result */}
                      {lastResult && !activeSync && (
                        <div className="mt-2 flex items-center space-x-4 text-xs">
                          <div className="flex items-center">
                            {getStatusIcon(lastResult.status)}
                            <span className="ml-1 capitalize">{lastResult.status}</span>
                          </div>
                          {lastResult.status === 'success' && (
                            <>
                              <span>📊 {lastResult.discovered} discovered</span>
                              <span>📥 {lastResult.imported} imported</span>
                              <span>🔄 {lastResult.updated} updated</span>
                            </>
                          )}
                          {lastResult.errors && lastResult.errors.length > 0 && (
                            <span className="text-red-600">
                              ⚠️ {lastResult.errors.length} errors
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleConfig(config.id, !config.enabled)}
                        className={`p-2 rounded-md transition-colors ${
                          config.enabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={config.enabled ? 'Disable sync' : 'Enable sync'}
                      >
                        {config.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      
                      {/* Manual Trigger */}
                      <button
                        onClick={() => handleTriggerSync(config.id)}
                        disabled={!!activeSync}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:text-gray-400 disabled:hover:bg-gray-50"
                        title="Trigger manual sync"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      
                      {/* View Last Result */}
                      {lastResult && (
                        <button
                          onClick={() => {
                            setSelectedResult(lastResult);
                            setShowResultModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                          title="View sync details"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Settings */}
                      <button
                        onClick={() => {
                          setSelectedConfig(config);
                          setShowConfigModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        title="Edit configuration"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        disabled={!!activeSync}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:text-gray-400"
                        title="Delete configuration"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Edit Sync Configuration</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository
                </label>
                <input
                  type="text"
                  value={`${selectedConfig.owner}/${selectedConfig.repo}`}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div>
  <BranchSelector
    repoUrl={`https://github.com/${selectedConfig.owner}/${selectedConfig.repo}`}
    ghToken={selectedConfig.token}
    selectedBranch={selectedConfig.branch}
    onBranchChange={(branch) => setSelectedConfig(prev => ({ ...prev, branch }))}
  />
</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sync Frequency
                </label>
                <select
                  value={selectedConfig.frequency}
                  onChange={(e) => setSelectedConfig(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedConfig.autoImport}
                    onChange={(e) => setSelectedConfig(prev => ({ ...prev, autoImport: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-import new test cases</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedConfig.enabled}
                    onChange={(e) => setSelectedConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable automatic sync</span>
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    GitHubSyncService.updateSyncConfiguration(selectedConfig.id, selectedConfig);
                    setShowConfigModal(false);
                    loadSyncData();
                  } catch (error) {
                    alert(`Failed to update configuration: ${error.message}`);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Result Modal */}
      {showResultModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sync Result Details</h3>
                <div className="flex items-center">
                  {getStatusIcon(selectedResult.status)}
                  <span className="ml-2 capitalize font-medium">{selectedResult.status}</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Start Time</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedResult.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">End Time</p>
                  <p className="text-sm text-gray-600">
                    {selectedResult.endTime ? new Date(selectedResult.endTime).toLocaleString() : 'Running...'}
                  </p>
                </div>
              </div>
              
              {selectedResult.status === 'success' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <p className="text-2xl font-bold text-blue-600">{selectedResult.discovered}</p>
                    <p className="text-sm text-blue-800">Discovered</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <p className="text-2xl font-bold text-green-600">{selectedResult.imported}</p>
                    <p className="text-sm text-green-800">Imported</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-md">
                    <p className="text-2xl font-bold text-purple-600">{selectedResult.updated}</p>
                    <p className="text-sm text-purple-800">Updated</p>
                  </div>
                </div>
              )}
              
              {selectedResult.errors && selectedResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Errors</p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                    {selectedResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700 mb-1">• {error}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedResult.hasChanges !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Changes Detected</p>
                  <p className="text-sm text-gray-600">
                    {selectedResult.hasChanges ? 'Yes' : 'No changes since last sync'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubSyncDashboard;