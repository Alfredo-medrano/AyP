// Supabase Edge Function: process-sync
// Deno runtime

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncItem {
    tabla: string;
    operacion: 'INSERT' | 'UPDATE' | 'DELETE';
    datos: Record<string, unknown>;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const authHeader = req.headers.get('Authorization')!;

        // Create Supabase client with user's auth token
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // Get user from token
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get sync items from request
        const { items } = await req.json() as { items: SyncItem[] };
        const results: { success: boolean; id?: string; error?: string }[] = [];

        for (const item of items) {
            try {
                const { tabla, operacion, datos } = item;

                // Verify user owns the data
                if (datos.usuario_id && datos.usuario_id !== user.id) {
                    results.push({ success: false, error: 'Unauthorized' });
                    continue;
                }

                switch (operacion) {
                    case 'INSERT': {
                        const { data, error } = await supabase
                            .from(tabla)
                            .insert({ ...datos, usuario_id: user.id })
                            .select()
                            .single();
                        if (error) throw error;
                        results.push({ success: true, id: data.id });
                        break;
                    }
                    case 'UPDATE': {
                        const { id, ...rest } = datos;
                        const { error } = await supabase
                            .from(tabla)
                            .update(rest)
                            .eq('id', id)
                            .eq('usuario_id', user.id);
                        if (error) throw error;
                        results.push({ success: true, id: id as string });
                        break;
                    }
                    case 'DELETE': {
                        const { error } = await supabase
                            .from(tabla)
                            .delete()
                            .eq('id', datos.id)
                            .eq('usuario_id', user.id);
                        if (error) throw error;
                        results.push({ success: true, id: datos.id as string });
                        break;
                    }
                }
            } catch (error) {
                results.push({ success: false, error: (error as Error).message });
            }
        }

        return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
