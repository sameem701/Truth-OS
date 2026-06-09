import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

const orgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  org_type: z.enum(['School', 'Nonprofit', 'Business']),
  specific_details: z.any().optional()
}).superRefine((data, ctx) => {
  if (data.org_type === 'School' && !data.specific_details?.districtName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'District Name is required for Schools',
      path: ['specific_details', 'districtName'],
    });
  }
  if (data.org_type === 'Nonprofit' && !data.specific_details?.cause) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cause is required for Nonprofits',
      path: ['specific_details', 'cause'],
    });
  }
  if (data.org_type === 'Business' && !data.specific_details?.industry) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Industry is required for Businesses',
      path: ['specific_details', 'industry'],
    });
  }
});

type OrgFormValues = z.infer<typeof orgSchema>

export function CreateOrgForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      org_type: 'Business',
      specific_details: {}
    }
  })

  const selectedType = watch('org_type')

  const createOrgMutation = useMutation({
    mutationFn: async (data: OrgFormValues) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert([{
          name: data.name,
          org_type: data.org_type,
          specific_details: data.specific_details,
          created_by: userData.user.id
        }])
        .select()
        .single()
      
      if (error) throw error
      return newOrg
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      onSuccess()
    },
    onError: (error: any) => {
      setServerError(error.message)
    }
  })

  const onSubmit = (data: OrgFormValues) => {
    createOrgMutation.mutate(data)
  }

  return (
    <Card className="w-full max-w-lg border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>Add a new organization to manage.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4 px-0">
          {serverError && <div className="text-sm font-medium text-destructive">{serverError}</div>}
          
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input id="name" {...register('name')} placeholder="Acme Corp" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="org_type">Organization Type</Label>
            <Select id="org_type" {...register('org_type')}>
              <option value="Business">Business</option>
              <option value="School">School</option>
              <option value="Nonprofit">Nonprofit</option>
            </Select>
            {errors.org_type && <p className="text-xs text-destructive">{errors.org_type.message}</p>}
          </div>

          {selectedType === 'School' && (
            <div className="grid gap-2">
              <Label htmlFor="districtName">District Name</Label>
              <Input id="districtName" {...register('specific_details.districtName')} placeholder="Springfield ISD" />
              {errors.specific_details && (errors.specific_details as any).districtName && (
                <p className="text-xs text-destructive">{(errors.specific_details as any).districtName.message}</p>
              )}
            </div>
          )}

          {selectedType === 'Nonprofit' && (
            <div className="grid gap-2">
              <Label htmlFor="cause">Cause</Label>
              <Input id="cause" {...register('specific_details.cause')} placeholder="Environmental Protection" />
              {errors.specific_details && (errors.specific_details as any).cause && (
                <p className="text-xs text-destructive">{(errors.specific_details as any).cause.message}</p>
              )}
            </div>
          )}

          {selectedType === 'Business' && (
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Select id="industry" {...register('specific_details.industry')}>
                <option value="">Select an industry...</option>
                <option value="Technology">Technology</option>
                <option value="Retail">Retail</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Real Estate">Real Estate</option>
              </Select>
              {errors.specific_details && (errors.specific_details as any).industry && (
                <p className="text-xs text-destructive">{(errors.specific_details as any).industry.message}</p>
              )}
            </div>
          )}

        </CardContent>
        <CardFooter className="px-0 pt-4">
          <Button type="submit" disabled={createOrgMutation.isPending} className="w-full">
            {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
