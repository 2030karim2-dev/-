
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAudit() {
    const sessionId = 'b419e364-228d-46d2-b9f7-8eadf222a4eb'; // From the screenshot URL
    
    console.log('Fetching audit session details for:', sessionId);
    
    const { data: items, error: iError } = await supabase.from('audit_items')
        .select('*, products(name_ar, sku, part_number, brand, size, product_categories(name))')
        .eq('session_id', sessionId);
        
    if (iError) {
        console.error('Error fetching items:', iError);
        return;
    }
    
    fs.writeFileSync('/tmp/debug_audit_items.json', JSON.stringify(items, null, 2));
    console.log('Saved debug data to /tmp/debug_audit_items.json');
}

debugAudit();
