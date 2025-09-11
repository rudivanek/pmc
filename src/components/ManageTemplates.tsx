import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Edit, Trash2, RefreshCw, ArrowLeft, Shield, User, Eye, X, Save, Copy, Search } from 'lucide-react';
import { getTemplates, Template, createTemplate, updateTemplate, deleteTemplate } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';

const ManageTemplates: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter templates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter(template =>
        template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Search in form_state_snapshot fields
        JSON.stringify(template.form_state_snapshot || {}).toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Fetch templates data
  const fetchTemplatesData = async () => {
    setLoading(true);
    setError(null);
    
    if (!currentUser?.id) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await getTemplates(currentUser.id);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        setTemplates(data);
        setFilteredTemplates(data);
      }
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(`Failed to load templates: ${err.message}`);
      toast.error(`Failed to load templates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load templates on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchTemplatesData();
    }
  }, [isAdmin, currentUser]);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin && !loading) {
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  // Handle adding a new template
  const handleAddTemplate = () => {
    navigate('/copy-maker?templateMode=add');
  };

  // Handle editing an existing template
  const handleEditTemplate = (template: Template) => {
    navigate(`/copy-maker?templateMode=edit&templateId=${template.id}`);
  };

  // Handle cloning a template
  const handleCloneTemplate = (template: Template) => {
    navigate(`/copy-maker?templateMode=clone&templateId=${template.id}`);
    toast(`Cloning "${template.template_name}"...`);
  };

  // Handle deleting a template
  const handleDeleteTemplate = (template: Template) => {
    const confirmMessage = `Are you sure you want to delete the template "${template.template_name}"?\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      deleteTemplate(template.id!).then(({ error }) => {
        if (error) {
          console.error('Error deleting template:', error);
          toast.error(`Failed to delete template: ${error.message}`);
        } else {
          toast.success(`Template "${template.template_name}" deleted successfully!`);
          fetchTemplatesData(); // Refresh the list
        }
      }).catch((error: any) => {
        console.error('Error deleting template:', error);
        toast.error(`Failed to delete template: ${error.message}`);
      });
    }
  };

  const handleViewTemplateData = (template: Template) => {
    // Simple alert to show the data (temporary solution)
    const dataStr = JSON.stringify(template.form_state_snapshot || template, null, 2);
    alert(`Template Data for "${template.template_name}":\n\n${dataStr}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <Shield size={48} className="text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <Settings size={32} className="text-primary-500 mr-3" />
                  Manage Templates
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Administrative panel for template management ({templates.length} templates)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddTemplate}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add New Template
              </button>
              <button
                onClick={fetchTemplatesData}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md flex items-center"
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search templates by name, category, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Templates Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
          {filteredTemplates.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <Settings size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No templates found' : 'No templates found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add New Template" to create one.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                      Template Details
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-2 py-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <User size={12} className="text-primary-600 dark:text-primary-400" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                              {template.template_name}
                            </div>
                            {template.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {template.description.length > 50 
                                  ? `${template.description.substring(0, 50)}...`
                                  : template.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="text-xs text-gray-900 dark:text-white">
                          {template.category || 'Uncategorized'}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="text-xs text-gray-900 dark:text-white">
                          {template.template_type === 'create' ? 'Create' : 'Improve'}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="text-xs text-gray-900 dark:text-white">
                          {template.is_public ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Private
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="text-xs text-gray-900 dark:text-white">
                          {template.user_id?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(template.created_at)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewTemplateData(template)}
                            className="text-gray-600 hover:text-gray-500 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                            title="View template data"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-primary-600 hover:text-primary-500 p-1 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit template"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleCloneTemplate(template)}
                            className="text-gray-600 hover:text-gray-500 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                            title="Clone template"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="text-red-600 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete template"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTemplates;