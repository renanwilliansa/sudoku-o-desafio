import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// ============================================================
// GERADOR DE PUZZLE INDEPENDENTE (não depende de game_core.js)
// ============================================================
function _isSafe(grid, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
        if (grid[x][col] === num) return false;
    }
    const sr = row - row % 3, sc = col - col % 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (grid[sr + i][sc + j] === num) return false;
    return true;
}

function _solve(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                for (let n = 1; n <= 9; n++) {
                    if (_isSafe(grid, r, c, n)) {
                        grid[r][c] = n;
                        if (_solve(grid)) return true;
                        grid[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function _fillBox(grid, rs, cs) {
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    let k = 0;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            grid[rs + i][cs + j] = nums[k++];
}

function _countSols(grid, limit) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                let count = 0;
                for (let n = 1; n <= 9; n++) {
                    if (_isSafe(grid, r, c, n)) {
                        grid[r][c] = n;
                        count += _countSols(grid, limit - count);
                        grid[r][c] = 0;
                        if (count >= limit) return count;
                    }
                }
                return count;
            }
        }
    }
    return 1;
}

function _generatePuzzle(holes) {
    // Cria grid vazio e preenche diagonais
    const grid = Array.from({length: 9}, () => Array(9).fill(0));
    _fillBox(grid, 0, 0);
    _fillBox(grid, 3, 3);
    _fillBox(grid, 6, 6);
    _solve(grid);

    const solution = grid.map(r => [...r]);
    const puzzle = grid.map(r => [...r]);

    let removed = 0;
    let fails = 30;
    while (removed < holes && fails > 0) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (puzzle[r][c] !== 0) {
            const backup = puzzle[r][c];
            puzzle[r][c] = 0;
            const copy = puzzle.map(row => [...row]);
            if (_countSols(copy, 2) !== 1) {
                puzzle[r][c] = backup;
                fails--;
            } else {
                removed++;
            }
        }
    }
    return { puzzle, solution };
}

// ============================================================
// FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyDWs4ePrW6kZeG9zD3T51503s57YSmtouE",
    authDomain: "sudokuodesafio.firebaseapp.com",
    projectId: "sudokuodesafio",
    storageBucket: "sudokuodesafio.firebasestorage.app",
    messagingSenderId: "1006930057724",
    appId: "1:1006930057724:web:b8edbb960a8f137e873a79",
    databaseURL: "https://sudokuodesafio-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.currentRoomId = null;
let isPlayer1 = false;
let myProgressRef = null;
let totalHoles = 81;

// ============================================================
// MATCHMAKING
// ============================================================
// ============================================================
// UI VIEW SWITCHERS
// ============================================================
window.showMPSelection = () => {
    document.getElementById('mp-view-selection')?.classList.remove('hidden');
    document.getElementById('mp-view-friend-options')?.classList.add('hidden');
    document.getElementById('mp-view-waiting')?.classList.add('hidden');
    document.getElementById('mp-view-join')?.classList.add('hidden');
};

window.showFriendOptions = () => {
    document.getElementById('mp-view-selection')?.classList.add('hidden');
    document.getElementById('mp-view-friend-options')?.classList.remove('hidden');
    document.getElementById('mp-view-waiting')?.classList.add('hidden');
    document.getElementById('mp-view-join')?.classList.add('hidden');
};

window.showJoinInput = () => {
    document.getElementById('mp-view-selection')?.classList.add('hidden');
    document.getElementById('mp-view-friend-options')?.classList.add('hidden');
    document.getElementById('mp-view-waiting')?.classList.add('hidden');
    document.getElementById('mp-view-join')?.classList.remove('hidden');
    document.getElementById('join-room-input')?.focus();
};

window.startMatchmaking = () => {
    const modal = document.getElementById('matchmaking-modal');
    if (modal) modal.classList.remove('hidden');
    window.showMPSelection();
};

// ============================================================
// RANDOM MATCHMAKING
// ============================================================
window.startRandomMatch = async () => {
    try {
        const title = document.getElementById('mp-waiting-title');
        const status = document.getElementById('mp-waiting-status');
        const codeDisplay = document.getElementById('mp-room-code-display');
        
        document.getElementById('mp-view-selection')?.classList.add('hidden');
        document.getElementById('mp-view-waiting')?.classList.remove('hidden');
        if (title) title.textContent = window.t ? window.t('mp-title-searching') : 'Procurando...';
        if (status) status.textContent = window.t ? window.t('mp-status-random') : 'Buscando oponente aleatório...';
        if (codeDisplay) codeDisplay.classList.add('hidden');

        const snapshot = await get(ref(db, 'waiting_rooms'));

        let validRoomId = null;
        let validRoomData = null;

        if (snapshot.exists()) {
            const rooms = snapshot.val();
            for (const rId in rooms) {
                if (rooms[rId] && Array.isArray(rooms[rId].puzzle)) {
                    validRoomId = rId;
                    validRoomData = rooms[rId];
                    break;
                }
            }
        }

        if (validRoomId) {
            await set(ref(db, `active_games/${validRoomId}`), {
                puzzle: validRoomData.puzzle,
                solution: validRoomData.solution,
                difficulty: validRoomData.difficulty || 'Medio',
                player1: 0,
                player2: 0,
                winner: null
            });
            await remove(ref(db, `waiting_rooms/${validRoomId}`));
            joinGame(validRoomId, false, validRoomData.puzzle, validRoomData.solution, validRoomData.difficulty || 'Medio');
        } else {
            const newRoomId = 'room_' + Date.now() + '_' + Math.floor(Math.random() * 9000 + 1000);
            const diffSelect = document.getElementById('mp-difficulty-select') || document.getElementById('start-difficulty');
            const diffMap = { Facil: 30, Medio: 40, Dificil: 50, Especialista: 56, Radical: 61 };
            const holes = diffSelect ? (diffMap[diffSelect.value] || 50) : 50;

            const { puzzle, solution } = _generatePuzzle(holes);

            await set(ref(db, `waiting_rooms/${newRoomId}`), {
                puzzle: puzzle,
                solution: solution,
                difficulty: diffSelect ? diffSelect.value : 'Medio',
                createdAt: Date.now()
            });

            window.currentRoomId = newRoomId;

            onValue(ref(db, `active_games/${newRoomId}`), (snap) => {
                if (snap.exists() && window.currentRoomId === newRoomId && !myProgressRef) {
                    const activeData = snap.val();
                    joinGame(newRoomId, true, puzzle, solution, activeData.difficulty || 'Medio');
                }
            });

            onDisconnect(ref(db, `waiting_rooms/${newRoomId}`)).remove();
        }
    } catch (err) {
        console.error("RANDOM MATCH ERROR:", err);
        alert(window.t ? window.t('mp-alert-match-error', {err: err.message}) : "Erro ao buscar partida: " + err.message);
        window.showMPSelection();
    }
};

// ============================================================
// PRIVATE FRIEND MATCH
// ============================================================
window.createPrivateRoom = async () => {
    try {
        const title = document.getElementById('mp-waiting-title');
        const status = document.getElementById('mp-waiting-status');
        const codeDisplay = document.getElementById('mp-room-code-display');
        const codeText = document.getElementById('room-code-text');

        document.getElementById('mp-view-friend-options')?.classList.add('hidden');
        document.getElementById('mp-view-waiting')?.classList.remove('hidden');
        if (title) title.textContent = window.t ? window.t('mp-title-created') : 'Sala Criada!';
        if (status) status.textContent = window.t ? window.t('mp-status-friend-waiting') : 'Aguardando seu amigo entrar...';
        if (codeDisplay) codeDisplay.classList.remove('hidden');

        // Gera código de 4 dígitos
        const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        if (codeText) codeText.textContent = roomCode;

        const diffSelect = document.getElementById('mp-difficulty-select') || document.getElementById('start-difficulty');
        const diffMap = { Facil: 30, Medio: 40, Dificil: 50, Especialista: 56, Radical: 61 };
        const holes = diffSelect ? (diffMap[diffSelect.value] || 50) : 50;

        const { puzzle, solution } = _generatePuzzle(holes);

        await set(ref(db, `private_waiting/${roomCode}`), {
            puzzle: puzzle,
            solution: solution,
            difficulty: diffSelect ? diffSelect.value : 'Medio',
            createdAt: Date.now()
        });

        window.currentRoomId = roomCode;
        window.isPrivateRoom = true;

        onValue(ref(db, `active_games/${roomCode}`), (snap) => {
            if (snap.exists() && window.currentRoomId === roomCode && !myProgressRef) {
                const activeData = snap.val();
                joinGame(roomCode, true, puzzle, solution, activeData.difficulty || 'Medio');
            }
        });

        onDisconnect(ref(db, `private_waiting/${roomCode}`)).remove();

    } catch (err) {
        console.error("CREATE PRIVATE ERROR:", err);
        alert(window.t ? window.t('mp-alert-create-error', {err: err.message}) : "Erro ao criar sala: " + err.message);
        window.showFriendOptions();
    }
};

window.joinPrivateRoom = async () => {
    const input = document.getElementById('join-room-input');
    const code = input?.value?.trim();
    if (!code || code.length < 4) {
        alert(window.t ? window.t('mp-alert-invalid-code') : "Digite um código válido de 4 dígitos.");
        return;
    }

    try {
        const snap = await get(ref(db, `private_waiting/${code}`));
        if (!snap.exists()) {
            alert(window.t ? window.t('mp-alert-not-found') : "Sala não encontrada! Verifique o código.");
            return;
        }

        const data = snap.val();
        // Move para active_games
        await set(ref(db, `active_games/${code}`), {
            puzzle: data.puzzle,
            solution: data.solution,
            difficulty: data.difficulty || 'Medio',
            player1: 0,
            player2: 0,
            winner: null
        });
        await remove(ref(db, `private_waiting/${code}`));
        joinGame(code, false, data.puzzle, data.solution, data.difficulty || 'Medio');

    } catch (err) {
        console.error("JOIN PRIVATE ERROR:", err);
        alert(window.t ? window.t('mp-alert-error', {err: err.message}) : "Erro ao entrar na sala: " + err.message);
    }
};

const joinGame = (roomId, isP1, puzzle, solution, diff) => {
    window.currentRoomId = roomId;
    isPlayer1 = isP1;

    totalHoles = 0;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] === 0) totalHoles++;
        }
    }

    const modal = document.getElementById('matchmaking-modal');
    const bar = document.getElementById('multiplayer-bar');
    if (modal) modal.classList.add('hidden');
    if (bar) bar.classList.remove('hidden');

    // Inicializa placar local e oponente imediatamente (Corrige o bug "0/--")
    const myFill = document.getElementById('my-progress-fill');
    const myText = document.getElementById('my-score-text');
    if (myFill) myFill.style.width = '0%';
    if (myText) myText.textContent = `0/${totalHoles}`;

    const oppFill = document.getElementById('opp-progress-fill');
    const oppText = document.getElementById('opp-score-text');
    if (oppFill) oppFill.style.width = '0%';
    if (oppText) oppText.textContent = `0/${totalHoles}`;

    myProgressRef = ref(db, `active_games/${roomId}/${isP1 ? 'player1' : 'player2'}`);
    const opponentProgressRef = ref(db, `active_games/${roomId}/${isP1 ? 'player2' : 'player1'}`);
    const winnerRef = ref(db, `active_games/${roomId}/winner`);

    onDisconnect(myProgressRef).set(-1);

    // Progresso do oponente
    onValue(opponentProgressRef, (snap) => {
        if (snap.exists()) {
            const oppScore = snap.val();
            if (oppScore === -1) {
                if (window.showToast) window.showToast(window.t ? window.t('opponent-disconnected') : "O oponente se desconectou!");
                endMultiplayerGame("win_disconnect");
            } else {
                const fill = document.getElementById('opp-progress-fill');
                const text = document.getElementById('opp-score-text');
                if (fill) fill.style.width = `${(oppScore / totalHoles) * 100}%`;
                if (text) text.textContent = `${oppScore}/${totalHoles}`;
            }
        }
    });

    // Vencedor
    onValue(winnerRef, (snap) => {
        if (snap.exists() && snap.val()) {
            const winner = snap.val();
            if ((winner === 'p1' && !isP1) || (winner === 'p2' && isP1)) {
                endMultiplayerGame("lose");
            }
        }
    });

    // Inicia jogo local
    if (window.startMultiplayerGameLocal) {
        window.startMultiplayerGameLocal(puzzle, solution, diff);
    }
};

window.sendProgress = (score) => {
    if (window.currentRoomId && myProgressRef) {
        set(myProgressRef, score);
        const fill = document.getElementById('my-progress-fill');
        const text = document.getElementById('my-score-text');
        if (fill) fill.style.width = `${(score / totalHoles) * 100}%`;
        if (text) text.textContent = `${score}/${totalHoles}`;

        if (score === totalHoles) {
            set(ref(db, `active_games/${window.currentRoomId}/winner`), isPlayer1 ? 'p1' : 'p2');
            endMultiplayerGame("win");
        }
    }
};

const endMultiplayerGame = (result) => {
    if (currentRoomId && myProgressRef) {
        set(myProgressRef, -1);
    }
    currentRoomId = null;
    myProgressRef = null;
    const bar = document.getElementById('multiplayer-bar');
    if (bar) bar.classList.add('hidden');

    if (result === "lose" && window.showGameOver) {
        window.showGameOver(false, window.t ? window.t('opponent-won') : "O oponente terminou primeiro. Você perdeu!");
    } else if (result === "win" && window.showGameOver) {
        window.showGameOver(true, window.t ? window.t('you-won-battle') : "Você venceu a Batalha!");
    } else if (result === "win_disconnect" && window.showGameOver) {
        window.showGameOver(true, window.t ? window.t('opponent-left') : "O oponente fugiu! Você venceu.");
    }
};

window.cancelMatchmaking = () => {
    const modal = document.getElementById('matchmaking-modal');
    if (modal) modal.classList.add('hidden');
    if (window.currentRoomId && !myProgressRef) {
        if (window.isPrivateRoom) {
            remove(ref(db, `private_waiting/${window.currentRoomId}`));
            window.isPrivateRoom = false;
        } else {
            remove(ref(db, `waiting_rooms/${window.currentRoomId}`));
        }
        window.currentRoomId = null;
    }
};
