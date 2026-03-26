document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('admin.html')) initAdmin();
    else if (path.includes('teste.html')) initTest(); // ← O ROTEADOR AGORA ACHA O TESTE!
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
            
            // Direciona o aluno direto para o teste após o cadastro/login
            window.location.href = data.tipo === 'gestor' ? 'admin.html' : 'teste.html';
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor.");
        }
    };
}

// --- LÓGICA DO PAINEL GESTOR ---
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

// --- LÓGICA DO TESTE DISC (NOVO) ---
function initTest() {
    const userId = localStorage.getItem('synthera_user_id');
    if (!userId) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = 'login.html';
        return;
    }

    // Banco de Perguntas Dinâmicas
    const questions = [
        {
            text: "Em um projeto em equipe, qual é o seu papel natural?",
            options: [
                { value: "D", text: "Assumo a liderança e foco em definir prazos e metas rápidas." },
                { value: "I", text: "Motivo a equipe e facilito a comunicação entre todos para manter a energia alta." },
                { value: "S", text: "Apoio as decisões do grupo e garanto que o trabalho flua sem estresse ou atritos." },
                { value: "C", text: "Organizo as planilhas, crio processos e garanto a qualidade técnica das entregas." }
            ]
        },
        {
            text: "Como você costuma agir sob pressão extrema?",
            options: [
                { value: "D", text: "Assumo o controle total e busco resolver o problema no ato, custe o que custar." },
                { value: "I", text: "Tento manter o otimismo, uso meu networking e engajo a equipe para achar uma saída." },
                { value: "S", text: "Mantenho a calma, evito o pânico e sigo o plano original passo a passo." },
                { value: "C", text: "Paro, analiso todos os dados detalhadamente e só tomo uma decisão com base em fatos." }
            ]
        },
        {
            text: "Ao tomar uma decisão importante na carreira, você se baseia mais em:",
            options: [
                { value: "D", text: "Resultados rápidos, instinto para o sucesso e o tamanho do desafio." },
                { value: "I", text: "Como isso vai impactar as pessoas ao meu redor e minha visibilidade." },
                { value: "S", text: "Segurança de longo prazo, consenso da família e manter um ambiente estável." },
                { value: "C", text: "Fatos concretos, estatísticas do mercado e uma análise rigorosa de riscos." }
            ]
        },
        {
            text: "O que mais te frustra no ambiente de trabalho ou de estudos?",
            options: [
                { value: "D", text: "Lentidão, indecisão da equipe e falta de foco em resultados práticos." },
                { value: "I", text: "Rotina rígida, isolamento social e falta de reconhecimento das minhas ideias." },
                { value: "S", text: "Mudanças bruscas de cronograma, conflitos desnecessários e falta de colaboração." },
                { value: "C", text: "Desorganização geral, falta de regras claras e tarefas entregues de qualquer jeito." }
            ]
        },
        {
            text: "Como você lida com regras e procedimentos estabelecidos?",
            options: [
                { value: "D", text: "Se a regra atrapalha o resultado final, eu questiono e tento quebrar ou mudar." },
                { value: "I", text: "Sigo as regras básicas, mas prefiro flexibilidade para criar e adaptar as coisas." },
                { value: "S", text: "Respeito as regras e a tradição, pois elas mantêm a ordem e a harmonia do grupo." },
                { value: "C", text: "Sigo rigorosamente à risca, pois as regras garantem a excelência e evitam falhas." }
            ]
        }
    ];

    let currentIndex = 0;
    let userAnswers = [];

    const questionText = document.getElementById('question-text');
    const quizForm = document.getElementById('quiz-form');
    const btnProxima = document.getElementById('btn-proxima');
    const btnVoltar = document.getElementById('btn-voltar');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    function renderQuestion() {
        const q = questions[currentIndex];
        questionText.textContent = q.text;

        // Injeta as alternativas no HTML
        quizForm.innerHTML = q.options.map((opt) => `
            <label class="block cursor-pointer">
                <input type="radio" name="resposta" value="${opt.value}" class="peer sr-only" ${userAnswers[currentIndex] === opt.value ? 'checked' : ''}>
                <div class="w-full p-5 rounded-2xl border-2 border-gray-100 peer-checked:border-brand-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-all">
                    <span class="text-gray-600 font-bold peer-checked:text-brand-900">${opt.text}</span>
                </div>
            </label>
        `).join('');

        // Atualiza Progresso
        const progressoPercentual = ((currentIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progressoPercentual}%`;
        progressText.textContent = `Pergunta ${currentIndex + 1} de ${questions.length}`;

        // Controla botões
        btnVoltar.classList.toggle('hidden', currentIndex === 0);
        btnProxima.innerHTML = currentIndex === questions.length - 1 ? 'Finalizar Análise <i class="fa-solid fa-check ml-2"></i>' : 'Próxima <i class="fa-solid fa-arrow-right ml-2"></i>';
    }

    btnProxima.onclick = async () => {
        const selected = document.querySelector('input[name="resposta"]:checked');
        if (!selected) {
            alert("Por favor, selecione uma alternativa antes de avançar.");
            return;
        }

        userAnswers[currentIndex] = selected.value; // Salva a resposta

        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderQuestion();
        } else {
            // FIM DO TESTE: Calcula tudo
            const pontuacao = { D: 0, I: 0, S: 0, C: 0 };
            userAnswers.forEach(resposta => pontuacao[resposta]++);

            // Acha o perfil dominante
            let perfilPredominante = 'D';
            let maxScore = pontuacao['D'];
            for (const p in pontuacao) {
                if (pontuacao[p] > maxScore) {
                    maxScore = pontuacao[p];
                    perfilPredominante = p;
                }
            }

            btnProxima.disabled = true;
            btnProxima.textContent = "Processando Dados...";

            try {
                const res = await fetch('/api/testes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, perfilPredominante, pontuacao })
                });

                if (res.ok) {
                    alert(`Análise concluída com sucesso! Seu perfil predominante é: ${perfilPredominante}`);
                    window.location.href = 'index.html'; // Aqui você pode mudar para relatorio.html se criar a página de relatório!
                } else {
                    alert("Erro ao salvar resultado. Tente novamente.");
                    btnProxima.disabled = false;
                }
            } catch (error) {
                alert("Erro de conexão com o servidor.");
                btnProxima.disabled = false;
            }
        }
    };

    btnVoltar.onclick = () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestion();
        }
    };

    // Dá o start inicial na tela
    renderQuestion();
}