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
    const confirmEmailBox = document.getElementById('confirm-email-box');
    const termosBox = document.getElementById('termos-box');
    const btnSubmit = document.getElementById('btn-submit');
    
    const toggleSenha = document.getElementById('toggle-senha');
    const senhaInput = document.getElementById('senha');
    const eyeIcon = document.getElementById('eye-icon');
    
    const cepInput = document.getElementById('cep');
    const ruaInput = document.getElementById('rua');
    const bairroInput = document.getElementById('bairro');
    const cidadeUfInput = document.getElementById('cidade-uf');
    
    let isLogin = true;
    let tipoSelecionado = 'aluno';
    let cidadeDetectada = '';
    let estadoDetectado = '';

    // Lógica do Olhinho (Ver Senha) - Ajustado para touch
    if(toggleSenha && senhaInput) {
        toggleSenha.onclick = (e) => {
            e.preventDefault();
            const isPassword = senhaInput.type === "password";
            senhaInput.type = isPassword ? "text" : "password";
            if (eyeIcon) {
                eyeIcon.classList.toggle('fa-eye', !isPassword);
                eyeIcon.classList.toggle('fa-eye-slash', isPassword);
            }
        };
    }

    if(btnGestor) {
        btnGestor.onclick = () => {
            tipoSelecionado = 'gestor';
            isLogin = true;
            btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
            btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
            authTabs?.classList.add('hidden');
            registerFields?.classList.add('hidden');
            confirmEmailBox?.classList.add('hidden');
            termosBox?.classList.add('hidden');
            btnSubmit.innerHTML = "Entrar como Gestor";
        };
    }

    if(btnAluno) {
        btnAluno.onclick = () => {
            tipoSelecionado = 'aluno';
            btnAluno.className = "flex-1 py-3 rounded-xl text-sm font-bold bg-white text-blue-600 shadow-sm transition-all";
            btnGestor.className = "flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 transition-all";
            authTabs?.classList.remove('hidden');
            tabLogin?.click(); 
        };
    }

    if(tabLogin) tabLogin.onclick = () => { 
        isLogin = true; 
        registerFields?.classList.add('hidden'); 
        confirmEmailBox?.classList.add('hidden');
        termosBox?.classList.add('hidden');
        tabLogin.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600"; 
        tabRegister.className = "flex-1 pb-3 text-sm font-bold text-slate-400"; 
        btnSubmit.innerHTML = "Acessar Plataforma";
    };
    
    if(tabRegister) tabRegister.onclick = () => { 
        isLogin = false; 
        registerFields?.classList.remove('hidden'); 
        confirmEmailBox?.classList.remove('hidden');
        termosBox?.classList.remove('hidden');
        tabRegister.className = "flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600"; 
        tabLogin.className = "flex-1 pb-3 text-sm font-bold text-slate-400"; 
        btnSubmit.innerHTML = "Criar Conta Segura";
    };

    // ViaCEP Robusto
    if(cepInput) {
        cepInput.addEventListener('blur', async (e) => {
            let cep = e.target.value.replace(/\D/g, '');
            if(cep.length === 8) {
                if(cidadeUfInput) cidadeUfInput.value = "Buscando...";
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await res.json();
                    if(!data.erro) {
                        cidadeDetectada = data.localidade;
                        estadoDetectado = data.uf;
                        if(cidadeUfInput) cidadeUfInput.value = `${cidadeDetectada} - ${estadoDetectado}`;
                        if(ruaInput) ruaInput.value = data.logradouro || '';
                        if(bairroInput) bairroInput.value = data.bairro || '';
                    } else {
                        if(cidadeUfInput) cidadeUfInput.value = "CEP não encontrado";
                    }
                } catch(err) { console.error(err); }
            }
        });
    }

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const payload = { email, senha, tipo: tipoSelecionado };

        if (!isLogin) {
            const confirmEmail = document.getElementById('confirm-email')?.value;
            if (email !== confirmEmail) return alert("Os e-mails não coincidem!");

            const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
            if(!senhaRegex.test(senha)) return alert("A senha deve ter 8+ caracteres, com letras e números.");

            const termos = document.getElementById('termos')?.checked;
            if(!termos) return alert("Aceite os termos da LGPD.");

            payload.nome = document.getElementById('nome').value;
            payload.cpf = document.getElementById('cpf').value;
            payload.cep = cepInput.value;
            payload.rua = ruaInput?.value;
            payload.bairro = bairroInput?.value;
            payload.cidade = cidadeDetectada;
            payload.estado = estadoDetectado;
            payload.numero = document.getElementById('numero').value;
            payload.complemento = document.getElementById('complemento')?.value;
            payload.termos = termos;
        }

        try {
            btnSubmit.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i>";
            btnSubmit.disabled = true;
            const res = await fetch(isLogin ? '/api/login' : '/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro no servidor");

            localStorage.setItem('synthera_user_id', data.userId);
            localStorage.setItem('synthera_user_tipo', data.tipo);
            localStorage.setItem('synthera_user_nome', data.nome || '');
            window.location.href = data.tipo === 'gestor' ? 'admin.html' : 'teste.html';
        } catch (error) {
            alert(error.message);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = "Tentar Novamente";
        }
    };
}

// ==========================================
// 2. LÓGICA DO PAINEL GESTOR (ROBUSTO)
// ==========================================
async function initAdmin() {
    if (localStorage.getItem('synthera_user_tipo') !== 'gestor') { window.location.href = 'login.html'; return; }
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        
        const ids = ['kpi-alunos', 'kpi-testes', 'kpi-ativos'];
        ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).textContent = data[id.split('-')[1]] || data.totalAlunos || 0; });
        // Ajuste específico para o nome da propriedade que vem do back
        if(document.getElementById('kpi-alunos')) document.getElementById('kpi-alunos').textContent = data.totalAlunos;
        if(document.getElementById('kpi-testes')) document.getElementById('kpi-testes').textContent = data.totalTestes;

        const cores = { D: { bg: 'bg-red-500' }, I: { bg: 'bg-yellow-400' }, S: { bg: 'bg-emerald-500' }, C: { bg: 'bg-blue-500' } };
        
        const container = document.getElementById('chart-container');
        if(container) {
            container.innerHTML = data.distribuicao.map(p => `
                <div>
                    <div class="flex justify-between text-xs font-bold mb-2"><span>Perfil ${p.label}</span><span>${p.value} Alunos</span></div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div class="${cores[p.label]?.bg || 'bg-slate-500'} h-full transition-all" style="width: ${(p.value / data.totalTestes) * 100}%"></div></div>
                </div>
            `).join('');
        }

        const mapContainer = document.getElementById('geo-map');
        if(mapContainer) {
            const regioes = {};
            data.ultimosTestes.forEach(t => { if(t.cidade) { const k = `${t.cidade}-${t.estado}`; regioes[k] = (regioes[k] || 0) + 1; }});
            mapContainer.innerHTML = Object.keys(regioes).map(r => `
                <div class="flex justify-between bg-white/5 p-2 rounded-lg text-xs"><span>${r}</span><span class="text-emerald-400">${regioes[r]} Acessos</span></div>
            `).join('');
        }

        const tabela = document.getElementById('tabela-testes');
        if(tabela) {
            tabela.innerHTML = data.ultimosTestes.map(t => `
                <tr class="border-b border-slate-800 text-xs">
                    <td class="py-4 font-bold text-white">${t.nome}<br><span class="text-[10px] text-slate-500">${t.cidade || 'Privado'}</span></td>
                    <td class="py-4"><span class="px-2 py-1 rounded bg-slate-700">${t.perfil_predominante}</span></td>
                    <td class="py-4 text-right">${new Date(t.data_realizacao).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (err) { console.error(err); }
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
        { text: "21. Se algo dá errado, sua reação é:", options: [{value: "D", text: "Achar o culpado e resolver na hora."}, {value: "I", text: "Minimizar o problem e focar no lado bom."}, {value: "S", text: "Tentar consertar sem causar alarde."}, {value: "C", text: "Investigar a raiz do erro sistematicamente."}] },
        { text: "22. O ambiente ideal para você é:", options: [{value: "D", text: "Competitivo e focado em metas."}, {value: "I", text: "Alegre, solto e cheio de pessoas."}, {value: "S", text: "Estável, familiar e sem pressão."}, {value: "C", text: "Silencioso, organizado e com métodos."}] },
        { text: "23. Você prefere trabalhar com:", options: [{value: "D", text: "Poder e autoridade."}, {value: "I", text: "Liberdade de expressão."}, {value: "S", text: "Rotinas claras e segurança."}, {value: "C", text: "Padrões operacionais exatos."}] },
        { text: "24. Como lida com prazos curtos?", options: [{value: "D", text: "Adoro o desafio e acelero."}, {value: "I", text: "Fico agitado, mas dou um jeito."}, {value: "S", text: "Me sinto pressionado e ansioso."}, {value: "C", text: "Fico frustrado por não poder fazer perfeito."}] },
        { text: "25. Seu maior defeito costuma ser:", options: [{value: "D", text: "Ser impaciente e rude."}, {value: "I", text: "Ser desorganizado e esquecido."}, {value: "S", text: "Ter dificuldade em dizer 'no'."}, {value: "C", text: "Ser crítico demais com os outros."}] },
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
        if(!questionText || !quizForm) return;
        const q = questions[currentIndex];
        questionText.textContent = q.text;
        quizForm.innerHTML = q.options.map((opt) => `
            <label class="block cursor-pointer">
                <input type="radio" name="resposta" value="${opt.value}" class="peer sr-only" ${userAnswers[currentIndex] === opt.value ? 'checked' : ''}>
                <div class="w-full p-4 rounded-xl border-2 border-slate-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
                    <span class="font-bold text-slate-700">${opt.text}</span>
                </div>
            </label>
        `).join('');
        if(progressBar) progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
        if(progressText) progressText.textContent = `Pergunta ${currentIndex + 1} de 30`;
        btnVoltar?.classList.toggle('hidden', currentIndex === 0);
    }

    btnProxima?.addEventListener('click', async () => {
        const sel = document.querySelector('input[name="resposta"]:checked');
        if(!sel) return alert("Selecione uma opção.");
        userAnswers[currentIndex] = sel.value;
        if(currentIndex < questions.length - 1) { currentIndex++; renderQuestion(); }
        else {
            const scores = { D: 0, I: 0, S: 0, C: 0 };
            userAnswers.forEach(v => scores[v]++);
            let pred = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
            try {
                await fetch('/api/testes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, perfilPredominante: pred, pontuacao: scores }) });
                localStorage.setItem('synthera_resultado_final', pred);
                window.location.href = 'painel.html';
            } catch(e) { alert("Erro ao salvar teste."); }
        }
    });

    btnVoltar?.addEventListener('click', () => { if(currentIndex > 0) { currentIndex--; renderQuestion(); } });
    renderQuestion();
}

// ==========================================
// 4. LÓGICA DO PAINEL DO ALUNO (HIGHTEC)
// ==========================================
function initPainel() {
    const nome = localStorage.getItem('synthera_user_nome');
    const perfil = localStorage.getItem('synthera_resultado_final');
    if(!perfil) { window.location.href = 'teste.html'; return; }
    
    if(document.getElementById('aluno-nome')) document.getElementById('aluno-nome').textContent = nome.split(' ')[0];

    const dados = {
        'D': { t: "DOMINÂNCIA (D)", d: "Perfil focado em resultados rápidos.", f: ["Decisão Ágil", "Foco em Metas"], c: "bg-red-500", i: "fa-fire" },
        'I': { t: "INFLUÊNCIA (I)", d: "Perfil comunicador e persuasivo.", f: ["Networking", "Entusiasmo"], c: "bg-yellow-400", i: "fa-satellite-dish" },
        'S': { t: "ESTABILIDADE (S)", d: "Perfil paciente e confiável.", f: ["Lealdade", "Rotina"], c: "bg-emerald-500", i: "fa-shield-halved" },
        'C': { t: "CONFORMIDADE (C)", d: "Perfil analítico e detalhista.", f: ["Precisão", "Lógica"], c: "bg-blue-500", i: "fa-microchip" }
    };

    const meu = dados[perfil];
    if(document.getElementById('perfil-titulo')) document.getElementById('perfil-titulo').textContent = meu.t;
    if(document.getElementById('perfil-desc')) document.getElementById('perfil-desc').textContent = meu.d;
    if(document.getElementById('card-color')) document.getElementById('card-color').className = `absolute top-0 left-0 w-full h-1 ${meu.c}`;
    if(document.getElementById('perfil-icone')) document.getElementById('perfil-icone').innerHTML = `<i class="fa-solid ${meu.i}"></i>`;
    if(document.getElementById('perfil-forcas')) document.getElementById('perfil-forcas').innerHTML = meu.f.map(x => `<li>${x}</li>`).join('');
}