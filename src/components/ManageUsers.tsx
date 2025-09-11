import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Edit, Trash2, UserPlus, ArrowLeft, Shield, Calendar, DollarSign, RefreshCw, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import { adminGetUsers, adminDeleteUser } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';

interface ManageUser {
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

const ManageUsers: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<ManageUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManageUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ManageUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await adminGetUsers();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err.message}`);
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Load users on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin && !loading) {
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  // Handle edit user
  const handleEditUser = (user: ManageUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = async (user: ManageUser) => {
    // Prevent admin from deleting themselves
    if (user.id === currentUser?.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${user.email}"?\n\nThis action will:\n• Remove them from authentication\n• Delete all their data\n• Cannot be undone`;
    
    if (window.confirm(confirmMessage)) {
      setIsDeleting(user.id);
      
      try {
        await adminDeleteUser(user.id);
        
        toast.success(`User ${user.email} deleted successfully!`);
        
        // Refresh the user list
        await fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(`Failed to delete user: ${error.message}`);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Handle user updated callback
  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the user list
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
          <Shield size={48} className="text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Users size={32} className="text-primary-500 mr-3" />
                Manage Users
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Administrative panel for user management ({filteredUsers.length} users)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchUsers}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              disabled={loading}
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              onClick={() => setIsAddModalOpen(true)}
            >
              <UserPlus size={16} className="mr-2" />
              Add New User
            </button>
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
              placeholder="Search users by email..."
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

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg overflow-hidden">
          {filteredUsers.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <Users size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'No users have been created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <UserIcon size={20} className="text-primary-600 dark:text-primary-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1 text-gray-400" />
                            {formatDate(user.start_date)} - {formatDate(user.until_date)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <DollarSign size={14} className="mr-1 text-gray-400" />
                          {user.tokens_allowed?.toLocaleString() || 'Not set'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-primary-500 p-2 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit user"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isDeleting === user.id || user.id === currentUser?.id}
                            className={`p-2 rounded-md transition-colors ${
                              user.id === currentUser?.id // Changed from text-red-600
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                            title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                          >
                            {isDeleting === user.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : ( // Changed from border-red-500
                              <Trash2 size={16} />
                            )}
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

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onUserCreated={handleUserUpdated}
        />
      </div>
    </div>
  );
};

export default ManageUsers;