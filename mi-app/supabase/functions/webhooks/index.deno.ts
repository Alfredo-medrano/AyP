// Supabase Edge Function: webhooks
// Deno runtime - Generic webhook handler

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
    type: string;
    table: string;
    record: Record<string, unknown>;
    old_record?: Record<string, unknown>;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const payload: WebhookPayload = await req.json();
        const { type, table, record } = payload;

        console.log(`Webhook received: ${type} on ${table}`, record);

        // Handle different webhook types
        switch (table) {
            case 'gastos':
                await handleGastosWebhook(supabase, type, record);
                break;
            case 'perfiles':
                await handlePerfilesWebhook(supabase, type, record);
                break;
            default:
                console.log(`No handler for table: ${table}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

async function handleGastosWebhook(
    supabase: ReturnType<typeof createClient>,
    type: string,
    record: Record<string, unknown>
) {
    // Example: Send notification on large expenses
    if (type === 'INSERT' && (record.monto as number) > 1000) {
        console.log(`Large expense detected: ${record.monto}`);
        // Could integrate with email, push notifications, etc.
    }
}

async function handlePerfilesWebhook(
    supabase: ReturnType<typeof createClient>,
    type: string,
    record: Record<string, unknown>
) {
    // Example: Log profile updates
    if (type === 'UPDATE') {
        console.log(`Profile updated: ${record.id}`);
    }
}
