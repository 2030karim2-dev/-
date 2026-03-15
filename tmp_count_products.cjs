
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zzthamxjxnxzzpswllid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dGhhbXhqeG54enpwc3dsbGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MjgsImV4cCI6MjA4NjgyNDQyOH0._-66pjzKBjUymrZrfeZSkC9Zt60Gdbgp8a7bTfzMwlw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function countProducts() {
    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

    if (error) {
        console.error('Error fetching product count:', error);
        process.exit(1);
    }

    console.log(`TOTAL_PRODUCTS_COUNT:${count}`);
}

countProducts();
