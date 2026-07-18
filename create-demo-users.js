// Script para criar usuários de demonstração no Supabase
// Execute com: node create-demo-users.js

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://mvfliifsrqdswrzwtkzn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'SEU_SERVICE_ROLE_KEY_AQUI'; // ⚠️ VOCÊ PRECISA PEGAR ESTA CHAVE NO DASHBOARD

// Criar cliente com service_role (tem permissões de admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUsers() {
  console.log('🚀 Criando usuários de demonstração...\n');

  try {
    // 1. Criar Motorista
    console.log('👨‍✈️ Criando motorista...');
    const { data: driverData, error: driverError } = await supabase.auth.admin.createUser({
      email: 'motorista@demo.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Carlos Motorista',
        phone: '+244 923 456 790'
      }
    });

    if (driverError) {
      console.error('❌ Erro ao criar motorista:', driverError.message);
    } else {
      console.log('✅ Motorista criado:', driverData.user.email);

      // Configurar perfil do motorista
      await supabase
        .from('profiles')
        .update({
          role: 'driver',
          full_name: 'Carlos Motorista',
          phone: '+244 923 456 790',
          avatar_url: 'https://ui-avatars.com/api/?name=Carlos+Motorista&background=0D8ABC&color=fff',
          verification_status: 'verified',
          license_number: 'CNH-12345-AO',
          rating: 4.8,
          reviews_count: 15
        })
        .eq('id', driverData.user.id);

      // Criar veículo
      await supabase
        .from('vehicles')
        .insert({
          owner_id: driverData.user.id,
          make: 'Toyota',
          model: 'Hiace',
          year: 2019,
          license_plate: 'LD-22-44-AB',
          color: 'Azul e Branco',
          seats: 14,
          is_verified: true
        });

      // Criar caronas de exemplo
      const today = new Date();
      await supabase
        .from('rides')
        .insert([
          {
            driver_id: driverData.user.id,
            origin: 'Luanda',
            destination: 'Benguela',
            date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '08:00',
            price: 8000,
            available_seats: 12,
            total_seats: 14,
            status: 'active'
          },
          {
            driver_id: driverData.user.id,
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

      console.log('✅ Perfil, veículo e caronas do motorista configurados!');
    }

    // 2. Criar Admin
    console.log('\n🛡️ Criando admin...');
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@demo.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin Sistema',
        phone: '+244 923 456 791'
      }
    });

    if (adminError) {
      console.error('❌ Erro ao criar admin:', adminError.message);
    } else {
      console.log('✅ Admin criado:', adminData.user.email);

      // Configurar perfil do admin
      await supabase
        .from('profiles')
        .update({
          role: 'admin',
          full_name: 'Admin Sistema',
          phone: '+244 923 456 791',
          avatar_url: 'https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff',
          verification_status: 'verified'
        })
        .eq('id', adminData.user.id);

      console.log('✅ Perfil do admin configurado!');
    }

    console.log('\n🎉 Todos os usuários foram criados com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log('   🚘 Motorista: motorista@demo.com / password123');
    console.log('   🛡️ Admin: admin@demo.com / password123');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
createDemoUsers();
