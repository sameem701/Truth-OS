-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    org_type TEXT NOT NULL CHECK (org_type IN ('School', 'Nonprofit', 'Business')),
    specific_details JSONB, -- Stores type-specific conditional fields (e.g., {"districtName": "ABC"} for School)
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable until accepted
    email TEXT NOT NULL,
    member_status TEXT NOT NULL DEFAULT 'invited' CHECK (member_status IN ('invited', 'active')),
    member_role TEXT NOT NULL DEFAULT 'member' CHECK (member_role IN ('admin', 'member')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    UNIQUE(organization_id, email) -- Prevent duplicate invitations to the same email within the same org
);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- RLS Policies for organizations
-- --------------------------------------------------------

-- Can only create an organisation where created_by = that same person's user id
CREATE POLICY "Users can create their own organizations"
ON organizations FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own organizations"
ON organizations FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own organizations"
ON organizations FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own organizations"
ON organizations FOR DELETE
USING (auth.uid() = created_by);

-- --------------------------------------------------------
-- RLS Policies for organization_members
-- --------------------------------------------------------

CREATE POLICY "Users can view members of their own organizations"
ON organization_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE organizations.id = organization_members.organization_id 
        AND organizations.created_by = auth.uid()
    )
);

CREATE POLICY "Users can insert members into their own organizations"
ON organization_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE organizations.id = organization_members.organization_id 
        AND organizations.created_by = auth.uid()
    )
);

CREATE POLICY "Users can update members in their own organizations"
ON organization_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE organizations.id = organization_members.organization_id 
        AND organizations.created_by = auth.uid()
    )
);

CREATE POLICY "Users can delete members from their own organizations"
ON organization_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE organizations.id = organization_members.organization_id 
        AND organizations.created_by = auth.uid()
    )
);
