-- RLS Policies for strict multi-tenancy
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ... full policies as previously defined ... 
CREATE POLICY "Company isolation" ON agencies FOR ALL USING (company_id = get_current_company_id());
-- Add for all tables