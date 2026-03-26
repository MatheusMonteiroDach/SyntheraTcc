const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const db = new sqlite3.Database('./synthera.db', () => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT UNIQUE, senha_hash TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS disc_tests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, perfil_predominante TEXT, pontuacao_d INTEGER, pontuacao_i INTEGER, pontuacao_s INTEGER, pontuacao_c INTEGER, answers_json TEXT)`);
});

app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    db.run(`INSERT INTO users (nome, email, senha_hash) VALUES (?, ?, ?)`, [nome, email, hash], function(err) {
        if (err) return res.status(400).json({ erro: 'E-mail já existe' });
        res.status(201).json({ userId: this.lastID, nome });
    });
});

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (user && await bcrypt.compare(senha, user.senha_hash)) {
            res.json({ userId: user.id, nome: user.nome });
        } else res.status(401).json({ erro: 'Credenciais inválidas' });
    });
});

app.post('/api/testes', (req, res) => {
    const { userId, perfilPredominante, pontuacao, respostasGlobais } = req.body;
    db.run(`INSERT INTO disc_tests (user_id, perfil_predominante, pontuacao_d, pontuacao_i, pontuacao_s, pontuacao_c, answers_json) VALUES (?,?,?,?,?,?,?)`, 
    [userId, perfilPredominante, pontuacao.D, pontuacao.I, pontuacao.S, pontuacao.C, JSON.stringify(respostasGlobais)], () => res.sendStatus(201));
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.listen(PORT, () => console.log(`🚀 Synthera rodando em http://localhost:${PORT}`));