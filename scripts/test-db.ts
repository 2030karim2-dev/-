import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzthamxjxnxzzpswllid.supabase.co';
const supabaseKey = 'sb_publishable_vl-3kl-XyDii6055ZIWfSA_gzqDcqX-';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Registering test user...');
  const testEmail = `test.agent.user.${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const testPass = 'password123!';
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPass,
    options: {
      data: {
        full_name: 'Test Agent User',
        company_name: 'Test ERP Company',
      }
    }
  });

  if (signUpErr) {
    console.error('Sign up error:', signUpErr);
    return;
  }
  
  const userId = signUpData.user?.id;
  console.log(`Registered user ID: ${userId}`);

  // Fetch profile via RPC
  console.log('Fetching user profile...');
  const { data: profile, error: profErr } = await supabase.rpc('get_user_profile', {
    p_user_id: userId
  });

  if (profErr) {
    console.error('Error fetching profile:', profErr);
    return;
  }
  console.log('Profile:', profile);

  const firstCompany = Array.isArray(profile?.companies) && profile.companies.length > 0 ? profile.companies[0] : null;
  const companyId = firstCompany?.company_id;
  if (!companyId) {
    console.error('Company ID not found in profile.');
    return;
  }
  console.log(`Using company_id: ${companyId}`);

  // Insert a test product to make sure there's data to test
  console.log('Inserting test product...');
  const { data: product, error: insErr } = await supabase
    .from('products')
    .insert({
      company_id: companyId,
      name_ar: 'منتج تجريبي 1',
      sku: `SKU-${Date.now()}`,
      sale_price: 1500,
      purchase_price: 1000,
      min_stock_level: 5,
      unit: 'piece',
      status: 'active'
    })
    .select()
    .single();

  if (insErr) {
    console.error('Error inserting product:', insErr);
  } else {
    console.log('Inserted product:', product);
    
    // Initialize stock for this product in a default warehouse
    console.log('Creating warehouse...');
    const { data: warehouse, error: whErr } = await supabase
      .from('warehouses')
      .insert({
        company_id: companyId,
        name_ar: 'المستودع الرئيسي',
        location: 'صنعاء',
        status: 'active'
      })
      .select()
      .single();
      
    if (whErr) {
      console.error('Error creating warehouse:', whErr);
    } else {
      console.log('Created warehouse:', warehouse);
      
      console.log('Initializing stock...');
      const { error: stockErr } = await supabase
        .from('product_stock')
        .insert({
          company_id: companyId,
          product_id: product.id,
          warehouse_id: warehouse.id,
          quantity: 25
        });
        
      if (stockErr) {
        console.error('Error initializing stock:', stockErr);
      } else {
        console.log('Initialized stock with 25 units');
      }
    }
  }

  console.log('Fetching products directly...');
  const { data: products, error: getProdErr } = await supabase
    .from('products')
    .select('id, name_ar, sku, status, company_id')
    .eq('company_id', companyId);

  if (getProdErr) {
    console.error('Error fetching products:', getProdErr);
  } else {
    console.log(`Found ${products?.length || 0} products:`, products);
  }

  console.log('Fetching products with stock relation...');
  const { data: productsWithStock, error: pwsErr } = await supabase
    .from('products')
    .select(`
      id,
      name_ar,
      sku,
      company_id,
      stock:product_stock(
        quantity,
        warehouse_id
      )
    `)
    .eq('company_id', companyId);

  if (pwsErr) {
    console.error('Error fetching products with stock:', pwsErr);
  } else {
    console.log('Products with stock relation:', JSON.stringify(productsWithStock, null, 2));
  }

  console.log('Calling search_inventory_paginated RPC...');
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('search_inventory_paginated', {
    p_company_id: companyId,
    p_term: '',
    p_limit: 5,
    p_offset: 0,
    p_sort_key: 'updated_at',
    p_sort_dir: 'desc'
  });

  if (rpcErr) {
    console.error('Error calling search_inventory_paginated RPC:', rpcErr);
  } else {
    console.log('RPC search_inventory_paginated results:', JSON.stringify(rpcRes, null, 2));
  }
}

run().catch(console.error);
