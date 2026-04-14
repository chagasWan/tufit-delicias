import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqsphmjatyvicoevwdit.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxc3BobWphdHl2aWNvZXZ3ZGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjg2NDQsImV4cCI6MjA5MTc0NDY0NH0.SerFGIom2OxyU4Doh3NUgen8-x8NHUXxzBmsocSWfxQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)