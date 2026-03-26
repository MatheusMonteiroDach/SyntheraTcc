const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('teste.html')) initTest();
    else if (path.includes('relatorio.html')) initReport();
    else if (path.includes('admin.html')) initAdmin();
});

function initLogin() {
    const authForm = document.getElementById('auth-form');
    const nameField = document.getElementById('name-field');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    let isLogin = true;

    tabLogin.onclick = () => { isLogin = true; nameField.classList.add('hidden'); };
    tabRegister.onclick = () => { isLogin = false; nameField.classList.remove('hidden'); };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            ...(isLogin ? {} : { nome: document.getElementById('nome').value })
        };
        try {
            const res = await fetch(`${API_URL}${isLogin ? '/login' : '/register'}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) return alert(data.erro);

            localStorage.setItem('synthera_user_id', data.userId);
            localStorage.setItem('synthera_user_nome', data.nome);
            localStorage.setItem('synthera_user_tipo', data.tipo);

            // Roteamento Automático
            window.location.href = data.tipo === 'gestor' ? 'admin.html' : 'painel.html';
        } catch { alert('Falha na comunicação com o servidor.'); }
    };
}

// Lógica Admin (KPIs)
async function initAdmin() {
    if (localStorage.getItem('synthera_user_tipo') !== 'gestor') window.location.href = 'index.html';
    
    const res = await fetch(`${API_URL}/admin/stats`);
    const data = await res.json();

    document.getElementById('kpi-alunos').textContent = data.totalAlunos;
    document.getElementById('kpi-testes').textContent = data.totalTestes;

    const chart = document.getElementById('chart-container');
    const cores = { D: 'bg-red-500', I: 'bg-yellow-400', S: 'bg-green-500', C: 'bg-blue-500' };
    
    chart.innerHTML = data.distribuicao.map(p => `
        <div class="mb-6">
            <div class="flex justify-between font-bold text-xs uppercase mb-2"><span>Perfil ${p.label}</span><span>${p.value} Alunos</span></div>
            <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div class="${cores[p.label]} h-full" style="width: ${(p.value / data.totalTestes) * 100}%"></div>
            </div>
        </div>
    `).join('');
}

// ... Restante das funções initTest e initReport mantidas conforme versões anteriores ...