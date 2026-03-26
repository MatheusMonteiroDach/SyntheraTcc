const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('teste.html')) initTest();
    else if (path.includes('relatorio.html')) initReport();
    else if (path.includes('admin.html')) initAdmin();
});

// --- LÓGICA DE LOGIN ---
function initLogin() {
    const authForm = document.getElementById('auth-form');
    const btnAluno = document.getElementById('perfil-aluno');
    const btnGestor = document.getElementById('perfil-gestor');
    const authTabs = document.getElementById('auth-tabs');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const nameField = document.getElementById('name-field');
    
    let isLogin = true;
    let tipoSelecionado = 'aluno';

    btnAluno.onclick = () => {
        tipoSelecionado = 'aluno';
        btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm";
        btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500";
        authTabs.classList.remove('hidden');
    };

    btnGestor.onclick = () => {
        tipoSelecionado = 'gestor';
        btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm";
        btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500";
        authTabs.classList.add('hidden');
        isLogin = true; nameField.classList.add('hidden');
    };

    tabLogin.onclick = () => { isLogin = true; nameField.classList.add('hidden'); tabLogin.classList.add('border-b-2', 'border-blue-600'); tabRegister.classList.remove('border-b-2'); };
    tabRegister.onclick = () => { isLogin = false; nameField.classList.remove('hidden'); tabRegister.classList.add('border-b-2', 'border-blue-600'); tabLogin.classList.remove('border-b-2'); };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            tipo: tipoSelecionado,
            ...(isLogin ? {} : { nome: document.getElementById('nome').value })
        };
        const res = await fetch(`${API_URL}${isLogin ? '/login' : '/register'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) return alert(data.erro);
        localStorage.setItem('synthera_user_id', data.userId);
        localStorage.setItem('synthera_user_tipo', data.tipo);
        localStorage.setItem('synthera_user_nome', data.nome);
        window.location.href = data.tipo === 'gestor' ? 'admin.html' : 'painel.html';
    };
}

// --- LÓGICA DO TESTE (30 PERGUNTAS) ---
function initTest() {
    const userId = localStorage.getItem('synthera_user_id');
    if (!userId) window.location.href = 'login.html';

    const perguntas = [
        { t: "1. Como você costuma agir sob pressão?", o: [{tx: "Assumo o controle.", v: "D"}, {tx: "Mantenho o otimismo.", v: "I"}, {tx: "Sigo o plano.", v: "S"}, {tx: "Analiso dados.", v: "C"}] },
        { t: "2. Em um projeto, você geralmente:", o: [{tx: "Lidero e cobro.", v: "D"}, {tx: "Dou ideias criativas.", v: "I"}, {tx: "Apoio os colegas.", v: "S"}, {tx: "Garanto regras.", v: "C"}] },
        // ... (Para encurtar aqui, repita o padrão para as 30 questões que mandamos antes)
        // DICA: No seu código final, cole as 30 aqui.
    ];

    let atual = 0;
    const scores = { D: 0, I: 0, S: 0, C: 0 };

    const render = () => {
        const q = perguntas[atual];
        document.getElementById('question-text').textContent = q.t;
        const form = document.getElementById('quiz-form');
        form.innerHTML = q.o.map(o => `<label class="block p-4 border rounded-xl mb-2 cursor-pointer hover:bg-slate-50"><input type="radio" name="r" value="${o.v}" class="mr-2"> ${o.tx}</label>`).join('');
    };

    document.getElementById('btn-proxima').onclick = async () => {
        const sel = document.querySelector('input[name="r"]:checked');
        if (!sel) return alert("Selecione uma opção.");
        scores[sel.value]++;
        if (++atual < perguntas.length) render();
        else {
            const dom = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
            const res = await fetch(`${API_URL}/testes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, perfilPredominante: dom, pontuacao: scores })
            });
            if (res.ok) { localStorage.setItem('synthera_scores', JSON.stringify(scores)); window.location.href = 'relatorio.html'; }
        }
    };
    render();
}

// --- LÓGICA ADMIN (KPIs) ---
async function initAdmin() {
    if (localStorage.getItem('synthera_user_tipo') !== 'gestor') window.location.href = 'index.html';
    const res = await fetch(`${API_URL}/admin/stats`);
    const data = await res.json();
    document.getElementById('kpi-alunos').textContent = data.totalAlunos;
    document.getElementById('kpi-testes').textContent = data.totalTestes;
    const container = document.getElementById('chart-container');
    const cores = { D: 'bg-red-500', I: 'bg-yellow-400', S: 'bg-green-500', C: 'bg-blue-500' };
    container.innerHTML = data.distribuicao.map(p => `
        <div class="mb-4">
            <div class="flex justify-between text-xs font-bold mb-1"><span>Perfil ${p.label}</span><span>${p.value}</span></div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div class="${cores[p.label]} h-full" style="width: ${(p.value / data.totalTestes) * 100}%"></div></div>
        </div>
    `).join('');
}