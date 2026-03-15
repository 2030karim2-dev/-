
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env manually since we're not in the vite context
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

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
    
    const output = JSON.stringify(items.slice(0, 5), null, 2);
    console.log('Sample data (first 5 items):');
    console.log(output);
    
    fs.writeFileSync('c:/Users/User/OneDrive/Desktop/alzhra/tmp/debug_audit_items.json', output);
    console.log('Saved debug data to c:/Users/User/OneDrive/Desktop/alzhra/tmp/debug_audit_items.json');
}

debugAudit();
