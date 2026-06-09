import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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
    // Initialize Supabase client with the caller's JWT to respect RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the user is authenticated
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Parse the request body
    const { email, organization_id } = await req.json()

    if (!email || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Email and organization_id are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Verify the caller is the owner (admin) of the organization
    // Because we use the user's Supabase client, RLS already restricts them 
    // to only fetching orgs they have access to. But we double check the 'created_by' field.
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, created_by')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found or you do not have access' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    if (org.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the organization admin can invite members' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Check if the user is already invited or active in this organization.
    // Our RLS allows viewing members of an org if the caller is the org's creator.
    const { data: existingMember } = await supabaseClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('email', email)
      .single()

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'User has already been invited to this organization' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create the invitation
    const { data: newMember, error: inviteError } = await supabaseClient
      .from('organization_members')
      .insert([
        {
          organization_id,
          email,
          member_status: 'invited',
          member_role: 'member',
        },
      ])
      .select()
      .single()

    if (inviteError) throw inviteError

    return new Response(
      JSON.stringify({ message: 'Invitation sent successfully', member: newMember }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
