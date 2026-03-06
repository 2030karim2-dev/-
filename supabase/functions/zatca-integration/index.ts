import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Using Standard Deno cors headers pattern for Supabase Functions
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { invoiceData } = await req.json()

        // 1. Validation
        if (!invoiceData || !invoiceData.id) {
            throw new Error('Valid invoiceData object with an ID is required.');
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`Submitting Invoice ${invoiceData.id} to ZATCA...`)

        // 2. Mock ZATCA Integration Process
        // In actual implementation, we'd sign XML and send to ZATCA Fatoora API
        // using credentials from Deno.env.get('ZATCA_CLIENT_ID')

        // Simulate network delay for API submission
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const mockZatcaResponse = {
            status: "REPORTED",
            clearanceStatus: "CLEARED",
            qrCodeData: `ZATCA-QR-SIMULATED-PAYLOAD-${invoiceData.id}`,
            submissionTime: new Date().toISOString()
        }

        // 3. Log the successful submission in the database
        const { error: logError } = await supabaseClient
            .from('audit_logs')
            .insert({
                action: 'ZATCA_SUBMISSION',
                table_name: 'invoices',
                record_id: invoiceData.id,
                changes: mockZatcaResponse
            })

        if (logError) {
            console.warn('Failed to insert ZATCA audit log:', logError)
        }

        return new Response(
            JSON.stringify(mockZatcaResponse),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('ZATCA Integration Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
