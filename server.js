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
    // 💡 Tabela atualizada com WhatsApp e Bio para o Perfil
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        senha_hash TEXT,
        cpf TEXT UNIQUE,
        cep TEXT,
        rua TEXT,
        bairro TEXT,
        cidade TEXT,
        estado TEXT,
        numero_endereco TEXT,
        complemento TEXT,
        whatsapp TEXT,
        bio TEXT,
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

    // Cadastro Master (Gestor)
    const adminEmail = 'dachmatheus@gmail.com';
    const hashAdmin = bcrypt.hashSync('123456', 10);
    db.run("INSERT OR IGNORE INTO users (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)", 
    ['Matheus Admin', adminEmail, hashAdmin, 'gestor']);
});

// --- API DE AUTENTICAÇÃO ---

app.post('/api/login', (req, res) => {
    const { email, senha, tipo } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user || !bcrypt.compareSync(senha, user.senha_hash)) return res.status(401).json({ erro: "Credenciais inválidas." });
        if (user.tipo !== tipo) return res.status(403).json({ erro: `Acesso negado: Perfil ${tipo} requerido.` });
        res.json({ userId: user.id, nome: user.nome, tipo: user.tipo });
    });
});

app.post('/api/register', (req, res) => {
    const { nome, email, senha, cpf, cep, rua, bairro, cidade, estado, numero, complemento, termos } = req.body;
    if(!termos) return res.status(400).json({ erro: "Aceite da LGPD obrigatório." });

    const hash = bcrypt.hashSync(senha, 10);
    const sql = `INSERT INTO users (nome, email, senha_hash, cpf, cep, rua, bairro, cidade, estado, numero_endereco, complemento, aceitou_termos) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
    
    db.run(sql, [nome, email, hash, cpf, cep, rua, bairro, cidade, estado, numero, complemento, termos], function(err) {
        if (err) return res.status(400).json({ erro: "E-mail ou CPF já cadastrado." });
        res.json({ userId: this.lastID, nome, tipo: 'aluno' });
    });
});

// --- API DE PERFIL (USUÁRIO E GESTOR) ---

// 1. Buscar Dados do Perfil
app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT id, nome, email, whatsapp, bio, cidade, estado, tipo FROM users WHERE id = ?", [id], (err, user) => {
        if (err || !user) return res.status(404).json({ erro: "Usuário não encontrado" });
        
        // Busca o último teste para exibir no perfil
        db.get("SELECT perfil_predominante FROM disc_tests WHERE user_id = ? ORDER BY data_realizacao DESC", [id], (err, test) => {
            res.json({ ...user, perfil: test ? test.perfil_predominante : "Não realizado" });
        });
    });
});

// 2. Atualizar Dados do Perfil (Dinamismo Total)
app.put('/api/user/:id', (req, res) => {
    const { id } = req.params;
    const { nome, whatsapp, bio } = req.body;
    
    db.run("UPDATE users SET nome = ?, whatsapp = ?, bio = ? WHERE id = ?", [nome, whatsapp, bio, id], (err) => {
        if (err) return res.status(500).json({ erro: "Erro ao atualizar perfil" });
        res.json({ ok: true, mensagem: "Perfil atualizado com sucesso!" });
    });
});

// --- API DE TESTES ---

app.post('/api/testes', (req, res) => {
    const { userId, perfilPredominante, pontuacao } = req.body;
    db.run(`INSERT INTO disc_tests (user_id, perfil_predominante, d_score, i_score, s_score, c_score) VALUES (?, ?, ?, ?, ?, ?)`, 
    [userId, perfilPredominante, pontuacao.D, pontuacao.I, pontuacao.S, pontuacao.C], (err) => {
        if (err) return res.status(500).json({ erro: "Erro ao processar DISC." });
        res.json({ ok: true });
    });
});

// --- DASHBOARD GESTOR (HITS REGIONAIS) ---

app.get('/api/admin/stats', (req, res) => {
    const stats = { totalAlunos: 0, totalTestes: 0, ativos: Math.floor(Math.random() * 5) + 2, distribuicao: [], ultimosTestes: [] };
    db.get("SELECT COUNT(*) as total FROM users WHERE tipo = 'aluno'", (err, r1) => {
        stats.totalAlunos = r1 ? r1.total : 0;
        db.get("SELECT COUNT(*) as total FROM disc_tests", (err, r2) => {
            stats.totalTestes = r2 ? r2.total : 0;
            db.all("SELECT perfil_predominante as label, COUNT(*) as value FROM disc_tests GROUP BY perfil_predominante", (err, rows) => {
                stats.distribuicao = rows || [];
                db.all(`SELECT u.nome, u.cidade, u.estado, d.perfil_predominante, d.data_realizacao FROM disc_tests d JOIN users u ON d.user_id = u.id ORDER BY d.data_realizacao DESC LIMIT 10`, (err, testes) => {
                    stats.ultimosTestes = testes || [];
                    res.json(stats);
                });
            });
        });
    });
});

app.get('*', (req, res) => { res.sendFile(path.join(publicDirectoryPath, 'index.html')); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Synthera Server em operação na porta ${PORT}`));