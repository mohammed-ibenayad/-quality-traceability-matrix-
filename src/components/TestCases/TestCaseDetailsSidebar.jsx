// Location: src/components/TestCases/TestCaseDetailsSidebar.jsx
import React from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarActionButton,
  SidebarField
} from '../Common/RightSidebarPanel';
import { Edit, Trash2, FileText, Target } from 'lucide-react';

const TestCaseDetailsSidebar = ({
  testCase,
  onEdit,
  onDelete,
  onClose,
  linkedRequirements = []
}) => {
  return (
    <RightSidebarPanel
      title="Test Case Details"
      onClose={onClose}
    >
      {/* Basic Info */}
      <SidebarSection title="Information" defaultOpen={true}>
        <SidebarField label="ID" value={testCase.id} />
        <SidebarField label="Name" value={testCase.name} />
        <SidebarField label="Status" value={
          <span className={`px-2 py-1 rounded text-xs font-medium 
            ${testCase.status === 'Passed' ? 'bg-green-100 text-green-800' : 
              testCase.status === 'Failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'}`}>
            {testCase.status}
          </span>
        } />
        <SidebarField label="Priority" value={testCase.priority} />
        <SidebarField label="Automation" value={testCase.automationStatus} />
      </SidebarSection>

      {/* Linked Requirements */}
      {linkedRequirements.length > 0 && (
        <SidebarSection title="Linked Requirements" defaultOpen={true}>
          <div className="space-y-2">
            {linkedRequirements.map(req => (
              <div key={req.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{req.id}</div>
                <div className="text-gray-600 text-xs">{req.title}</div>
              </div>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2 border-t border-gray-200">
        <SidebarActionButton
          icon={<Edit size={16} />}
          label="Edit Test Case"
          onClick={onEdit}
          variant="primary"
          fullWidth
        />
        <SidebarActionButton
          icon={<Trash2 size={16} />}
          label="Delete"
          onClick={onDelete}
          variant="danger"
          fullWidth
        />
      </div>
    </RightSidebarPanel>
  );
};

export default TestCaseDetailsSidebar;