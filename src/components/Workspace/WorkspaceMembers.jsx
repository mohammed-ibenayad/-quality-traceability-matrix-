import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit, Check, X, ChevronDown, User } from 'lucide-react';
import apiClient from '../../utils/apiClient';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Alert } from '../UI/Alert';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import ConfirmDialog from '../UI/ConfirmDialog';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '../UI/Dropdown';

const roleOptions = [
  { value: 'owner', label: 'Owner', description: 'Full control over the workspace, including deletion' },
  { value: 'admin', label: 'Admin', description: 'Can manage settings and members, but cannot delete workspace' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit content, but cannot change settings' },
  { value: 'test_executor', label: 'Test Executor', description: 'Can execute tests, but cannot modify requirements' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'admin':
      return 'bg-blue-100 text-blue-800';
    case 'editor':
      return 'bg-green-100 text-green-800';
    case 'test_executor':
      return 'bg-yellow-100 text-yellow-800';
    case 'viewer':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const WorkspaceMembers = ({ workspaceId }) => {
  const { currentWorkspace } = useWorkspaceContext();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isEditingRole, setIsEditingRole] = useState({});

  const userIsAdmin = currentWorkspace?.user_role === 'owner' || currentWorkspace?.user_role === 'admin';

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/workspaces/${workspaceId}/members`);
      
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to load workspace members'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    
    try {
      setIsInviting(true);
      
      const response = await apiClient.post(`/api/workspaces/${workspaceId}/members`, {
        email: inviteEmail,
        role: inviteRole
      });
      
      if (response.data.success) {
        setSuccessMessage(`User ${inviteEmail} has been added to the workspace`);
        setInviteEmail('');
        setInviteRole('viewer');
        setShowInviteForm(false);
        fetchMembers();
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to invite user. Please check if the email is registered.'
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const response = await apiClient.put(
        `/api/workspaces/${workspaceId}/members/${memberId}`, 
        { role: newRole }
      );
      
      if (response.data.success) {
        setMembers(members.map(m => 
          m.id === memberId ? { ...m, role: newRole } : m
        ));
        setIsEditingRole({});
        setSuccessMessage('Member role updated successfully');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to update member role'
      );
      setIsEditingRole({});
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      const response = await apiClient.delete(
        `/api/workspaces/${workspaceId}/members/${memberToRemove.id}`
      );
      
      if (response.data.success) {
        setMembers(members.filter(m => m.id !== memberToRemove.id));
        setSuccessMessage(`${memberToRemove.full_name || memberToRemove.email} has been removed from the workspace`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to remove member'
      );
    } finally {
      setMemberToRemove(null);
    }
  };

  const cancelEditing = () => {
    setIsEditingRole({});
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        
        {userIsAdmin && (
          <Button 
            size="sm"
            onClick={() => setShowInviteForm(!showInviteForm)}
            icon={showInviteForm ? <X size={16} /> : <UserPlus size={16} />}
          >
            {showInviteForm ? 'Cancel' : 'Add Member'}
          </Button>
        )}
      </div>
      
      {errorMessage && (
        <Alert 
          variant="error" 
          title="Error" 
          message={errorMessage}
          className="mb-4"
          onClose={() => setErrorMessage('')}
        />
      )}
      
      {successMessage && (
        <Alert 
          variant="success" 
          title="Success" 
          message={successMessage}
          className="mb-4"
          onClose={() => setSuccessMessage('')}
        />
      )}
      
      {/* Invite Form */}
      {showInviteForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium mb-3">Add new team member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError('');
                  }}
                  placeholder="user@example.com"
                  error={inviteError}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <Select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  options={roleOptions}
                  disabled={isInviting}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                loading={isInviting}
              >
                Add to Workspace
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added
              </th>
              {userIsAdmin && (
                <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={userIsAdmin ? 4 : 3} className="px-4 py-4 text-center text-sm text-gray-500">
                  Loading members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={userIsAdmin ? 4 : 3} className="px-4 py-4 text-center text-sm text-gray-500">
                  No members found
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt={member.full_name || member.email} 
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <User size={16} className="text-gray-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {member.full_name || 'Unnamed User'}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {isEditingRole[member.id] ? (
                      <div className="flex items-center space-x-2">
                        <Select
                          value={isEditingRole[member.id]}
                          onChange={(e) => setIsEditingRole({
                            ...isEditingRole,
                            [member.id]: e.target.value
                          })}
                          options={roleOptions}
                          className="w-32"
                        />
                        <button 
                          onClick={() => handleRoleChange(member.id, isEditingRole[member.id])}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  {userIsAdmin && (
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {!isEditingRole[member.id] && currentWorkspace?.user_id !== member.user_id && (
                          <>
                            <button
                              onClick={() => setIsEditingRole({ [member.id]: member.role })}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit role"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove member"
                              disabled={member.role === 'owner'}
                            >
                              <Trash2 size={16} className={member.role === 'owner' ? 'opacity-30 cursor-not-allowed' : ''} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Remove Member Confirmation Dialog */}
      {memberToRemove && (
        <ConfirmDialog
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToRemove.full_name || memberToRemove.email} from this workspace?`}
          confirmLabel="Remove"
          confirmVariant="danger"
          onConfirm={handleRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
};

export default WorkspaceMembers;