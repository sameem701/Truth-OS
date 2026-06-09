import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  
  const [email, setEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['organization_members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', id)
        .order('invited_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const inviteMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email: inviteEmail, organization_id: id })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to send invite')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_members', id] })
      setInviteSuccess('Invitation sent successfully!')
      setEmail('')
      setTimeout(() => setInviteSuccess(''), 3000)
    },
    onError: (err: any) => {
      setInviteError(err.message)
    }
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    if (!email) return
    inviteMutation.mutate(email)
  }

  if (orgLoading) return <div className="p-12 text-center text-muted-foreground">Loading organization...</div>
  if (!org) return <div className="p-12 text-center text-destructive">Organization not found.</div>

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="sticky top-0 z-10 border-b bg-background px-6 py-3">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </header>

      <main className="container mx-auto p-6 max-w-5xl mt-4 grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                {org.org_type}
              </span>
            </div>
            <p className="text-muted-foreground mt-2">Created on {new Date(org.created_at).toLocaleDateString()}</p>
            {org.specific_details && Object.keys(org.specific_details).length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-muted/50 border text-sm">
                <h4 className="font-semibold mb-2">Specific Details:</h4>
                <ul className="space-y-1">
                  {Object.entries(org.specific_details).map(([key, value]) => (
                    <li key={key}><span className="text-muted-foreground capitalize font-medium">{key}:</span> {value as string}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage who has access to this organization.</CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading members...</div>
              ) : members?.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No members found.</div>
              ) : (
                <div className="rounded-md border">
                  <div className="w-full">
                    {members?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border-b last:border-0">
                        <div>
                          <div className="font-medium text-sm">{member.email}</div>
                          <div className="text-xs text-muted-foreground capitalize">{member.member_role}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            member.member_status === 'active' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"
                          )}>
                            {member.member_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
              <CardDescription>Send email invitation.</CardDescription>
            </CardHeader>
            <form onSubmit={handleInvite}>
              <CardContent className="grid gap-4">
                {inviteError && <div className="text-sm font-medium text-destructive">{inviteError}</div>}
                {inviteSuccess && <div className="text-sm font-medium text-green-600">{inviteSuccess}</div>}
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com" 
                      required 
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
