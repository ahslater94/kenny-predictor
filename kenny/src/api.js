const SUPABASE_URL  = 'https://emekxcnayaqctxlapmnf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZWt4Y25heWFxY3R4bGFwbW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDg2NDYsImV4cCI6MjA5NjgyNDY0Nn0.Clz12mOfYn9Z_6J44tK3cFO4EdtKbkIr0MyHKPs0CXg';

const headers = {
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  'Content-Type': 'application/json',
};

export const db = {
  async get(table, params = '') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async upsert(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
