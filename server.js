const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./database.db');

// Inicialização do Banco com Suporte a Níveis de Acesso
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        senha_hash TEXT,
        tipo TEXT DEFAULT 'aluno' -- 'aluno' ou 'gestor'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS disc_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        perfil_predominante TEXT,
        d_score INTEGER, i_score INTEGER, s_score INTEGER, c_score INTEGER,
        respostas_globais TEXT,
        data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // AUTO-CREATE ADMIN: dachmatheus@gmail.com | 123456
    const adminEmail = 'dachmatheus@gmail.com';
    db.get("SELECT id FROM users WHERE email = ?", [adminEmail], (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('123456', 10);
            db.run("INSERT INTO users (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)", 
            ['Matheus Admin', adminEmail, hash, 'gestor']);
            console.log("-> Admin configurado com sucesso!");
        }
    });
});

// LOGIN COM REDIRECIONAMENTO POR TIPO
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }
        res.json({ userId: user.id, nome: user.nome, tipo: user.tipo });
    });
});

// CADASTRO DE ALUNOS
app.post('/api/register', (req, res) => {
    const { nome, email, senha } = req.body;
    const hash = bcrypt.hashSync(senha, 10);
    db.run("INSERT INTO users (nome, email, senha_hash) VALUES (?, ?, ?)", [nome, email, hash], function(err) {
        if (err) return res.status(400).json({ erro: "E-mail já cadastrado." });
        res.json({ userId: this.lastID, nome, tipo: 'aluno' });
    });
});

// SALVAR TESTE DISC
app.post('/api/testes', (req, res) => {
    const { userId, perfilPredominante, pontuacao, respostasGlobais } = req.body;
    db.run(`INSERT INTO disc_tests (user_id, perfil_predominante, d_score, i_score, s_score, c_score, respostas_globais) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    [userId, perfilPredominante, pontuacao.D, pontuacao.I, pontuacao.S, pontuacao.C, JSON.stringify(respostasGlobais)], (err) => {
        if (err) return res.status(500).json({ erro: "Erro ao salvar teste." });
        res.json({ mensagem: "Teste salvo!" });
    });
});

// DASHBOARD DO GESTOR: KPI STATS
app.get('/api/admin/stats', (req, res) => {
    const stats = { totalAlunos: 0, totalTestes: 0, distribuicao: [] };
    db.get("SELECT COUNT(*) as total FROM users WHERE tipo = 'aluno'", (err, r1) => {
        stats.totalAlunos = r1.total;
        db.get("SELECT COUNT(*) as total FROM disc_tests", (err, r2) => {
            stats.totalTestes = r2.total;
            db.all("SELECT perfil_predominante as label, COUNT(*) as value FROM disc_tests GROUP BY perfil_predominante", (err, rows) => {
                stats.distribuicao = rows;
                res.json(stats);
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Synthera Online: Porta ${PORT}`));