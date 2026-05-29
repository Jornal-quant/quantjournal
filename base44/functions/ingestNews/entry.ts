import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Allow CORS for external integrations
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { source, title, content, url } = body;

    if (!title) {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    const record = await base44.asServiceRole.entities.RawNewsFeed.create({
      source_name: source || 'Externo',
      source_url: url || '',
      raw_title: title,
      raw_content: content || '',
      fetched_at: new Date().toISOString(),
      processed: false,
    });

    return Response.json(
      { success: true, id: record.id },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});