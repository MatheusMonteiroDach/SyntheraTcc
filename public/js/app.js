document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    // Adicione as outras chamadas aqui (initTest, etc) se necessário
});

function initLogin() {
    const authForm = document.getElementById('auth-form');
    const btnAluno = document.getElementById('btn-aluno');
    const btnGestor = document.getElementById('btn-gestor');
    const authTabs = document.getElementById('auth-tabs');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const nameField = document.getElementById('name-field');
    
    let isLogin = true;
    let tipoSelecionado = 'aluno';

    // FUNÇÃO PARA MUDAR PARA GESTOR
    btnGestor.onclick = () => {
        tipoSelecionado = 'gestor';
        isLogin = true; // Gestor só faz login, não se cadastra
        
        // Estilo visual dos botões
        btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
        btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
        
        // Esconder abas de cadastro e campo nome
        authTabs.classList.add('hidden');
        nameField.classList.add('hidden');
        tabLogin.innerHTML = "Acesso Administrativo";
    };

    // FUNÇÃO PARA MUDAR PARA ALUNO
    btnAluno.onclick = () => {
        tipoSelecionado = 'aluno';
        
        // Estilo visual dos botões
        btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
        btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
        
        // Mostrar abas de login/cadastro
        authTabs.classList.remove('hidden');
        tabLogin.innerHTML = "Entrar";
    };

    // ALTERNAR ENTRE LOGIN E CADASTRO (PARA ALUNOS)
    tabLogin.onclick = () => {
        isLogin = true;
        nameField.classList.add('hidden');
        tabLogin.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600";
        tabRegister.className = "flex-1 pb-3 text-sm font-bold text-slate-400";
    };

    tabRegister.onclick = () => {
        isLogin = false;
        nameField.classList.remove('hidden');
        tabRegister.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600";
        tabLogin.className = "flex-1 pb-3 text-sm font-bold text-slate-400";
    };

    // SUBMISSÃO DO FORMULÁRIO
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
                body: JSON.stringify({ 
                    email, 
                    senha, 
                    tipo: tipoSelecionado,
                    nome: isLogin ? undefined : nome 
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.erro || "Erro ao processar solicitação.");
                return;
            }

            // SALVAR DADOS E REDIRECIONAR
            localStorage.setItem('synthera_user_id', data.userId);
            localStorage.setItem('synthera_user_tipo', data.tipo);
            localStorage.setItem('synthera_user_nome', data.nome);

            if (data.tipo === 'gestor') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'painel.html';
            }

        } catch (error) {
            console.error("Erro no fetch:", error);
            alert("Erro ao conectar com o servidor.");
        }
    };
}