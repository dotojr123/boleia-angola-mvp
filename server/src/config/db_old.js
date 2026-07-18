const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('DB config env:', {DB_USER: process.env.DB_USER, DB_HOST: process.env.DB_HOST, DB_NAME: process.env.DB_NAME, DB_PASSWORD: process.env.DB_PASSWORD, DB_PORT: process.env.DB_PORT});
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};

