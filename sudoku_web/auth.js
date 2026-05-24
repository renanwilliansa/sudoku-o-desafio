import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    set,
    update
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// ─── Firebase Setup ────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyDWs4ePrW6kZeG9zD3T51503s57YSmtouE",
    authDomain: "sudokuodesafio.firebaseapp.com",
    projectId: "sudokuodesafio",
    storageBucket: "sudokuodesafio.firebasestorage.app",
    messagingSenderId: "1006930057724",
    appId: "1:1006930057724:web:b8edbb960a8f137e873a79",
    databaseURL: "https://sudokuodesafio-default-rtdb.firebaseio.com"
};

// Reutiliza app já inicializado pelo game_net.js se existir
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const DIFFICULTIES = ['Facil', 'Medio', 'Dificil', 'Especialista', 'Radical'];
const DIFF_LABELS   = { Facil: 'Fácil', Medio: 'Médio', Dificil: 'Difícil', Especialista: 'Especialista', Radical: 'Radical' };
const POINTS_MAP    = { Facil: 10, Medio: 20, Dificil: 30, Especialista: 40, Radical: 50 };

// ─── DOM helpers ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── UI: perfil no header ──────────────────────────────────────────────────────
function updateHeaderAvatar(user, dbAvatar = null) {
    const btns = [$('profile-btn'), $('profile-btn-start')];
    btns.forEach(btn => {
        if (!btn) return;
        if (user) {
            if (dbAvatar) {
                btn.innerHTML = `<span style="font-size: ${btn.id==='profile-btn-start' ? '1.5rem' : '1.15rem'}; line-height: 1; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${dbAvatar}</span>`;
            } else {
                const initial = (user.displayName || user.email || '?')[0].toUpperCase();
                btn.innerHTML = `<span class="avatar-initial">${initial}</span>`;
            }
            btn.title = user.displayName || user.email;
            btn.classList.add('logged-in');
        } else {
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="${btn.id==='profile-btn-start'?24:18}" height="${btn.id==='profile-btn-start'?24:18}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            btn.title = 'Entrar';
            btn.classList.remove('logged-in');
        }
    });
}

// ─── UI: tela de início — seção de auth ────────────────────────────────────────
function updateStartScreenAuth(user, dbAvatar = null) {
    const guestSection  = $('auth-guest-section');
    const loggedSection = $('auth-logged-section');
    const userName      = $('auth-user-name');
    const userEmail     = $('auth-user-email');
    const cardAvatar    = $('user-card-avatar');
    if (!guestSection || !loggedSection) return;

    if (user) {
        guestSection.classList.add('hidden');
        loggedSection.classList.remove('hidden');
        if (userName)  userName.textContent  = user.displayName || 'Jogador';
        if (userEmail) userEmail.textContent = user.email || '';
        if (cardAvatar) {
            if (dbAvatar) {
                cardAvatar.innerHTML = `<span style="font-size: 2rem;">${dbAvatar}</span>`;
                cardAvatar.style.background = 'transparent';
                cardAvatar.style.boxShadow = 'none';
            } else {
                const initial = (user.displayName || user.email || '?')[0].toUpperCase();
                cardAvatar.textContent = initial;
                cardAvatar.style.background = '';
                cardAvatar.style.boxShadow = '';
            }
        }
    } else {
        guestSection.classList.remove('hidden');
        loggedSection.classList.add('hidden');
    }
}

// ─── Stats: carregar e exibir ──────────────────────────────────────────────────
async function loadAndShowStats(user) {
    const tbody = $('stats-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color: var(--text-secondary);">${window.t ? window.t('stats-loading') : 'Carregando...'}</td></tr>`;

    let stats = {};
    let points = 0;
    try {
        const snap = await get(ref(db, `users/${user.uid}/stats`));
        if (snap.exists()) stats = snap.val();

        const pointsSnap = await get(ref(db, `users/${user.uid}/points`));
        if (pointsSnap.exists()) points = pointsSnap.val();
    } catch(e) {
        console.warn('Erro ao carregar stats:', e);
    }

    tbody.innerHTML = '';
    let totalWins = 0, totalGames = 0;

    DIFFICULTIES.forEach(diff => {
        const s = stats[diff] || { wins: 0, games: 0, bestTime: null };
        const wins  = s.wins  || 0;
        const games = s.games || 0;
        totalWins  += wins;
        totalGames += games;
        const rate  = games > 0 ? Math.round((wins / games) * 100) : 0;
        const best  = s.bestTime ? formatTime(s.bestTime) : '—';

        const diffKeys = { Facil: 'diff-easy', Medio: 'diff-medium', Dificil: 'diff-hard', Especialista: 'diff-expert', Radical: 'diff-extreme' };
        const label = window.t && diffKeys[diff] ? window.t(diffKeys[diff]) : DIFF_LABELS[diff];

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${label}</td>
            <td><span class="stat-wins">${wins}</span></td>
            <td>${games}</td>
            <td>
                <div class="stat-rate-bar-wrap">
                    <div class="stat-rate-bar" style="width:${rate}%"></div>
                    <span>${rate}%</span>
                </div>
            </td>
            <td>${best}</td>
        `;
        tbody.appendChild(tr);
    });

    // Linha de total
    const totalRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    const tfoot = $('stats-tfoot');
    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td><strong>${window.t ? window.t('total') : 'Total'}</strong></td>
                <td><strong>${totalWins}</strong></td>
                <td><strong>${totalGames}</strong></td>
                <td><strong>${totalRate}%</strong></td>
                <td><strong>★ ${points}</strong></td>
            </tr>
        `;
    }
}

// ─── Stats: salvar após vitória ────────────────────────────────────────────────
async function saveStats(difficulty, won, timeSeconds) {
    const user = auth.currentUser;
    if (!user) return; // Visitante: não salva

    const statsRef = ref(db, `users/${user.uid}/stats/${difficulty}`);
    const globalRef = ref(db, `users/${user.uid}`);
    
    try {
        const snap = await get(statsRef);
        const prev = snap.exists() ? snap.val() : { wins: 0, games: 0, bestTime: null };
        const newStats = {
            wins:  (prev.wins  || 0) + (won ? 1 : 0),
            games: (prev.games || 0) + 1,
            bestTime: won
                ? (prev.bestTime === null ? timeSeconds : Math.min(prev.bestTime, timeSeconds))
                : (prev.bestTime || null)
        };
        await set(statsRef, newStats);

        // Pontuação
        if (won) {
            const userSnap = await get(globalRef);
            const userData = userSnap.exists() ? userSnap.val() : {};
            const currentPoints = userData.points || 0;
            const earned = POINTS_MAP[difficulty] || 10;
            await update(globalRef, {
                points: currentPoints + earned,
                name: user.displayName || user.email || 'Jogador'
            });
        } else {
            await update(globalRef, {
                name: user.displayName || user.email || 'Jogador'
            });
        }
    } catch(e) {
        console.warn('Erro ao salvar stats:', e);
    }
}

// ─── Ranking: carregar e exibir ───────────────────────────────────────────────
async function loadAndShowRanking() {
    const tbody = $('ranking-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">${window.t ? window.t('ranking-loading') : 'Carregando...'}</td></tr>`;

    try {
        const snap = await get(ref(db, 'users'));
        if (!snap.exists()) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">${window.t ? window.t('ranking-no-players') : 'Nenhum jogador encontrado.'}</td></tr>`;
            return;
        }

        const usersData = snap.val();
        const ranking = [];

        for (const uid in usersData) {
            const u = usersData[uid];
            const name = u.name || 'Jogador';
            const avatar = u.avatar || '';
            const points = u.points || 0;
            let wins = 0, games = 0;

            if (u.stats) {
                for (const diff in u.stats) {
                    wins += (u.stats[diff].wins || 0);
                    games += (u.stats[diff].games || 0);
                }
            }
            if (games > 0) {
                ranking.push({ name, wins, games, points, avatar });
            }
        }

        // Ordena por Pontos (desc)
        ranking.sort((a, b) => (b.points - a.points) || (b.wins - a.wins));

        tbody.innerHTML = '';
        ranking.slice(0, 20).forEach((item, idx) => {
            const tr = document.createElement('tr');
            let medal = idx + 1;
            if (idx === 0) medal = '🥇';
            if (idx === 1) medal = '🥈';
            if (idx === 2) medal = '🥉';

            tr.innerHTML = `
                <td>${medal}</td>
                <td style="text-align:left; font-weight:600;">
                    ${item.avatar ? `<span style="font-size: 1.25rem; margin-right: 6px; vertical-align: middle;">${item.avatar}</span>` : ''}
                    <span style="vertical-align: middle;">${item.name}</span>
                </td>
                <td><span style="color:var(--primary-color); font-weight:700;">★ ${item.points}</span></td>
                <td style="font-size:0.75rem; color:var(--text-secondary);">${item.wins} ${window.t ? window.t('ranking-wins-short') : 'vit.'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error('Erro ao carregar ranking:', e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--error-color);">${window.t ? window.t('ranking-error') : 'Erro ao carregar dados.'}</td></tr>`;
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

function showError(elId, msg) {
    const el = $(elId);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearError(elId) {
    const el = $(elId);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
}
function setLoading(btnId, loading) {
    const btn = $(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.6' : '1';
}

// ─── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(id)  { const m = $(id); if (m) m.classList.remove('hidden'); }
function closeModal(id) { const m = $(id); if (m) m.classList.add('hidden'); }

// ─── Login com Google ──────────────────────────────────────────────────────────
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        setLoading('btn-google', true);
        await signInWithPopup(auth, provider);
        closeModal('email-modal');
    } catch(e) {
        console.error('Google login error:', e);
        showError('auth-error', getMsgForCode(e.code));
    } finally {
        setLoading('btn-google', false);
    }
}

// ─── Criar conta com E-mail ────────────────────────────────────────────────────
async function registerWithEmail() {
    const name     = ($('reg-name')?.value   || '').trim();
    const email    = ($('reg-email')?.value  || '').trim();
    const password = $('reg-password')?.value || '';

    clearError('auth-error');

    const t = (key, fallback) => window.t ? window.t(key) : fallback;

    if (!name)            return showError('auth-error', t('auth-enter-name', 'Digite seu nome.'));
    if (!email)           return showError('auth-error', t('auth-enter-email', 'Digite seu e-mail.'));
    if (password.length < 6) return showError('auth-error', t('auth-password-short', 'A senha deve ter pelo menos 6 caracteres.'));

    try {
        setLoading('btn-register', true);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        // força refresh do token para displayName aparecer
        await cred.user.reload();
        closeModal('email-modal');
    } catch(e) {
        showError('auth-error', getMsgForCode(e.code));
    } finally {
        setLoading('btn-register', false);
    }
}

// ─── Login com E-mail já existente ─────────────────────────────────────────────
async function loginWithEmail() {
    const email    = ($('login-email')?.value    || '').trim();
    const password = $('login-password')?.value  || '';

    clearError('auth-error-login');
    if (!email || !password) return showError('auth-error-login', window.t ? window.t('auth-fill-fields') : 'Preencha e-mail e senha.');

    try {
        setLoading('btn-login-email', true);
        await signInWithEmailAndPassword(auth, email, password);
        closeModal('email-modal');
    } catch(e) {
        showError('auth-error-login', getMsgForCode(e.code));
    } finally {
        setLoading('btn-login-email', false);
    }
}

// ─── Logout ────────────────────────────────────────────────────────────────────
async function logout() {
    await signOut(auth);
    closeModal('profile-modal');
}

// ─── Mensagens de erro amigáveis ───────────────────────────────────────────────
function getMsgForCode(code) {
    const t = (key, fallback) => window.t ? window.t(key) : fallback;
    const map = {
        'auth/email-already-in-use':   t('auth-email-in-use', 'Este e-mail já está em uso.'),
        'auth/invalid-email':          t('auth-invalid-email', 'E-mail inválido.'),
        'auth/weak-password':          t('auth-weak-password', 'Senha muito fraca (mínimo 6 caracteres).'),
        'auth/user-not-found':         t('auth-user-not-found', 'Conta não encontrada.'),
        'auth/wrong-password':         t('auth-wrong-password', 'Senha incorreta.'),
        'auth/invalid-credential':     t('auth-invalid-credential', 'E-mail ou senha incorretos.'),
        'auth/popup-closed-by-user':   t('auth-popup-closed', 'Login cancelado.'),
        'auth/network-request-failed': t('auth-network-error', 'Sem conexão com a internet.'),
    };
    return map[code] || t('auth-unknown-error', 'Ocorreu um erro. Tente novamente.');
}

// ─── Toggle entre abas de Criar / Entrar ────────────────────────────────────────
function showTab(tab) {
    const reg   = $('tab-register');
    const log   = $('tab-login');
    const btnReg = $('tab-btn-register');
    const btnLog = $('tab-btn-login');
    clearError('auth-error');
    clearError('auth-error-login');
    if (tab === 'register') {
        reg?.classList.remove('hidden');
        log?.classList.add('hidden');
        btnReg?.classList.add('tab-active');
        btnLog?.classList.remove('tab-active');
    } else {
        reg?.classList.add('hidden');
        log?.classList.remove('hidden');
        btnLog?.classList.add('tab-active');
        btnReg?.classList.remove('tab-active');
    }
}

// ─── Auth State Observer ────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (user) {
        let dbAvatar = null;
        try {
            const snap = await get(ref(db, `users/${user.uid}/avatar`));
            if (snap.exists()) dbAvatar = snap.val();
        } catch (e) {
            console.warn('Erro ao obter avatar do DB:', e);
        }
        updateHeaderAvatar(user, dbAvatar);
        updateStartScreenAuth(user, dbAvatar);
    } else {
        updateHeaderAvatar(null);
        updateStartScreenAuth(null);
    }
});

// ─── Bind eventos DOM ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Botões perfil
    const openProfileModalDetails = async () => {
        const user = auth.currentUser;
        if (user) {
            openModal('profile-modal');
            const pName  = $('profile-name');
            const pEmail = $('profile-email');
            const avatar = $('profile-avatar-big');
            if (pName)  pName.textContent  = user.displayName || 'Jogador';
            if (pEmail) pEmail.textContent = user.email || '';

            // Carrega avatar personalizado
            let dbAvatar = null;
            try {
                const snap = await get(ref(db, `users/${user.uid}/avatar`));
                if (snap.exists()) dbAvatar = snap.val();
            } catch(e) {}

            if (avatar) {
                if (dbAvatar) {
                    avatar.innerHTML = `<span style="font-size: 2.8rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${dbAvatar}</span>`;
                    avatar.style.background = 'transparent';
                    avatar.style.boxShadow = 'none';
                } else {
                    avatar.textContent = (user.displayName || user.email || '?')[0].toUpperCase();
                    avatar.style.background = '';
                    avatar.style.boxShadow = '';
                }
            }

            // Destaca o avatar correspondente no grid
            document.querySelectorAll('.avatar-option').forEach(opt => {
                if (opt.dataset.avatar === dbAvatar) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });

            loadAndShowStats(user);
        } else {
            openModal('email-modal');
            showTab('register');
        }
    };

    $('profile-btn')?.addEventListener('click', openProfileModalDetails);
    $('profile-btn-start')?.addEventListener('click', openProfileModalDetails);

    // Botões na tela inicial
    $('btn-google-start')?.addEventListener('click', loginWithGoogle);
    $('btn-email-start')?.addEventListener('click', () => {
        openModal('email-modal');
        showTab('register');
    });
    $('btn-logout-start')?.addEventListener('click', logout);
    $('btn-view-stats')?.addEventListener('click', openProfileModalDetails);

    // ─── Mascote Selector ─────────────────────────────────────────────────────────
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;
            const chosen = opt.dataset.avatar;
            try {
                // Atualiza no Firebase Realtime Database
                await update(ref(db, `users/${user.uid}`), { avatar: chosen });

                // Atualiza UI local do grid
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');

                // Atualiza o avatar grande
                const bigAvatar = $('profile-avatar-big');
                if (bigAvatar) {
                    bigAvatar.innerHTML = `<span style="font-size: 2.8rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${chosen}</span>`;
                    bigAvatar.style.background = 'transparent';
                    bigAvatar.style.boxShadow = 'none';
                }

                // Atualiza headers e tela inicial
                updateHeaderAvatar(user, chosen);
                updateStartScreenAuth(user, chosen);

                if (window.showToast) window.showToast(window.t ? window.t('mascot-updated') : 'Mascote atualizado! 🦁');
            } catch (e) {
                console.error('Erro ao salvar avatar:', e);
            }
        });
    });

    // Botão Ranking
    $('ranking-btn-start')?.addEventListener('click', () => {
        openModal('ranking-modal');
        loadAndShowRanking();
    });

    // Botões no modal de e-mail
    $('btn-google')?.addEventListener('click', loginWithGoogle);
    $('btn-register')?.addEventListener('click', registerWithEmail);
    $('btn-login-email')?.addEventListener('click', loginWithEmail);
    $('tab-btn-register')?.addEventListener('click', () => showTab('register'));
    $('tab-btn-login')?.addEventListener('click', () => showTab('login'));
    $('close-email-modal')?.addEventListener('click', () => closeModal('email-modal'));

    // Botões no modal de perfil
    $('btn-logout-profile')?.addEventListener('click', logout);
    $('close-profile-modal')?.addEventListener('click', () => {
        closeModal('profile-modal');
        closeEditName();
    });

    // ─── Edição de Perfil: Nome ──────────────────────────────────────────────────
    const btnEditName      = $('btn-edit-name');
    const btnSaveName      = $('btn-save-name');
    const btnCancelName    = $('btn-cancel-name');
    const editNameInput    = $('edit-name-input');
    const editNameContainer = $('edit-name-container');
    const profileName      = $('profile-name');

    if (btnEditName) {
        btnEditName.addEventListener('click', () => {
            const user = auth.currentUser;
            if (!user) return;
            profileName.style.display = 'none';
            btnEditName.style.display = 'none';
            editNameContainer.classList.remove('hidden');
            editNameInput.value = user.displayName || 'Jogador';
            editNameInput.focus();
        });
    }

    const closeEditName = () => {
        profileName.style.display = '';
        btnEditName.style.display = '';
        editNameContainer.classList.add('hidden');
    };

    if (btnCancelName) btnCancelName.addEventListener('click', closeEditName);

    if (btnSaveName) {
        btnSaveName.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;
            const newName = (editNameInput.value || '').trim();
            if (!newName) {
                if (window.showToast) window.showToast(window.t ? window.t('name-invalid') : 'Digite um nome válido.');
                return;
            }
            try {
                setLoading('btn-save-name', true);
                // 1. Atualiza no Auth do Firebase
                await updateProfile(user, { displayName: newName });
                await user.reload();

                // 2. Atualiza no banco de dados para o ranking
                await set(ref(db, `users/${user.uid}/name`), newName);

                // 3. Atualiza na UI
                profileName.textContent = newName;
                updateHeaderAvatar(auth.currentUser);
                updateStartScreenAuth(auth.currentUser);

                closeEditName();
                if (window.showToast) window.showToast(window.t ? window.t('name-updated') : 'Nome atualizado com sucesso!');
            } catch (e) {
                console.error('Erro ao atualizar nome:', e);
                if (window.showToast) window.showToast(window.t ? window.t('name-error') : 'Erro ao atualizar o nome.');
            } finally {
                setLoading('btn-save-name', false);
            }
        });
    }

    // ─── Excluir Conta & Estatísticas ─────────────────────────────────────────────
    const btnDeleteProfile = $('btn-delete-profile');
    if (btnDeleteProfile) {
        btnDeleteProfile.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;

            const confirm1 = confirm(window.t ? window.t('delete-confirm-1') : '⚠️ Atenção: Isso excluirá permanentemente sua conta, todas as suas estatísticas de jogo e pontuação. Esta ação NÃO pode ser desfeita. Deseja continuar?');
            if (!confirm1) return;

            const confirm2 = confirm(window.t ? window.t('delete-confirm-2') : 'Confirmar exclusão permanente? Todos os seus dados serão apagados para sempre.');
            if (!confirm2) return;

            try {
                // 1. Apaga do Banco de Dados
                await set(ref(db, `users/${user.uid}`), null);

                // 2. Apaga da autenticação
                await user.delete();

                // 3. Sucesso
                closeModal('profile-modal');
                if (window.showToast) window.showToast(window.t ? window.t('account-deleted') : 'Conta excluída com sucesso.');
            } catch (e) {
                console.error('Erro ao excluir conta:', e);
                if (e.code === 'auth/requires-recent-login') {
                    alert(window.t ? window.t('auth-reauth-required') : 'Por segurança, faça login novamente na sua conta e tente excluir os dados de novo.');
                } else {
                    if (window.showToast) window.showToast(window.t ? window.t('account-delete-error') : 'Erro ao excluir a conta.');
                }
            }
        });
    }

    // Fechar Ranking
    $('close-ranking-modal')?.addEventListener('click', () => closeModal('ranking-modal'));
});

// ─── Exporta para game_core.js ────────────────────────────────────────────────
window.authModule = {
    saveStats,
    getCurrentUser: () => auth.currentUser
};
