import React from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarField,
  SidebarActionButton,
  SidebarBadge,
  SidebarDivider
} from '../Common/RightSidebarPanel';
import {
  Edit,
  Trash2,
  Link,
  FileText,
  User,
  Calendar,
  Tag,
  BarChart3,
  AlertCircle
} from 'lucide-react';

/**
 * RequirementDetailsSidebar - Example implementation showing requirement details
 * 
 * @param {object} requirement - Requirement object to display
 * @param {function} onClose - Close callback
 * @param {function} onEdit - Edit callback
 * @param {function} onDelete - Delete callback
 * @param {function} onLinkTests - Link tests callback
 * @param {array} linkedTests - Array of linked test cases
 */
const RequirementDetailsSidebar = ({
  requirement,
  onClose,
  onEdit,
  onDelete,
  onLinkTests,
  linkedTests = []
}) => {
  if (!requirement) {
    return null;
  }

  // Calculate test depth factor
  const calculateTDF = (req) => {
    const bi = req.businessImpact || 3;
    const tc = req.technicalComplexity || 3;
    const rf = req.regulatoryFactor || 1;
    const uf = req.usageFrequency || 3;
    return ((bi + tc + rf + uf) / 20 * 100).toFixed(0);
  };

  const tdf = calculateTDF(requirement);

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'yellow';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Draft': return 'blue';
      case 'Deprecated': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <RightSidebarPanel
      title="Requirement Details"
      onClose={onClose}
    >
      {/* Quick Actions */}
      <div className="p-4 space-y-2 border-b border-gray-200">
        <SidebarActionButton
          icon={<Edit size={16} />}
          label="Edit Requirement"
          onClick={onEdit}
          variant="primary"
        />
        <SidebarActionButton
          icon={<Link size={16} />}
          label="Link Test Cases"
          onClick={onLinkTests}
          variant="secondary"
        />
        <SidebarActionButton
          icon={<Trash2 size={16} />}
          label="Delete Requirement"
          onClick={onDelete}
          variant="danger"
        />
      </div>

      {/* Basic Information */}
      <SidebarSection
        title="Basic Information"
        icon={<FileText size={16} />}
        defaultOpen={true}
      >
        <SidebarField
          label="Requirement ID"
          value={<span className="font-mono font-semibold">{requirement.id}</span>}
        />
        <SidebarField
          label="Name"
          value={requirement.name}
        />
        <SidebarField
          label="Description"
          value={
            <p className="text-sm leading-relaxed">{requirement.description}</p>
          }
        />
      </SidebarSection>

      {/* Classification */}
      <SidebarSection
        title="Classification"
        icon={<Tag size={16} />}
        defaultOpen={true}
      >
        <SidebarField
          label="Priority"
          value={
            <SidebarBadge
              label={requirement.priority}
              color={getPriorityColor(requirement.priority)}
            />
          }
        />
        <SidebarField
          label="Type"
          value={requirement.type}
        />
        <SidebarField
          label="Status"
          value={
            <SidebarBadge
              label={requirement.status}
              color={getStatusColor(requirement.status)}
            />
          }
        />
      </SidebarSection>

      {/* Ownership */}
      <SidebarSection
        title="Ownership"
        icon={<User size={16} />}
        defaultOpen={true}
      >
        <SidebarField
          label="Owner"
          value={requirement.owner || 'Unassigned'}
        />
        <SidebarField
          label="Created Date"
          value={requirement.createdDate ? new Date(requirement.createdDate).toLocaleDateString() : 'N/A'}
        />
        <SidebarField
          label="Last Modified"
          value={requirement.lastModified ? new Date(requirement.lastModified).toLocaleDateString() : 'N/A'}
        />
      </SidebarSection>

      {/* Test Depth Factors */}
      <SidebarSection
        title="Test Depth Analysis"
        icon={<BarChart3 size={16} />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {/* Overall TDF Score */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs font-medium text-blue-600 uppercase mb-1">
              Test Depth Factor
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-blue-900">{tdf}</span>
              <span className="text-sm text-blue-600 ml-1">/ 100</span>
            </div>
          </div>

          {/* Individual Factors */}
          <SidebarField
            label="Business Impact"
            value={
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(requirement.businessImpact / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {requirement.businessImpact}/5
                </span>
              </div>
            }
          />
          <SidebarField
            label="Technical Complexity"
            value={
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(requirement.technicalComplexity / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {requirement.technicalComplexity}/5
                </span>
              </div>
            }
          />
          <SidebarField
            label="Regulatory Factor"
            value={
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${(requirement.regulatoryFactor / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {requirement.regulatoryFactor}/5
                </span>
              </div>
            }
          />
          <SidebarField
            label="Usage Frequency"
            value={
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(requirement.usageFrequency / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {requirement.usageFrequency}/5
                </span>
              </div>
            }
          />
        </div>
      </SidebarSection>

      {/* Versions */}
      <SidebarSection
        title="Applicable Versions"
        icon={<Calendar size={16} />}
        defaultOpen={true}
      >
        {requirement.versions && requirement.versions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {requirement.versions.map((versionId, index) => (
              <SidebarBadge
                key={index}
                label={versionId}
                color="blue"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Not assigned to any version</p>
        )}
      </SidebarSection>

      {/* Tags */}
      {requirement.tags && requirement.tags.length > 0 && (
        <SidebarSection
          title="Tags"
          icon={<Tag size={16} />}
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2">
            {requirement.tags.map((tag, index) => (
              <SidebarBadge
                key={index}
                label={tag}
                color="gray"
              />
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Linked Test Cases */}
      <SidebarSection
        title="Linked Test Cases"
        icon={<Link size={16} />}
        defaultOpen={true}
      >
        {linkedTests.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {linkedTests.length} test case{linkedTests.length !== 1 ? 's' : ''} linked
              </span>
            </div>
            <div className="space-y-2">
              {linkedTests.slice(0, 5).map((test, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="font-mono text-xs text-blue-600 mb-1">
                    {test.id}
                  </div>
                  <div className="text-sm text-gray-900 line-clamp-2">
                    {test.title}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <SidebarBadge
                      label={test.status}
                      color={
                        test.status === 'Passed' ? 'green' :
                        test.status === 'Failed' ? 'red' :
                        'gray'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            {linkedTests.length > 5 && (
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
                View all {linkedTests.length} test cases →
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-500">No test cases linked</p>
            <button
              onClick={onLinkTests}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Link test cases
            </button>
          </div>
        )}
      </SidebarSection>

      <SidebarDivider />

      {/* Additional Info */}
      <div className="p-4">
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p>
            <strong>Note:</strong> Changes to this requirement may affect {linkedTests.length} linked test case{linkedTests.length !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>
    </RightSidebarPanel>
  );
};

export default RequirementDetailsSidebar;