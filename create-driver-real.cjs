const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const projectRef = 'mvfliifsrqdswrzwtkzn';
const pat = 'sbp_d16e7dd3be8589ab36f6862c997a40e75f8a3136';

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

getServiceKey(async (key) => {
    const supabase = createClient(`https://${projectRef}.supabase.co`, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('🚀 Creating motorista_real@demo.com via Admin API...');

    // 1. Create Identity
    let { data: { user }, error } = await supabase.auth.admin.createUser({
        email: 'motorista_real@demo.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Motorista Real', type: 'DRIVER' }
    });

    if (error && error.message.includes('already')) {
        console.log('User exists, fetching...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        user = users.find(u => u.email === 'motorista_real@demo.com');
    }

    // 2. Fix Profile Role (Force Update)
    if (user) {
        console.log('👤 User created/found:', user.id);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        console.log('Current Profile Role:', profile ? profile.role : 'Does not exist');

        if (profile) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'driver', verification_status: 'verified' })
                .eq('id', user.user.id);

            if (profileError) console.error('Update Profile Error:', profileError);
            else console.log('✅ Profile role set to DRIVER');
        }
    }
});
