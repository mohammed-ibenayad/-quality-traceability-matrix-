import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Plus, 
  ChevronDown,
  ChevronRight,
  Eye,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import EmptyState from '../components/Common/EmptyState';
import EditRequirementModal from '../components/Requirements/EditRequirementModal';
import TDFInfoTooltip from '../components/Common/TDFInfoTooltip';
import { useVersionContext } from '../context/VersionContext';
import { calculateCoverage } from '../utils/coverage';
import dataStore from '../services/DataStore';

const Requirements = () => {
  // State to hold the data from DataStore
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [mapping, setMapping] = useState({});
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [hasData, setHasData] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedRequirements, setSelectedRequirements] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Get version context
  const { selectedVersion, versions } = useVersionContext();
  
  // Load data from DataStore
  useEffect(() => {
    const updateData = () => {
      setRequirements(dataStore.getRequirements());
      setTestCases(dataStore.getTestCases());
      setMapping(dataStore.getMapping());
      setHasData(dataStore.hasData());
    };
    
    updateData();
    
    // Subscribe to DataStore changes
    const unsubscribe = dataStore.subscribe(updateData);
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Calculate version-specific coverage
  const versionCoverage = useMemo(() => {
    if (selectedVersion === 'unassigned') {
      return calculateCoverage(requirements, mapping, testCases);
    } else {
      return calculateCoverage(requirements, mapping, testCases, selectedVersion);
    }
  }, [requirements, mapping, testCases, selectedVersion]);

  // Filter requirements by selected version
  const versionFilteredRequirements = selectedVersion === 'unassigned'
    ? requirements // Show all requirements for "unassigned"
    : requirements.filter(req => req.versions && req.versions.includes(selectedVersion));

  // Apply search and filters
  const filteredRequirements = useMemo(() => {
    return versionFilteredRequirements.filter(req => {
      const matchesSearch = req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           req.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'All' || req.priority === priorityFilter;
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      const matchesType = typeFilter === 'All' || req.type === typeFilter;
      
      return matchesSearch && matchesPriority && matchesStatus && matchesType;
    });
  }, [versionFilteredRequirements, searchQuery, priorityFilter, statusFilter, typeFilter]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredRequirements.length;
    const highPriority = filteredRequirements.filter(req => req.priority === 'High').length;
    const withTests = versionCoverage.filter(stat => stat.totalTests > 0).length;
    const fullyTested = versionCoverage.filter(stat => stat.meetsMinimum).length;
    const fullyAutomated = versionCoverage.filter(stat => 
      stat.automationPercentage === 100 && stat.totalTests > 0
    ).length;
    const avgTDF = total > 0 ? 
      (filteredRequirements.reduce((sum, req) => sum + req.testDepthFactor, 0) / total).toFixed(1) : 0;
    const testCoverage = total > 0 ? Math.round((withTests / total) * 100) : 0;

    return {
      total,
      highPriority,
      withTests,
      fullyTested,
      fullyAutomated,
      avgTDF,
      testCoverage
    };
  }, [filteredRequirements, versionCoverage]);

  // Handle requirement selection
  const handleRequirementSelection = (reqId, checked) => {
    const newSelection = new Set(selectedRequirements);
    if (checked) {
      newSelection.add(reqId);
    } else {
      newSelection.delete(reqId);
    }
    setSelectedRequirements(newSelection);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRequirements(new Set(filteredRequirements.map(req => req.id)));
    } else {
      setSelectedRequirements(new Set());
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (reqId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId);
    } else {
      newExpanded.add(reqId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle saving the edited requirement
  const handleSaveRequirement = (updatedRequirement) => {
    try {
      dataStore.updateRequirement(updatedRequirement.id, updatedRequirement);
      setEditingRequirement(null);
    } catch (error) {
      console.error("Error updating requirement:", error);
    }
  };

  // Handle requirement deletion
  const handleDeleteRequirement = (reqId) => {
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      try {
        dataStore.deleteRequirement(reqId);
        setSelectedRequirements(prev => {
          const newSet = new Set(prev);
          newSet.delete(reqId);
          return newSet;
        });
      } catch (error) {
        console.error('Error deleting requirement:', error);
        alert('Error deleting requirement: ' + error.message);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRequirements.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedRequirements.size} requirement(s)?`)) {
      try {
        Array.from(selectedRequirements).forEach(reqId => {
          dataStore.deleteRequirement(reqId);
        });
        setSelectedRequirements(new Set());
      } catch (error) {
        console.error('Error deleting requirements:', error);
        alert('Error deleting requirements: ' + error.message);
      }
    }
  };

  // Handle new requirement creation
  const handleNewRequirement = () => {
    setEditingRequirement({
      id: '',
      name: '',
      description: '',
      priority: 'Medium',
      type: 'Functional',
      status: 'Active',
      businessImpact: 3,
      technicalComplexity: 3,
      regulatoryFactor: 1,
      usageFrequency: 3,
      versions: selectedVersion !== 'unassigned' ? [selectedVersion] : [],
      tags: []
    });
  };

  // CHANGED: Check for requirements.length === 0 instead of !hasData
  if (requirements.length === 0) {
    return (
      <MainLayout title="Requirements" hasData={hasData}>
        <EmptyState 
          title="No Requirements Found" 
          message="Get started by importing your requirements to begin tracking your quality metrics."
          actionText="Import Requirements"
          actionPath="/import#requirements-tab"
          icon="requirements"
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Requirements" hasData={hasData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Requirements</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleNewRequirement}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2" size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Requirements</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.withTests}</div>
            <div className="text-sm text-gray-500">With Tests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.fullyTested}</div>
            <div className="text-sm text-gray-500">Fully Tested</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.fullyAutomated}</div>
            <div className="text-sm text-gray-500">Fully Automated</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{stats.avgTDF}</div>
            <div className="text-sm text-gray-500">Avg Test Depth</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">{stats.testCoverage}%</div>
            <div className="text-sm text-gray-500">Test Coverage</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Proposed">Proposed</option>
              <option value="Implemented">Implemented</option>
              <option value="Deprecated">Deprecated</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Functional">Functional</option>
              <option value="Security">Security</option>
              <option value="Performance">Performance</option>
              <option value="Usability">Usability</option>
              <option value="Compatibility">Compatibility</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequirements.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                {selectedRequirements.size} requirement(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedRequirements(new Set())}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requirements Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.size === filteredRequirements.length && filteredRequirements.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-64">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    <div className="flex items-center">
                      Test Depth
                      <TDFInfoTooltip />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Coverage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Versions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequirements.map((req) => {
                  // Find corresponding coverage data
                  const coverage = versionCoverage.find(c => c.reqId === req.id);
                  
                  // Filter linked test cases based on selected version
                  const allLinkedTests = mapping[req.id] || [];
                  const linkedTestCount = selectedVersion === 'unassigned'
                    ? allLinkedTests.length
                    : allLinkedTests.filter(tcId => {
                        const tc = testCases.find(t => t.id === tcId);
                        return tc && (!tc.version || tc.version === selectedVersion || tc.version === '');
                      }).length;

                  const isExpanded = expandedRows.has(req.id);
                  
                  return (
                    <React.Fragment key={req.id}>
                      <tr className={`hover:bg-gray-50 ${selectedRequirements.has(req.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRequirements.has(req.id)}
                            onChange={(e) => handleRequirementSelection(req.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleRowExpansion(req.id)}
                              className="mr-2 p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            {req.id}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={req.name}>{req.name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs ${
                            req.type === 'Security' ? 'bg-red-100 text-red-800' :
                            req.type === 'Performance' ? 'bg-orange-100 text-orange-800' :
                            req.type === 'Functional' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {req.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs ${
                            req.priority === 'High' ? 'bg-red-100 text-red-800' : 
                            req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs ${
                            req.status === 'Active' ? 'bg-green-100 text-green-800' :
                            req.status === 'Proposed' ? 'bg-yellow-100 text-yellow-800' :
                            req.status === 'Implemented' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="font-medium">{req.testDepthFactor}</span>
                            <span className="text-gray-500 ml-1">/ {req.minTestCases} tests</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 min-w-24">
                              <div className={`text-sm font-medium ${
                                coverage && coverage.meetsMinimum ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {linkedTestCount} / {req.minTestCases}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className={`h-2 rounded-full ${
                                    coverage && coverage.meetsMinimum ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, (linkedTestCount / req.minTestCases) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {req.versions && req.versions.length > 0 ? req.versions.slice(0, 2).map(vId => {
                              const versionExists = versions.some(v => v.id === vId);
                              return (
                                <span 
                                  key={vId}
                                  className={`px-2 py-1 rounded text-xs ${
                                    versionExists 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                  title={versionExists ? 'Existing version' : 'Version not created yet'}
                                >
                                  {vId}
                                </span>
                              );
                            }) : (
                              <span className="text-gray-400 text-xs">No versions</span>
                            )}
                            {req.versions && req.versions.length > 2 && (
                              <span className="text-gray-400 text-xs">+{req.versions.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingRequirement(req)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit requirement"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequirement(req.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete requirement"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="10" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                <p className="text-sm text-gray-600">{req.description}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Business Impact</span>
                                  <div className="text-sm font-medium">{req.businessImpact}/5</div>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Technical Complexity</span>
                                  <div className="text-sm font-medium">{req.technicalComplexity}/5</div>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Regulatory Factor</span>
                                  <div className="text-sm font-medium">{req.regulatoryFactor}/5</div>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Usage Frequency</span>
                                  <div className="text-sm font-medium">{req.usageFrequency}/5</div>
                                </div>
                              </div>

                              {req.tags && req.tags.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Tags</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {req.tags.map(tag => (
                                      <span key={tag} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredRequirements.length} of {versionFilteredRequirements.length} requirements
          {selectedVersion !== 'unassigned' && (
            <span> for version {versions.find(v => v.id === selectedVersion)?.name || selectedVersion}</span>
          )}
        </div>
        
        {/* Edit Requirement Modal */}
        {editingRequirement && (
          <EditRequirementModal
            requirement={editingRequirement}
            onSave={handleSaveRequirement}
            onCancel={() => setEditingRequirement(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Requirements;