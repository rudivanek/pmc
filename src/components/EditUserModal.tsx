import React, { useState } from 'react';
import { X, User, Calendar, DollarSign, Save, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminUpdateUser } from '../services/supabaseClient';

interface EditUser {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  start_date?: string | null;
  until_date?: string | null;
  tokens_allowed: number;
  auth_created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EditUser | null;
  onUserUpdated: () => void; // Callback to refresh data after user update
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    password: '',
    startDate: '',
    untilDate: '',
    tokensAllowed: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or user changes
  React.useEffect(() => {
    if (isOpen && user) {
      setFormData({
        password: '',
        startDate: user.start_date || '',
        untilDate: user.until_date || '',
        tokensAllowed: user.tokens_allowed || 0
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tokensAllowed' ? parseInt(value) || 0 : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Date validation
    if (formData.startDate && formData.untilDate) {
      const startDate = new Date(formData.startDate);
      const untilDate = new Date(formData.untilDate);
      
      if (untilDate <= startDate) {
        newErrors.untilDate = 'End date must be after start date';
      }
    }

    // Tokens validation
    if (formData.tokensAllowed < 0) {
      newErrors.tokensAllowed = 'Tokens allowed must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('No user selected for editing');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);

    try {
      await adminUpdateUser({
        userId: user.id,
        password: formData.password || undefined,
        startDate: formData.startDate || null,
        untilDate: formData.untilDate || null,
        tokensAllowed: formData.tokensAllowed
      });

      toast.success(`User ${user.email} updated successfully!`);
      onUserUpdated(); // Refresh data
      onClose(); // Close modal
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-black dark:text-white flex items-center">
            <User size={20} className="mr-2 text-primary-500" />
            Edit User: {user.email}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            disabled={isUpdating}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-4">
            {/* User Info Display */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">User Information</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Created:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                {user.last_sign_in_at && (
                  <p><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`bg-white dark:bg-black border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5`}
                  placeholder="Leave blank to keep current password"
                  disabled={isUpdating}
                  minLength={6}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only enter a new password if you want to change it
              </p>
            </div>

            {/* Subscription Details Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <Calendar size={16} className="mr-2 text-primary-500" />
                Subscription Details
              </h4>

              {/* Start Date */}
              <div className="mb-4">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  disabled={isUpdating}
                />
              </div>

              {/* Until Date */}
              <div className="mb-4">
                <label htmlFor="untilDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Until Date
                </label>
                <input
                  type="date"
                  id="untilDate"
                  name="untilDate"
                  value={formData.untilDate}
                  onChange={handleInputChange}
                  className={`bg-white dark:bg-black border ${errors.untilDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5`}
                  disabled={isUpdating}
                />
                {errors.untilDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.untilDate}</p>
                )}
              </div>

              {/* Tokens Allowed */}
              <div>
                <label htmlFor="tokensAllowed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tokens Allowed
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="number"
                    id="tokensAllowed"
                    name="tokensAllowed"
                    min="0"
                    step="1000"
                    value={formData.tokensAllowed}
                    onChange={handleInputChange}
                    className={`bg-white dark:bg-black border ${errors.tokensAllowed ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5`}
                    placeholder="500000"
                    disabled={isUpdating}
                  />
                </div>
                {errors.tokensAllowed && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tokensAllowed}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Total tokens the user can consume during their subscription period
                </p>
              </div>
            </div>
          </div>
        </form>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Update User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;