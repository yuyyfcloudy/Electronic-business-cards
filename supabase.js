import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.0/+esm'

const supabaseUrl = "https://qzxzsnxrjppfjnxxmxkt.supabase.co"
const supabaseKey = "sb_publishable_Ik24Q_jg-mxVutTdXqjbbw_Kn0xohJu"

export const supabase = createClient(supabaseUrl, supabaseKey)