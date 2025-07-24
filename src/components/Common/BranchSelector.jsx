import React, { useState, useEffect } from 'react';
import { GitBranch, ChevronDown, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const BranchSelector = ({ 
  repoUrl, 
  ghToken, 
  selectedBranch, 
  onBranchChange, 
  disabled = false 
}) => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [defaultBranch, setDefaultBranch] = useState(null);

  // Parse repository URL to get owner and repo
  const parseRepoUrl = (url) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    return null;
  };

  // Fetch repository info to get default branch
  const fetchRepoInfo = async (owner, repo, token) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Repository not found or access denied`);
      }

      const repoData = await response.json();
      return repoData.default_branch; // Returns 'main', 'master', etc.
    } catch (error) {
      throw new Error(`Failed to fetch repository info: ${error.message}`);
    }
  };

  // Fetch branches from GitHub API
  const fetchBranches = async () => {
    const repoInfo = parseRepoUrl(repoUrl);
    if (!repoInfo || !ghToken) {
      setBranches([]);
      setDefaultBranch(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get repository info to find default branch
      const defaultBranchName = await fetchRepoInfo(repoInfo.owner, repoInfo.repo, ghToken);
      setDefaultBranch(defaultBranchName);

      // Step 2: Fetch all branches
      const response = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches`,
        {
          headers: {
            'Authorization': `token ${ghToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.status}`);
      }

      const branchData = await response.json();
      const branchList = branchData.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected,
        isDefault: branch.name === defaultBranchName
      }));

      // Sort branches: default first, then alphabetically
      branchList.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });

      setBranches(branchList);
      
      // Step 3: Auto-select default branch if no branch is currently selected
      if (!selectedBranch && defaultBranchName) {
        onBranchChange(defaultBranchName);
      }
      
    } catch (err) {
      setError(err.message);
      setBranches([]);
      setDefaultBranch(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when repo URL and token are both available
  useEffect(() => {
    if (repoUrl && ghToken) {
      fetchBranches();
    } else {
      setBranches([]);
      setDefaultBranch(null);
      setError(null);
    }
  }, [repoUrl, ghToken]);

  // Handle branch selection
  const handleBranchSelect = (branchName) => {
    onBranchChange(branchName);
    setIsDropdownOpen(false);
  };

  // If no repo or token configured, show instructional text
  if (!repoUrl || !ghToken) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Branch
        </label>
        <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-500 text-sm">
          Enter repository URL and token above to see available branches
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Branches will auto-load when repository details are provided
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Branch {defaultBranch && <span className="text-xs text-gray-500">(default: {defaultBranch})</span>}
      </label>
      
      <div className="relative">
        <div className="flex items-center">
          <GitBranch className="text-gray-500 mr-2" size={18} />
          
          {/* Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled || isLoading || branches.length === 0}
            className="w-full p-2 border border-gray-300 rounded bg-white text-left flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <span className={selectedBranch ? 'text-gray-900' : 'text-gray-500'}>
              {isLoading ? 'Loading branches...' : 
               selectedBranch || 'Select branch'}
            </span>
            <div className="flex items-center">
              {isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
              {error && <AlertCircle className="text-red-500 mr-2" size={16} />}
              {!isLoading && !error && branches.length > 0 && <CheckCircle className="text-green-500 mr-2" size={16} />}
              <ChevronDown 
                className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                size={16} 
              />
            </div>
          </button>
          
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchBranches}
            disabled={disabled || isLoading || !repoUrl || !ghToken}
            className="ml-2 p-2 border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            title="Refresh branches"
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {error ? (
              <div className="p-3 text-red-600 text-sm flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {error}
              </div>
            ) : branches.length === 0 ? (
              <div className="p-3 text-gray-500 text-sm">
                No branches found
              </div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.name}
                  type="button"
                  onClick={() => handleBranchSelect(branch.name)}
                  className={`w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between ${
                    selectedBranch === branch.name ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <GitBranch size={14} className="mr-2" />
                    <span className="font-medium">{branch.name}</span>
                    {branch.isDefault && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                        Default
                      </span>
                    )}
                    {branch.protected && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Protected
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {branch.sha.substring(0, 7)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Status Information */}
      <div className="mt-1 text-xs text-gray-500">
        {isLoading ? (
          'Loading branches...'
        ) : error ? (
          'Failed to load branches'
        ) : branches.length > 0 ? (
          `${branches.length} branches available${defaultBranch ? ` • Default: ${defaultBranch}` : ''}`
        ) : (
          'No branches found'
        )}
      </div>
    </div>
  );
};

// Demo showing the improved workflow
const ImprovedWorkflowDemo = () => {
  const [config, setConfig] = useState({
    repoUrl: '',
    ghToken: '',
    branch: ''
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Improved Branch Selection Workflow</h2>
      
      <div className="space-y-4">
        {/* Step 1: Repository URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Step 1: GitHub Repository URL
          </label>
          <input
            type="text"
            value={config.repoUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, repoUrl: e.target.value }))}
            placeholder="https://github.com/username/repository"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Step 2: GitHub Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Step 2: GitHub Token
          </label>
          <input
            type="password"
            value={config.ghToken}
            onChange={(e) => setConfig(prev => ({ ...prev, ghToken: e.target.value }))}
            placeholder="ghp_..."
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Step 3: Auto-loaded Branch Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Step 3: Branch (Auto-loaded)
          </label>
          <BranchSelector
            repoUrl={config.repoUrl}
            ghToken={config.ghToken}
            selectedBranch={config.branch}
            onBranchChange={(branch) => setConfig(prev => ({ ...prev, branch }))}
          />
        </div>
      </div>

      {/* Current Configuration Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Configuration:</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div><span className="font-medium">Repository:</span> {config.repoUrl || 'Not set'}</div>
          <div><span className="font-medium">Token:</span> {config.ghToken ? '***configured***' : 'Not set'}</div>
          <div><span className="font-medium">Branch:</span> {config.branch || 'None selected'}</div>
        </div>
        
        {config.repoUrl && config.ghToken && config.branch && (
          <div className="mt-3 p-2 bg-green-100 text-green-800 rounded text-sm">
            ✅ Ready to run tests on {config.branch}!
          </div>
        )}
      </div>

      {/* Workflow Explanation */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How This Works:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Enter repository URL</li>
          <li>2. Enter GitHub token</li>
          <li>3. System automatically fetches all branches</li>
          <li>4. Default branch is pre-selected</li>
          <li>5. You can select a different branch if needed</li>
          <li>6. Ready to run tests!</li>
        </ol>
      </div>
    </div>
  );
};

export default BranchSelector;