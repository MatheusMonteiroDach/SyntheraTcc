const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('teste.html')) initTest();
    else if (path.includes('relatorio.html')) initReport();
});

function initLogin() {
    const authForm = document.getElementById('auth-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const nameField = document.getElementById('name-field');
    let isLogin = true;

    tabLogin.onclick = () => { isLogin = true; nameField.classList.add('hidden'); tabLogin.className = "flex-1 pb-3 text-sm font-bold text-brand-500 border-b-2 border-brand-500"; tabRegister.className = "flex-1 pb-3 text-sm font-bold text-gray-400"; };
    tabRegister.onclick = () => { isLogin = false; nameField.classList.remove('hidden'); tabRegister.className = "flex-1 pb-3 text-sm font-bold text-brand-500 border-b-2 border-brand-500"; tabLogin.className = "flex-1 pb-3 text-sm font-bold text-gray-400"; };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            ...(isLogin ? {} : { nome: document.getElementById('nome').value })
        };
        try {
            const res = await fetch(`${API_URL}${isLogin ? '/login' : '/register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) return alert(data.erro);
            localStorage.setItem('synthera_user_id', data.userId);
            localStorage.setItem('synthera_user_nome', data.nome);
            window.location.href = 'painel.html'; // Vai para o painel agora!
        } catch { alert('Erro de conexão.'); }
    };
}

function initTest() {
    const userId = localStorage.getItem('synthera_user_id');
    if (!userId) return window.location.href = 'login.html';

    const perguntas = [
        { titulo: "1. Como você costuma agir sob pressão?", opcoes: [{texto: "Assumo o controle e resolvo rápido.", valor: "D"}, {texto: "Mantenho o otimismo e engajo o time.", valor: "I"}, {texto: "Sigo o plano passo a passo.", valor: "S"}, {texto: "Analiso dados antes de decidir.", valor: "C"}] },
        { titulo: "2. Em um projeto em grupo, você geralmente:", opcoes: [{texto: "Garanto que regras sejam seguidas.", valor: "C"}, {texto: "Lidero e cobro resultados.", valor: "D"}, {texto: "Evito conflitos e apoio colegas.", valor: "S"}, {texto: "Animo e dou ideias criativas.", valor: "I"}] },
        { titulo: "3. O que mais te motiva no trabalho?", opcoes: [{texto: "Reconhecimento e interação social.", valor: "I"}, {texto: "Segurança e rotina clara.", valor: "S"}, {texto: "Desafios e poder de decisão.", valor: "D"}, {texto: "Qualidade e métodos precisos.", valor: "C"}] },
        { titulo: "4. Ao lidar com mudanças repentinas:", opcoes: [{texto: "Vejo como chance de inovar.", valor: "D"}, {texto: "Tento vender a ideia aos outros.", valor: "I"}, {texto: "Prefiro adaptações graduais.", valor: "S"}, {texto: "Questiono a lógica da mudança.", valor: "C"}] },
        { titulo: "5. Como você toma decisões importantes?", opcoes: [{texto: "Baseado em fatos e números.", valor: "C"}, {texto: "De forma rápida e assertiva.", valor: "D"}, {texto: "Buscando o consenso da equipe.", valor: "S"}, {texto: "Considerando o impacto nas pessoas.", valor: "I"}] },
        { titulo: "6. Qual a sua maior força na comunicação?", opcoes: [{texto: "Sou direto e objetivo.", valor: "D"}, {texto: "Sou persuasivo e carismático.", valor: "I"}, {texto: "Sou um bom ouvinte e empático.", valor: "S"}, {texto: "Sou estruturado e embasado.", valor: "C"}] },
        { titulo: "7. Quando alguém discorda de você:", opcoes: [{texto: "Debato para provar meu ponto.", valor: "D"}, {texto: "Uso humor e persuasão.", valor: "I"}, {texto: "Busco um meio-termo pacífico.", valor: "S"}, {texto: "Apresento evidências concretas.", valor: "C"}] },
        { titulo: "8. Seu ritmo de trabalho ideal é:", opcoes: [{texto: "Acelerado e voltado para ação.", valor: "D"}, {texto: "Dinâmico e interativo.", valor: "I"}, {texto: "Constante e previsível.", valor: "S"}, {texto: "Metódico e detalhista.", valor: "C"}] },
        { titulo: "9. O que mais te irrita nos outros?", opcoes: [{texto: "Lentidão e indecisão.", valor: "D"}, {texto: "Frieza e excesso de formalidade.", valor: "I"}, {texto: "Agressividade e falta de tato.", valor: "S"}, {texto: "Desorganização e erros bobos.", valor: "C"}] },
        { titulo: "10. Qual palavra melhor te descreve?", opcoes: [{texto: "Competitivo.", valor: "D"}, {texto: "Sociável.", valor: "I"}, {texto: "Confiável.", valor: "S"}, {texto: "Analítico.", valor: "C"}] },
        { titulo: "11. Ao iniciar uma tarefa complexa:", opcoes: [{texto: "Planejo cada detalhe antes.", valor: "C"}, {texto: "Começo logo para testar.", valor: "D"}, {texto: "Troco ideias com o time.", valor: "I"}, {texto: "Peço orientações claras.", valor: "S"}] },
        { titulo: "12. Sobre regras e procedimentos:", opcoes: [{texto: "São essenciais para qualidade.", valor: "C"}, {texto: "Questiono se atrasarem metas.", valor: "D"}, {texto: "São flexíveis conforme o caso.", valor: "I"}, {texto: "Dão segurança ao meu agir.", valor: "S"}] },
        { titulo: "13. Ao dar feedback, você é:", opcoes: [{texto: "Direto e focado no erro.", valor: "D"}, {texto: "Positivo e encorajador.", valor: "I"}, {texto: "Suave e cuidadoso.", valor: "S"}, {texto: "Específico com fatos reais.", valor: "C"}] },
        { titulo: "14. Sua área de trabalho é:", opcoes: [{texto: "Funcional e minimalista.", valor: "D"}, {texto: "Colorida e personalizada.", valor: "I"}, {texto: "Aconchegante e organizada.", valor: "S"}, {texto: "Impecável e categorizada.", valor: "C"}] },
        { titulo: "15. Diante de um risco alto:", opcoes: [{texto: "Abraço se valer a pena.", valor: "D"}, {texto: "Confio na minha improvisação.", valor: "I"}, {texto: "Escolho o caminho seguro.", valor: "S"}, {texto: "Calculo tudo minuciosamente.", valor: "C"}] },
        { titulo: "16. Se pedem para acelerar a entrega:", opcoes: [{texto: "Aceito e faço acontecer.", valor: "D"}, {texto: "Engajo o time no mutirão.", valor: "I"}, {texto: "Fico tenso com a pressa.", valor: "S"}, {texto: "Aviso sobre riscos à qualidade.", valor: "C"}] },
        { titulo: "17. Quer ser reconhecido por:", opcoes: [{texto: "Resultados e competência.", valor: "D"}, {texto: "Carisma e influência.", valor: "I"}, {texto: "Lealdade e dedicação.", valor: "S"}, {texto: "Expertise e perfeccionismo.", valor: "C"}] },
        { titulo: "18. Em eventos sociais, você:", opcoes: [{texto: "Foco em contatos úteis.", valor: "D"}, {texto: "Falo com todos e me divirto.", valor: "I"}, {texto: "Fico com quem já conheço.", valor: "S"}, {texto: "Observo mais do que falo.", valor: "C"}] },
        { titulo: "19. Sobre detalhes no projeto:", opcoes: [{texto: "Delego para focar no geral.", valor: "D"}, {texto: "Esqueço se não anotar.", valor: "I"}, {texto: "Faço com calma pelo time.", valor: "S"}, {texto: "São a parte mais importante.", valor: "C"}] },
        { titulo: "20. O que te causa mais estresse?", opcoes: [{texto: "Perder o controle das coisas.", valor: "D"}, {texto: "Rejeição ou isolamento.", valor: "I"}, {texto: "Conflitos e caos no time.", valor: "S"}, {texto: "Críticas ao meu método.", valor: "C"}] },
        { titulo: "21. Para aprender algo novo:", opcoes: [{texto: "Testo tudo na prática agora.", valor: "D"}, {texto: "Peço para alguém me ensinar.", valor: "I"}, {texto: "Sigo tutoriais com calma.", valor: "S"}, {texto: "Leio manuais e teorias.", valor: "C"}] },
        { titulo: "22. Seu papel natural no time:", opcoes: [{texto: "Comandante (direciona).", valor: "D"}, {texto: "Motivador (integra).", valor: "I"}, {texto: "Apoio (ajuda a todos).", valor: "S"}, {texto: "Analista (revisa tudo).", valor: "C"}] },
        { titulo: "23. Projeto ideal para você:", opcoes: [{texto: "Desafiador e autônomo.", valor: "D"}, {texto: "Criativo e com visibilidade.", valor: "I"}, {texto: "Estruturado e útil ao próximo.", valor: "S"}, {texto: "Técnico e baseado em dados.", valor: "C"}] },
        { titulo: "24. Como reage ao erro:", opcoes: [{texto: "Fico impaciente e corrijo.", valor: "D"}, {texto: "Levo leve e aprendo.", valor: "I"}, {texto: "Ofereço ajuda generosa.", valor: "S"}, {texto: "Analiso a causa raiz.", valor: "C"}] },
        { titulo: "25. Postura e tom de voz:", opcoes: [{texto: "Firme e gestos rápidos.", valor: "D"}, {texto: "Animado e expressivo.", valor: "I"}, {texto: "Calmo e movimentos suaves.", valor: "S"}, {texto: "Contido e voz controlada.", valor: "C"}] },
        { titulo: "26. Ao receber uma nova meta:", opcoes: [{texto: "Como podemos bater o recorde?", valor: "D"}, {texto: "Vamos engajar a galera nisso!", valor: "I"}, {texto: "É viável na nossa rotina?", valor: "S"}, {texto: "Quero ver os dados históricos.", valor: "C"}] },
        { titulo: "27. Ao delegar tarefas, você:", opcoes: [{texto: "Cobro apenas o resultado.", valor: "D"}, {texto: "Motivo e explico o porquê.", valor: "I"}, {texto: "Ensino e fico à disposição.", valor: "S"}, {texto: "Passo um checklist rígido.", valor: "C"}] },
        { titulo: "28. Maior medo profissional:", opcoes: [{texto: "Falhar e perder autonomia.", valor: "D"}, {texto: "Ser ignorado ou excluído.", valor: "I"}, {texto: "Instabilidade e mudanças.", valor: "S"}, {texto: "Ter meu saber questionado.", valor: "C"}] },
        { titulo: "29. Sobre multitarefas:", opcoes: [{texto: "Gosto, me sinto produtivo.", valor: "D"}, {texto: "Amo, odeio tédio.", valor: "I"}, {texto: "Não gosto, prefiro foco único.", valor: "S"}, {texto: "Faço, mas temo erros.", valor: "C"}] },
        { titulo: "30. Final de dia ideal:", opcoes: [{texto: "Planejar o amanhã.", valor: "D"}, {texto: "Sair com os amigos.", valor: "I"}, {texto: "Relaxar com a família.", valor: "S"}, {texto: "Revisar o que foi feito.", valor: "C"}] }
    ];

    let atual = 0;
    const scores = { D: 0, I: 0, S: 0, C: 0 };
    const respostas = [];

    const render = () => {
        const p = perguntas[atual];
        document.getElementById('question-text').textContent = p.titulo;
        document.getElementById('progress-text').textContent = `Pergunta ${atual+1} de 30`;
        document.getElementById('progress-bar').style.width = `${((atual+1)/30)*100}%`;
        const form = document.getElementById('quiz-form');
        form.innerHTML = p.opcoes.map(o => `<label class="block cursor-pointer fade-in"><input type="radio" name="resposta" value="${o.valor}" class="peer sr-only"><div class="w-full p-4 rounded-xl border-2 border-gray-200 peer-checked:border-brand-500 peer-checked:bg-blue-50 transition-all"><span class="text-gray-700 font-medium">${o.texto}</span></div></label>`).join('');
        const btn = document.getElementById('btn-proxima');
        btn.disabled = true;
        form.onchange = () => btn.disabled = false;
    };

    document.getElementById('btn-proxima').onclick = async () => {
        const sel = document.querySelector('input[name="resposta"]:checked').value;
        scores[sel]++;
        respostas.push(sel);
        if (++atual < 30) render();
        else {
            const dom = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
            const res = await fetch(`${API_URL}/testes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, perfilPredominante: dom, pontuacao: scores, respostasGlobais: respostas }) });
            if (res.ok) { localStorage.setItem('synthera_scores', JSON.stringify(scores)); window.location.href = 'relatorio.html'; }
        }
    };
    render();
}

function initReport() {
    const scores = JSON.parse(localStorage.getItem('synthera_scores'));
    const nome = localStorage.getItem('synthera_user_nome');
    if (!scores) return window.location.href = 'painel.html';
    document.getElementById('user-greeting').textContent = `Olá, ${nome}`;
    const dom = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    document.getElementById('perfil-letra').textContent = dom;
    ['D', 'I', 'S', 'C'].forEach(l => {
        const p = Math.round((scores[l]/30)*100);
        document.getElementById(`score-${l.toLowerCase()}-bar`).style.width = `${p}%`;
        document.getElementById(`score-${l.toLowerCase()}-text`).textContent = `${p}%`;
    });
}