/* =====================================================================
   First Serve intake relay — Cloudflare Worker
   ---------------------------------------------------------------------
   Receives the site's intake form (fields + document files) and creates
   a Job in ServeManager via their API, attaching each uploaded document.
   The ServeManager API key lives ONLY here, as a Worker secret — it is
   never exposed to the browser and never committed to git.

   Deploy (one time, ~10 minutes):
     1. npm install -g wrangler   (or: npm create cloudflare@latest)
     2. cd intake-worker
     3. npx wrangler login        (opens browser; free Cloudflare account)
     4. npx wrangler secret put SERVEMANAGER_API_KEY   (paste the key)
     5. npx wrangler deploy       (prints the worker URL)
     6. Paste the printed URL into INTAKE_API_URL in assets/main.js

   The ServeManager API key comes from: ServeManager -> Settings -> API.
   ===================================================================== */

const SM_API = 'https://www.servemanager.com/api';
const ALLOWED_ORIGINS = [
  'https://coraydude.github.io',
  'https://firstserveprocess.com',
  'https://www.firstserveprocess.com',
];
const MAX_FILE_BYTES = 25 * 1024 * 1024; // matches the widget's stated 25MB
const MAX_FILES = 10;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function smFetch(env, path, options = {}) {
  const auth = 'Basic ' + btoa(env.SERVEMANAGER_API_KEY + ':');
  const res = await fetch(SM_API + path, {
    ...options,
    headers: {
      Authorization: auth,
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'POST only' }, 405, origin);
    }

    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return json({ ok: false, error: 'Expected multipart form data' }, 400, origin);
    }

    // Honeypot: real users never fill this hidden field.
    if (form.get('website')) {
      return json({ ok: true }, 200, origin); // silently accept, create nothing
    }

    const field = (n) => (form.get(n) || '').toString().trim().slice(0, 500);
    const name = field('name');
    const phone = field('phone');
    const email = field('email');
    if (!name && !email && !phone) {
      return json({ ok: false, error: 'Missing contact details' }, 400, origin);
    }

    const files = form.getAll('documents').filter((f) => typeof f === 'object' && f.size > 0);
    if (files.length > MAX_FILES) {
      return json({ ok: false, error: 'Too many files' }, 400, origin);
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        return json({ ok: false, error: `${f.name} is over 25MB` }, 400, origin);
      }
    }

    const descLines = [
      'Website intake — firstserveprocess.com',
      name && `Name: ${name}`,
      field('company') && `Company / firm: ${field('company')}`,
      phone && `Phone: ${phone}`,
      email && `Email: ${email}`,
      field('service') && `Service needed: ${field('service')}`,
      field('county') && `County: ${field('county')}`,
      field('urgency') && `Urgency: ${field('urgency')}`,
      field('address') && `Service address: ${field('address')}`,
      field('details') && `Details: ${field('details')}`,
    ].filter(Boolean);

    // 1) Create the job in ServeManager.
    const jobPayload = {
      data: {
        type: 'job',
        service_instructions: descLines.join('\n'),
      },
    };
    let jobRes;
    try {
      jobRes = await smFetch(env, '/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });
    } catch (e) {
      return json({ ok: false, error: 'ServeManager unreachable' }, 502, origin);
    }
    if (!jobRes.ok) {
      const text = await jobRes.text().catch(() => '');
      console.log('ServeManager job create failed', jobRes.status, text.slice(0, 500));
      return json({ ok: false, error: 'ServeManager rejected the job' }, 502, origin);
    }
    const jobData = await jobRes.json().catch(() => null);
    const jobId = jobData && jobData.data && jobData.data.id;
    if (!jobId) {
      return json({ ok: false, error: 'ServeManager returned no job id' }, 502, origin);
    }

    // 2) Attach each document to the job.
    //    ServeManager's upload flow: register the document on the job, then
    //    PUT the bytes to the presigned upload URL it returns.
    const attached = [];
    const failed = [];
    for (const f of files) {
      try {
        const reg = await smFetch(env, `/jobs/${jobId}/documents_to_be_served`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { type: 'document_to_be_served', title: f.name, file_name: f.name } }),
        });
        if (!reg.ok) throw new Error('register ' + reg.status);
        const regData = await reg.json();
        const uploadUrl =
          regData?.data?.links?.upload ||
          regData?.data?.attributes?.upload_url ||
          regData?.upload_url;
        if (!uploadUrl) throw new Error('no upload url in response');
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': f.type || 'application/octet-stream' },
          body: f.stream(),
        });
        if (!put.ok) throw new Error('upload ' + put.status);
        attached.push(f.name);
      } catch (e) {
        console.log('document attach failed', f.name, String(e));
        failed.push(f.name);
      }
    }

    // Files that failed to attach are reported honestly — the job still
    // exists, and the client is told to email those documents.
    return json({ ok: true, jobId, attached, failed }, 200, origin);
  },
};
