const { Pool } = require('pg');
const pool = new Pool({ user: 'boleia_user', host: 'localhost', database: 'boleia_angola', password: 'boleia_password', port: 5432 });

async function fixDriver() {
    try {
        const driver = await pool.query("SELECT id FROM profiles WHERE email = 'motorista@demo.com'");
        if (driver.rows.length === 0) return console.log('Motorista motorista@demo.com não encontrado');
        const driverId = driver.rows[0].id;

        console.log('--- VALIDANDO FLUXO MOTORISTA ---');

        // 1. Garantir Veículo
        const vRes = await pool.query("INSERT INTO vehicles (owner_id, make, model, year, color, plate) VALUES ($1, 'Toyota', 'Land Cruiser', 2022, 'Branco', 'LD-00-01') ON CONFLICT DO NOTHING RETURNING id", [driverId]);
        const vehicleId = vRes.rows.length > 0 ? vRes.rows[0].id : (await pool.query("SELECT id FROM vehicles WHERE owner_id = $1", [driverId])).rows[0].id;
        console.log('✅ Veículo Validado:', vehicleId);

        // 2. Criar Carona Teste
        await pool.query("INSERT INTO rides (driver_id, vehicle_id, origin, destination, departure_time, price_per_seat, total_seats, available_seats, status) VALUES ($1, $2, 'Luanda', 'Namibe', NOW() + interval '2 days', 7500, 4, 4, 'scheduled')", [driverId, vehicleId]);
        console.log('✅ Criar Viagem: OK');

    } catch (e) { console.error('Erro no fluxo motorista:', e.message); }
    finally { await pool.end(); }
}

fixDriver();

