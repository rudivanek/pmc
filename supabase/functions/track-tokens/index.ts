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
    // Create supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Parse request body
    const {
      user_id,
      operation_type,
      model,
      tokens_used,
      cost_usd
    } = await req.json()

    // Validate required fields
    if (!user_id || !operation_type || !model || !tokens_used || cost_usd === undefined) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['user_id', 'operation_type', 'model', 'tokens_used', 'cost_usd']
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validate data types
    if (typeof tokens_used !== 'number' || tokens_used <= 0) {
      return new Response(
        JSON.stringify({ error: 'tokens_used must be a positive number' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (typeof cost_usd !== 'number' || cost_usd < 0) {
      return new Response(
        JSON.stringify({ error: 'cost_usd must be a non-negative number' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Recording token usage: ${tokens_used} tokens for ${operation_type} using ${model}`)

    // Insert token usage record
    const { data, error } = await supabaseAdmin
      .from('pmc_user_tokens_used')
      .insert([
        {
          user_id,
          operation_type,
          model,
          tokens_used,
          cost_usd,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error inserting token usage:', error)
      return new Response(
        JSON.stringify({ 
          error: `Failed to record token usage: ${error.message}`,
          code: error.code
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Successfully recorded token usage:`, data?.[0])

    return new Response(
      JSON.stringify({ 
        success: true,
        id: data?.[0]?.id,
        message: 'Token usage recorded successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in track-tokens function:', error)
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