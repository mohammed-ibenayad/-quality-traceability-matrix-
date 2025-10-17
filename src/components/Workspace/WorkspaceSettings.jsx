import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../UI/Tabs';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';
import apiClient from '../../utils/apiClient';
import { Alert } from '../UI/Alert';
import { Loader } from 'lucide-react';
import WorkspaceMembers from './WorkspaceMembers';
import DeleteWorkspaceDialog from './DeleteWorkspaceDialog';

const WorkspaceSettings = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, setCurrentWorkspace, fetchWorkspaces } = useWorkspaceContext();
  
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [workspaceId]);

  const fetchWorkspaceDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/workspaces/${workspaceId}`);
      
      if (response.data.success) {
        const workspaceData = response.data.data;
        setWorkspace(workspaceData);
        setFormData({
          name: workspaceData.name || '',
          description: workspaceData.description || '',
          slug: workspaceData.slug || '',
        });
      }
    } catch (error) {
      console.error('Error fetching workspace details:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to load workspace details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Clear any success/error messages
    setSuccessMessage('');
    setErrorMessage('');
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Workspace name must be at least 3 characters';
    }
    
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    if (!validate()) return;
    
    try {
      setIsSaving(true);
      
      const response = await apiClient.put(`/api/workspaces/${workspaceId}`, formData);
      
      if (response.data.success) {
        setSuccessMessage('Workspace updated successfully!');
        
        // Update current workspace if this is the active one
        if (currentWorkspace?.id === workspaceId) {
          const updatedWorkspace = {
            ...currentWorkspace,
            ...formData
          };
          setCurrentWorkspace(updatedWorkspace);
          localStorage.setItem('currentWorkspace', JSON.stringify(updatedWorkspace));
        }
        
        // Refresh workspaces list
        fetchWorkspaces();
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to update workspace settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await apiClient.delete(`/api/workspaces/${workspaceId}`);
      
      if (response.data.success) {
        // If this was the current workspace, clear it
        if (currentWorkspace?.id === workspaceId) {
          setCurrentWorkspace(null);
          localStorage.removeItem('currentWorkspace');
        }
        
        // Refresh workspaces list and redirect
        await fetchWorkspaces();
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to delete workspace'
      );
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading workspace settings...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Workspace Settings</h1>
        <p className="text-gray-500">
          Manage your workspace settings and team members
        </p>
      </div>

      {successMessage && (
        <Alert 
          variant="success" 
          title="Success" 
          message={successMessage}
          className="mb-4"
          onClose={() => setSuccessMessage('')}
        />
      )}
      
      {errorMessage && (
        <Alert 
          variant="error" 
          title="Error" 
          message={errorMessage}
          className="mb-4"
          onClose={() => setErrorMessage('')}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug
                  </label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    error={errors.slug}
                    placeholder="my-workspace"
                  />
                  {errors.slug ? (
                    <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="A brief description of your workspace"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button type="submit" loading={isSaving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          <WorkspaceMembers workspaceId={workspaceId} />
        </TabsContent>
        
        <TabsContent value="danger">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
            <p className="text-gray-500 mb-6">
              These actions are destructive and cannot be undone. Please be certain.
            </p>
            
            <div className="border border-red-200 rounded-md p-4 bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">Delete Workspace</h3>
              <p className="text-sm text-gray-700 mb-4">
                This will permanently delete the workspace and all associated data, including requirements, test cases, 
                and execution history. This action is irreversible.
              </p>
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Workspace
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {showDeleteDialog && (
        <DeleteWorkspaceDialog
          workspace={workspace}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default WorkspaceSettings;