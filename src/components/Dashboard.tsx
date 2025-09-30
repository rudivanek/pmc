import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Settings, DollarSign, Users, RefreshCw, Calendar, Zap, Eye, Trash2, CreditCard as Edit, ArrowRight, User, AlertCircle, Filter, Download, List } from 'lucide-react';
import { retryFailedTracking, getTrackingQueueStatus } from '../services/api/tokenTracking';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';
import { 
  getUserCopySessions, 
  getUserTemplates, 
  getUserTokenUsage,
  getUserSavedOutputs,
  getUserSubscriptionData,
  getMockCopySessions,
  getMockTokenUsage,
  getMockSavedOutputs,
  getMockSubscriptionData,
  deleteCopySession,
  deleteTemplate,
  deleteSavedOutput,
  renameTemplate,
  adminGetTokenUsage,
  adminGetBetaRegistrationsCount,
  adminGetUsers
} from '../services/supabaseClient';
import { CopySession, Template, SavedOutput } from '../types';
import { toast } from 'react-hot-toast';

// Define TokenUsage interface locally since it's not in types
interface TokenUsage {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  operation_type: string;
  model: string;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

// Import Supabase enabled flag from environment variables
const SUPABASE_ENABLED = import.meta.env.VITE_SUPABASE_ENABLED === 'true';

interface DashboardStats {
  totalSessions: number;
  totalTemplates: number;
  totalTokensUsed: number;
  totalCost: number;
  totalSavedOutputs: number;
}

interface DashboardUser {
  id: string;
  email: string;
  name: string;
}

const Dashboard: React.FC<{ userId: string; onLogout: () => void }> = ({ userId, onLogout }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // State
  const [copySessions, setCopySessions] = useState<CopySession[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [allUsers, setAllUsers] = useState<DashboardUser[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [betaRegistrationsCount, setBetaRegistrationsCount] = useState<number | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions');
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalTemplates: 0,
    totalTokensUsed: 0,
    totalCost: 0,
    totalSavedOutputs: 0
  });

  // Check if current user is admin
  const isAdmin = currentUser?.email === 'rfv@datago.net';

  // Rename template state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState<string>('');

  // Filter token usage based on selected user
  const filteredTokenUsage = React.useMemo(() => {
    if (selectedUserFilter === 'all') {
      return tokenUsage;
    }
    return tokenUsage.filter(usage => usage.user_email === selectedUserFilter);
  }, [tokenUsage, selectedUserFilter]);

  // Calculate filtered stats for token usage
  const filteredStats = React.useMemo(() => {
    const totalTokensUsed = filteredTokenUsage.reduce((sum, usage) => sum + usage.tokens_used, 0);
    const totalCost = filteredTokenUsage.reduce((sum, usage) => sum + usage.cost_usd, 0);
    return { totalTokensUsed, totalCost };
  }, [filteredTokenUsage]);

  // CSV export function for token usage
  const exportTokenUsageToCSV = useCallback(() => {
    if (filteredTokenUsage.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Debug: Log the first item to see the actual data structure
    console.log('Sample token usage item for CSV export:', filteredTokenUsage[0]);

    // Define CSV headers
    const headers = [
      'User Email',
      'User Name',
      'Operation Type',
      'Model',
      'Token Usage',
      'Token Cost',
      'Cost per 1K Tokens',
      'Created At'
    ];

    // Convert data to CSV rows
    const csvRows = filteredTokenUsage.map(usage => {
      const costPer1K = (usage.cost_usd / usage.tokens_used) * 1000;
      
      return [
        `"${usage.user_email || ''}"`,
        `"${usage.user_name || ''}"`,
        `"${usage.operation_type || ''}"`,
        `"${usage.model || ''}"`,
        `${usage.tokens_used || 0}`,
        `${usage.cost_usd || 0}`,
        `${costPer1K.toFixed(6)}`,
        `"${usage.created_at || ''}"`
      ].join(',');
    });

    // Combine headers and data
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `token-usage-${selectedUserFilter === 'all' ? 'all-users' : selectedUserFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Token usage data exported to CSV!');
  }, [filteredTokenUsage, selectedUserFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Load user data
  const loadUserData = useCallback(async () => {
    setLoading(true);
    
    try {
      if (!SUPABASE_ENABLED) {
        // Use mock data if Supabase is not enabled
        setCopySessions(getMockCopySessions());
        setTokenUsage(getMockTokenUsage());
        setSavedOutputs(getMockSavedOutputs());
        setSubscriptionData(getMockSubscriptionData());
        setLoading(false);
        return;
      }
      
      // Load user-specific data
      const [
        sessionsResult,
        templatesResult,
        savedOutputsResult,
        subscriptionResult
      ] = await Promise.all([
        getUserCopySessions(userId),
        getUserTemplates(userId),
        getUserSavedOutputs(userId),
        getUserSubscriptionData(userId)
      ]);

      if (sessionsResult.data) setCopySessions(sessionsResult.data);
      if (templatesResult.data) setTemplates(templatesResult.data);
      if (savedOutputsResult.data) setSavedOutputs(savedOutputsResult.data);
      if (subscriptionResult.data) setSubscriptionData(subscriptionResult.data);

      // Load admin-specific data if user is admin
      if (isAdmin) {
        try {
          // Load all users token usage for admin
          try {
            const allTokenUsageResult = await adminGetTokenUsage();
            if (allTokenUsageResult.data) {
              setTokenUsage(allTokenUsageResult.data);
            }
          } catch (tokenError) {
            console.error('Error loading all token usage:', tokenError);
            // Don't fail the entire load process if token usage fails
          }
          
          // Try to load admin data with individual error handling
          try {
            const betaCountResult = await adminGetBetaRegistrationsCount();
            if (betaCountResult.data !== null) {
              setBetaRegistrationsCount(betaCountResult.data);
            }
          } catch (betaError) {
            console.error('Error loading beta registrations count:', betaError);
            // Don't fail the entire load process if beta count fails
          }
          
          try {
            const usersResult = await adminGetUsers();
            if (usersResult.data) {
              setAllUsers(usersResult.data.map((user: any) => ({
                id: user.id,
                email: user.email,
                name: user.name
              })));
            }
          } catch (usersError) {
            console.error('Error loading users:', usersError);
            // Don't fail the entire load process if users load fails
          }
        } catch (adminError) {
          console.error('Error loading admin data:', adminError);
        }
      } else {
        // Load user-specific token usage for non-admin users
        try {
          const tokenUsageResult = await getUserTokenUsage(currentUser?.email || '');
          if (tokenUsageResult.data) {
            // Transform the data to match the expected format for non-admin users
            const transformedTokenUsage = tokenUsageResult.data.map((usage: any) => ({
              id: usage.id,
              user_id: userId,
              user_email: currentUser?.email || '',
              user_name: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || '',
              operation_type: usage.control_executed || 'unknown',
              model: usage.model,
              tokens_used: usage.token_usage,
              cost_usd: usage.token_cost,
              created_at: usage.created_at
            }));
            setTokenUsage(transformedTokenUsage);
          }
        } catch (tokenError) {
          console.error('Error loading user token usage:', tokenError);
        }
      }

      if (sessionsResult.error) console.error('Error loading sessions:', sessionsResult.error);
      if (savedOutputsResult.error) console.error('Error loading saved outputs:', savedOutputsResult.error);
      if (subscriptionResult.error) console.error('Error loading subscription data:', subscriptionResult.error);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.email, isAdmin]);

  // Calculate stats
  useEffect(() => {
    const totalTokensUsed = tokenUsage.reduce((sum, usage) => sum + usage.token_usage, 0);
    const totalCost = tokenUsage.reduce((sum, usage) => sum + usage.token_cost, 0);
    const userTokensUsed = isAdmin ? filteredStats.totalTokensUsed : totalTokensUsed;
    const userCost = isAdmin ? filteredStats.totalCost : totalCost;
    
    setStats({
      totalSessions: copySessions.length,
      totalTemplates: templates.length,
      totalTokensUsed: userTokensUsed,
      totalCost: userCost,
      totalSavedOutputs: savedOutputs.length
    });
  }, [copySessions, templates, tokenUsage, savedOutputs, isAdmin, filteredStats]);

  // Load data on component mount
  useEffect(() => {
    loadUserData();
    
    // Start background retry of failed token tracking
    const retryInterval = setInterval(() => {
      retryFailedTracking().catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(retryInterval);
  }, [userId, currentUser?.email, isAdmin]);

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['sessions', 'templates', 'savedOutputs', 'tokenUsage'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, location.pathname]);

  // Handle delete copy session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        if (!SUPABASE_ENABLED) {
          setCopySessions(copySessions.filter(session => session.id !== sessionId));
          toast.success('Session deleted successfully');
          return;
        }
        
        await deleteCopySession(sessionId);
        setCopySessions(copySessions.filter(session => session.id !== sessionId));
        toast.success('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        toast.error('Failed to delete session');
      }
    } 
  }, [SUPABASE_ENABLED, copySessions]);

  // Handle delete template
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        if (!SUPABASE_ENABLED) {
          setTemplates(templates.filter(template => template.id !== templateId));
          toast.success('Template deleted successfully');
          return;
        }
        
        await deleteTemplate(templateId);
        setTemplates(templates.filter(template => template.id !== templateId));
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    } 
  }, [SUPABASE_ENABLED, templates]);

  // Handle delete saved output
  const handleDeleteSavedOutput = useCallback(async (outputId: string) => {
    if (window.confirm('Are you sure you want to delete this saved output?')) {
      try {
        if (!SUPABASE_ENABLED) {
          setSavedOutputs(savedOutputs.filter(output => output.id !== outputId));
          toast.success('Saved output deleted successfully');
          return;
        }
        
        await deleteSavedOutput(outputId);
        setSavedOutputs(savedOutputs.filter(output => output.id !== outputId));
        toast.success('Saved output deleted successfully');
      } catch (error) {
        console.error('Error deleting saved output:', error);
        toast.error('Failed to delete saved output');
      }
    } 
  }, [SUPABASE_ENABLED, savedOutputs]);

  // Handle template rename
  const handleStartRename = useCallback((template: Template) => {
    setEditingTemplateId(template.id || '');
    setEditingTemplateName(template.template_name);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingTemplateId(null);
    setEditingTemplateName('');
  }, []);

  const handleSaveRename = useCallback(async (templateId: string) => {
    if (!editingTemplateName.trim()) {
      toast.error('Template name cannot be empty');
      return;
    }

    try {
      if (!SUPABASE_ENABLED) {
        // Update mock data
        setTemplates(templates.map(template => 
          template.id === templateId
            ? { ...template, template_name: editingTemplateName }
            : template
        ));
        toast.success('Template renamed successfully');
        setEditingTemplateId(null);
        setEditingTemplateName('');
        return;
      }
      
      await renameTemplate(templateId, editingTemplateName);
      setTemplates(templates.map(template => 
        template.id === templateId 
          ? { ...template, template_name: editingTemplateName }
          : template
      ));
      toast.success('Template renamed successfully');
      setEditingTemplateId(null);
      setEditingTemplateName('');
    } catch (error) {
      console.error('Error renaming template:', error);
      toast.error('Failed to rename template');
    }
  }, [SUPABASE_ENABLED, editingTemplateName, templates]);

  // Helper function to render tab navigation
  const renderTabNavigation = () => (
    <div className="border-b border-gray-300 dark:border-gray-800 mb-6">
      <nav className="flex space-x-8">
        {[
          { id: 'sessions', label: 'Copy Sessions', icon: FileText },
          { id: 'templates', label: 'Templates', icon: Settings },
          { id: 'savedOutputs', label: 'Saved Outputs', icon: BarChart3 },
          { id: 'tokenUsage', label: 'Token Usage', icon: DollarSign }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === id
                ? 'border-gray-500 text-gray-600 dark:text-gray-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={18} className="mr-2" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your copy sessions, templates, and view analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUserData}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex items-center space-x-3">
                <Link
                  to="/manage-users"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
                  title="Manage Users"
                >
                  <Users size={16} />
                </Link>
                
                <Link
                  to="/manage-prefills"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
                  title="Manage Prefills"
                >
                  <List size={16} />
                </Link>
                
                {/* Beta Registrations Count */}
                {betaRegistrationsCount !== null && (
                  <div className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center shadow-md" title={`Beta Registrations: ${betaRegistrationsCount}`}>
                    <User size={16} className="mr-1" />
                    {betaRegistrationsCount}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Status */}
        {subscriptionData && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar size={24} className="text-gray-500 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Status</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subscriptionData.start_date && subscriptionData.until_date 
                      ? `Active from ${formatDate(subscriptionData.start_date)} to ${formatDate(subscriptionData.until_date)}`
                      : 'No subscription dates set'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subscriptionData.tokens_allowed?.toLocaleString() || 'Unlimited'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tokens Allowed</div>
                {stats.totalTokensUsed > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Used: {stats.totalTokensUsed.toLocaleString()} (N/A%)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <FileText size={24} className="text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Copy Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <Settings size={24} className="text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTemplates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <BarChart3 size={24} className="text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Saved Outputs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSavedOutputs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <DollarSign size={24} className="text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalCost)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{stats.totalTokensUsed.toLocaleString()} tokens</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Content based on active tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Copy Sessions</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your saved copy generation sessions</p>
            </div>
            
            {copySessions.length === 0 ? (
              <div className="p-8 text-center"> {/* Removed token usage related content */}
                <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sessions yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first copy session by using the Copy Maker
                </p>
                <Link
                  to="/copy-maker"
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  <Zap size={16} className="mr-2" />
                  Create Copy
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto"> {/* Removed token usage related content */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {copySessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-2 py-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.brief_description || 'Untitled Session'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {session.input_data?.language} • {session.input_data?.tone} • {session.input_data?.wordCount}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Model: {session.input_data?.model || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-900 dark:text-white">
                          {session.customer?.name || 'No customer'}
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                          <div>{session.output_type || session.input_data?.tab || 'Copy'}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {session.input_data?.pageType} • {session.input_data?.section}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(session.created_at)}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/copy-maker?sessionId=${session.id}`}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                              title="Load session"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                              title="Delete session"
                            >
                              <Trash2 size={16} />
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
        )}

        {activeTab === 'templates' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Templates</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your saved configuration templates</p>
            </div>
            
            {templates.length === 0 ? (
              <div className="p-8 text-center">
                <Settings size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No templates yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Save your first template by configuring a form and clicking "Save as Template"
                </p>
                <Link
                  to="/copy-maker"
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  <Settings size={16} className="mr-2" />
                  Create Template
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Template Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Configuration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Settings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2">
                          {editingTemplateId === template.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingTemplateName}
                                onChange={(e) => setEditingTemplateName(e.target.value)}
                                className="text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(template.id || '');
                                  if (e.key === 'Escape') handleCancelRename();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(template.id || '')}
                                className="text-gray-600 hover:text-gray-500"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="text-gray-600 hover:text-gray-500"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {template.template_name}
                                {template.is_public && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                    Public
                                  </span>
                                )}
                              </div>
                              {template.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {template.description}
                                </div>
                              )}
                              {template.is_public && template.public_name && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Public as: "{template.public_name}"
                                </div>
                              )}
                              {template.creator && template.creator.email !== currentUser?.email && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  By: {template.creator.name || template.creator.email}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Type:</span> <span className="capitalize">{template.template_type}</span></div>
                            <div><span className="font-medium">Language:</span> {template.language}</div>
                            <div><span className="font-medium">Tone:</span> {template.tone}</div>
                            <div><span className="font-medium">Word Count:</span> {template.word_count}{template.custom_word_count ? ` (${template.custom_word_count})` : ''}</div>
                            {template.page_type && <div><span className="font-medium">Page:</span> {template.page_type}</div>}
                            {template.section && <div><span className="font-medium">Section:</span> {template.section}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            {template.target_audience && (
                              <div><span className="font-medium">Audience:</span> {template.target_audience.substring(0, 50)}{template.target_audience.length > 50 ? '...' : ''}</div>
                            )}
                            {template.key_message && (
                              <div><span className="font-medium">Key Message:</span> {template.key_message.substring(0, 50)}{template.key_message.length > 50 ? '...' : ''}</div>
                            )}
                            {template.keywords && (
                              <div><span className="font-medium">Keywords:</span> {template.keywords.substring(0, 40)}{template.keywords.length > 40 ? '...' : ''}</div>
                            )}
                            {template.selectedPersona && (
                              <div><span className="font-medium">Voice:</span> {template.selectedPersona}</div>
                            )}
                            {(template.generateScores || template.generateSeoMetadata) && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {[
                                  template.generateScores && 'Scoring',
                                  template.generateSeoMetadata && 'SEO Metadata'
                                ].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {template.created_at ? formatDate(template.created_at) : 'Unknown'}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {template.created_at && new Date(template.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/copy-maker?templateId=${template.id}`}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                              title="Load template"
                            >
                              <Eye size={16} />
                            </Link>
                            {template.user_id === userId && (
                              <>
                                <button
                                  onClick={() => handleStartRename(template)}
                                  className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                                  title="Rename template"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template.id || '')}
                                  className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                                  title="Delete template"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'savedOutputs' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Saved Outputs</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your specifically saved content outputs</p>
            </div>
            
            {savedOutputs.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No saved outputs yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Save your first output by generating copy and clicking "Save Output"
                </p>
                <Link
                  to="/copy-maker"
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  <Zap size={16} className="mr-2" />
                  Generate Copy
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Configuration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saved</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {savedOutputs.map((output) => (
                      <tr key={output.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {output.brief_description}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {output.customer?.name && `Customer: ${output.customer.name}`}
                          </div>
                          {output.input_snapshot?.tab && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Type: {output.input_snapshot.tab === 'create' ? 'Create New' : 'Improve Existing'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Model:</span> {output.model}</div>
                            <div><span className="font-medium">Language:</span> {output.language}</div>
                            <div><span className="font-medium">Tone:</span> {output.tone}</div>
                            {output.selected_persona && (
                              <div><span className="font-medium">Voice:</span> {output.selected_persona}</div>
                            )}
                            {output.input_snapshot?.targetAudience && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                <span className="font-medium">Audience:</span> {output.input_snapshot.targetAudience.substring(0, 30)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            {output.output_content?.generatedVersions && (
                              <div><span className="font-medium">Versions:</span> {output.output_content.generatedVersions.length}</div>
                            )}
                            {output.output_content?.improvedCopy && (
                              <div><span className="font-medium">Word Count:</span> {
                                typeof output.output_content.improvedCopy === 'string' 
                                  ? output.output_content.improvedCopy.split(/\s+/).length 
                                  : 'Structured'
                              }</div>
                            )}
                            {output.output_content?.seoMetadata && (
                              <div><span className="font-medium">SEO:</span> Included</div>
                            )}
                            {output.input_snapshot?.generateScores && (
                              <div><span className="font-medium">Scores:</span> Generated</div>
                            )}
                            {output.input_snapshot?.keywords && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                <span className="font-medium">Keywords:</span> {output.input_snapshot.keywords.substring(0, 25)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {output.saved_at ? formatDate(output.saved_at) : 'Unknown'}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {output.saved_at && new Date(output.saved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/copy-maker?savedOutputId=${output.id}`}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                              title="Load saved output"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeleteSavedOutput(output.id || '')}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                              title="Delete saved output"
                            >
                              <Trash2 size={16} />
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
        )}

        {activeTab === 'tokenUsage' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Token Usage</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {isAdmin ? 'Monitor API token consumption across all users' : 'Monitor your API token consumption'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportTokenUsageToCSV}
                    disabled={filteredTokenUsage.length === 0}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export filtered data to CSV"
                  >
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
              
              {/* User Filter and Stats - Only show for admin */}
              {isAdmin && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Filter size={16} className="text-gray-500 mr-2" />
                      <label htmlFor="userFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter by user:
                      </label>
                    </div>
                    <select
                      id="userFilter"
                      value={selectedUserFilter}
                      onChange={(e) => setSelectedUserFilter(e.target.value)}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    >
                      <option value="all">All Users ({tokenUsage.length} records)</option>
                      {allUsers.map(user => {
                        const userTokenCount = tokenUsage.filter(t => t.user_email === user.email).length;
                        return (
                          <option key={user.email} value={user.email}>
                            {user.name} ({userTokenCount} records)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Filtered: {filteredTokenUsage.length} records
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Tokens: {filteredStats.totalTokensUsed.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Cost: {formatCurrency(filteredStats.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {!isAdmin && (
                <div className="mt-4 flex justify-end">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Records: {tokenUsage.length}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Tokens: {stats.totalTokensUsed.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Cost: {formatCurrency(stats.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats for non-admin users */}
              {!isAdmin && tokenUsage.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Total Records: {tokenUsage.length}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Total Tokens: {stats.totalTokensUsed.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Total Cost: {formatCurrency(stats.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {tokenUsage.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No token usage data</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isAdmin ? 'Token usage will appear here as users generate content' : 'Your token usage will appear here as you generate content'}
                </p>
              </div>
            ) : isAdmin && filteredTokenUsage.length === 0 ? (
              <div className="p-8 text-center">
                <Filter size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No data for selected user</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try selecting a different user or "All Users"
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {isAdmin && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tokens</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {(isAdmin ? filteredTokenUsage : tokenUsage).map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {usage.user_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {usage.user_email}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-white capitalize">
                            {usage.operation_type.replace(/_/g, ' ')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {usage.model}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {usage.tokens_used.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency((usage.cost_usd / usage.tokens_used) * 1000)}/1K
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(usage.cost_usd)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(usage.created_at)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(usage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;