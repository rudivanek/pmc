import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

    // Get users from pmc_users table with auth user data
    const { data: pmcUsers, error: pmcError } = await supabaseAdmin
      .from('pmc_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (pmcError) {
      console.error('Error fetching pmc_users:', pmcError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch users: ${pmcError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get auth users data
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch auth users: ${authError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Combine data from both tables
    const combinedUsers = pmcUsers.map(pmcUser => {
      const authUser = authUsers.users.find(au => au.id === pmcUser.id)
      return {
        id: pmcUser.id,
        email: pmcUser.email,
        name: pmcUser.name,
        created_at: pmcUser.created_at,
        start_date: pmcUser.start_date,
        until_date: pmcUser.until_date,
        tokens_allowed: pmcUser.tokens_allowed,
        auth_created_at: authUser?.created_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed_at: authUser?.email_confirmed_at
      }
    })

    return new Response(
      JSON.stringify({ users: combinedUsers }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in admin-get-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})