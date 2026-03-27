import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ SUAS CREDENCIAIS CONFIGURADAS
const firebaseConfig = {
  apiKey: "AIzaSyBwcdzvWnGOBwvjpEtIUq1dJgCJCCv-80M",
  authDomain: "synthera-18b49.firebaseapp.com",
  projectId: "synthera-18b49",
  storageBucket: "synthera-18b49.firebasestorage.app",
  messagingSenderId: "682531889100",
  appId: "1:682531889100:web:a798159da682470f9ac769",
  measurementId: "G-QGE0B7HJV4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Monitor de Sessão e Dropdown
onAuthStateChanged(auth, async (user) => {
    if (user) {
        localStorage.setItem('synthera_user_id', user.uid);
        const dropdownName = document.getElementById('dropdown-user-name');
        if (dropdownName) dropdownName.textContent = localStorage.getItem('synthera_user_nome') || 'Usuário';
    }
});

// Lógica Global Dropdown
document.addEventListener('click', (e) => {
    const menuBtn = document.getElementById('user-menu-button');
    const dropdown = document.getElementById('user-dropdown');
    if (menuBtn && dropdown) {
        if (menuBtn.contains(e.target)) {
            dropdown.classList.toggle('hidden');
            const linkPerfil = document.getElementById('link-perfil');
            if(linkPerfil && localStorage.getItem('synthera_user_tipo') === 'gestor') linkPerfil.href = 'perfil-gestor.html';
        } else if (!dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    }
});

window.logout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('login.html')) initLogin();
    else if (path.includes('admin.html')) initAdmin();
    else if (path.includes('teste.html')) initTest();
    else if (path.includes('painel.html')) initPainel();
    else if (path.includes('perfil.html')) initPerfil();
    else if (path.includes('perfil-gestor.html')) initPerfilGestor();
});

// ==========================================
// 1. LOGIN E CADASTRO (FIREBASE)
// ==========================================
function initLogin() {
    const authForm = document.getElementById('auth-form');
    if(!authForm) return;

    const btnSubmit = document.getElementById('btn-submit');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    let isLogin = true;
    let tipoSelecionado = 'aluno';

    // Toggle Abas
    if(tabLogin) tabLogin.onclick = () => { isLogin = true; btnSubmit.innerHTML = "Acessar Plataforma"; };
    if(tabRegister) tabRegister.onclick = () => { isLogin = false; btnSubmit.innerHTML = "Criar Conta Segura"; };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i>";

        try {
            if (isLogin) {
                const userCred = await signInWithEmailAndPassword(auth, email, senha);
                const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
                
                if (userDoc.exists()) {
                    localStorage.setItem('synthera_user_tipo', userDoc.data().tipo);
                    localStorage.setItem('synthera_user_nome', userDoc.data().nome);
                    window.location.href = userDoc.data().tipo === 'gestor' ? 'admin.html' : 'painel.html';
                }
            } else {
                const userCred = await createUserWithEmailAndPassword(auth, email, senha);
                const userData = {
                    nome: document.getElementById('nome').value,
                    email: email,
                    tipo: 'aluno',
                    cidade: document.getElementById('cidade-uf')?.value || 'Não informado',
                    whatsapp: "", bio: "", data_cadastro: serverTimestamp()
                };
                await setDoc(doc(db, "users", userCred.user.uid), userData);
                localStorage.setItem('synthera_user_tipo', 'aluno');
                localStorage.setItem('synthera_user_nome', userData.nome);
                window.location.href = 'teste.html';
            }
        } catch (err) {
            alert("Falha: " + err.message);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = "Tentar Novamente";
        }
    };
}

// ==========================================
// 2. PERFIL (FIRESTORE)
// ==========================================
async function initPerfil() {
    const uid = localStorage.getItem('synthera_user_id');
    if (!uid) return;
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const data = userDoc.data();
        document.getElementById('display-nome').textContent = data.nome;
        document.getElementById('perfil-nome').value = data.nome;
        document.getElementById('perfil-phone').value = data.whatsapp || '';
        document.getElementById('perfil-bio').value = data.bio || '';

        document.getElementById('perfil-form').onsubmit = async (e) => {
            e.preventDefault();
            await updateDoc(doc(db, "users", uid), {
                nome: document.getElementById('perfil-nome').value,
                whatsapp: document.getElementById('perfil-phone').value,
                bio: document.getElementById('perfil-bio').value
            });
            alert("Perfil salvo com sucesso!");
        };
    } catch(err) { console.error(err); }
}

// ==========================================
// 3. ADMIN (DADOS REAIS DO CLOUD)
// ==========================================
async function initAdmin() {
    const qTestes = await getDocs(collection(db, "disc_results"));
    const qAlunos = await getDocs(query(collection(db, "users"), where("tipo", "==", "aluno")));
    if(document.getElementById('kpi-alunos')) document.getElementById('kpi-alunos').textContent = qAlunos.size;
    if(document.getElementById('kpi-testes')) document.getElementById('kpi-testes').textContent = qTestes.size;
}

// ==========================================
// 4. TESTE DISC (CLOUD SAVE)
// ==========================================
function initTest() {
    const userId = localStorage.getItem('synthera_user_id');
    let currentIndex = 0;
    let userAnswers = [];

    // Array de perguntas reduzido para exemplo (adicione as outras 29)
    const questions = [
        { text: "1. Como você se descreve em um grupo novo?", options: [{value: "D", text: "Tomo a frente das decisões."}, {value: "I", text: "Faço amizades rapidamente."}, {value: "S", text: "Observo antes de interagir."}, {value: "C", text: "Avalio as regras e o ambiente."}] }
    ];

    const questionText = document.getElementById('question-text');
    const quizForm = document.getElementById('quiz-form');
    const btnProxima = document.getElementById('btn-proxima');

    window.startQuiz = () => {
        document.getElementById('intro-screen').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');
        renderQuestion();
    };

    function renderQuestion() {
        const q = questions[currentIndex];
        questionText.textContent = q.text;
        quizForm.innerHTML = q.options.map(o => `
            <label class="block cursor-pointer mb-3">
                <input type="radio" name="resposta" value="${o.value}" class="peer sr-only">
                <div class="p-4 border-2 border-slate-100 rounded-xl peer-checked:border-blue-500 peer-checked:bg-blue-50 font-bold text-slate-600">${o.text}</div>
            </label>`).join('');
    }

    btnProxima?.addEventListener('click', async () => {
        const sel = document.querySelector('input[name="resposta"]:checked');
        if(!sel) return alert("Escolha uma opção.");
        userAnswers[currentIndex] = sel.value;

        if(currentIndex < questions.length - 1) { currentIndex++; renderQuestion(); }
        else {
            const scores = { D:0, I:0, S:0, C:0 };
            userAnswers.forEach(v => scores[v]++);
            const pred = Object.keys(scores).reduce((a,b) => scores[a] > scores[b] ? a : b);
            
            await setDoc(doc(db, "disc_results", userId), {
                user_id: userId, perfil_predominante: pred, scores, data_realizacao: serverTimestamp()
            });
            localStorage.setItem('synthera_resultado_final', pred);
            window.location.href = 'painel.html';
        }
    });
}

document.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-logout')) {
        await auth.signOut();
        localStorage.clear();
        window.location.href = 'index.html';
    }
});