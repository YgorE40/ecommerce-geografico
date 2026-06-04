// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('./middlewares/log');
const pool = require('./config/database');
const autenticarToken = require('./middlewares/auth');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(logger);

app.post('/cadastro', async (req, res, next) => {
    try {
        const { nome, email, senha, lat, lon } = req.body;
        if (!nome || !email || !senha || !lat || !lon) {
            return res.status(400).json({ erro: "Todos os campos (nome, email, senha, lat, lon) são obrigatórios." });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const queryTexto = `
            INSERT INTO usuarios (nome, email, senha, localizacao)
            VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
            RETURNING id, nome, email;
        `;
        const resultado = await pool.query(queryTexto, [
            nome,               // $1
            email,              // $2
            senhaCriptografada, // $3
            parseFloat(lon),    // $4
            parseFloat(lat)     // $5
        ]);
        res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!", usuario: resultado.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
        }
        next(error);
    }
});

app.post('/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
        }

        const buscarUsuario = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (buscarUsuario.rows.length === 0) {
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }

        const usuario = buscarUsuario.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            mensagem: "Login realizado com sucesso!",
            token: token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (error) {
        next(error);
    }
});

app.get('/status', (req, res) => {
    res.json({ mensagem: "API do E-commerce Geográfico rodando!" });
});

app.get('/lojas-proximas', autenticarToken, async (req, res, next) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ erro: "Forneça lat e lon na URL." });
        }

        const queryTexto = `
            SELECT id, nome, categoria,
                   ST_Y(localizacao::geometry) AS lat,
                   ST_X(localizacao::geometry) AS lon,
                   ST_DistanceSphere(localizacao, ST_MakePoint($1, $2)::geometry) AS distancia_metros
            FROM lojas
            ORDER BY distancia_metros ASC;
        `;
        const resultado = await pool.query(queryTexto, [lon, lat]);
        res.json(resultado.rows);
    } catch (error) {
        next(error);
    }
});

app.post('/pedidos', autenticarToken, async (req, res, next) => {
    try {
        const { loja_id, total } = req.body;
        const usuario_id = req.usuario.id; 

        if (!loja_id || !total) {
            return res.status(400).json({ erro: "Os campos loja_id e total são obrigatórios." });
        }

        const queryTexto = `
            INSERT INTO pedidos (usuario_id, loja_id, total)
            VALUES ($1, $2, $3)
            RETURNING id, usuario_id, loja_id, total, status, criado_em;
        `;
        
        const resultado = await pool.query(queryTexto, [usuario_id, loja_id, total]);
        res.status(201).json({
            mensagem: "Pedido realizado com sucesso!",
            pedido: resultado.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

app.get('/pedidos', autenticarToken, async (req, res, next) => {
    try {
        const usuario_id = req.usuario.id; 

        const queryTexto = `
            SELECT p.id, p.total, p.status, p.criado_em, l.nome AS nome_loja
            FROM pedidos p
            JOIN lojas l ON p.loja_id = l.id
            WHERE p.usuario_id = $1
            ORDER BY p.criado_em DESC;
        `;

        const resultado = await pool.query(queryTexto, [usuario_id]);
        res.json(resultado.rows);
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(' Erro Interno Detectado:', err.stack);
    res.status(500).json({ 
        erro: "Ocorreu um erro interno no servidor.",
        detalhes: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});