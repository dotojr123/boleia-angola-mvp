const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const projectRef = 'mvfliifsrqdswrzwtkzn';
const pat = 'sbp_d16e7dd3be8589ab36f6862c997a40e75f8a3136';

// Helper to get service key
function getServiceKey(cb) {
    const options = {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${projectRef}/api-keys`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${pat}`, 'Content-Type': 'application/json' }
    };
    https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => cb(JSON.parse(data).find(k => k.name === 'service_role').api_key));
    }).end();
}

getServiceKey((key) => {
    const supabase = createClient(`https://${projectRef}.supabase.co`, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('👀 Watching for motorista_real@demo.com to appear...');
    const interval = setInterval(async () => {
        try {
            const { data: users, error } = await supabase.auth.admin.listUsers();
            const user = users.find(u => u.email === 'motorista_real@demo.com');

            if (user) {
                // Fix Profile Role
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile && profile.role !== 'driver') {
                    console.log('🔧 Fixing role for motorista_real@demo.com to DRIVER...');
                    await supabase.from('profiles').update({ role: 'driver' }).eq('id', user.id);
                    console.log('✅ Role Fixed!');
                    clearInterval(interval);
                    process.exit(0);
                } else if (profile && profile.role === 'driver') {
                    console.log('✅ Role is already correct.');
                    clearInterval(interval);
                    process.exit(0);
                }
            }
        } catch (e) {
            console.error('Check failed:', e.message);
        }
    }, 2000);

    // Stop after 2 minutes
    setTimeout(() => { console.log('Timeout'); process.exit(0); }, 120000);
});
