document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('admin.html')) initAdmin();
    else if (path.includes('teste.html')) initTest();
    else if (path.includes('painel.html')) initPainel(); 
});

// ==========================================
// 1. LÓGICA DE LOGIN, CADASTRO E VIA CEP
// ==========================================
function initLogin() {
    const authForm = document.getElementById('auth-form');
    if(!authForm) return;

    const btnAluno = document.getElementById('btn-aluno');
    const btnGestor = document.getElementById('btn-gestor');
    const authTabs = document.getElementById('auth-tabs');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    const registerFields = document.getElementById('register-fields');
    const termosBox = document.getElementById('termos-box');
    const senhaHint = document.getElementById('senha-hint');
    const btnSubmit = document.getElementById('btn-submit');
    const cepInput = document.getElementById('cep');
    const cidadeUfInput = document.getElementById('cidade-uf');
    
    let isLogin = true;
    let tipoSelecionado = 'aluno';
    let cidadeDetectada = '';
    let estadoDetectado = '';

    if(btnGestor) {
        btnGestor.onclick = () => {
            tipoSelecionado = 'gestor';
            isLogin = true;
            btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
            btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
            authTabs.classList.add('hidden');
            registerFields?.classList.add('hidden');
            termosBox?.classList.add('hidden');
            senhaHint?.classList.add('hidden');
            tabLogin.innerHTML = "Acesso Administrativo";
            btnSubmit.innerHTML = "Entrar como Gestor";
        };
    }

    if(btnAluno) {
        btnAluno.onclick = () => {
            tipoSelecionado = 'aluno';
            btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
            btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
            authTabs.classList.remove('hidden');
            tabLogin.click(); 
        };
    }

    if(tabLogin) tabLogin.onclick = () => { 
        isLogin = true; 
        registerFields?.classList.add('hidden'); 
        termosBox?.classList.add('hidden');
        senhaHint?.classList.add('hidden');
        tabLogin.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600"; 
        tabRegister.className = "flex-1 pb-3 text-sm font-bold text-slate-400"; 
        btnSubmit.innerHTML = "Acessar Plataforma";
    };
    
    if(tabRegister) tabRegister.onclick = () => { 
        isLogin = false; 
        registerFields?.classList.remove('hidden'); 
        termosBox?.classList.remove('hidden');
        senhaHint?.classList.remove('hidden');
        tabRegister.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600"; 
        tabLogin.className = "flex-1 pb-3 text-sm font-bold text-slate-400"; 
        btnSubmit.innerHTML = "Criar Conta Segura";
    };

    if(cepInput) {
        cepInput.addEventListener('blur', async (e) => {
            let cep = e.target.value.replace(/\D/g, '');
            if(cep.length === 8) {
                cidadeUfInput.value = "Buscando localização...";
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();
                    if(data.erro) {
                        cidadeUfInput.value = "CEP não encontrado";
                    } else {
                        cidadeDetectada = data.localidade;
                        estadoDetectado = data.uf;
                        cidadeUfInput.value = `${cidadeDetectada} - ${estadoDetectado}`;
                    }
                } catch(error) {
                    cidadeUfInput.value = "Erro ao buscar CEP";
                }
            }
        });
    }

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const payload = { email, senha, tipo: tipoSelecionado };

        if (!isLogin) {
            const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
            if(!senhaRegex.test(senha)) {
                alert("Sua senha é fraca. Ela precisa ter no mínimo 8 caracteres, misturando letras e números.");
                return;
            }
            const termos = document.getElementById('termos').checked;
            if(!termos) {
                alert("Você precisa aceitar os Termos de Serviço da LGPD para continuar.");
                return;
            }
            payload.nome = document.getElementById('nome').value;
            payload.cpf = document.getElementById('cpf').value;
            payload.cep = cepInput.value;
            payload.cidade = cidadeDetectada;
            payload.estado = estadoDetectado;
            payload.numero = document.getElementById('numero').value;
            payload.termos = termos;
        }

        const rota = isLogin ? '/api/login' : '/api/register';
        
        try {
            btnSubmit.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Processando...";
            btnSubmit.disabled = true;

            const res = await fetch(rota, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (!res.ok) {
                alert(data.erro || "Erro ao processar solicitação.");
                btnSubmit.innerHTML = isLogin ? "Acessar Plataforma" : "Criar Conta Segura";
                btnSubmit.disabled = false;
                return;
            }
            
            localStorage.setItem('synthera_user_id', data.userId);
            localStorage.setItem('synthera_user_tipo', data.tipo);
            localStorage.setItem('synthera_user_nome', data.nome || '');
            window.location.href = data.tipo === 'gestor' ? 'admin.html' : 'teste.html';
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor.");
            btnSubmit.disabled = false;
        }
    };
}

// ==========================================
// 2. LÓGICA DO PAINEL GESTOR (HIGHTEC)
// ==========================================
async function initAdmin() {
    if (localStorage.getItem('synthera_user_tipo') !== 'gestor') { window.location.href = 'index.html'; return; }
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        
        document.getElementById('kpi-alunos').textContent = data.totalAlunos;
        document.getElementById('kpi-testes').textContent = data.totalTestes;
        document.getElementById('kpi-ativos').textContent = data.ativos;

        const container = document.getElementById('chart-container');
        const cores = { 
            D: { bg: 'bg-red-500', nome: 'Dominância (D)' }, 
            I: { bg: 'bg-yellow-400', nome: 'Influência (I)' }, 
            S: { bg: 'bg-emerald-500', nome: 'Estabilidade (S)' }, 
            C: { bg: 'bg-blue-500', nome: 'Conformidade (C)' } 
        };
        
        container.innerHTML = data.distribuicao.length > 0 ? data.distribuicao.map(p => `
            <div>
                <div class="flex justify-between text-xs font-bold mb-2 text-slate-400"><span>${cores[p.label]?.nome || p.label}</span><span class="text-white">${p.value} log(s)</span></div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div class="${cores[p.label]?.bg || 'bg-slate-500'} h-full transition-all" style="width: ${(p.value / data.totalTestes) * 100}%"></div></div>
            </div>
        `).join('') : '<p class="text-xs text-slate-500">Sem dados processados.</p>';

        // Preenchendo o Radar Geográfico
        const mapContainer = document.getElementById('geo-map');
        const regioes = {};
        data.ultimosTestes.forEach(t => {
            if(t.cidade && t.estado) {
                const key = `${t.cidade} - ${t.estado}`;
                regioes[key] = (regioes[key] || 0) + 1;
            }
        });

        const regioesHtml = Object.keys(regioes).length > 0 ? Object.keys(regioes).map(r => `
            <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <span class="text-sm font-bold text-slate-300">${r}</span>
                <span class="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md">${regioes[r]} hit(s)</span>
            </div>
        `).join('') : '<p class="text-xs text-slate-500">Nenhum dado geográfico capturado (CEP não informado).</p>';
        mapContainer.innerHTML = regioesHtml;

        const tabela = document.getElementById('tabela-testes');
        tabela.innerHTML = data.ultimosTestes.length > 0 ? data.ultimosTestes.map(t => {
            const dataF = new Date(t.data_realizacao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const local = (t.cidade && t.estado) ? `${t.cidade} - ${t.estado}` : "Localização Privada";
            
            return `
            <tr class="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition">
                <td class="py-4">
                    <p class="font-bold text-white">${t.nome}</p>
                    <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1"><i class="fa-solid fa-location-crosshairs text-blue-500 mr-1"></i> ${local}</p>
                </td>
                <td class="py-4">
                    <span class="px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-black ${cores[t.perfil_predominante]?.bg || 'bg-slate-700'} text-slate-950 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        ${t.perfil_predominante} - ${cores[t.perfil_predominante]?.nome.split(' ')[0]}
                    </span>
                </td>
                <td class="py-4 text-right text-slate-500 text-xs font-bold font-mono">${dataF}</td>
            </tr>
        `}).join('') : '<tr><td colspan="3" class="py-4 text-center text-slate-600 text-sm">Nenhum evento registrado no servidor...</td></tr>';

    } catch (error) { console.error(error); }
}

// ==========================================
// 3. LÓGICA DO TESTE DISC (30 PERGUNTAS)
// ==========================================
function initTest() {
    const userId = localStorage.getItem('synthera_user_id');
    if (!userId) { window.location.href = 'login.html'; return; }

    const questions = [
        { text: "1. Como você se descreve em um grupo novo?", options: [{value: "D", text: "Tomo a frente das decisões."}, {value: "I", text: "Faço amizades rapidamente."}, {value: "S", text: "Observo antes de interagir."}, {value: "C", text: "Avalio as regras e o ambiente."}] },
        { text: "2. Em um projeto, qual é o seu foco?", options: [{value: "D", text: "Os resultados e metas."}, {value: "I", text: "O engajamento da equipe."}, {value: "S", text: "Manter a harmonia do grupo."}, {value: "C", text: "A precisão técnica dos detalhes."}] },
        { text: "3. Diante de um conflito, você:", options: [{value: "D", text: "Enfrento diretamente."}, {value: "I", text: "Tento apaziguar com humor."}, {value: "S", text: "Busco um acordo calmo."}, {value: "C", text: "Uso a lógica e os fatos."}] },
        { text: "4. Qual é o seu maior medo profissional?", options: [{value: "D", text: "Perder o controle da situação."}, {value: "I", text: "Ser rejeitado ou isolado."}, {value: "S", text: "Mudanças bruscas e insegurança."}, {value: "C", text: "Ser criticado por cometer um erro."}] },
        { text: "5. Ao receber uma tarefa nova, você:", options: [{value: "D", text: "Começo a executar na hora."}, {value: "I", text: "Chamo alguém para fazer comigo."}, {value: "S", text: "Peço um passo a passo claro."}, {value: "C", text: "Estudo as regras antes de agir."}] },
        { text: "6. Como você prefere ser reconhecido?", options: [{value: "D", text: "Pelos meus resultados palpáveis."}, {value: "I", text: "Com elogios em público."}, {value: "S", text: "Pela minha lealdade e suporte."}, {value: "C", text: "Pela alta qualidade do meu trabalho."}] },
        { text: "7. O que te desmotiva no trabalho?", options: [{value: "D", text: "Lentidão e indecisão."}, {value: "I", text: "Rotina rígida e sem interação."}, {value: "S", text: "Falta de colaboração e atritos."}, {value: "C", text: "Desorganização e regras falhas."}] },
        { text: "8. Sob pressão extrema, você:", options: [{value: "D", text: "Me torno autoritário."}, {value: "I", text: "Falo demais para aliviar a tensão."}, {value: "S", text: "Me fecho e evito confrontos."}, {value: "C", text: "Exijo mais dados antes de decidir."}] },
        { text: "9. Seu estilo de comunicação é:", options: [{value: "D", text: "Direto e objetivo."}, {value: "I", text: "Animado e persuasivo."}, {value: "S", text: "Calmo e empático."}, {value: "C", text: "Formal e detalhista."}] },
        { text: "10. Ao liderar uma reunião, você:", options: [{value: "D", text: "Vou direto aos tópicos importantes."}, {value: "I", text: "Faço um quebra-gelo inicial."}, {value: "S", text: "Garanto que todos sejam ouvidos."}, {value: "C", text: "Sigo a pauta rigorosamente."}] },
        { text: "11. Como você lida com mudanças?", options: [{value: "D", text: "As abraço se trouxerem resultados."}, {value: "I", text: "Acho estimulantes e divertidas."}, {value: "S", text: "Preciso de tempo para me adaptar."}, {value: "C", text: "Aceito se houver um motivo lógico."}] },
        { text: "12. Qual é a sua maior virtude na equipe?", options: [{value: "D", text: "Acelerar as entregas."}, {value: "I", text: "Manter o clima positivo."}, {value: "S", text: "Ser o pilar de confiança de todos."}, {value: "C", text: "Evitar que o time cometa erros."}] },
        { text: "13. Como você prefere aprender algo novo?", options: [{value: "D", text: "Na prática, errando e acertando."}, {value: "I", text: "Em debates com outras pessoas."}, {value: "S", text: "Com tutoriais e ritmo tranquilo."}, {value: "C", text: "Lendo manuais e artigos técnicos."}] },
        { text: "14. Quando alguém discorda de você:", options: [{value: "D", text: "Bato de frente para provar meu ponto."}, {value: "I", text: "Tento convencê-lo com carisma."}, {value: "S", text: "Prefiro ceder a brigar."}, {value: "C", text: "Apresento dados concretos."}] },
        { text: "15. O que um líder precisa ter?", options: [{value: "D", text: "Visão e ousadia."}, {value: "I", text: "Carisma e poder de inspirar."}, {value: "S", text: "Paciência e senso de justiça."}, {value: "C", text: "Conhecimento técnico profundo."}] },
        { text: "16. No tempo livre, você prefere:", options: [{value: "D", text: "Atividades competitivas ou esportes."}, {value: "I", text: "Sair com amigos e ir a eventos."}, {value: "S", text: "Ficar em casa relaxando."}, {value: "C", text: "Hobbies intelectuais ou organizar coisas."}] },
        { text: "17. Como você toma decisões financeiras?", options: [{value: "D", text: "Arrisco para ter lucro rápido."}, {value: "I", text: "Gasto com experiências e pessoas."}, {value: "S", text: "Guardo para ter segurança futura."}, {value: "C", text: "Calculo cada centavo antes de agir."}] },
        { text: "18. O que te irrita em outras pessoas?", options: [{value: "D", text: "Incompetência e enrolação."}, {value: "I", text: "Pessimismo e frieza."}, {value: "S", text: "Agressividade e egoísmo."}, {value: "C", text: "Falta de lógica e regras."}] },
        { text: "19. Qual seu papel em uma festa?", options: [{value: "D", text: "Decido onde ir e o que fazer."}, {value: "I", text: "Sou o centro das atenções."}, {value: "S", text: "Fico conversando com os mais próximos."}, {value: "C", text: "Observo e analiso o ambiente."}] },
        { text: "20. Ao delegar uma tarefa, você:", options: [{value: "D", text: "Digo o que quero e exijo prazo."}, {value: "I", text: "Vendo a ideia com entusiasmo."}, {value: "S", text: "Explico com calma e dou suporte."}, {value: "C", text: "Descrevo os mínimos detalhes exigidos."}] },
        { text: "21. Se algo dá errado, sua reação é:", options: [{value: "D", text: "Achar o culpado e resolver na hora."}, {value: "I", text: "Minimizar o problema e focar no lado bom."}, {value: "S", text: "Tentar consertar sem causar alarde."}, {value: "C", text: "Investigar a raiz do erro sistematicamente."}] },
        { text: "22. O ambiente ideal para você é:", options: [{value: "D", text: "Competitivo e focado em metas."}, {value: "I", text: "Alegre, solto e cheio de pessoas."}, {value: "S", text: "Estável, familiar e sem pressão."}, {value: "C", text: "Silencioso, organizado e com métodos."}] },
        { text: "23. Você prefere trabalhar com:", options: [{value: "D", text: "Poder e autoridade."}, {value: "I", text: "Liberdade de expressão."}, {value: "S", text: "Rotinas claras e segurança."}, {value: "C", text: "Padrões operacionais exatos."}] },
        { text: "24. Como lida com prazos curtos?", options: [{value: "D", text: "Adoro o desafio e acelero."}, {value: "I", text: "Fico agitado, mas dou um jeito."}, {value: "S", text: "Me sinto pressionado e ansioso."}, {value: "C", text: "Fico frustrado por não poder fazer perfeito."}] },
        { text: "25. Seu maior defeito costuma ser:", options: [{value: "D", text: "Ser impaciente e rude."}, {value: "I", text: "Ser desorganizado e esquecido."}, {value: "S", text: "Ter dificuldade em dizer 'não'."}, {value: "C", text: "Ser crítico demais com os outros."}] },
        { text: "26. Para você, regras são feitas para:", options: [{value: "D", text: "Serem quebradas se atrapalharem."}, {value: "I", text: "Serem usadas como sugestões flexíveis."}, {value: "S", text: "Manter a paz e a justiça para todos."}, {value: "C", text: "Garantir a ordem e devem ser seguidas à risca."}] },
        { text: "27. Se você ganha um prêmio, você:", options: [{value: "D", text: "Sinto que mereci pelo meu esforço."}, {value: "I", text: "Comemoro muito e posto nas redes."}, {value: "S", text: "Agradeço à equipe que me ajudou."}, {value: "C", text: "Analiso os critérios de avaliação."}] },
        { text: "28. O que você valoriza em um amigo?", options: [{value: "D", text: "Lealdade e honestidade brutal."}, {value: "I", text: "Senso de humor e energia."}, {value: "S", text: "Companheirismo e capacidade de ouvir."}, {value: "C", text: "Inteligência e conversas profundas."}] },
        { text: "29. Quando tem muitas coisas para fazer:", options: [{value: "D", text: "Faço as mais importantes primeiro."}, {value: "I", text: "Pulo de uma para outra sem terminar."}, {value: "S", text: "Faço uma de cada vez, no meu ritmo."}, {value: "C", text: "Crio uma lista detalhada e sigo a ordem."}] },
        { text: "30. O que significa sucesso para você?", options: [{value: "D", text: "Alcançar o topo e vencer desafios."}, {value: "I", text: "Ser popular e reconhecido pelas pessoas."}, {value: "S", text: "Ter estabilidade e uma vida tranquila."}, {value: "C", text: "Fazer um trabalho perfeito e ser especialista."}] }
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

        quizForm.innerHTML = q.options.map((opt) => `
            <label class="block cursor-pointer">
                <input type="radio" name="resposta" value="${opt.value}" class="peer sr-only" ${userAnswers[currentIndex] === opt.value ? 'checked' : ''}>
                <div class="w-full p-4 rounded-xl border-2 border-gray-200 peer-checked:border-brand-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-all">
                    <span class="text-gray-600 font-bold peer-checked:text-brand-900">${opt.text}</span>
                </div>
            </label>
        `).join('');

        const progressoPercentual = ((currentIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progressoPercentual}%`;
        progressText.textContent = `Pergunta ${currentIndex + 1} de 30`;

        btnVoltar.classList.toggle('hidden', currentIndex === 0);
        btnProxima.innerHTML = currentIndex === questions.length - 1 ? 'Finalizar <i class="fa-solid fa-check ml-2"></i>' : 'Próxima <i class="fa-solid fa-arrow-right ml-2"></i>';
    }

    btnProxima.onclick = async () => {
        const selected = document.querySelector('input[name="resposta"]:checked');
        if (!selected) return alert("Selecione uma alternativa.");

        userAnswers[currentIndex] = selected.value;

        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderQuestion();
        } else {
            const pontuacao = { D: 0, I: 0, S: 0, C: 0 };
            userAnswers.forEach(r => pontuacao[r]++);

            let perfilPredominante = 'D';
            let maxScore = pontuacao['D'];
            for (const p in pontuacao) { if (pontuacao[p] > maxScore) { maxScore = pontuacao[p]; perfilPredominante = p; } }

            btnProxima.disabled = true;
            btnProxima.textContent = "Salvando...";

            try {
                await fetch('/api/testes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, perfilPredominante, pontuacao })
                });

                localStorage.setItem('synthera_resultado_final', perfilPredominante);
                window.location.href = 'painel.html';
            } catch (error) {
                alert("Erro ao salvar resultado.");
                btnProxima.disabled = false;
            }
        }
    };

    btnVoltar.onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
    renderQuestion();
}

// ==========================================
// 4. LÓGICA DO PAINEL DO ALUNO (HIGHTEC)
// ==========================================
function initPainel() {
    const nome = localStorage.getItem('synthera_user_nome');
    const perfil = localStorage.getItem('synthera_resultado_final');

    if(!perfil) {
        alert("Autenticação requerida. Conclua o teste primeiro.");
        window.location.href = 'teste.html';
        return;
    }

    if(nome) document.getElementById('aluno-nome').textContent = nome.split(' ')[0];

    const perfisDados = {
        'D': {
            titulo: "DOMINÂNCIA (D)",
            desc: "Foco extremo em resultados e metas. Operação em cenários de alta pressão validada. Perfil de liderança executiva detectado.",
            forcas: ["<i class='fa-solid fa-bolt text-red-500 mr-2'></i> Resolução Crítica de Problemas", "<i class='fa-solid fa-bolt text-red-500 mr-2'></i> Foco Direcionado a Metas", "<i class='fa-solid fa-bolt text-red-500 mr-2'></i> Gerenciamento de Crises"],
            cor: "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]",
            icone: "fa-fire text-red-400",
            cursos: [{ nome: "Gestão Ágil (Scrum/Kanban)", area: "Gerenciamento" }, { nome: "Empreendedorismo Digital", area: "Negócios" }]
        },
        'I': {
            titulo: "INFLUÊNCIA (I)",
            desc: "Alta capacidade de persuasão e comunicação. Habilidade de network e engajamento de equipes operacionais validada.",
            forcas: ["<i class='fa-solid fa-satellite-dish text-yellow-400 mr-2'></i> Comunicação Assertiva", "<i class='fa-solid fa-satellite-dish text-yellow-400 mr-2'></i> Construção de Networking", "<i class='fa-solid fa-satellite-dish text-yellow-400 mr-2'></i> Resolução de Conflitos"],
            cor: "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]",
            icone: "fa-satellite-dish text-yellow-400",
            cursos: [{ nome: "Customer Success (CS)", area: "Relacionamento" }, { nome: "Marketing Digital Acionável", area: "Comunicação" }]
        },
        'S': {
            titulo: "ESTABILIDADE (S)",
            desc: "Perfil de altíssima confiabilidade e lealdade. Operação consistente em rotinas processuais. Ponto focal de segurança da equipe.",
            forcas: ["<i class='fa-solid fa-shield-halved text-emerald-400 mr-2'></i> Operação Consistente", "<i class='fa-solid fa-shield-halved text-emerald-400 mr-2'></i> Escuta Ativa e Suporte", "<i class='fa-solid fa-shield-halved text-emerald-400 mr-2'></i> Gestão de Rotinas"],
            cor: "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
            icone: "fa-shield-halved text-emerald-400",
            cursos: [{ nome: "Suporte Técnico N1/N2", area: "Infraestrutura TI" }, { nome: "Assistência Administrativa Avançada", area: "Operações" }]
        },
        'C': {
            titulo: "CONFORMIDADE (C)",
            desc: "Capacidade analítica superior. Tomada de decisão fundamentada em dados (Data-Driven). Foco total em qualidade e compliance.",
            forcas: ["<i class='fa-solid fa-microchip text-blue-500 mr-2'></i> Análise de Dados Complexos", "<i class='fa-solid fa-microchip text-blue-500 mr-2'></i> Controle de Qualidade (QA)", "<i class='fa-solid fa-microchip text-blue-500 mr-2'></i> Otimização de Processos"],
            cor: "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
            icone: "fa-microchip text-blue-400",
            cursos: [{ nome: "Análise de Dados (SQL/Excel)", area: "Data Science Base" }, { nome: "Lógica de Programação", area: "Engenharia de Software" }]
        }
    };

    const meuPerfil = perfisDados[perfil];
    
    document.getElementById('perfil-titulo').textContent = meuPerfil.titulo;
    document.getElementById('perfil-desc').textContent = meuPerfil.desc;
    document.getElementById('perfil-icone').innerHTML = `<i class="fa-solid ${meuPerfil.icone}"></i>`;
    document.getElementById('card-color').className = `absolute top-0 left-0 w-full h-1 ${meuPerfil.cor}`;
    document.getElementById('perfil-forcas').innerHTML = meuPerfil.forcas.map(f => `<li>${f}</li>`).join('');

    document.getElementById('trilha-cursos').innerHTML = meuPerfil.cursos.map(c => `
        <div class="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
            <span class="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">${c.area}</span>
            <h4 class="font-bold text-lg text-slate-200 mb-4 group-hover:text-white transition-colors">${c.nome}</h4>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
                <div class="bg-slate-600 h-full w-0 group-hover:w-full transition-all duration-1000"></div>
            </div>
            <span class="text-xs font-bold text-blue-500 flex items-center gap-2 uppercase tracking-widest">Iniciar Deploy <i class="fa-solid fa-chevron-right text-[10px]"></i></span>
        </div>
    `).join('');
}