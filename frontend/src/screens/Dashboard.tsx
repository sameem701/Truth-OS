import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building, Plus, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { CreateOrgForm } from '../components/CreateOrgForm'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [showCreate, setShowCreate] = useState(false)

  const { data: orgs, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      // Fetch orgs + member count
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id, name, org_type, created_at,
          organization_members(count)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 border-b bg-background px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Building className="h-5 w-5 text-primary" />
          <span>Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground mt-1">Manage your created organizations and their members.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> New Organization</>}
          </Button>
        </div>

        {showCreate && (
          <div className="mb-8 p-6 bg-background rounded-xl border shadow-sm">
            <CreateOrgForm onSuccess={() => setShowCreate(false)} />
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading organizations...</div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">Error loading organizations: {(error as Error).message}</div>
        ) : orgs?.length === 0 ? (
          <div className="py-24 text-center border rounded-xl bg-background shadow-sm border-dashed">
            <h3 className="text-lg font-medium">No organizations found</h3>
            <p className="text-muted-foreground mt-1 mb-4">You haven't created any organizations yet.</p>
            <Button onClick={() => setShowCreate(true)} variant="secondary">Create your first organization</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orgs?.map((org: any) => (
              <Link key={org.id} to={`/org/${org.id}`} className="block group">
                <div className="p-6 rounded-xl border bg-background shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg truncate pr-2 group-hover:text-primary transition-colors">{org.name}</h3>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {org.org_type}
                    </span>
                  </div>
                  <div className="mt-auto pt-4 border-t flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {org.organization_members[0].count} members
                    </div>
                    <div className="text-xs">
                      {new Date(org.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
