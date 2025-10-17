import React, { useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '../../utils/apiClient';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';

const NewWorkspaceModal = ({ onClose, onWorkspaceCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Auto-generate slug from name
    if (name === 'name' && !formData.slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/--+/g, '-')      // Replace multiple hyphens with a single one
        .trim();
      
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
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
    setServerError('');
    
    if (!validate()) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Creating workspace with data:', formData);
      const response = await apiClient.post('/api/workspaces', formData);
      
      console.log('Workspace creation response:', response.data);
      
      if (response.data.success) {
        // Fetch the newly created workspace details
        try {
          const workspaceResponse = await apiClient.get(`/api/workspaces/${response.data.data.id}`);
          
          if (workspaceResponse.data.success) {
            console.log('Created workspace details:', workspaceResponse.data.data);
            onWorkspaceCreated(workspaceResponse.data.data);
          } else {
            console.error('Failed to fetch workspace details:', workspaceResponse.data);
            // Use the data from the creation response as fallback
            onWorkspaceCreated({ id: response.data.data.id, ...formData });
          }
        } catch (fetchError) {
          console.error('Error fetching workspace details:', fetchError);
          // Use the data from the creation response as fallback
          onWorkspaceCreated({ id: response.data.data.id, ...formData });
        }
      } else {
        setServerError(response.data.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      setServerError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to create workspace. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Create New Workspace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {serverError}
          </div>
        )}

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
                placeholder="My Awesome Project"
                error={errors.name}
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="my-awesome-project"
                error={errors.slug}
              />
              {errors.slug ? (
                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Used in URLs. Leave empty to generate from name.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 text-xs">(optional)</span>
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

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Workspace
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewWorkspaceModal;