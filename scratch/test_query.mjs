
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zzthamxjxnxzzpswllid.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dGhhbXhqeG54enpwc3dsbGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MjgsImV4cCI6MjA4NjgyNDQyOH0._-66pjzKBjUymrZrfeZSkC9Zt60Gdbgp8a7bTfzMwlw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testQuery() {
  console.log('Testing products query...');
  
  // Test 1: Simple query
  const t1 = await supabase.from('products').select('id, name_ar').limit(1);
  console.log('Test 1 (Basic):', t1.error ? `FAILED: ${t1.error.message}` : 'SUCCESS');

  // Test 2: Categories join
  const t2 = await supabase.from('products').select('id, category:product_categories(id, name)').limit(1);
  console.log('Test 2 (Categories):', t2.error ? `FAILED: ${t2.error.message}` : 'SUCCESS');

  // Test 3: Stock join
  const t3 = await supabase.from('products').select('id, stock:product_stock(quantity, warehouse_id)').limit(1);
  console.log('Test 3 (Stock):', t3.error ? `FAILED: ${t3.error.message}` : 'SUCCESS');

  // Test 4: Stock + Warehouses join
  const t4 = await supabase.from('products').select('id, stock:product_stock(quantity, warehouse_id, warehouses(name_ar))').limit(1);
  console.log('Test 4 (Stock+Warehouses):', t4.error ? `FAILED: ${t4.error.message}` : 'SUCCESS');

  // Test 5: UoMs join
  const t5 = await supabase.from('products').select('id, uoms:product_uoms(id, uom_name, conversion_factor)').limit(1);
  console.log('Test 5 (UoMs):', t5.error ? `FAILED: ${t5.error.message}` : 'SUCCESS');
}

testQuery();
