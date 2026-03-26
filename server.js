const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();

app.use(express.json());

// 1. Configura a pasta pública de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // 1. Cria as tabelas (se não existirem)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        senha_hash TEXT,
        tipo TEXT DEFAULT 'aluno'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS disc_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        perfil_predominante TEXT,
        d_score INTEGER, i_score INTEGER, s_score INTEGER, c_score INTEGER,
        data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 2. FORÇAR VOCÊ COMO GESTOR (O Pulo do Gato)
    const adminEmail = 'dachmatheus@gmail.com';
    const hashAdmin = bcrypt.hashSync('123456', 10);
    
    // Primeiro, tentamos inserir. Se já existir, ele não faz nada (IGNORE).
    db.run("INSERT OR IGNORE INTO users (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)", 
    ['Matheus Admin', adminEmail, hashAdmin, 'gestor']);

    // LOGO EM SEGUIDA, forçamos o UPDATE para garantir que você seja 'gestor'
    db.run("UPDATE users SET tipo = 'gestor', senha_hash = ? WHERE email = ?", [hashAdmin, adminEmail], (err) => {
        if(!err) console.log(`-> Permissões de GESTOR confirmadas para: ${adminEmail}`);
    });
});
// --- API ROUTES ---

app.post('/api/login', (req, res) => {
    const { email, senha, tipo } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }
        if (user.tipo !== tipo) {
            return res.status(403).json({ erro: `Este e-mail não é de um ${tipo}.` });
        }
        res.json({ userId: user.id, nome: user.nome, tipo: user.tipo });
    });
});

app.post('/api/register', (req, res) => {
    const { nome, email, senha } = req.body;
    const hash = bcrypt.hashSync(senha, 10);
    db.run("INSERT INTO users (nome, email, senha_hash) VALUES (?, ?, ?)", [nome, email, hash], function(err) {
        if (err) return res.status(400).json({ erro: "E-mail já cadastrado." });
        res.json({ userId: this.lastID, nome, tipo: 'aluno' });
    });
});

app.post('/api/testes', (req, res) => {
    const { userId, perfilPredominante, pontuacao } = req.body;
    db.run(`INSERT INTO disc_tests (user_id, perfil_predominante, d_score, i_score, s_score, c_score) VALUES (?, ?, ?, ?, ?, ?)`, 
    [userId, perfilPredominante, pontuacao.D, pontuacao.I, pontuacao.S, pontuacao.C], (err) => {
        if (err) return res.status(500).json({ erro: "Erro ao salvar teste." });
        res.json({ ok: true });
    });
});

app.get('/api/admin/stats', (req, res) => {
    const stats = { totalAlunos: 0, totalTestes: 0, distribuicao: [] };
    db.get("SELECT COUNT(*) as total FROM users WHERE tipo = 'aluno'", (err, r1) => {
        stats.totalAlunos = r1 ? r1.total : 0;
        db.get("SELECT COUNT(*) as total FROM disc_tests", (err, r2) => {
            stats.totalTestes = r2 ? r2.total : 0;
            db.all("SELECT perfil_predominante as label, COUNT(*) as value FROM disc_tests GROUP BY perfil_predominante", (err, rows) => {
                stats.distribuicao = rows || [];
                res.json(stats);
            });
        });
    });
});

// 2. ROTA CORINGA: Garante que qualquer acesso direto (ou o principal /) abra o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Synthera Online na porta ${PORT}`));