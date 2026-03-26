const sqlite3 = require('sqlite3').verbose();

// Conecta no arquivo do banco
const db = new sqlite3.Database('./synthera.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
});

// Faz as consultas
db.serialize(() => {
    console.log("\n================ USUÁRIOS CADASTRADOS ================");
    db.all("SELECT id, nome, email, data_criacao FROM users", (err, rows) => {
        console.table(rows);
    });

    console.log("\n================ TESTES REALIZADOS ================");
    db.all("SELECT id, user_id, perfil_predominante, pontuacao_d, pontuacao_i, pontuacao_s, pontuacao_c, answers_json FROM disc_tests", (err, rows) => {
        console.table(rows);
    });
});