import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing required environment variables' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Create supabase admin client with service role key
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        }
      }
    )

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Check if user is the authorized admin
    if (user.email !== 'rfv@datago.net') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    const { userId } = await req.json()

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own admin account' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Starting deletion process for user: ${userId}`)

    // Removed token usage deletion logic

    // First, delete user from pmc_users table (this will handle cascading deletes)
    console.log(`Deleting user from pmc_users table...`)
    const { error: pmcError } = await supabaseAdmin
      .from('pmc_users')
      .delete()
      .eq('id', userId)

    if (pmcError) {
      console.error('Error deleting user from pmc_users:', pmcError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user data: ${pmcError.message}`,
          details: pmcError.details || 'No additional details available'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Successfully deleted user from pmc_users table`)

    // Then delete user from auth.users table
    console.log(`Deleting user from auth.users table...`)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting user from auth.users:', authError)
      
      // Provide more specific error messages based on error codes
      let errorMessage = `Failed to delete user from authentication: ${authError.message}`
      let hint = 'Please verify the service role key has admin permissions'
      
      if (authError.message?.includes('permission') || authError.message?.includes('unauthorized')) {
        errorMessage = 'Insufficient permissions to delete user from authentication system'
        hint = 'The service role key may not have admin privileges. Check your Supabase project settings.'
      } else if (authError.message?.includes('not found')) {
        errorMessage = 'User not found in authentication system'
        hint = 'The user may have already been deleted or the ID is incorrect.'
      } else if (authError.message?.includes('network') || authError.message?.includes('timeout')) {
        errorMessage = 'Network error while deleting user'
        hint = 'Please check your internet connection and try again.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: authError.code ? `Error code: ${authError.code}` : 'No error code provided',
          hint: hint
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    console.log(`Successfully deleted user from auth.users table`)
    console.log(`User deletion process completed successfully for ${userId}`)
    
    return new Response(
      JSON.stringify({ 
        message: 'User deleted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})