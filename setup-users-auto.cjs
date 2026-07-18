const https = require('https');

const projectRef = 'mvfliifsrqdswrzwtkzn';
const pat = 'sbp_d16e7dd3be8589ab36f6862c997a40e75f8a3136';

console.log('🔄 Buscando credenciais de admin...');

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
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const keys = JSON.parse(data);
        const serviceKey = keys.find(k => k.name === 'service_role');
        if (serviceKey) {
            console.log('✅ Chave de Admin encontrada!');

            // Agora vamos usar essa chave para criar os usuários
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(`https://${projectRef}.supabase.co`, serviceKey.api_key, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            createUsers(supabase);
        } else {
            console.log('❌ Service role key não encontrada na resposta.');
        }
      } catch (e) {
          console.log('❌ Erro ao processar resposta:', e.message);
      }
    } else {
      console.log('❌ Erro ao buscar chaves:', res.statusCode, data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e);
});

req.end();

async function createUsers(supabase) {
    console.log('\n🚀 Iniciando criação de usuários...');

    try {
        // 1. Criar Motorista
        console.log('👨‍✈️ Criando motorista (motorista@demo.com)...');
        const { data: driverData, error: driverError } = await supabase.auth.admin.createUser({
            email: 'motorista@demo.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: { full_name: 'Carlos Motorista' }
        });

        if (driverError) {
            console.log('ℹ️ Aviso motorista:', driverError.message);
            // Se já existe, tentamos buscar o ID pelo email (não dá pra buscar direto via admin api facilmente sem listar,
            // mas vamos assumir que se deu erro é pq existe.
            // Vamos tentar rodar o SQL de setup de qualquer forma, pois ele usa o email para buscar o ID)
        } else {
            console.log('✅ Usuário Motorista criado!');
        }

        // 2. Criar Admin
        console.log('🛡️ Criando admin (admin@demo.com)...');
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: 'admin@demo.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: { full_name: 'Admin Sistema' }
        });

        if (adminError) {
            console.log('ℹ️ Aviso admin:', adminError.message);
        } else {
            console.log('✅ Usuário Admin criado!');
        }

        console.log('\n⚙️ Configurando perfis e dados no banco...');

        // Vamos usar o cliente normal para rodar o SQL via RPC ou inserção direta se possível.
        // Como não temos uma função RPC para rodar SQL arbitrário, vamos fazer updates diretos nas tabelas
        // Mas precisamos dos IDs. Vamos listar os usuários para pegar os IDs corretos.

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) throw listError;

        const driver = users.find(u => u.email === 'motorista@demo.com');
        const admin = users.find(u => u.email === 'admin@demo.com');

        if (driver) {
            console.log('🚗 Configurando perfil do Motorista...');
            await supabase.from('profiles').upsert({
                id: driver.id,
                email: 'motorista@demo.com',
                role: 'driver',
                full_name: 'Carlos Motorista',
                phone: '+244 923 456 790',
                avatar_url: 'https://ui-avatars.com/api/?name=Carlos+Motorista&background=0D8ABC&color=fff',
                verification_status: 'verified',
                license_number: 'CNH-12345-AO',
                rating: 4.8,
                reviews_count: 15
            });

            await supabase.from('vehicles').upsert({
                owner_id: driver.id,
                make: 'Toyota',
                model: 'Hiace',
                year: 2019,
                license_plate: 'LD-22-44-AB',
                color: 'Azul e Branco',
                seats: 14,
                is_verified: true
            }, { onConflict: 'owner_id, license_plate' }); // Ajuste conforme constraint real, ou ignorar erro

             // Criar caronas
            const today = new Date();
            const date1 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Verificar se já tem caronas para não duplicar excessivamente
            const { data: rides } = await supabase.from('rides').select('id').eq('driver_id', driver.id);

            if (!rides || rides.length === 0) {
                 await supabase.from('rides').insert([
                    {
                        driver_id: driver.id,
                        origin: 'Luanda',
                        destination: 'Benguela',
                        date: date1,
                        time: '08:00',
                        price: 8000,
                        available_seats: 12,
                        total_seats: 14,
                        status: 'active'
                    },
                    {
                        driver_id: driver.id,
                        origin: 'Luanda',
                        destination: 'Huambo',
                        date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        time: '06:30',
                        price: 12000,
                        available_seats: 10,
                        total_seats: 14,
                        status: 'active'
                    }
                ]);
                console.log('✅ Caronas criadas!');
            }
        }

        if (admin) {
            console.log('🛡️ Configurando perfil do Admin...');
            await supabase.from('profiles').upsert({
                id: admin.id,
                email: 'admin@demo.com',
                role: 'admin',
                full_name: 'Admin Sistema',
                phone: '+244 923 456 791',
                avatar_url: 'https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff',
                verification_status: 'verified'
            });
        }

        console.log('\n🎉 TUDO PRONTO! Pode testar o login.');

    } catch (err) {
        console.error('❌ Erro no processo:', err);
    }
}
