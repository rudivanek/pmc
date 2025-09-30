import { createClient } from '@supabase/supabase-js';
import { FormData, Customer, CopySession, Template, TokenUsage, StructuredCopyOutput, SavedOutput, FormState } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export function to get the Supabase client
export const getSupabaseClient = () => supabase;

// User authentication functions
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

// Prefill interface for database-stored prefills
export interface Prefill {
  id: string;
  created_at: string;
  updated_at: string;
  label: string;
  category: string;
  data: any; // FormState data as JSONB
  is_public: boolean;
  user_id: string | null;
}

// Admin function to create a new user
export const adminCreateUser = async (userData: {
  email: string;
  password: string;
  name: string;
  startDate: string | null;
  untilDate: string | null;
  tokensAllowed: number;
}) => {
  try {
    console.log('Creating user via edge function:', userData.email);
    
    // Get current user's session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('No active session found. Please log in and try again.');
    }
    
    // Call the secure edge function for admin user creation
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        startDate: userData.startDate,
        untilDate: userData.untilDate,
        tokensAllowed: userData.tokensAllowed
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('User created successfully via edge function');
    
    return {
      user: result.user,
      error: null
    };
  } catch (error) {
    console.error('Error in adminCreateUser:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

// Function to get the current session token
export const getSessionToken = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('No active session found. Please log in and try again.');
  }
  
  return session.access_token;
};

// Function to get a specific copy session by ID with abort support
export const getCopySession = async (sessionId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_copy_sessions')
        .select('*, customer:customer_id(name)')
        .eq('id', sessionId)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_copy_sessions')
    .select('*, customer:customer_id(name)')
    .eq('id', sessionId)
    .single();
};

// Function to get the latest copy session for a user with abort support
export const getLatestCopySession = async (userId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_copy_sessions')
        .select('*, customer:customer_id(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_copy_sessions')
    .select('*, customer:customer_id(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
};

// Function to get a specific template by ID with abort support
export const getTemplate = async (templateId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_templates')
        .select('*')
        .eq('id', templateId)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_templates')
    .select('*')
    .eq('id', templateId)
    .single();
};

// Function to check if a user exists by email
export const checkUserExists = async (email: string) => {
  const { data, error } = await supabase
    .from('pmc_users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 is the error code for "no rows returned"
    console.error('Error checking if user exists:', error);
    throw error;
  }
  
  return !!data; // Return true if user exists, false otherwise
};

// Function to create a new user in the pmc_users table
export const createNewUser = async (id: string, email: string, name: string) => {
  const { error } = await supabase
    .from('pmc_users')
    .insert([
      { 
        id, 
        email,
        name: name || email.split('@')[0]
      }
    ]);
  
  if (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
  
  return true;
};

// Function to save token usage data
export const saveTokenUsage = async (
  user_email: string,
  token_usage: number,
  token_cost: number,
  control_executed: string,
  brief_description: string,
  model: string = 'gpt-4o',
  copy_source: string = 'Copy Generator',
  session_id?: string,
  project_description?: string
) => {
  // First, get the current authenticated user's email to ensure we're using 
  // the exact same format that Supabase has in the JWT token
  try {
    console.log("saveTokenUsage called with user_email:", user_email);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use the authenticated user's email if available, otherwise fall back to the provided email
    const emailToUse = user?.email || user_email;
    
    console.log('Saving token usage for user:', emailToUse);
    
    return supabase
      .from('pmc_user_tokens_usage')
      .insert([
        {
          user_email: emailToUse,
          token_usage,
          token_cost,
          control_executed,
          brief_description,
          model,
          copy_source,
          session_id,
          project_description
        }
      ]);
  } catch (error) {
    console.error('Error getting authenticated user in saveTokenUsage:', error);
    
    // Fall back to using the provided email
    return supabase
      .from('pmc_user_tokens_usage')
      .insert([
        {
          user_email: user_email,
          token_usage,
          token_cost,
          control_executed,
          brief_description,
          model,
          copy_source,
          session_id,
          project_description
        }
      ]);
  }
};

// Function to get user templates
export const getUserTemplates = async (userId?: string) => {
  if (!userId) {
    console.error('getUserTemplates called without userId');
    return { data: null, error: new Error('User ID is required') };
  }
  
  console.log('getUserTemplates called with userId:', userId);
  
  try {
    const result = await supabase
      .from('pmc_templates')
      .select('*, creator:user_id(name, email)')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false });
    
    console.log('getUserTemplates result:', { 
      dataLength: result.data?.length || 0,
      error: result.error 
    });
    
    if (result.error) {
      console.error('getUserTemplates Supabase error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('getUserTemplates exception:', error);
    return { data: null, error };
  }
};

// Original implementation kept as backup
export const _getUserTemplates = async (userId?: string) => {
  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }
  
  return supabase
    .from('pmc_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

// Function to delete a template
export const deleteTemplate = async (templateId: string) => {
  return supabase
    .from('pmc_templates')
    .delete()
    .eq('id', templateId);
};

// Function to rename a template
export const renameTemplate = async (templateId: string, newName: string) => {
  return supabase
    .from('pmc_templates')
    .update({ template_name: newName })
    .eq('id', templateId);
};

// Function to save or update a template
export const saveTemplate = async (template: Template, existingTemplateId?: string) => {
  console.log('=== TEMPLATE SAVE DEBUG ===');
  console.log('Input template data:', template);
  console.log('is_public:', template.is_public);
  console.log('public_name:', template.public_name);
  console.log('public_description:', template.public_description);
  
  // Validate public template fields BEFORE creating dbTemplate
  if (template.is_public) {
    if (!template.public_name || template.public_name.trim().length === 0) {
      console.error('❌ Public template validation failed: public_name is required and must not be empty');
      return { 
        error: new Error('Public templates must have a valid public name'), 
        updated: false, 
        id: null 
      };
    }
    console.log('✅ Public template validation passed');
  }
  
  // Create a copy of the template with snake_case properties for database columns
  const dbTemplate: any = {
    user_id: template.user_id,
    template_name: template.template_name,
    description: template.description,
    language: template.language,
    tone: template.tone,
    word_count: template.word_count,
    custom_word_count: template.custom_word_count,
    target_audience: template.target_audience,
    key_message: template.key_message,
    desired_emotion: template.desired_emotion,
    call_to_action: template.call_to_action,
    brand_values: template.brand_values,
    keywords: template.keywords,
    context: template.context,
    brief_description: template.brief_description,
    page_type: template.page_type,
    business_description: template.business_description,
    original_copy: template.original_copy,
    template_type: template.template_type,
    competitor_urls: template.competitor_urls,
    product_service_name: template.product_service_name,
    industry_niche: template.industry_niche,
    tone_level: template.tone_level,
    reader_funnel_stage: template.reader_funnel_stage,
    competitor_copy_text: template.competitor_copy_text,
    target_audience_pain_points: template.target_audience_pain_points,
    preferred_writing_style: template.preferred_writing_style,
    language_style_constraints: template.language_style_constraints,
    generate_seo_metadata: template.generateSeoMetadata || false,
    generatescores: template.generateScores || template.generatescores,
    sectionBreakdown: template.sectionBreakdown || template.section_breakdown,
    forceElaborationsExamples: template.forceElaborationsExamples || template.force_elaborations_examples,
    forceKeywordIntegration: template.forceKeywordIntegration || template.force_keyword_integration,
    prioritizeWordCount: template.prioritizeWordCount || false,
    adhereToLittleWordCount: template.adhereToLittleWordCount || false,
    littleWordCountTolerancePercentage: template.littleWordCountTolerancePercentage || 20,
    project_description: template.project_description,
    is_public: Boolean(template.is_public),
    public_name: template.is_public ? (template.public_name?.trim() || template.template_name) : null,
    public_description: template.is_public ? (template.public_description?.trim() || null) : null,
    category: template.category,
  };
  
  console.log('Final dbTemplate for database:', {
    is_public: dbTemplate.is_public,
    public_name: dbTemplate.public_name,
    public_description: dbTemplate.public_description,
    template_name: dbTemplate.template_name
  });

  if (existingTemplateId) {
    // Update existing template by ID
    console.log('🔄 Updating existing template with ID:', existingTemplateId);
    const { data, error } = await supabase
      .from('pmc_templates')
      .update(dbTemplate)
      .eq('id', existingTemplateId)
      .select();
    
    console.log('🔄 Update result:', { data, error });
    
    if (error) {
      console.error('❌ Database update error:', error);
      return { 
        error: new Error(`Failed to update template: ${error.message}`), 
        updated: false, 
        id: null 
      };
    }
    
    console.log('✅ Template updated successfully');
    return { error: null, updated: true, id: existingTemplateId };
  } else {
    // Check if a template with this name already exists for this user
    console.log('🔍 Checking for existing template with name:', template.template_name);
    const { data: existingTemplate, error: queryError } = await supabase
      .from('pmc_templates')
      .select('id')
      .eq('user_id', template.user_id)
      .eq('template_name', template.template_name)
      .maybeSingle();

    if (queryError) {
      console.error('Error checking for existing template:', queryError);
      return { error: queryError, updated: false, id: null };
    }

    if (existingTemplate) {
      // Update existing template
      console.log('🔄 Found existing template, updating ID:', existingTemplate.id);
      const { error } = await supabase
        .from('pmc_templates')
        .update(dbTemplate)
        .eq('id', existingTemplate.id);
      
      console.log('🔄 Existing template update result:', { error });
      
      if (error) {
        console.error('❌ Database update error for existing template:', error);
        return { 
          error: new Error(`Failed to update existing template: ${error.message}`), 
          updated: false, 
          id: null 
        };
      }
      
      console.log('✅ Existing template updated successfully');
      return { error: null, updated: true, id: existingTemplate.id };
    } else {
      // Insert new template
      console.log('➕ Inserting new template with data:', dbTemplate);
      const { data, error } = await supabase
        .from('pmc_templates')
        .insert([dbTemplate])
        .select();
      
      console.log('➕ Insert result:', { data, error });
      
      if (error) {
        console.error('❌ Database insert error:', error);
        return { 
          error: new Error(`Failed to insert new template: ${error.message}`), 
          updated: false, 
          id: null 
        };
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No data returned from insert operation');
        return { 
          error: new Error('Template insert succeeded but no data was returned'), 
          updated: false, 
          id: null 
        };
      }
      
      console.log('✅ New template inserted successfully with ID:', data[0]?.id);
      return { error: null, updated: false, id: data[0]?.id };
    }
  }
};

// Ensure user exists in the pmc_users table
export const ensureUserExists = async (userId: string, email: string, name?: string) => {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('pmc_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
    
  // If user doesn't exist, create them
  if (!existingUser) {
    await supabase
      .from('pmc_users')
      .insert([
        { 
          id: userId, 
          email: email,
          name: name || email.split('@')[0]
        }
      ]);
  }
  
  return { id: userId, email };
};

// Customer functions
export const getCustomers = async (userId?: string) => {
  if (userId) {
    return supabase
      .from('pmc_customers')
      .select('*')
      .eq('user_id', userId)
      .order('name');
  }
  
  // Fallback to all customers if no userId provided (for backwards compatibility)
  return supabase
    .from('pmc_customers')
    .select('*')
    .order('name');
};

// Updated to include user_id parameter
export const createCustomer = async (name: string, userId: string) => {
  return supabase
    .from('pmc_customers')
    .insert([
      { 
        name, 
        user_id: userId  // Include the user_id to satisfy RLS policy
      }
    ])
    .select()
    .single();
};

// Helper function to convert copy content for storage
const prepareCopyForStorage = (copy: string | StructuredCopyOutput) => {
  if (typeof copy === 'string') {
    return copy;
  }
  return copy; // Supabase JSONB will handle the JSON object
};

// Function to save a copy session
export const saveCopySession = async (data: FormData, improvedCopy: string | StructuredCopyOutput, alternativeCopy?: string | StructuredCopyOutput, sessionId?: string) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('No authenticated user found. Please log in and try again.');
    }
    
    // Extract required fields from formData
    const {
      customerId,
      outputType,
      briefDescription,
      outputStructure
    } = data;

    // Create input_data object
    const inputData = {
      ...data,
      outputStructure: outputStructure || []
    };

    // If sessionId is provided, update the existing session
    if (sessionId) {
      console.log('Updating existing session:', sessionId);
      
      // Create update object with only the fields that should be updated
      const updateData: any = {};
      
      // Always update input_data to ensure latest state is saved
      updateData.input_data = inputData;
      
      const updateResult = await supabase
        .from('pmc_copy_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', user.id) // Ensure user can only update their own sessions
        .select();
      
      // If no rows were updated (session doesn't exist), create a new session instead
      if (updateResult.data && updateResult.data.length === 0) {
        console.log('Session not found, creating new session instead');
        
        return supabase
          .from('pmc_copy_sessions')
          .insert([
            {
              user_id: user.id,
              input_data: inputData,
              customer_id: customerId && customerId !== 'none' && customerId !== '' ? customerId : null,
              output_type: outputType || null,
              brief_description: briefDescription || null,
            },
          ])
          .select()
          .single();
      }
      
      // If update was successful, return the first (and only) updated record
      return {
        data: updateResult.data?.[0] || null,
        error: updateResult.error
      };
    } else {
      // Create a new session
      console.log('Creating new copy session');
      
      return supabase
        .from('pmc_copy_sessions')
        .insert([
          {
            user_id: user.id,
            input_data: inputData,
            customer_id: customerId && customerId !== 'none' && customerId !== '' ? customerId : null,
            output_type: outputType || null,
            brief_description: briefDescription || null,
          },
        ])
        .select()
        .single();
    }
  } catch (error) {
    console.error('Error in saveCopySession:', error);
    throw error;
  }
};

// Function to update a specific copy session field
export const updateCopySessionField = async (
  sessionId: string, 
  fieldName: string, 
  fieldValue: any
) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('No authenticated user found. Please log in and try again.');
    }
    
    // Create an update object with only the specific field
    const updateData: any = {};
    updateData[fieldName] = fieldValue;
    
    console.log(`Updating session ${sessionId}, field: ${fieldName}`);
    
    return supabase
      .from('pmc_copy_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only update their own sessions
      .select()
      .single();
  } catch (error) {
    console.error(`Error updating copy session field ${fieldName}:`, error);
    throw error;
  }
};

// Function to delete a copy session
export const deleteCopySession = async (sessionId: string) => {
  return supabase
    .from('pmc_copy_sessions')
    .delete()
    .eq('id', sessionId);
};

// Function to get copy sessions for the current user
export const getCopySessions = async () => {
  return supabase
    .from('pmc_copy_sessions')
    .select('*, pmc_customers(name)')
    .order('created_at', { ascending: false });
};

// Function to get user copy sessions
export const getUserCopySessions = async (userId: string) => {
  console.log('getUserCopySessions called with userId:', userId);
  
  try {
    const result = await supabase
      .from('pmc_copy_sessions')
      .select('*, customer:customer_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log('getUserCopySessions result:', { 
      dataLength: result.data?.length || 0,
      error: result.error 
    });
    
    if (result.error) {
      console.error('getUserCopySessions Supabase error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('getUserCopySessions exception:', error);
    return { data: null, error };
  }
};

// Original implementation kept as backup
export const _getUserCopySessions = async (userId: string) => {
  return supabase
    .from('pmc_copy_sessions')
    .select('*, customer:customer_id(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

// Function to get user token usage
export const getUserTokenUsage = async (userEmail: string) => {
  console.log('getUserTokenUsage called with userEmail:', userEmail);
  
  try {
    const result = await supabase
      .from('pmc_user_tokens_usage')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });
    
    console.log('getUserTokenUsage result:', { 
      dataLength: result.data?.length || 0,
      error: result.error 
    });
    
    if (result.error) {
      console.error('getUserTokenUsage Supabase error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('getUserTokenUsage exception:', error);
    return { data: null, error };
  }
};

// Original implementation kept as backup
export const _getUserTokenUsage = async (userEmail: string) => {
  return supabase
    .from('pmc_user_tokens_usage')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });
};

// New functions for saved outputs

// Function to get a specific saved output with abort support
export const getSavedOutput = async (outputId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_saved_outputs')
        .select('*, customer:customer_id(name)')
        .eq('id', outputId)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_saved_outputs')
    .select('*, customer:customer_id(name)')
    .eq('id', outputId)
    .single();
};

// Function to save output
export const saveSavedOutput = async (savedOutput: SavedOutput) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('No authenticated user found. Please log in and try again.');
    }
    
    // Set the user_id to ensure it matches the authenticated user
    savedOutput.user_id = user.id;
    
    return supabase
      .from('pmc_saved_outputs')
      .insert([savedOutput])
      .select()
      .single();
  } catch (error) {
    console.error('Error in saveSavedOutput:', error);
    throw error;
  }
};

// Function to get saved outputs for the current user
export const getUserSavedOutputs = async (userId: string) => {
  console.log('getUserSavedOutputs called with userId:', userId);
  
  try {
    const result = await supabase
      .from('pmc_saved_outputs')
      .select('*, customer:customer_id(name)')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    
    console.log('getUserSavedOutputs result:', { 
      dataLength: result.data?.length || 0,
      error: result.error 
    });
    
    if (result.error) {
      console.error('getUserSavedOutputs Supabase error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('getUserSavedOutputs exception:', error);
    return { data: null, error };
  }
};

// Original implementation kept as backup
export const _getUserSavedOutputs = async (userId: string) => {
  return supabase
    .from('pmc_saved_outputs')
    .select('*, customer:customer_id(name)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
};

// Function to delete a saved output
export const deleteSavedOutput = async (outputId: string) => {
  return supabase
    .from('pmc_saved_outputs')
    .delete()
    .eq('id', outputId);
};

// Function to save beta registration
export const saveBetaRegistration = async (betaData: {
  name: string;
  email: string;
}) => {
  return supabase
    .from('pmc_beta_register')
    .insert([betaData]);
};

// Register beta user via Edge Function (creates auth user, pmc_users entry, and sends welcome email)
export async function registerBetaUserViaEdgeFunction(name: string, email: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-beta-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register beta user via Edge Function');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling register-beta-user Edge Function:', error);
    throw error;
  }
}

// Delete a prefill
export async function deletePrefill(prefillId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('pmc_prefills')
    .delete()
    .eq('id', prefillId);
  
  return { data, error };
}

/**
 * Get a single prefill by ID
 * @param prefillId - The ID of the prefill to fetch
 * @returns Promise with prefill data or error
 */
export async function getPrefill(prefillId: string): Promise<{ data: Prefill | null; error: any }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('pmc_prefills')
      .select('*')
      .eq('id', prefillId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error getting prefill:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to get all token usage data
 * Only accessible by admin users
 */
export async function adminGetTokenUsage() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-token-usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch token usage');
    }

    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error: any) {
    console.error('Error fetching token usage:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to get beta registrations count
 * Only accessible by admin users
 */
export async function adminGetBetaRegistrationsCount() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-beta-registrations-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch beta registrations count');
    }

    const result = await response.json();
    return { data: result.count, error: null };
  } catch (error: any) {
    console.error('Error fetching beta registrations count:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to get all users
 * Only accessible by admin users
 */
export async function adminGetUsers() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const result = await response.json();
    return { data: result.users, error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to update an existing user
 * Only accessible by admin users
 */
export async function adminUpdateUser(updateData: {
  userId: string;
  password?: string;
  startDate: string | null;
  untilDate: string | null;
  tokensAllowed: number;
}) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to delete a user
 * Only accessible by admin users
 */
export async function adminDeleteUser(userId: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { data: null, error };
  }
}

// Get prefills from database
export async function getPrefills(userId: string): Promise<{ data: Prefill[] | null; error: any }> {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('pmc_prefills')
      .select('*')
      .or(`is_public.eq.true,user_id.eq.${userId}`) // Fetch public prefills OR prefills owned by the user
      .order('category', { ascending: true })
      .order('label', { ascending: true });

    if (error) {
      console.error('Error fetching prefills:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Exception fetching prefills:', err);
    return { data: null, error: err };
  }
}

export async function updatePrefill(prefill: Prefill): Promise<{ data: Prefill | null; error: any }> {
  try {
    const supabase = getSupabaseClient();
    
    const SUPABASE_ENABLED = true; // Add this constant or import it
    
    if (!SUPABASE_ENABLED) {
      // Mock implementation for when Supabase is disabled
      console.log('Mock: Updating prefill', prefill);
      return { data: prefill, error: null };
    }
    
    // Update the prefill in the database
    const { data, error } = await supabase
      .from('pmc_prefills')
      .update({
        label: prefill.label,
        category: prefill.category,
        is_public: prefill.is_public || false,
        data: prefill.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', prefill.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating prefill:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in updatePrefill:', error);
    return { data: null, error };
  }
}

// Create a new prefill
export async function createPrefill(prefillData: {
  user_id: string;
  label: string;
  category: string;
  is_public: boolean;
  data: any;
}): Promise<{ data: Prefill | null; error: any }> {
  const SUPABASE_ENABLED = true; // Add this constant or import it
  
  if (!SUPABASE_ENABLED) {
    console.log('Supabase disabled, skipping prefill creation');
    return { data: null, error: null };
  }

  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('pmc_prefills')
      .insert([{
        user_id: prefillData.user_id,
        label: prefillData.label,
        category: prefillData.category,
        is_public: prefillData.is_public,
        data: prefillData.data,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating prefill:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createPrefill:', error);
    return { data: null, error };
  }
}

/**
 * Get unique template categories for suggestion
 * @returns Promise with unique categories data
 */
export async function getUniqueTemplateCategories(): Promise<{ data: { value: string; label: string }[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('pmc_templates')
      .select('category')
      .not('category', 'is', null)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching unique template categories:', error);
      return { data: null, error };
    }

    // Extract unique categories and format them
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    const formattedCategories = uniqueCategories.map(category => ({
      value: category,
      label: category
    }));

    return { data: formattedCategories, error: null };
  } catch (error) {
    console.error('Error in getUniqueTemplateCategories:', error);
    return { data: null, error };
  }
}

// Mock data functions for development without Supabase
export const getMockCustomers = (): Customer[] => {
  return [
    { id: 'mock-1', name: 'Acme Corp', created_at: '2023-01-01T00:00:00Z' },
    { id: 'mock-2', name: 'XYZ Industries', created_at: '2023-01-02T00:00:00Z' },
    { id: 'mock-3', name: 'Tech Innovators', created_at: '2023-01-03T00:00:00Z' },
  ];
};

export const getMockCopySessions = (): CopySession[] => {
  return [
    {
      id: 'mock-session-1',
      user_id: 'mock-user',
      input_data: {
        language: 'English',
        tone: 'Professional',
        wordCount: '200-300',
        targetAudience: 'Business professionals',
        inputText: 'Original text for session 1',
      },
      improved_copy: 'Improved copy for session 1',
      alternative_copy: 'Alternative copy for session 1',
      created_at: '2023-01-10T00:00:00Z',
      customer_id: 'mock-1',
      pmc_customers: { name: 'Acme Corp' },
      output_type: 'Website Copy',
      brief_description: 'Homepage redesign',
    },
    {
      id: 'mock-session-2',
      user_id: 'mock-user',
      input_data: {
        language: 'English',
        tone: 'Casual',
        wordCount: '100-200',
        targetAudience: 'General public',
        inputText: 'Original text for session 2',
      },
      improved_copy: 'Improved copy for session 2',
      alternative_copy: null,
      created_at: '2023-01-15T00:00:00Z',
      customer_id: 'mock-2',
      pmc_customers: { name: 'XYZ Industries' },
      output_type: 'Email Campaign',
      brief_description: 'Product launch',
    },
  ];
};

// Function to get mock token usage data
export const getMockTokenUsage = (): TokenUsage[] => {
  return [
    {
      id: 'mock-token-1',
      user_email: 'user@example.com',
      token_usage: 3245,
      token_cost: 0.006490,
      usage_date: '2023-05-10',
      created_at: '2023-05-10T14:23:10Z',
      control_executed: 'generate_create_copy',
      brief_description: 'Website homepage copy',
      model: 'deepseek-chat',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-2',
      user_email: 'user@example.com',
      token_usage: 2134,
      token_cost: 0.004268,
      usage_date: '2023-05-12',
      created_at: '2023-05-12T09:45:22Z',
      control_executed: 'generate_improve_copy',
      brief_description: 'Product description refinement',
      model: 'gpt-4o',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-3',
      user_email: 'user@example.com',
      token_usage: 1567,
      token_cost: 0.003134,
      usage_date: '2023-05-15',
      created_at: '2023-05-15T16:12:05Z',
      control_executed: 'evaluate_prompt',
      brief_description: 'SEO content analysis',
      model: 'deepseek-chat',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-4',
      user_email: 'user@example.com',
      token_usage: 4321,
      token_cost: 0.008642,
      usage_date: '2023-05-18',
      created_at: '2023-05-18T11:30:45Z',
      control_executed: 'generate_humanized_version',
      brief_description: 'Email campaign humanization',
      model: 'gpt-4-turbo',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-5',
      user_email: 'user@example.com',
      token_usage: 1876,
      token_cost: 0.003752,
      usage_date: '2023-05-20',
      created_at: '2023-05-20T15:20:30Z',
      control_executed: 'generate_headlines',
      brief_description: 'Blog post headline options',
      model: 'gpt-3.5-turbo',
      copy_source: 'Copy Generator'
    }
  ];
};

// Function to get mock saved outputs
export const getMockSavedOutputs = (): SavedOutput[] => {
  return [
    {
      id: 'mock-saved-1',
      user_id: 'mock-user',
      customer_id: 'mock-1',
      customer: { id: 'mock-1', name: 'Acme Corp', created_at: '2023-01-01T00:00:00Z' },
      brief_description: 'Homepage copy with Steve Jobs voice',
      language: 'English',
      tone: 'Professional',
      model: 'gpt-4o',
      selected_persona: 'Steve Jobs',
      input_snapshot: {
        tab: 'create',
        language: 'English',
        tone: 'Professional',
        wordCount: 'Medium: 100-200',
        competitorUrls: [],
        businessDescription: 'Mock business description for saved output',
        isLoading: false,
        model: 'gpt-4o'
      } as FormData,
      output_content: {
        improvedCopy: 'Mock improved copy',
        alternativeCopy: 'Mock alternative copy',
        humanizedCopy: 'Mock humanized copy',
        alternativeHumanizedCopy: 'Mock alternative humanized copy',
        restyledImprovedCopy: 'Mock Steve Jobs improved copy',
        headlines: ['Headline 1', 'Headline 2', 'Headline 3']
      },
      saved_at: '2023-06-01T10:30:00Z'
    },
    {
      id: 'mock-saved-2',
      user_id: 'mock-user',
      brief_description: 'Product page copy in Spanish',
      language: 'Spanish',
      tone: 'Friendly',
      model: 'deepseek-chat',
      input_snapshot: {
        tab: 'create',
        language: 'Spanish',
        tone: 'Friendly',
        wordCount: 'Short: 50-100',
        competitorUrls: [],
        businessDescription: 'Mock Spanish business description for saved output',
        isLoading: false,
        model: 'deepseek-chat'
      } as FormData,
      output_content: {
        improvedCopy: 'Mock Spanish improved copy',
        alternativeCopy: 'Mock Spanish alternative copy',
        headlines: ['Spanish Headline 1', 'Spanish Headline 2', 'Spanish Headline 3']
      },
      saved_at: '2023-06-02T15:45:00Z'
    }
  ];
};

// Function to get user subscription data
export const getUserSubscriptionData = async (userId: string) => {
  console.log('getUserSubscriptionData called with userId:', userId);
  
  try {
    const result = await supabase
      .from('pmc_users')
      .select('start_date, until_date, tokens_allowed')
      .eq('id', userId)
      .single();
    
    console.log('getUserSubscriptionData result:', { 
      data: result.data,
      error: result.error 
    });
    
    if (result.error) {
      console.error('getUserSubscriptionData Supabase error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('getUserSubscriptionData exception:', error);
    return { data: null, error };
  }
};

// Function to get mock subscription data for development
export const getMockSubscriptionData = () => {
  return {
    start_date: '2025-01-01',
    until_date: '2025-12-31', 
    tokens_allowed: 500000
  };
};

// User access control function
export interface AccessCheckResult {
  hasAccess: boolean;
  message: string;
  details?: {
    isSubscriptionValid: boolean;
    isWithinTokenLimit: boolean;
    tokensUsed: number;
    tokensAllowed: number;
    untilDate: string | null;
  };
}

/**
 * Check if a user has access to the application based on subscription and token usage
 * @param userId - The user's ID from auth.users
 * @param userEmail - The user's email address
 * @returns AccessCheckResult with hasAccess boolean and message
 */
export const checkUserAccess = async (userId: string, userEmail: string): Promise<AccessCheckResult> => {
  try {
    console.log('🔍 DEBUGGING ACCESS CHECK for user:', { userId, userEmail });
    
    // Validate input parameters
    if (!userId || !userEmail) {
      console.error('❌ Invalid parameters for access check:', { userId, userEmail });
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan."
      };
    }
    
    // Get user's subscription details from pmc_users table
    const { data: userData, error: userError } = await supabase
      .from('pmc_users')
      .select('start_date, until_date, tokens_allowed')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user subscription data:', userError);
      // If we can't fetch user data, DENY access for security
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan."
      };
    }
    
    if (!userData) {
      console.error('❌ No user subscription data found');
      // If no user data found, DENY access
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan."
      };
    }
    
    console.log('📊 User subscription data:', userData);
    
    // 1. Check subscription date validity
    const now = new Date();
    const startDate = userData.start_date ? new Date(userData.start_date) : null;
    const untilDate = userData.until_date ? new Date(userData.until_date) : null;
    
    let isSubscriptionValid = true;
    
    // If dates are set, check if current date is within subscription period
    if (startDate && untilDate) {
      isSubscriptionValid = now >= startDate && now <= untilDate;
      console.log('🗓️ Subscription date check:', { 
        now: now.toISOString(), 
        start: startDate.toISOString(), 
        until: untilDate.toISOString(),
        valid: isSubscriptionValid 
      });
    } else if (untilDate) {
      // Only until date is set, check if not expired
      isSubscriptionValid = now <= untilDate;
      console.log('🗓️ Until date check:', { 
        now: now.toISOString(), 
        until: untilDate.toISOString(),
        valid: isSubscriptionValid 
      });
    }
    
    if (!isSubscriptionValid) {
      console.log('❌ Subscription has expired');
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan.",
        details: {
          isSubscriptionValid: false,
          isWithinTokenLimit: true,
          tokensUsed: 0,
          tokensAllowed: userData.tokens_allowed || 0,
          untilDate: userData.until_date
        }
      };
    }
    
    // 2. Check token usage limits
    let tokensUsed = 0;
    let isWithinTokenLimit = true;
    
    // Get total token usage for the user within subscription period
    try {
      let tokenQuery = supabase
        .from('pmc_user_tokens_used')
        .select('tokens_used')
        .eq('user_id', userId);
      
      // Filter by date range if subscription dates are set
      if (startDate && untilDate) {
        tokenQuery = tokenQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', untilDate.toISOString());
      } else if (startDate) {
        // Only start date is set
        tokenQuery = tokenQuery.gte('created_at', startDate.toISOString());
      } else if (untilDate) {
        // Only until date is set
        tokenQuery = tokenQuery.lte('created_at', untilDate.toISOString());
      }
      
      const { data: tokenData, error: tokenError } = await tokenQuery;
      
      if (tokenError) {
        console.error('❌ Error fetching token usage data:', tokenError);
        // If we can't fetch token data, allow access but log the issue
        console.log('⚠️ Unable to verify token usage, allowing access');
      } else if (tokenData) {
        // Calculate total tokens used
        tokensUsed = tokenData.reduce((sum, record) => sum + (record.tokens_used || 0), 0);
        
        // Check if within token limit
        const tokensAllowed = userData.tokens_allowed || 999999; // Default to high limit if not set
        isWithinTokenLimit = tokensUsed <= tokensAllowed;
        
        console.log('🪙 Token usage check:', { 
          tokensUsed,
          tokensAllowed,
          isWithinTokenLimit,
          percentage: (tokensUsed / tokensAllowed * 100).toFixed(1) + '%'
        });
        
        if (!isWithinTokenLimit) {
          console.log('❌ Token limit exceeded');
          return {
            hasAccess: false,
            message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan.",
            details: {
              isSubscriptionValid: true,
              isWithinTokenLimit: false,
              tokensUsed,
              tokensAllowed,
              untilDate: userData.until_date
            }
          };
        }
      }
    } catch (tokenFetchError) {
      console.error('❌ Exception fetching token usage:', tokenFetchError);
      // If token usage can't be verified, allow access but log the issue
      console.log('⚠️ Token usage verification failed, allowing access');
    }
    
    try {
      console.log('🔢 Checking token usage for period...');
      
      // Build the query to sum tokens used within subscription period
      let tokenQuery = supabase
        .from('pmc_user_tokens_used')
        .select('tokens_used')
        .eq('user_id', userId);
      
      // Add date filters if subscription period is defined
      if (startDate) {
        tokenQuery = tokenQuery.gte('created_at', startDate.toISOString());
        console.log('🗓️ Filtering tokens from start date:', startDate.toISOString());
      }
      if (untilDate) {
        tokenQuery = tokenQuery.lte('created_at', untilDate.toISOString());
        console.log('🗓️ Filtering tokens until date:', untilDate.toISOString());
      }
      
      const { data: tokenUsageData, error: tokenError } = await tokenQuery;
      
      if (tokenError) {
        console.error('❌ Error fetching token usage:', tokenError);
        // If we can't check token usage, allow access but log the issue
        console.log('⚠️ Cannot verify token usage, allowing access');
      } else if (tokenUsageData) {
        // Sum up all token usage within the period
        tokensUsed = tokenUsageData.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0);
        console.log('🔢 Total tokens used in period:', tokensUsed);
        console.log('🎫 Tokens allowed:', userData.tokens_allowed);
        
        // Check if user has exceeded token limit
        const tokensAllowed = userData.tokens_allowed || 999999; // Default to high limit if not set
        isWithinTokenLimit = tokensUsed <= tokensAllowed;
        
        console.log('🚦 Token limit check:', { 
          tokensUsed, 
          tokensAllowed, 
          isWithinTokenLimit 
        });
      }
    } catch (tokenCheckError) {
      console.error('❌ Exception during token usage check:', tokenCheckError);
      // If token check fails, allow access but log the issue
      console.log('⚠️ Token check failed, allowing access as fallback');
    }
    
    // If user has exceeded token limit, deny access
    if (!isWithinTokenLimit) {
      console.log('❌ User has exceeded token limit');
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan.",
        details: {
          isSubscriptionValid: true,
          isWithinTokenLimit: false,
          tokensUsed,
          tokensAllowed: userData.tokens_allowed || 0,
          untilDate: userData.until_date
        }
      };
    }
    
    console.log('✅ Access granted - subscription valid and within token limits');
    return {
      hasAccess: true,
      message: "Access granted.",
      details: {
        isSubscriptionValid: true,
        isWithinTokenLimit,
        tokensUsed,
        tokensAllowed: userData.tokens_allowed || 999999,
        untilDate: userData.until_date
      }
    };
    
  } catch (error) {
    console.error('❌ Error in checkUserAccess:', error);
    return {
      hasAccess: false,
      message: "Access denied: your subscription has expired or you have consumed all your available tokens. Please update your plan."
    };
  }
};