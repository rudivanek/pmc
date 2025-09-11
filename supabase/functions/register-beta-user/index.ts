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
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const { name, email } = await req.json()

    // Validate required fields
    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email and name are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`Starting beta registration process for: ${email}`)
    // Check if user already exists in beta register table
    const { data: existingBetaUser, error: betaCheckError } = await supabaseAdmin
      .from('pmc_beta_register')
      .select('*')
      .eq('email', email)
      .single()

    if (betaCheckError && betaCheckError.code !== 'PGRST116') {
      console.error('Error checking existing beta user:', betaCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing registration' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Check if user already exists in auth.users
    const { data: { users }, error: authListError } = await supabaseAdmin.auth.admin.listUsers()
    if (authListError) {
      console.error('Error checking existing auth users:', authListError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing authentication users' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const existingAuthUser = users.find(u => u.email === email)
    if (existingAuthUser) {
      console.log(`User ${email} already exists in auth.users with ID: ${existingAuthUser.id}`)
      return new Response(
        JSON.stringify({ error: 'This email is already registered for beta access.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }
    // If user doesn't exist in beta register, add them first
    if (!existingBetaUser) {
      console.log(`Adding ${email} to pmc_beta_register`)
      const { error: betaInsertError } = await supabaseAdmin
        .from('pmc_beta_register')
        .insert([{ name, email }])

      if (betaInsertError) {
        console.error('Error inserting into pmc_beta_register:', betaInsertError)
        return new Response(
          JSON.stringify({ error: `Failed to register for beta: ${betaInsertError.message}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
    } else {
      console.log(`User ${email} already exists in pmc_beta_register`)
    }

    // Get today's date and date + 30 days
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const untilDate = thirtyDaysLater.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Creating auth user for: ${email}`)
    // 1. Create user in auth.users table with fixed password "letmein"
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'letmein', // Fixed password as requested
      user_metadata: {
        name: name
      },
      email_confirm: true // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error('Error creating user in auth.users:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create user in authentication system: ${authError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'User creation succeeded but no user data was returned' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log(`Auth user created successfully with ID: ${authUser.user.id}`)

    // Check if this ID already exists in pmc_users (debugging)
    // 2. Insert into pmc_users table
    const { error: pmcUserError } = await supabaseAdmin
      .from('pmc_users')
     .upsert([
        {
          id: authUser.user.id,
          email: email,
          name: name,
          start_date: startDate,
          until_date: untilDate,
          tokens_allowed: 2000000, // Fixed tokens as requested
          created_at: new Date().toISOString()
        }
     ], { onConflict: 'id' })

    if (pmcUserError) {
      console.error('Error inserting user into pmc_users:', pmcUserError)
      // Attempt to delete the auth user if pmc_users insertion failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('Cleaned up auth user after pmc_users insertion failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${pmcUserError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // 3. Update pmc_beta_register table to mark welcome_mail_sent
    const { error: betaRegisterUpdateError } = await supabaseAdmin
      .from('pmc_beta_register')
      .update({ welcome_mail_sent: true })
      .eq('email', email)

    if (betaRegisterUpdateError) {
      console.error('Error updating pmc_beta_register:', betaRegisterUpdateError)
      // Log error but don't fail the main response as user is already created
    }

    // 4. Send welcome email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not set. Skipping welcome email.');
    } else {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'PimpMyCopy <onboarding@pimpmycopy.xyz>', // Replace with your verified Resend sender
            to: [email],
            subject: 'Welcome to PimpMyCopy Beta!',
            html: `
              <p>Hello ${name},</p>
              <p>Welcome to the PimpMyCopy Beta program! We're excited to have you on board.</p>
              <p>Your account has been created. You can log in using the following credentials:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> letmein</p>
              <p>We recommend changing your password after your first login for security reasons.</p>
              <p>You have been granted 2,000,000 tokens to start generating amazing copy. Your access is valid for 30 days from today.</p>
              <p>Get started by logging in here: <a href="https://pimpmycopy.xyz/login">https://pimpmycopy.xyz/login</a></p>
              <p>If you have any questions or feedback, please don't hesitate to reach out.</p>
              <p>Happy copywriting!</p>
              <p>The PimpMyCopy Team</p>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const resendError = await resendResponse.json();
          console.error('Error sending welcome email:', resendError);
        } else {
          console.log('Welcome email sent successfully.');
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Beta registration successful. User created and welcome email sent.',
        user_id: authUser.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in register-beta-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})