const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configs from setup-users-auto.cjs
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
                    const supabase = createClient(`https://${projectRef}.supabase.co`, serviceKey.api_key, {
                        auth: { autoRefreshToken: false, persistSession: false }
                    });
                    seedRides(supabase);
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

async function seedRides(supabase) {
    console.log('\n🚀 Iniciando criação de viagens de teste...');

    try {
        // 1. Buscar motorista
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const driver = users.find(u => u.email === 'motorista@demo.com');

        if (!driver) {
            console.error('❌ Erro: Usuário motorista@demo.com não encontrado. Rode o setup inicial primeiro.');
            return;
        }

        console.log(`👨‍✈️ Motorista encontrado: ${driver.id}`);

        // 2. Buscar veículo do motorista
        const { data: vehicles, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id')
            .eq('owner_id', driver.id);

        if (vehicleError) throw vehicleError;

        let vehicleId = null;
        if (vehicles && vehicles.length > 0) {
            vehicleId = vehicles[0].id;
            console.log(`🚗 Veículo encontrado: ${vehicleId}`);
        } else {
            console.log('⚠️ Nenhum veículo encontrado. Criando um...');
            const { data: newVehicle, error: createVehicleError } = await supabase
                .from('vehicles')
                .insert({
                    owner_id: driver.id,
                    make: 'Toyota',
                    model: 'Hiace',
                    year: 2020,
                    plate: 'LD-88-99-XX',
                    seats_capacity: 14,
                    color: 'Branco',
                    is_active: true
                })
                .select()
                .single();

            if (createVehicleError) throw createVehicleError;
            vehicleId = newVehicle.id;
            console.log(`✅ Veículo criado: ${vehicleId}`);
        }

        // 3. Gerar Viagens
        const rides = [];
        const cities = ['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Lobito', 'Namibe', 'Malanje'];

        // Helper para data relativa
        const addDays = (days) => {
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date;
        };

        // Helper para item randomico
        const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // A. Viagens Futuras (Agendadas)
        for (let i = 1; i <= 5; i++) {
            const origin = 'Luanda';
            const destination = randomItem(cities.filter(c => c !== origin));
            rides.push({
                driver_id: driver.id,
                vehicle_id: vehicleId,
                origin: origin,
                destination: destination,
                departure_time: addDays(i).toISOString(), // Futuro
                estimated_duration: `${3 + Math.floor(Math.random() * 5)} hours`,
                price_per_seat: 5000 + Math.floor(Math.random() * 10) * 500,
                total_seats: 14,
                available_seats: 10 + Math.floor(Math.random() * 4),
                status: 'scheduled',
                description: `Viagem regular para ${destination}. Saída pontual.`,
                preferences: { smoking: false, pets: false, music: true }
            });
        }

        // B. Viagens Hoje (Ativas/Agendadas)
        rides.push({
            driver_id: driver.id,
            vehicle_id: vehicleId,
            origin: 'Benguela',
            destination: 'Luanda',
            departure_time: new Date(new Date().getTime() + 1000 * 60 * 60 * 2).toISOString(), // Daqui a 2 horas
            estimated_duration: '6 hours',
            price_per_seat: 8000,
            total_seats: 14,
            available_seats: 14,
            status: 'scheduled',
            description: 'Voltando para capital. Ar condicionado ligado.',
            preferences: { smoking: false, pets: false, music: true }
        });

        // C. Viagens Passadas (Completadas)
        for (let i = 1; i <= 5; i++) {
            const origin = randomItem(cities);
            const destination = randomItem(cities.filter(c => c !== origin));
            rides.push({
                driver_id: driver.id,
                vehicle_id: vehicleId,
                origin: origin,
                destination: destination,
                departure_time: addDays(-i * 2).toISOString(), // Passado
                estimated_duration: '5 hours',
                price_per_seat: 6000,
                total_seats: 14,
                available_seats: 0,
                status: 'completed',
                description: 'Viagem realizada com sucesso.',
                preferences: { smoking: false, pets: false, music: true }
            });
        }

        // D. Viagem Cancelada
        rides.push({
            driver_id: driver.id,
            vehicle_id: vehicleId,
            origin: 'Luanda',
            destination: 'Malanje',
            departure_time: addDays(-1).toISOString(),
            estimated_duration: '4 hours',
            price_per_seat: 7000,
            total_seats: 14,
            available_seats: 14,
            status: 'cancelled',
            description: 'Cancelada por problemas mecânicos.',
            preferences: { smoking: false, pets: false, music: true }
        });

        console.log(`📦 Preparando para inserir ${rides.length} viagens...`);

        const { error: insertError } = await supabase.from('rides').insert(rides);

        if (insertError) {
            console.error('❌ Erro ao inserir viagens:', insertError);
        } else {
            console.log('✅ 12 Viagens de teste criadas com sucesso!');
            console.log('   - 5 Futuras');
            console.log('   - 1 Hoje');
            console.log('   - 5 Completadas');
            console.log('   - 1 Cancelada');
        }

    } catch (err) {
        console.error('❌ Erro no processo:', err);
    }
}
