// Location: src/components/TestCases/TestCasesSuiteSidebar.jsx
import React from 'react';
import RightSidebarPanel, {
  SidebarSection,
  SidebarActionButton,
  SidebarField,
  SidebarBadge
} from '../Common/RightSidebarPanel';
import { Edit, Trash2, X, FolderOpen, FileCheck, Plus } from 'lucide-react';

const TestCasesSuiteSidebar = ({
  suite,
  onEditSuite,
  onDeleteSuite,
  onClose,
  onAddTests
}) => {
  return (
    <RightSidebarPanel
      title="Suite Details"
      onClose={onClose}
    >
      {/* Suite Info */}
      <SidebarSection title="Information" defaultOpen={true}>
        <SidebarField label="Name" value={suite.name} />
        <SidebarField label="Version" value={suite.version || 'N/A'} />
        <SidebarField label="Type" value={
          <span className={`px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800`}>
            {suite.suite_type || 'Custom'}
          </span>
        } />
        {suite.description && (
          <SidebarField label="Description" value={suite.description} />
        )}
      </SidebarSection>

      {/* Members */}
      <SidebarSection title="Test Cases" defaultOpen={true} badge={suite.members?.length || 0}>
        {suite.members && suite.members.length > 0 ? (
          <div className="space-y-2">
            {suite.members.map(member => (
              <div key={member.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{member.id}</div>
                {member.name && <div className="text-gray-600 text-xs">{member.name}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No test cases in this suite</div>
        )}
      </SidebarSection>

      {/* Actions */}
      <div className="p-4 space-y-2 border-t border-gray-200">
        <SidebarActionButton
          icon={<Plus size={16} />}
          label="Add Tests"
          onClick={onAddTests}
          variant="primary"
          fullWidth
        />
        <SidebarActionButton
          icon={<Edit size={16} />}
          label="Edit Suite"
          onClick={onEditSuite}
          variant="secondary"
          fullWidth
        />
        <SidebarActionButton
          icon={<Trash2 size={16} />}
          label="Delete Suite"
          onClick={onDeleteSuite}
          variant="danger"
          fullWidth
        />
      </div>
    </RightSidebarPanel>
  );
};

export default TestCasesSuiteSidebar;