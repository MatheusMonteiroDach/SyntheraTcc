const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log("\n--- 🔎 AUDITORIA DE BANCO DE DADOS | SYNTHERA ---\n");

db.serialize(() => {
    // 1. Verificar Usuários e LGPD
    console.log("👥 TABELA DE USUÁRIOS (LOGÍSTICA E LGPD):");
    db.each("SELECT id, nome, email, cpf, cidade, estado, bairro, rua, aceitou_termos FROM users", (err, row) => {
        if (err) return console.error("Erro ao ler users:", err.message);
        console.log(`[ID ${row.id}] ${row.nome} | CPF: ${row.cpf} | Local: ${row.rua}, ${row.bairro} - ${row.cidade}/${row.estado} | LGPD: ${row.aceitou_termos ? '✅ ACEITO' : '❌ NÃO'}`);
    });

    // 2. Verificar Testes DISC
    setTimeout(() => {
        console.log("\n📊 RESULTADOS DOS TESTES DISC:");
        db.each("SELECT id, user_id, perfil_predominante, data_realizacao FROM disc_tests", (err, row) => {
            if (err) return console.error("Erro ao ler testes:", err.message);
            console.log(`[TESTE ${row.id}] User ID: ${row.user_id} | Perfil: ${row.perfil_predominante} | Data: ${row.data_realizacao}`);
        });
    }, 500);
});

// Fechar após leitura
setTimeout(() => { db.close(); console.log("\n--- FIM DA AUDITORIA ---"); }, 1000);