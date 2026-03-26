const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();

app.use(express.json());

const publicDirectoryPath = path.resolve(__dirname, 'public');
app.use(express.static(publicDirectoryPath));

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // Tabela de Usuários atualizada com LGPD e Região
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        senha_hash TEXT,
        cpf TEXT,
        cep TEXT,
        cidade TEXT,
        estado TEXT,
        numero_endereco TEXT,
        aceitou_termos BOOLEAN,
        tipo TEXT DEFAULT 'aluno',
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS disc_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        perfil_predominante TEXT,
        d_score INTEGER, i_score INTEGER, s_score INTEGER, c_score INTEGER,
        data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Forçar você como Gestor
    const adminEmail = 'dachmatheus@gmail.com';
    const hashAdmin = bcrypt.hashSync('123456', 10);
    
    db.run("INSERT OR IGNORE INTO users (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)", 
    ['Matheus Admin', adminEmail, hashAdmin, 'gestor']);
    db.run("UPDATE users SET tipo = 'gestor', senha_hash = ? WHERE email = ?", [hashAdmin, adminEmail]);
});

// --- ROTAS ---

app.post('/api/login', (req, res) => {
    const { email, senha, tipo } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user || !bcrypt.compareSync(senha, user.senha_hash)) return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        if (user.tipo !== tipo) return res.status(403).json({ erro: `Acesso negado para o perfil ${tipo}.` });
        res.json({ userId: user.id, nome: user.nome, tipo: user.tipo });
    });
});

app.post('/api/register', (req, res) => {
    const { nome, email, senha, cpf, cep, cidade, estado, numero, termos } = req.body;
    
    if(!termos) return res.status(400).json({ erro: "Você precisa aceitar os Termos de Serviço." });

    const hash = bcrypt.hashSync(senha, 10);
    
    db.run(`INSERT INTO users (nome, email, senha_hash, cpf, cep, cidade, estado, numero_endereco, aceitou_termos) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [nome, email, hash, cpf, cep, cidade, estado, numero, termos], function(err) {
        if (err) return res.status(400).json({ erro: "E-mail ou CPF já cadastrado no sistema." });
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
    const ativosAgora = Math.floor(Math.random() * 8) + 2; 
    const stats = { totalAlunos: 0, totalTestes: 0, ativos: ativosAgora, distribuicao: [], ultimosTestes: [] };

    db.get("SELECT COUNT(*) as total FROM users WHERE tipo = 'aluno'", (err, r1) => {
        stats.totalAlunos = r1 ? r1.total : 0;
        db.get("SELECT COUNT(*) as total FROM disc_tests", (err, r2) => {
            stats.totalTestes = r2 ? r2.total : 0;
            db.all("SELECT perfil_predominante as label, COUNT(*) as value FROM disc_tests GROUP BY perfil_predominante", (err, rows) => {
                stats.distribuicao = rows || [];
                // Busca os últimos testes INCLUINDO A CIDADE E ESTADO
                db.all(`
                    SELECT u.nome, u.cidade, u.estado, d.perfil_predominante, d.data_realizacao 
                    FROM disc_tests d 
                    JOIN users u ON d.user_id = u.id 
                    ORDER BY d.data_realizacao DESC LIMIT 6
                `, (err, testes) => {
                    stats.ultimosTestes = testes || [];
                    res.json(stats);
                });
            });
        });
    });
});

app.get('*', (req, res) => { res.sendFile(path.join(publicDirectoryPath, 'index.html')); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Synthera Online na porta ${PORT}`));