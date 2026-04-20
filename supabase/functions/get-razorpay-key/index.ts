import { corsHeaders } from '@supabase/supabase-js/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  if (!keyId) {
    return new Response(
      JSON.stringify({ error: 'RAZORPAY_KEY_ID not configured' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }

  return new Response(JSON.stringify({ keyId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
