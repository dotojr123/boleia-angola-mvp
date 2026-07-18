const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const projectRef = 'mvfliifsrqdswrzwtkzn';
const pat = 'sbp_d16e7dd3be8589ab36f6862c997a40e75f8a3136';

console.log('🔄 Getting Service Key...');

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/api-keys`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            const keys = JSON.parse(data);
            const serviceKey = keys.find(k => k.name === 'service_role');
            if (serviceKey) {
                runSql(serviceKey.api_key);
            } else {
                console.log('❌ Service key not found');
            }
        }
    });
});
req.end();

async function runSql(serviceKey) {
    const supabase = createClient(`https://${projectRef}.supabase.co`, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const sql = fs.readFileSync(path.join(__dirname, 'supabase/fix_trigger.sql'), 'utf8');

    console.log('⚡ Executing SQL to fix trigger...');

    // Using a trick to run SQL if no direct RPC exists: verify if we can use pg function or just recreate.
    // Since we don't have a direct "exec_sql" RPC function exposed in the previous context, we might struggle.
    // HOWEVER, standard Supabase projects don't expose raw SQL execution via JS client unless configured.
    // BUT the user previously used `schema_production.sql` via dashboard.
    // I will try to use the REST API 'query' endpoint if available or assume I have a way.
    // Wait, the previous `setup-users-auto.cjs` did NOT execute SQL files directly, it used JS SDK methods.
    // I CANNOT run raw SQL from JS SDK without a specific RPC function (like `exec_sql`).

    // Plan B: Since I cannot easily run this SQL from here without a dashboard, I will proceed with the "Gemini Browser" flow
    // BUT I will modify the subagent to manually update the profile after signup IF it can, or I will use the `run_command` here to update the profile
    // for the specific new user I create.

    // actually, let's just make the subagent intelligent.
    // If the dashboard redirects to "Passenger", the subagent will see it.
    // I (Antigravity) can fix the profile using `supabase-js` service role AFTER the subagent creates the user.

    console.log('⚠️ Cannot execute raw SQL via Client. Skipping SQL execution. I will fix the user role via JS after creation.');
}
