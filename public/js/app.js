document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('admin.html')) initAdmin();
    // Se tiver teste.html ou relatorio.html, as funções continuam funcionando aqui
});

// --- LÓGICA DE LOGIN ---
function initLogin() {
    const authForm = document.getElementById('auth-form');
    if(!authForm) return;

    const btnAluno = document.getElementById('btn-aluno');
    const btnGestor = document.getElementById('btn-gestor');
    const authTabs = document.getElementById('auth-tabs');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const nameField = document.getElementById('name-field');
    
    let isLogin = true;
    let tipoSelecionado = 'aluno';

    if(btnGestor) {
        btnGestor.onclick = () => {
            tipoSelecionado = 'gestor';
            isLogin = true;
            btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
            btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
            authTabs.classList.add('hidden');
            nameField.classList.add('hidden');
            tabLogin.innerHTML = "Acesso Administrativo";
        };
    }

    if(btnAluno) {
        btnAluno.onclick = () => {
            tipoSelecionado = 'aluno';
            btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
            btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
            authTabs.classList.remove('hidden');
            tabLogin.innerHTML = "Entrar";
        };
    }

    if(tabLogin) tabLogin.onclick = () => { isLogin = true; nameField.classList.add('hidden'); tabLogin.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600"; tabRegister.className = "flex-1 pb-3 text-sm font-bold text-slate-400"; };
    if(tabRegister) tabRegister.onclick = () => { isLogin = false; nameField.classList.remove('hidden'); tabRegister.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600"; tabLogin.className = "flex-1 pb-3 text-sm font-bold text-slate-400"; };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const nome = document.getElementById('nome').value;
        const rota = isLogin ? '/api/login' : '/api/register';
        
        try {
            const res = await fetch(rota, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha, tipo: tipoSelecionado, nome: isLogin ? undefined : nome })
            });
            const data = await res.json();
            if (!res.ok) return alert(data.erro || "Erro ao processar solicitação.");
            
            localStorage.setItem('synthera_user_id', data.userId);
            localStorage.setItem('synthera_user_tipo', data.tipo);
            localStorage.setItem('synthera_user_nome', data.nome);
            window.location.href = data.tipo === 'gestor' ? 'admin.html' : 'painel.html';
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor.");
        }
    };
}

// --- LÓGICA DO PAINEL GESTOR (NOVO) ---
async function initAdmin() {
    if (localStorage.getItem('synthera_user_tipo') !== 'gestor') {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        
        document.getElementById('kpi-alunos').textContent = data.totalAlunos;
        document.getElementById('kpi-testes').textContent = data.totalTestes;
        document.getElementById('kpi-ativos').textContent = data.ativos;

        const container = document.getElementById('chart-container');
        const cores = { 
            D: { bg: 'bg-red-500', nome: 'Dominância' }, 
            I: { bg: 'bg-yellow-400', nome: 'Influência' }, 
            S: { bg: 'bg-green-500', nome: 'Estabilidade' }, 
            C: { bg: 'bg-blue-500', nome: 'Conformidade' } 
        };
        
        container.innerHTML = data.distribuicao.length > 0 ? data.distribuicao.map(p => `
            <div>
                <div class="flex justify-between text-xs font-bold mb-2 text-slate-600">
                    <span>${cores[p.label]?.nome || p.label} (${p.label})</span>
                    <span>${p.value} aluno(s)</span>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div class="${cores[p.label]?.bg || 'bg-slate-400'} h-full transition-all duration-1000" style="width: ${(p.value / data.totalTestes) * 100}%"></div>
                </div>
            </div>
        `).join('') : '<p class="text-sm text-slate-400 italic">Nenhum teste realizado ainda.</p>';

        const tabela = document.getElementById('tabela-testes');
        tabela.innerHTML = data.ultimosTestes.length > 0 ? data.ultimosTestes.map(t => {
            const dataFormatada = new Date(t.data_realizacao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `
            <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <td class="py-4 font-bold text-slate-800">${t.nome}</td>
                <td class="py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-black ${cores[t.perfil_predominante]?.bg || 'bg-slate-200'} text-white">
                        ${cores[t.perfil_predominante]?.nome || t.perfil_predominante}
                    </span>
                </td>
                <td class="py-4 text-right text-slate-400 text-xs font-bold">${dataFormatada}</td>
            </tr>
        `}).join('') : '<tr><td colspan="3" class="py-4 text-center text-slate-400 text-sm">Aguardando novos resultados...</td></tr>';

    } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
    }
}