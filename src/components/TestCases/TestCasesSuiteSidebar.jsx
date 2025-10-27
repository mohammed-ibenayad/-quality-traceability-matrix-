// Location: src/components/TestCases/TestCasesSuiteSidebar.jsx
import React from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarActionButton,
  SidebarField,
  SidebarBadge
} from '../Common/RightSidebarPanel';
import { 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  FolderOpen, 
  Filter,
  AlertCircle
} from 'lucide-react';

/**
 * Enhanced TestCasesSuiteSidebar - For Option B Design
 * Shows suite details and filters main table to suite members
 */
const TestCasesSuiteSidebar = ({
  suite,
  onEditSuite,
  onDeleteSuite,
  onClose, // This now means "exit suite mode" / "clear filter"
  onAddTests,
  onRemoveTest, // NEW: Remove individual test from suite
  isFiltering = true // NEW: Indicates if table is filtered
}) => {
  
  const getSuiteTypeBadge = (suiteType) => {
    const colors = {
      smoke: 'bg-orange-100 text-orange-800',
      regression: 'bg-blue-100 text-blue-800',
      sanity: 'bg-green-100 text-green-800',
      integration: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[suiteType?.toLowerCase()] || colors.custom;
  };

  return (
    <RightSidebarPanel
      title="Suite View"
      subtitle={suite.name}
      onClose={onClose}
    >
      {/* 🔥 ACTIVE FILTER INDICATOR */}
      {isFiltering && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Filter size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                Table filtered to suite
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Showing {suite.members?.length || 0} test case{suite.members?.length !== 1 ? 's' : ''} from this suite
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded"
              title="Clear filter"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 space-y-2 border-b border-gray-200 bg-gray-50">
        <SidebarActionButton
          icon={<Plus size={16} />}
          label="Add Tests to Suite"
          onClick={onAddTests}
          variant="primary"
          fullWidth
        />
        <div className="grid grid-cols-2 gap-2">
          <SidebarActionButton
            icon={<Edit size={16} />}
            label="Edit"
            onClick={onEditSuite}
            variant="secondary"
          />
          <SidebarActionButton
            icon={<Trash2 size={16} />}
            label="Delete"
            onClick={onDeleteSuite}
            variant="danger"
          />
        </div>
      </div>

      {/* Suite Information */}
      <SidebarSection title="Information" icon={<FolderOpen size={16} />} defaultOpen={true}>
        <SidebarField 
          label="Name" 
          value={suite.name} 
        />
        
        <SidebarField 
          label="Type" 
          value={
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSuiteTypeBadge(suite.suite_type)}`}>
              {suite.suite_type || 'Custom'}
            </span>
          } 
        />
        
        {suite.version && (
          <SidebarField 
            label="Version" 
            value={
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {suite.version}
              </span>
            } 
          />
        )}
        
        {suite.description && (
          <SidebarField 
            label="Description" 
            value={<p className="text-sm text-gray-600 leading-relaxed">{suite.description}</p>} 
          />
        )}
        
        {suite.estimated_duration && (
          <SidebarField 
            label="Estimated Duration" 
            value={`${suite.estimated_duration} minutes`} 
          />
        )}
        
        {suite.recommended_environment && (
          <SidebarField 
            label="Environment" 
            value={suite.recommended_environment} 
          />
        )}
      </SidebarSection>

      {/* Test Cases in Suite */}
      <SidebarSection 
        title="Test Cases" 
        defaultOpen={true} 
        badge={suite.members?.length || 0}
      >
        {!suite.members || suite.members.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              No test cases in this suite yet
            </p>
            <button
              onClick={onAddTests}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first test case →
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {suite.members.map((member, index) => (
              <div
                key={member.id}
                className="group p-2.5 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Test Case ID */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-gray-700">
                        {member.id}
                      </span>
                      {member.execution_order !== undefined && (
                        <span className="text-xs text-gray-400">
                          #{member.execution_order + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* Test Case Name */}
                    {member.name && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {member.name}
                      </p>
                    )}
                    
                    {/* Optional: Test Case Status/Priority */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {member.priority && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          member.priority === 'High' || member.priority === 'Critical'
                            ? 'bg-red-100 text-red-700'
                            : member.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.priority}
                        </span>
                      )}
                      {member.automationStatus === 'Automated' && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          Auto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  {onRemoveTest && (
                    <button
                      onClick={() => onRemoveTest(member.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-all"
                      title="Remove from suite"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

      {/* Suite Statistics */}
      <SidebarSection title="Statistics" defaultOpen={false}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Tests:</span>
            <span className="font-semibold text-gray-900">{suite.members?.length || 0}</span>
          </div>
          
          {suite.automated_count !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Automated:</span>
              <span className="font-semibold text-green-600">{suite.automated_count}</span>
            </div>
          )}
          
          {suite.manual_count !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Manual:</span>
              <span className="font-semibold text-orange-600">{suite.manual_count}</span>
            </div>
          )}
        </div>
      </SidebarSection>

      {/* Tips */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
          💡 Tips
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Main table shows only tests in this suite</li>
          <li>• Click X above to view all test cases</li>
          <li>• Drag tests in the list to reorder (future)</li>
        </ul>
      </div>
    </RightSidebarPanel>
  );
};

export default TestCasesSuiteSidebar;