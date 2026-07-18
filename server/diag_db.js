const { Pool } = require('pg');
const pool = new Pool({
    user: 'boleia_user',
    host: 'localhost',
    database: 'boleia_angola',
    password: 'boleia_password',
    port: 5432,
});

async function runDiag() {
    console.log('--- RELATÓRIO TÉCNICO BOLEIA ANGOLA ---');
    try {
        const users = await pool.query('SELECT email, role FROM profiles ORDER BY created_at DESC LIMIT 10');
        console.log('\nÚltimos Usuários Registrados:');
        console.table(users.rows);

        const rides = await pool.query('SELECT origin, destination, departure_time, available_seats FROM rides LIMIT 5');
        console.log('\nÚltimas Caronas Criadas:');
        console.table(rides.rows);

        const logs = await pool.query('SELECT id, passenger_id, status FROM bookings LIMIT 5');
        console.log('\nÚltimas Reservas (Bookings):');
        console.table(logs.rows);

    } catch (err) {
        console.error('Erro no Diagnóstico:', err.message);
    } finally {
        await pool.end();
    }
}

runDiag();

