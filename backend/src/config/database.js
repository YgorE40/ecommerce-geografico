const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS, 
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});


pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('X Erro ao conectar no PostgreSQL/PostGIS:', err.message);
    } else {
        console.log('V Conexão com o PostGIS estabelecida com sucesso!');
    }
});

module.exports = pool;