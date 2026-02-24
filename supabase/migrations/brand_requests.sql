-- Brand Requests table — stores RDV/booking requests from brands
CREATE TABLE IF NOT EXISTS brand_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'meeting_scheduled', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE brand_requests ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on brand_requests"
    ON brand_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Anonymous/authenticated users can insert (from the landing page form)
CREATE POLICY "Anyone can insert brand_requests"
    ON brand_requests FOR INSERT
    WITH CHECK (true);

-- Index for admin listing
CREATE INDEX idx_brand_requests_status ON brand_requests(status);
CREATE INDEX idx_brand_requests_created ON brand_requests(created_at DESC);
