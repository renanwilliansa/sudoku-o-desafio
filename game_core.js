document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const difficultySelect = document.getElementById('start-difficulty');
    const gameDifficultyLabel = document.getElementById('game-difficulty-label');
    const newGameBtn = document.getElementById('new-game-btn');
    const mistakesCounter = document.getElementById('mistakes-counter');
    const timerElement = document.getElementById('timer');
    const numBtns = document.querySelectorAll('.num-btn:not(.action-btn)');
    const modal = document.getElementById('game-over-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalNewGameBtn = document.getElementById('modal-new-game');
    const draftBtn = document.getElementById('draft-btn');
    const fastFillBtn = document.getElementById('fast-fill-btn');
    const undoBtn = document.getElementById('undo-btn');
    const hintBtn = document.getElementById('hint-btn');
    const toast = document.getElementById('toast');
    const themeBtn = document.getElementById('theme-btn');
    const startScreen = document.getElementById('start-screen');
    const startDifficulty = document.getElementById('start-difficulty');
    const startGameBtn = document.getElementById('start-game-btn');
    const continueGameBtn = document.getElementById('continue-game-btn');
    let toastTimeout;

    // Lógica de Modo Escuro
    const updateThemeIcon = (isDark) => {
        const svg = isDark 
            ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' 
            : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        if (themeBtn) themeBtn.innerHTML = svg;
        const darkSwitch = document.getElementById('setting-dark-mode');
        if (darkSwitch) darkSwitch.checked = isDark;
    };

    const toggleTheme = (force = null) => {
        if (force !== null) {
            if (force) document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
        } else {
            document.body.classList.toggle('dark-mode');
        }
        const isDark = document.body.classList.contains('dark-mode');
        settings.darkMode = isDark;
        saveSettingsToStorage();
        updateThemeIcon(isDark);
    };

    if (themeBtn) themeBtn.addEventListener('click', () => toggleTheme());

    const DIFFICULTIES = {
        'Facil': 30,
        'Medio': 40,
        'Dificil': 50,
        'Especialista': 56,
        'Radical': 61
    };

    let solution = [];
    let puzzle = [];
    let userBoard = [];
    let selectedCell = null;
    let mistakes = 0;
    const maxMistakes = 3;
    let timerInterval;
    let secondsElapsed = 0;
    
    let drafts = [];
    let draftMode = false;
    let fastFillMode = false;
    let armedNumber = null;
    let history = [];
    let hintChances = 3;

    // Detectar idioma padrão do navegador
    const getBrowserLanguage = () => {
        const lang = navigator.language || navigator.userLanguage || 'pt-BR';
        if (lang.startsWith('en')) return 'en';
        if (lang.startsWith('es')) return 'es';
        return 'pt-BR';
    };

    let settings = {
        darkMode: false,
        timer: true,
        errorLimit: true,
        highlightCrosshair: false,
        highlightExclusion: false,
        highlightSame: true,
        autoClearDrafts: true,
        language: getBrowserLanguage()
    };    // ─── Dicionário de Localização Internacional ──────────────────────────────────────
    window.LOCALIZATION = {
        'pt-BR': {
            'title': 'O Desafio',
            'auth-subtitle': 'Crie uma conta para salvar suas estatísticas',
            'btn-google': 'Entrar com Google',
            'btn-email': 'Entrar com E-mail',
            'auth-divider': 'ou',
            'guest-note': 'Sem cadastro:',
            'user-default-name': 'Jogador',
            'btn-view-stats': '📊 Ver Estatísticas',
            'btn-logout-small': 'Sair',
            'select-difficulty': 'Escolha a dificuldade:',
            'diff-easy': 'Fácil',
            'diff-medium': 'Médio',
            'diff-hard': 'Difícil',
            'diff-expert': 'Especialista',
            'diff-extreme': 'Radical',
            'btn-continue': 'Continuar Jogo',
            'btn-new-game': 'Novo Jogo',
            'btn-battle': '⚔️ Batalha Online',
            
            'settings-title': '⚙️ Configurações',
            'settings-dark-mode': 'Modo Escuro',
            'settings-dark-mode-desc': 'Alterar aparência do jogo',
            'settings-timer': 'Exibir Cronômetro',
            'settings-timer-desc': 'Mostrar tempo de jogo',
            'settings-error-limit': 'Limite de Erros',
            'settings-error-limit-desc': 'Fim de jogo ao atingir 3 erros',
            'settings-clear-drafts': 'Limpar Rascunhos',
            'settings-clear-drafts-desc': 'Apagar rascunhos ao acertar valor',
            'settings-highlight-label': 'Realce de Células:',
            'settings-highlight-simple': 'Apenas o número clicado (Padrão)',
            'settings-highlight-full': 'Realces completos (Cruzamento e bloqueios)',
            'settings-language-label': 'Idioma:',

            'auth-modal-title': 'Acesse sua conta',
            'tab-register': 'Criar Conta',
            'tab-login': 'Já tenho conta',
            'label-name': 'Seu nome',
            'placeholder-name': 'Como quer ser chamado?',
            'label-email': 'E-mail',
            'placeholder-email': 'seu@email.com',
            'label-password': 'Senha',
            'placeholder-password': 'Mínimo 6 caracteres',
            'btn-register': 'Criar Conta',
            'placeholder-password-login': 'Sua senha',
            'btn-login': 'Entrar',
            'auth-continue-with': 'ou continue com',
            'btn-google-modal': 'Entrar com Google',

            'mp-title': 'Batalha Online',
            'mp-select-difficulty': 'Selecione a Dificuldade:',
            'mp-btn-random': '⚔️ Oponente Aleatório',
            'mp-btn-friend': '👥 Jogar com Amigo',
            'mp-friend-title': 'Jogar com Amigo',
            'mp-btn-create': '🏠 Criar Sala',
            'mp-btn-join': '🔑 Entrar em Sala',
            'btn-back': '← Voltar',
            'mp-title-searching': 'Procurando...',
            'mp-status-waiting': 'Aguardando oponente...',
            'mp-code-label': 'Código da Sala:',
            'mp-join-title': 'Entrar em Sala',
            'mp-join-desc': 'Digite o código da sala do seu amigo:',
            'mp-placeholder-code': 'Ex: 1234',
            'mp-btn-enter-now': 'Entrar agora',

            'ranking-title': '🏆 Ranking Global',
            'ranking-col-player': 'Jogador',
            'ranking-col-points': '⭐ Pontos',
            'ranking-col-wins': 'Vitórias',
            'ranking-loading': 'Carregando...',
            'ranking-note': 'O ranking considera o total de vitórias em todos os níveis.',
            'total': 'Total',
            'ranking-no-players': 'Nenhum jogador encontrado.',
            'ranking-error': 'Erro ao carregar dados.',
            'ranking-wins-short': 'vit.',
            'delete-confirm-1': '⚠️ Atenção: Isso excluirá permanentemente sua conta, todas as suas estatísticas de jogo e pontuação. Esta ação NÃO pode ser desfeita. Deseja continuar?',
            'delete-confirm-2': 'Confirmar exclusão permanente? Todos os seus dados serão apagados para sempre.',
            'mp-status-random': 'Buscando oponente aleatório...',
            'mp-title-created': 'Sala Criada!',
            'mp-status-friend-waiting': 'Aguardando seu amigo entrar...',
            'mp-alert-invalid-code': 'Digite um código válido de 4 dígitos.',
            'mp-alert-not-found': 'Sala não encontrada! Verifique o código.',
            'mp-alert-error': 'Erro ao entrar na sala: {err}',
            'mp-alert-match-error': 'Erro ao buscar partida: {err}',
            'mp-alert-create-error': 'Erro ao criar sala: {err}',

            'placeholder-new-name': 'Novo nome',
            'btn-save-name': 'Salvar',
            'profile-mascote-title': '🦁 Escolha seu Mascote:',
            'profile-stats-title': '📊 Suas Estatísticas',
            'stats-col-level': 'Nível',
            'stats-col-wins': '✅ Vitórias',
            'stats-col-games': '🎮 Jogos',
            'stats-col-rate': '🏆 Taxa',
            'stats-col-best': '⏱ Recorde',
            'stats-loading': 'Carregando...',
            'btn-logout-account': 'Sair da Conta',
            'btn-delete-account': 'Excluir Conta Permanentemente',

            'mp-you': 'Você',
            'mp-opponent': 'Oponente',
            'btn-play-again': 'Jogar Novamente',

            'action-undo': 'Desfazer jogada',
            'action-draft': 'Alternar Rascunho',
            'action-fast': 'Alternar Preenchimento Rápido',
            'action-hint': 'Pedir Dica',

            // Dynamic texts
            'errors-label': 'Erros',
            'opponent-disconnected': 'O oponente se desconectou!',
            'opponent-won': 'O oponente terminou primeiro. Você perdeu!',
            'you-won-battle': 'Você venceu a Batalha!',
            'opponent-left': 'O oponente fugiu! Você venceu.',
            'mascot-updated': 'Mascote atualizado! 🦁',
            'name-updated': 'Nome atualizado com sucesso!',
            'name-error': 'Erro ao atualizar o nome.',
            'name-invalid': 'Digite um nome válido.',
            'account-deleted': 'Conta excluída com sucesso.',
            'account-delete-error': 'Erro ao excluir a conta.',
            'congrats': 'Parabéns! 🎉',
            'game-over': 'Game Over',
            'mp-battle-over': 'Fim de Batalha!',
            'you-solved-in': 'Você resolveu em {time}.',
            'plus-points': '⭐ +{pts} Pontos!',
            'mistakes-reached': 'Você atingiu o limite de erros.',
            'auto-completed': '✨ Sudoku finalizado automaticamente!',
            
            'hint-naked-single': '💡 <b>A Única Opção:</b> 8 números estão bloqueados.',
            'hint-hidden-single-row': '💡 <b>O Único Lugar:</b> Só cabe o {num} nesta linha.',
            'hint-hidden-single-col': '💡 <b>O Único Lugar:</b> Só cabe o {num} nesta coluna.',
            'hint-hidden-single-box': '💡 <b>O Único Lugar:</b> Só cabe o {num} neste bloco 3x3.',
            'hint-pointing-pairs-row': '💡 <b>Pares Apontadores:</b> O {num} deve ficar nas casas amarelas. Elimine-o das casas vermelhas da mesma linha.',
            'hint-pointing-pairs-col': '💡 <b>Pares Apontadores:</b> O {num} deve ficar nas casas amarelas. Elimine-o das casas vermelhas da mesma coluna.',
            'hint-naked-pairs': '💡 <b>Pares Gêmeos:</b> As casas amarelas formam um par exclusivo. Elimine esses números das casas vermelhas do bloco.',
            'hint-advanced-move': '💡 <b>Jogada Avançada:</b> Revelando casa para continuar.',
            'number-completed-toast': '✅ Número completado! Mudando para o {num}.',

            // Firebase errors
            'auth-email-in-use': 'Este e-mail já está em uso.',
            'auth-invalid-email': 'E-mail inválido.',
            'auth-weak-password': 'Senha muito fraca (mínimo 6 caracteres).',
            'auth-user-not-found': 'Conta não encontrada.',
            'auth-wrong-password': 'Senha incorreta.',
            'auth-invalid-credential': 'E-mail ou senha incorretos.',
            'auth-popup-closed': 'Login cancelado.',
            'auth-network-error': 'Sem conexão com a internet.',
            'auth-unknown-error': 'Ocorreu um erro. Tente novamente.',
            'auth-enter-name': 'Digite seu nome.',
            'auth-enter-email': 'Digite seu e-mail.',
            'auth-password-short': 'A senha deve ter pelo menos 6 caracteres.',
            'auth-fill-fields': 'Preencha e-mail e senha.',
            'auth-reauth-required': 'Por segurança, faça login novamente na sua conta e tente excluir os dados de novo.'
        },
        'en': {
            'title': 'The Challenge',
            'auth-subtitle': 'Create an account to save your statistics',
            'btn-google': 'Sign in with Google',
            'btn-email': 'Sign in with Email',
            'auth-divider': 'or',
            'guest-note': 'Without registration:',
            'user-default-name': 'Player',
            'btn-view-stats': '📊 View Stats',
            'btn-logout-small': 'Log out',
            'select-difficulty': 'Choose difficulty:',
            'diff-easy': 'Easy',
            'diff-medium': 'Medium',
            'diff-hard': 'Hard',
            'diff-expert': 'Expert',
            'diff-extreme': 'Extreme',
            'btn-continue': 'Continue Game',
            'btn-new-game': 'New Game',
            'btn-battle': '⚔️ Online Battle',
            
            'settings-title': '⚙️ Settings',
            'settings-dark-mode': 'Dark Mode',
            'settings-dark-mode-desc': 'Change game appearance',
            'settings-timer': 'Show Timer',
            'settings-timer-desc': 'Show gameplay elapsed time',
            'settings-error-limit': 'Mistakes Limit',
            'settings-error-limit-desc': 'Game over on reaching 3 mistakes',
            'settings-clear-drafts': 'Clear Drafts',
            'settings-clear-drafts-desc': 'Erase drafts when filling a correct value',
            'settings-highlight-label': 'Cell Highlight:',
            'settings-highlight-simple': 'Only clicked number (Default)',
            'settings-highlight-full': 'Full highlights (Crosshair and blocks)',
            'settings-language-label': 'Language:',

            'auth-modal-title': 'Access your account',
            'tab-register': 'Create Account',
            'tab-login': 'Already have an account',
            'label-name': 'Your name',
            'placeholder-name': 'What do you want to be called?',
            'label-email': 'Email',
            'placeholder-email': 'your@email.com',
            'label-password': 'Password',
            'placeholder-password': 'Minimum 6 characters',
            'btn-register': 'Create Account',
            'placeholder-password-login': 'Your password',
            'btn-login': 'Log In',
            'auth-continue-with': 'or continue with',
            'btn-google-modal': 'Sign in with Google',

            'mp-title': 'Online Battle',
            'mp-select-difficulty': 'Select Difficulty:',
            'mp-btn-random': '⚔️ Random Opponent',
            'mp-btn-friend': '👥 Play with Friend',
            'mp-friend-title': 'Play with Friend',
            'mp-btn-create': '🏠 Create Room',
            'mp-btn-join': '🔑 Enter Room',
            'btn-back': '← Back',
            'mp-title-searching': 'Searching...',
            'mp-status-waiting': 'Waiting for opponent...',
            'mp-code-label': 'Room Code:',
            'mp-join-title': 'Enter Room',
            'mp-join-desc': "Type your friend's room code:",
            'mp-placeholder-code': 'Ex: 1234',
            'mp-btn-enter-now': 'Join now',

            'ranking-title': '🏆 Global Ranking',
            'ranking-col-player': 'Player',
            'ranking-col-points': '⭐ Points',
            'ranking-col-wins': 'Wins',
            'ranking-loading': 'Loading...',
            'ranking-note': 'The ranking considers total wins in all levels.',
            'total': 'Total',
            'ranking-no-players': 'No players found.',
            'ranking-error': 'Error loading data.',
            'ranking-wins-short': 'wins',
            'delete-confirm-1': '⚠️ Warning: This will permanently delete your account, all your game statistics and scores. This action CANNOT be undone. Do you want to continue?',
            'delete-confirm-2': 'Confirm permanent deletion? All your data will be erased forever.',
            'mp-status-random': 'Searching for random opponent...',
            'mp-title-created': 'Room Created!',
            'mp-status-friend-waiting': 'Waiting for your friend to join...',
            'mp-alert-invalid-code': 'Please enter a valid 4-digit code.',
            'mp-alert-not-found': 'Room not found! Check the code.',
            'mp-alert-error': 'Error joining room: {err}',
            'mp-alert-match-error': 'Error finding match: {err}',
            'mp-alert-create-error': 'Error creating room: {err}',

            'placeholder-new-name': 'New name',
            'btn-save-name': 'Save',
            'profile-mascote-title': '🦁 Choose your Mascot:',
            'profile-stats-title': '📊 Your Statistics',
            'stats-col-level': 'Level',
            'stats-col-wins': '✅ Wins',
            'stats-col-games': '🎮 Games',
            'stats-col-rate': '🏆 Win Rate',
            'stats-col-best': '⏱ Record',
            'stats-loading': 'Loading...',
            'btn-logout-account': 'Log out',
            'btn-delete-account': 'Delete Account Permanently',

            'mp-you': 'You',
            'mp-opponent': 'Opponent',
            'btn-play-again': 'Play Again',

            'action-undo': 'Undo move',
            'action-draft': 'Toggle Draft Mode',
            'action-fast': 'Toggle Fast Fill Mode',
            'action-hint': 'Get Hint',

            // Dynamic texts
            'errors-label': 'Mistakes',
            'opponent-disconnected': 'The opponent disconnected!',
            'opponent-won': 'The opponent finished first. You lost!',
            'you-won-battle': 'You won the Battle!',
            'opponent-left': 'The opponent fled! You won.',
            'mascot-updated': 'Mascot updated! 🦁',
            'name-updated': 'Name updated successfully!',
            'name-error': 'Error updating name.',
            'name-invalid': 'Please enter a valid name.',
            'account-deleted': 'Account successfully deleted.',
            'account-delete-error': 'Error deleting account.',
            'congrats': 'Congratulations! 🎉',
            'game-over': 'Game Over',
            'mp-battle-over': 'Battle Over!',
            'you-solved-in': 'You solved it in {time}.',
            'plus-points': '⭐ +{pts} Points!',
            'mistakes-reached': 'You reached the mistakes limit.',
            'auto-completed': '✨ Sudoku completed automatically!',
            
            'hint-naked-single': '💡 <b>Naked Single:</b> 8 numbers are blocked.',
            'hint-hidden-single-row': '💡 <b>Hidden Single:</b> Only {num} fits in this row.',
            'hint-hidden-single-col': '💡 <b>Hidden Single:</b> Only {num} fits in this column.',
            'hint-hidden-single-box': '💡 <b>Hidden Single:</b> Only {num} fits in this 3x3 block.',
            'hint-pointing-pairs-row': '💡 <b>Pointing Pairs:</b> The {num} must be in the yellow cells. Eliminate it from red cells in the same row.',
            'hint-pointing-pairs-col': '💡 <b>Pointing Pairs:</b> The {num} must be in the yellow cells. Eliminate it from red cells in the same column.',
            'hint-naked-pairs': '💡 <b>Naked Pairs:</b> Yellow cells form an exclusive pair. Eliminate these numbers from other cells in the block.',
            'hint-advanced-move': '💡 <b>Advanced Move:</b> Revealing cell to continue.',
            'number-completed-toast': '✅ Number completed! Changing to {num}.',

            // Firebase errors
            'auth-email-in-use': 'This email is already in use.',
            'auth-invalid-email': 'Invalid email address.',
            'auth-weak-password': 'Password is too weak (minimum 6 characters).',
            'auth-user-not-found': 'Account not found.',
            'auth-wrong-password': 'Wrong password.',
            'auth-invalid-credential': 'Invalid email or password.',
            'auth-popup-closed': 'Sign-in cancelled.',
            'auth-network-error': 'No internet connection.',
            'auth-unknown-error': 'An error occurred. Please try again.',
            'auth-enter-name': 'Please enter your name.',
            'auth-enter-email': 'Please enter your email.',
            'auth-password-short': 'Password must be at least 6 characters.',
            'auth-fill-fields': 'Please fill email and password.',
            'auth-reauth-required': 'For security, please log in to your account again and try to delete your data.'
        },
        'es': {
            'title': 'El Desafío',
            'auth-subtitle': 'Crea una cuenta para guardar tus estadísticas',
            'btn-google': 'Iniciar sesión con Google',
            'btn-email': 'Iniciar sesión con Email',
            'auth-divider': 'o',
            'guest-note': 'Sin registro:',
            'user-default-name': 'Jugador',
            'btn-view-stats': '📊 Ver Estadísticas',
            'btn-logout-small': 'Salir',
            'select-difficulty': 'Elige la dificultad:',
            'diff-easy': 'Fácil',
            'diff-medium': 'Medio',
            'diff-hard': 'Difícil',
            'diff-expert': 'Experto',
            'diff-extreme': 'Radical',
            'btn-continue': 'Continuar Jogo',
            'btn-new-game': 'Nuevo Juego',
            'btn-battle': '⚔️ Batalla Online',
            
            'settings-title': '⚙️ Configuraciones',
            'settings-dark-mode': 'Modo Escuro',
            'settings-dark-mode-desc': 'Cambiar apariencia del juego',
            'settings-timer': 'Mostrar Cronómetro',
            'settings-timer-desc': 'Mostrar tiempo de juego',
            'settings-error-limit': 'Límite de Errores',
            'settings-error-limit-desc': 'Fin de juego al llegar a 3 errores',
            'settings-clear-drafts': 'Limpiar Borradores',
            'settings-clear-drafts-desc': 'Borrar borradores al acertar valor',
            'settings-highlight-label': 'Realce de Celdas:',
            'settings-highlight-simple': 'Solo el número cliqueado (Predeterminado)',
            'settings-highlight-full': 'Realces completos (Cruce y bloqueos)',
            'settings-language-label': 'Idioma:',

            'auth-modal-title': 'Accede a tu cuenta',
            'tab-register': 'Crear Cuenta',
            'tab-login': 'Ya tengo cuenta',
            'label-name': 'Tu nombre',
            'placeholder-name': '¿Cómo quieres que te llamen?',
            'label-email': 'Correo electrónico',
            'placeholder-email': 'tu@email.com',
            'label-password': 'Contraseña',
            'placeholder-password': 'Mínimo 6 caracteres',
            'btn-register': 'Crear Cuenta',
            'placeholder-password-login': 'Tu contraseña',
            'btn-login': 'Entrar',
            'auth-continue-with': 'o continúa con',
            'btn-google-modal': 'Iniciar sesión con Google',

            'mp-title': 'Batalla Online',
            'mp-select-difficulty': 'Selecciona la Dificulad:',
            'mp-btn-random': '⚔️ Oponente Aleatorio',
            'mp-btn-friend': '👥 Jugar con Amigo',
            'mp-friend-title': 'Jugar con Amigo',
            'mp-btn-create': '🏠 Crear Sala',
            'mp-btn-join': '🔑 Entrar a Sala',
            'btn-back': '← Volver',
            'mp-title-searching': 'Buscando...',
            'mp-status-waiting': 'Esperando oponente...',
            'mp-code-label': 'Código de Sala:',
            'mp-join-title': 'Entrar a Sala',
            'mp-join-desc': 'Ingresa el código de la sala de tu amigo:',
            'mp-placeholder-code': 'Ej: 1234',
            'mp-btn-enter-now': 'Entrar ahora',

            'ranking-title': '🏆 Ranking Global',
            'ranking-col-player': 'Jugador',
            'ranking-col-points': '⭐ Puntos',
            'ranking-col-wins': 'Victorias',
            'ranking-loading': 'Cargando...',
            'ranking-note': 'El ranking considera el total de victorias en todos los niveles.',
            'total': 'Total',
            'ranking-no-players': 'Ningún jugador encontrado.',
            'ranking-error': 'Error al cargar datos.',
            'ranking-wins-short': 'vict.',
            'delete-confirm-1': '⚠️ Atención: Esto eliminará permanentemente su cuenta, todas sus estadísticas de juego y puntuaciones. Esta acción NO se puede deshacer. ¿Desea continuar?',
            'delete-confirm-2': '¿Confirmar eliminación permanente? Todos sus datos serán borrados para siempre.',
            'mp-status-random': 'Buscando oponente aleatorio...',
            'mp-title-created': '¡Sala Creada!',
            'mp-status-friend-waiting': 'Esperando a que tu amigo entre...',
            'mp-alert-invalid-code': 'Ingrese un código válido de 4 dígitos.',
            'mp-alert-not-found': '¡Sala no encontrada! Verifique el código.',
            'mp-alert-error': 'Error al entrar a la sala: {err}',
            'mp-alert-match-error': 'Error al buscar partida: {err}',
            'mp-alert-create-error': 'Error al crear la sala: {err}',

            'placeholder-new-name': 'Nuevo nombre',
            'btn-save-name': 'Guardar',
            'profile-mascote-title': '🦁 Elige tu Mascota:',
            'profile-stats-title': '📊 Tus Estatísticas',
            'stats-col-level': 'Nivel',
            'stats-col-wins': '✅ Victorias',
            'stats-col-games': '🎮 Juegos',
            'stats-col-rate': '🏆 Tasa de Éxito',
            'stats-col-best': '⏱ Récord',
            'stats-loading': 'Cargando...',
            'btn-logout-account': 'Cerrar Sesión',
            'btn-delete-account': 'Eliminar Cuenta Permanentemente',

            'mp-you': 'Tú',
            'mp-opponent': 'Oponente',
            'btn-play-again': 'Jugar de Nuevo',

            'action-undo': 'Deshacer jugada',
            'action-draft': 'Alternar Borrador',
            'action-fast': 'Alternar Relleno Rápido',
            'action-hint': 'Obtener Pista',

            // Dynamic texts
            'errors-label': 'Errores',
            'opponent-disconnected': '¡El oponente se desconectó!',
            'opponent-won': 'El oponente terminó primero. ¡Perdiste!',
            'you-won-battle': '¡Ganaste la Batalla!',
            'opponent-left': '¡El oponente huyó! Ganaste.',
            'mascot-updated': '¡Mascota actualizada! 🦁',
            'name-updated': '¡Nombre actualizado con éxito!',
            'name-error': 'Error al actualizar el nombre.',
            'name-invalid': 'Ingresa un nombre válido.',
            'account-deleted': 'Cuenta eliminada con éxito.',
            'account-delete-error': 'Error al eliminar la cuenta.',
            'congrats': '¡Felicitaciones! 🎉',
            'game-over': 'Fin del juego',
            'mp-battle-over': '¡Fin de la Batalla!',
            'you-solved-in': 'Lo resolviste en {time}.',
            'plus-points': '⭐ +{pts} ¡Puntos!',
            'mistakes-reached': 'Has alcanzado el límite de errores.',
            'auto-completed': '¡Sudoku completado automáticamente!',
            
            'hint-naked-single': '💡 <b>Naked Single:</b> 8 números están bloqueados.',
            'hint-hidden-single-row': '💡 <b>Hidden Single:</b> Solo cabe el {num} en esta fila.',
            'hint-hidden-single-col': '💡 <b>Hidden Single:</b> Solo cabe el {num} en esta columna.',
            'hint-hidden-single-box': '💡 <b>Hidden Single:</b> Solo cabe el {num} en este bloque 3x3.',
            'hint-pointing-pairs-row': '💡 <b>Pares Apuntadores:</b> El {num} debe estar en las casillas amarillas. Elimínalo de las rojas en la misma fila.',
            'hint-pointing-pairs-col': '💡 <b>Pares Apuntadores:</b> El {num} debe estar en las casillas amarillas. Elimínalo de las rojas en la misma columna.',
            'hint-naked-pairs': '💡 <b>Pares Gemelos:</b> Las casillas amarillas forman un par exclusivo. Elimina estos números de las casillas del bloque.',
            'hint-advanced-move': '💡 <b>Jugada Avanzada:</b> Revelando casilla para continuar.',
            'number-completed-toast': '✅ ¡Número completado! Cambiando al {num}.',

            // Firebase errors
            'auth-email-in-use': 'Este correo ya está en uso.',
            'auth-invalid-email': 'Correo inválido.',
            'auth-weak-password': 'Contraseña muy débil (mínimo 6 caracteres).',
            'auth-user-not-found': 'Cuenta no encontrada.',
            'auth-wrong-password': 'Contraseña incorrecta.',
            'auth-invalid-credential': 'Correo o contraseña incorrectos.',
            'auth-popup-closed': 'Inicio de sesión cancelado.',
            'auth-network-error': 'Sin conexión a internet.',
            'auth-unknown-error': 'Ocurrió un error. Inténtalo de nuevo.',
            'auth-enter-name': 'Ingresa tu nombre.',
            'auth-enter-email': 'Ingresa tu correo.',
            'auth-password-short': 'La contraseña debe tener al menos 6 caracteres.',
            'auth-fill-fields': 'Completa correo y contraseña.',
            'auth-reauth-required': 'Por seguridad, inicia sesión de nuevo e intenta eliminar los datos otra vez.'
        }
    };

    window.currentLanguage = settings.language;

    window.t = function(key, params = {}) {
        const lang = window.currentLanguage;
        const langMap = window.LOCALIZATION[lang] || window.LOCALIZATION['pt-BR'];
        let str = langMap[key] || window.LOCALIZATION['pt-BR'][key] || key;
        for (const p in params) {
            str = str.replace(`{${p}}`, params[p]);
        }
        return str;
    };

    const applyLanguage = (lang) => {
        window.currentLanguage = lang;
        settings.language = lang;
        saveSettingsToStorage();
        
        // 1. Traduzir todos os elementos estáticos
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = window.t(key);
            if (translation) {
                if (el.tagName === 'INPUT' && el.placeholder) {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // 2. Traduzir Tooltips / Titles
        const tooltips = {
            'ranking-btn-start': 'ranking-title',
            'settings-btn-start': 'settings-title',
            'profile-btn-start': 'tab-login',
            'theme-btn': 'settings-dark-mode',
            'new-game-btn': 'btn-new-game',
            'settings-btn': 'settings-title',
            'profile-btn': 'tab-login',
            'undo-btn': 'action-undo',
            'draft-btn': 'action-draft',
            'fast-fill-btn': 'action-fast',
            'hint-btn': 'action-hint'
        };
        for (const id in tooltips) {
            const el = document.getElementById(id);
            if (el) {
                el.title = window.t(tooltips[id]);
            }
        }

        // 3. Atualizar label de erros dinamicamente
        const isMultiplayer = !document.getElementById('multiplayer-bar')?.classList.contains('hidden');
        if (settings.errorLimit || isMultiplayer) {
            mistakesCounter.textContent = `${window.t('errors-label')}: ${mistakes}/${maxMistakes}`;
        } else {
            mistakesCounter.textContent = `${window.t('errors-label')}: ${mistakes}`;
        }

        // 4. Atualizar label de dificuldade dinâmica
        let diff = difficultySelect.value;
        const diffKeys = { 'Facil': 'diff-easy', 'Medio': 'diff-medium', 'Dificil': 'diff-hard', 'Especialista': 'diff-expert', 'Radical': 'diff-extreme' };
        if (gameDifficultyLabel) {
            if (window.currentRoomId) {
                const localizedDiff = diffKeys[diff] ? window.t(diffKeys[diff]) : diff;
                gameDifficultyLabel.textContent = `${window.t('mp-title')} (${localizedDiff})`;
            } else {
                gameDifficultyLabel.textContent = window.t(diffKeys[diff] || diff);
            }
        }

        // 5. Sincronizar o select dropdown de configurações
        const selectLang = document.getElementById('setting-language');
        if (selectLang) {
            selectLang.value = lang;
        }
    };

    const saveSettingsToStorage = () => {
        try {
            localStorage.setItem('sudoku_settings', JSON.stringify(settings));
        } catch(e) {}
    };

    const loadSettings = () => {
        try {
            const saved = localStorage.getItem('sudoku_settings');
            if (saved) {
                settings = { ...settings, ...JSON.parse(saved) };
            } else {
                // Migra o highlightMode anterior se houver
                const oldMode = localStorage.getItem('sudoku_highlight_mode');
                if (oldMode === 'full') {
                    settings.highlightCrosshair = true;
                    settings.highlightExclusion = true;
                }
            }
            // Modo escuro legado
            if (localStorage.getItem('darkMode') === 'true') {
                settings.darkMode = true;
            }
        } catch (e) {}
    };
    loadSettings();
    window.currentLanguage = settings.language;

    // Aplica o tema carregado
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    }

    // ----- Lógica Matemática: Gerador de Sudoku (Backtracking) -----
    const generateSudoku = (holes) => {
        let grid = Array.from({length: 9}, () => Array(9).fill(0));
        fillDiagonalBoxes(grid);
        solveSudoku(grid);
        
        // Copia a solução completa
        solution = JSON.parse(JSON.stringify(grid));
        
        // Remove os números para criar o puzzle
        removeNumbers(grid, holes);
        puzzle = JSON.parse(JSON.stringify(grid));
        userBoard = JSON.parse(JSON.stringify(grid));
    };

    const fillDiagonalBoxes = (grid) => {
        for (let i = 0; i < 9; i += 3) {
            fillBox(grid, i, i);
        }
    };

    const fillBox = (grid, rowStart, colStart) => {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!isSafeInBox(grid, rowStart, colStart, num));
                grid[rowStart + i][colStart + j] = num;
            }
        }
    };

    const isSafeInBox = (grid, rowStart, colStart, num) => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    };

    const isSafe = (grid, row, col, num) => {
        for (let x = 0; x <= 8; x++) if (grid[row][x] === num) return false;
        for (let x = 0; x <= 8; x++) if (grid[x][col] === num) return false;
        let startRow = row - row % 3, startCol = col - col % 3;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                if (grid[i + startRow][j + startCol] === num) return false;
        return true;
    };

    const solveSudoku = (grid) => {
        let row = -1, col = -1, isEmpty = false;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid[i][j] === 0) {
                    row = i; col = j; isEmpty = true; break;
                }
            }
            if (isEmpty) break;
        }
        if (!isEmpty) return true;

        for (let num = 1; num <= 9; num++) {
            if (isSafe(grid, row, col, num)) {
                grid[row][col] = num;
                if (solveSudoku(grid)) return true;
                grid[row][col] = 0; // backtrack
            }
        }
        return false;
    };

    const countSolutions = (grid, limit) => {
        let row = -1, col = -1, isEmpty = false;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid[i][j] === 0) {
                    row = i; col = j; isEmpty = true; break;
                }
            }
            if (isEmpty) break;
        }
        if (!isEmpty) return 1;

        let count = 0;
        for (let num = 1; num <= 9; num++) {
            if (isSafe(grid, row, col, num)) {
                grid[row][col] = num;
                count += countSolutions(grid, limit);
                grid[row][col] = 0;
                if (count >= limit) return count;
            }
        }
        return count;
    };

    const removeNumbers = (grid, targetHoles) => {
        let attempts = targetHoles;
        let holesMade = 0;
        // Para evitar travamentos (loops infinitos) em dificuldades Radicais,
        // permitimos ate 20 falhas seguidas ao tentar remover um numero.
        let fails = 20; 
        
        while (holesMade < targetHoles && fails > 0) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            if (grid[row][col] !== 0) {
                let backup = grid[row][col];
                grid[row][col] = 0;
                
                // Copia o grid para testar as solucoes
                let gridCopy = grid.map(arr => [...arr]);
                
                // Se o jogo agora tem mais de 1 solucao, desfaça. (Garante 1 unica solucao logica)
                if (countSolutions(gridCopy, 2) !== 1) {
                    grid[row][col] = backup;
                    fails--;
                } else {
                    holesMade++;
                }
            }
        }
    };
    // -------------------------------------------------------------

    // Timer
    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const startTimer = (startFrom = 0) => {
        clearInterval(timerInterval);
        secondsElapsed = startFrom;
        timerElement.textContent = formatTime(secondsElapsed);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            timerElement.textContent = formatTime(secondsElapsed);
            if (secondsElapsed % 5 === 0) persistGame(); // Auto-save a cada 5 seg
        }, 1000);
    };

    // UI Rendering
    const renderBoard = () => {
        boardElement.innerHTML = '';
        // Garante que a barra de multiplayer esteja escondida se não houver um ID de sala ativo
        if (!window.currentRoomId) {
            document.getElementById('multiplayer-bar')?.classList.add('hidden');
        }
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.r = r;
                cell.dataset.c = c;

                if (c === 2 || c === 5) cell.classList.add('border-right');
                if (r === 2 || r === 5) cell.classList.add('border-bottom');

                if (puzzle[r][c] !== 0) {
                    cell.textContent = puzzle[r][c];
                    cell.classList.add('fixed');
                } else if (userBoard[r][c] !== 0) {
                    cell.textContent = userBoard[r][c];
                    if (userBoard[r][c] !== solution[r][c]) cell.classList.add('error');
                } else {
                    renderDrafts(r, c, cell);
                }
                
                cell.addEventListener('click', () => selectCell(r, c));
                boardElement.appendChild(cell);
            }
        }
        updateNumpad();
    };

    const persistGame = () => {
        const state = {
            puzzle,
            userBoard,
            solution,
            mistakes,
            secondsElapsed,
            difficulty: difficultySelect.value,
            hintChances,
            drafts: drafts.map(row => row.map(s => Array.from(s)))
        };
        try { localStorage.setItem('sudoku_save', JSON.stringify(state)); } catch(e) {}
    };

    const loadSavedGame = () => {
        let saved = null;
        try { saved = localStorage.getItem('sudoku_save'); } catch(e) { return false; }
        if (!saved) return false;
        try {
            const state = JSON.parse(saved);
            puzzle = state.puzzle;
            userBoard = state.userBoard;
            solution = state.solution;
            mistakes = state.mistakes;
            secondsElapsed = state.secondsElapsed;
            difficultySelect.value = state.difficulty;
            if (gameDifficultyLabel) gameDifficultyLabel.textContent = state.difficulty;
            hintChances = state.hintChances;
            drafts = state.drafts.map(row => row.map(arr => new Set(arr)));
            
            if(startScreen) startScreen.classList.add('hidden');
            modal.classList.add('hidden');
            document.getElementById('multiplayer-bar')?.classList.add('hidden');
            if (settings.errorLimit) {
                mistakesCounter.textContent = `${window.t('errors-label')}: ${mistakes}/${maxMistakes}`;
            } else {
                mistakesCounter.textContent = `${window.t('errors-label')}: ${mistakes}`;
            }
            document.getElementById('hint-badge').textContent = hintChances;
            
            renderBoard();
            startTimer(secondsElapsed);
            return true;
        } catch (e) {
            return false;
        }
    };

    const initGame = (isNew = true) => {
        startScreen.classList.add('hidden');
        modal.classList.add('hidden');
        document.getElementById('multiplayer-bar')?.classList.add('hidden');
        mistakes = 0;
        if (settings.errorLimit) {
            mistakesCounter.textContent = `${window.t('errors-label')}: 0/${maxMistakes}`;
        } else {
            mistakesCounter.textContent = `${window.t('errors-label')}: 0`;
        }
        selectedCell = null;
        disarmNumber();
        startTimer(0);
        
        history = [];
        hintChances = 3;
        document.getElementById('hint-badge').textContent = 3;
        hintBtn.style.opacity = 1;
        hintBtn.style.cursor = 'pointer';

        drafts = Array.from({length: 9}, () => Array.from({length: 9}, () => new Set()));

        let diff = difficultySelect.value;
        const diffKeys = { 'Facil': 'diff-easy', 'Medio': 'diff-medium', 'Dificil': 'diff-hard', 'Especialista': 'diff-expert', 'Radical': 'diff-extreme' };
        if (gameDifficultyLabel) {
            gameDifficultyLabel.textContent = window.t(diffKeys[diff] || diff);
        }
        generateSudoku(DIFFICULTIES[diff]);
        renderBoard();
        persistGame();
    };



    window.showGameOver = (win, message) => {
        clearInterval(timerInterval);
        modalTitle.textContent = win ? window.t('mp-battle-over') : window.t('game-over');
        modalTitle.style.color = win ? 'var(--primary-color)' : 'var(--error-color)';
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
        try { localStorage.removeItem('sudoku_save'); } catch(e) {}
    };

    const checkWin = () => {
        let isFull = true;
        let isCorrect = true;
        let correctCount = 0;
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] === 0) {
                    if (userBoard[r][c] === 0) isFull = false;
                    if (userBoard[r][c] !== 0 && userBoard[r][c] !== solution[r][c]) isCorrect = false;
                    if (userBoard[r][c] === solution[r][c]) correctCount++;
                }
            }
        }
        
        if (window.sendProgress) {
            window.sendProgress(correctCount);
        }

        if (isFull && isCorrect) {
            // Se NÃO estiver no modo multiplayer (onde a modal é mostrada pelo outro arquivo)
            if (document.getElementById('multiplayer-bar')?.classList.contains('hidden')) {
                gameOver(true);
            } else {
                clearInterval(timerInterval);
            }
        }
    };

    const selectCell = (r, c) => {
        selectedCell = { r, c };
        updateHighlights(r, c);

        if (fastFillMode && armedNumber !== null) {
            handleInput(armedNumber);
        }
    };

    const updateNumpad = () => {
        let counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                let val = userBoard[r][c] || puzzle[r][c];
                if (val !== 0 && val === solution[r][c]) {
                    counts[val]++;
                }
            }
        }

        // Lógica Dinâmica: Se o número atual (armed) completou 9, pula para o próximo disponível
        if (armedNumber && counts[armedNumber] === 9) {
            if (fastFillMode) {
                let nextNum = null;
                for (let i = 1; i <= 9; i++) {
                    let candidate = (armedNumber + i - 1) % 9 + 1;
                    if (counts[candidate] < 9) {
                        nextNum = candidate;
                        break;
                    }
                }
                if (nextNum) {
                    armedNumber = nextNum;
                    showToast(window.t('number-completed-toast', {num: nextNum}));
                    selectedCell = null;
                    updateHighlights(null, null, nextNum);
                } else {
                    disarmNumber();
                    selectedCell = null;
                    updateHighlights(null, null);
                }
            } else {
                disarmNumber();
                selectedCell = null;
                updateHighlights(null, null);
            }
        }

        numBtns.forEach(btn => {
            let num = parseInt(btn.dataset.val);
            if (counts[num] === 9) {
                btn.classList.add('completed');
                btn.classList.remove('armed');
            } else {
                btn.classList.remove('completed');
                if (armedNumber === num) btn.classList.add('armed');
                else btn.classList.remove('armed');
            }
        });
    };

    const updateHighlights = (r, c, forceNum = null) => {
        let selectedVal = null;
        if (forceNum !== null) {
            selectedVal = forceNum;
        } else if (fastFillMode && armedNumber !== null) {
            selectedVal = armedNumber;
        } else if (r !== null && c !== null) {
            selectedVal = userBoard[r][c] || puzzle[r][c];
        }
        
        // Verifica se o número selecionado já está completo (9 vezes no tabuleiro)
        // Se estiver completo, não destacamos mais os "mesmos números" para limpar o visual
        if (selectedVal && selectedVal !== 0) {
            let count = 0;
            for(let i=0; i<9; i++) {
                for(let j=0; j<9; j++) {
                    if (userBoard[i][j] === selectedVal || puzzle[i][j] === selectedVal) count++;
                }
            }
            if (count === 9) selectedVal = null; // "Esquece" o valor para fins de destaque
        }

        // Identificar linhas, colunas e blocos bloqueados pelo número selecionado (apenas se realce de exclusão ou cruzamento estiver ativo)
        let blockedRows = new Set();
        let blockedCols = new Set();
        let blockedBoxes = new Set();

        const needsExclusion = settings.highlightExclusion;
        const needsCrosshair = settings.highlightCrosshair;

        if ((needsExclusion || needsCrosshair) && selectedVal && selectedVal !== 0) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (userBoard[i][j] === selectedVal || puzzle[i][j] === selectedVal) {
                        blockedRows.add(i);
                        blockedCols.add(j);
                        blockedBoxes.add(`${Math.floor(i/3)},${Math.floor(j/3)}`);
                    }
                }
            }
        }

        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'same-number', 'exclusion-highlight');
            let cellR = parseInt(cell.dataset.r);
            let cellC = parseInt(cell.dataset.c);
            let cellVal = userBoard[cellR][cellC] || puzzle[cellR][cellC];
            
            // 1. Destaque de exclusão
            if (needsExclusion && selectedVal && selectedVal !== 0 && cellVal === 0) {
                if (blockedRows.has(cellR) || blockedCols.has(cellC) || blockedBoxes.has(`${Math.floor(cellR/3)},${Math.floor(cellC/3)}`)) {
                    cell.classList.add('exclusion-highlight');
                }
            }

            // 2. Destaque de seleção, mesmos números e cruzamento
            if (r !== null && cellR === r && cellC === c) {
                cell.classList.add('selected');
            } else if (settings.highlightSame && selectedVal && selectedVal !== 0 && cellVal === selectedVal) {
                cell.classList.add('same-number');
            } else if (needsCrosshair && !draftMode && r !== null && c !== null && (cellR === r || cellC === c || 
                      (Math.floor(cellR/3) === Math.floor(r/3) && Math.floor(cellC/3) === Math.floor(c/3)))) {
                cell.classList.add('highlighted');
            }
        });

        // Destaque para os rascunhos (drafts)
        document.querySelectorAll('.draft-num').forEach(span => {
            if (selectedVal && selectedVal !== 0 && parseInt(span.textContent) === selectedVal) {
                span.classList.add('highlight-draft');
            } else {
                span.classList.remove('highlight-draft');
            }
        });
    };

    const autoFillLastCells = () => {
        let emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (userBoard[r][c] === 0) {
                    emptyCells.push({r, c});
                }
            }
        }
        
        // Se faltarem apenas 1 ou 2 casas, preenche automaticamente para polpar tempo do jogador
        if (emptyCells.length > 0 && emptyCells.length <= 2) {
            emptyCells.forEach(cellPos => {
                const {r, c} = cellPos;
                userBoard[r][c] = solution[r][c];
                const cell = getCellDOM(r, c);
                cell.textContent = solution[r][c];
                cell.classList.remove('error');
                cell.classList.add('hint-target'); // Usa a cor verde de dica para mostrar que foi automático
                drafts[r][c].clear();
            });
            showToast(window.t('auto-completed'));
        }
    };

    const getCellDOM = (r, c) => document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);

    const handleInput = (num) => {
        if (!selectedCell) {
            updateHighlights(null, null, num);
            return;
        }
        const { r, c } = selectedCell;
        
        if (puzzle[r][c] !== 0) return;
        if (userBoard[r][c] === solution[r][c]) return;
        if (draftMode && userBoard[r][c] !== 0) return;

        saveState();

        const cell = getCellDOM(r, c);
        
        if (draftMode) {
            if (userBoard[r][c] !== 0) return; // Nao rascunha se ja preencheu
            if (drafts[r][c].has(num)) drafts[r][c].delete(num);
            else drafts[r][c].add(num);
            renderDrafts(r, c);
            updateHighlights(r, c, num);
            persistGame();
            return;
        }

        if (num === solution[r][c]) {
            userBoard[r][c] = num;
            cell.textContent = num;
            cell.classList.remove('error');
            drafts[r][c].clear();
            if (settings.autoClearDrafts) {
                clearDraftsFor(r, c, num);
            }
            updateNumpad();
            autoFillLastCells();
            checkWin();
        } else {
            if (userBoard[r][c] === num) {
                // Remove o número errado se clicar nele novamente
                userBoard[r][c] = 0;
                cell.textContent = '';
                cell.classList.remove('error');
            } else {
                userBoard[r][c] = num;
                cell.textContent = num;
                cell.classList.add('error');
                mistakes++;
                const isMultiplayer = !document.getElementById('multiplayer-bar')?.classList.contains('hidden');
                if (settings.errorLimit || isMultiplayer) {
                    mistakesCounter.textContent = `${window.t('errors-label')}: ${mistakes}/${maxMistakes}`;
                    if (mistakes >= maxMistakes) gameOver(false);
                } else {
                    mistakesCounter.textContent = `${window.t('errors-label')}: ${mistakes}`;
                }
            }
        }
        updateHighlights(selectedCell ? selectedCell.r : null, selectedCell ? selectedCell.c : null);
        persistGame();
    };

    const renderDrafts = (r, c, cellParam = null) => {
        const cell = cellParam || getCellDOM(r, c);
        if (!cell) return;
        cell.innerHTML = '';
        if (drafts[r][c].size === 0) return;
        const draftContainer = document.createElement('div');
        draftContainer.className = 'draft-container';
        for(let i=1; i<=9; i++) {
            const span = document.createElement('span');
            span.className = 'draft-num';
            if (drafts[r][c].has(i)) span.textContent = i;
            draftContainer.appendChild(span);
        }
        cell.appendChild(draftContainer);
    };

    const clearDraftsFor = (r, c, num) => {
        for (let i = 0; i < 9; i++) {
            if (drafts[r][i].has(num)) { drafts[r][i].delete(num); renderDrafts(r, i); }
            if (drafts[i][c].has(num)) { drafts[i][c].delete(num); renderDrafts(i, c); }
        }
        let startRow = r - r % 3, startCol = c - c % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (drafts[startRow + i][startCol + j].has(num)) {
                    drafts[startRow + i][startCol + j].delete(num);
                    renderDrafts(startRow + i, startCol + j);
                }
            }
        }
    };

    const eraseInput = () => {
        if (!selectedCell) return;
        const { r, c } = selectedCell;
        if (puzzle[r][c] !== 0) return;
        if (userBoard[r][c] === solution[r][c]) return;
        
        if (userBoard[r][c] !== 0 || drafts[r][c].size > 0) {
            saveState();
        }
        
        if (userBoard[r][c] !== 0) {
            userBoard[r][c] = 0;
            const cell = getCellDOM(r, c);
            cell.textContent = '';
            cell.classList.remove('error');
            renderDrafts(r, c);
            updateHighlights(r, c);
            persistGame();
        } else if (drafts[r][c].size > 0) {
            drafts[r][c].clear();
            renderDrafts(r, c);
            persistGame();
        }
    };



    const gameOver = (won) => {
        clearInterval(timerInterval);
        
        // 1. Atualiza visual da interface do modal IMEDIATAMENTE (à prova de crash)
        if (won) {
            modalTitle.textContent = window.t('congrats');
            modalTitle.style.color = "var(--primary-color)";
            const diff = difficultySelect ? difficultySelect.value : 'Dificil';
            const ptsMap = { Facil: 10, Medio: 20, Dificil: 30, Especialista: 40, Radical: 50 };
            const pts = ptsMap[diff] || 10;
            modalMessage.innerHTML = `${window.t('you-solved-in', {time: formatTime(secondsElapsed)})}<br><span style="font-size: 1.3rem; color: #38a169; font-weight: bold; display: block; margin-top: 10px;">${window.t('plus-points', {pts})}</span>`;
        } else {
            modalTitle.textContent = window.t('game-over');
            modalTitle.style.color = "#e53e3e";
            modalMessage.textContent = window.t('mistakes-reached');
        }
        
        modal.classList.remove('hidden');
        
        // 2. Salva estatísticas no Firebase com proteção isolada
        try {
            if (window.authModule && typeof window.authModule.saveStats === 'function') {
                const diff = difficultySelect ? difficultySelect.value : 'Dificil';
                window.authModule.saveStats(diff, won, secondsElapsed);
            }
        } catch(e) { console.warn('Stats save error:', e); }

        // 3. Dispara o anúncio com proteção isolada
        try {
            mostrarAnuncio();
        } catch(e) { console.warn('AdMob display error:', e); }

        // 4. Limpa jogo salvo localmente
        try { localStorage.removeItem('sudoku_save'); } catch(e) {}
    };

    // Função para disparar o anúncio Intersticial (Tela Cheia) do Google AdMob
    const mostrarAnuncio = () => {
        console.log("AdMob: Solicitando anúncio...");
        if (window.adsbygoogle) {
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-app-pub-7310901635673832",
                enable_page_level_ads: true,
                overlays: {bottom: true}
            });
        }
    };

    // Event Listeners
    const showStartScreen = () => {
        if (startScreen) startScreen.classList.remove('hidden');
        if (modal) modal.classList.add('hidden');
        try {
            if (localStorage.getItem('sudoku_save') && continueGameBtn) {
                continueGameBtn.classList.remove('hidden');
            } else if (continueGameBtn) {
                continueGameBtn.classList.add('hidden');
            }
        } catch(e) {
            if (continueGameBtn) continueGameBtn.classList.add('hidden');
        }
    };
    if (newGameBtn) newGameBtn.addEventListener('click', showStartScreen);
    if (modalNewGameBtn) modalNewGameBtn.addEventListener('click', showStartScreen);
    if (difficultySelect) difficultySelect.addEventListener('change', initGame);
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            initGame(true);
        });
    }

    if (continueGameBtn) {
        continueGameBtn.addEventListener('click', () => {
            if (!loadSavedGame()) {
                initGame(true); // Fallback caso o save esteja corrompido
            }
        });
    }

    const saveState = () => {
        history.push({
            userBoard: JSON.parse(JSON.stringify(userBoard)),
            drafts: drafts.map(row => row.map(cellSet => new Set(cellSet)))
        });
    };

    if (undoBtn) undoBtn.addEventListener('click', () => {
        if (history.length === 0) return;
        const lastAction = history.pop();
        userBoard = lastAction.userBoard;
        drafts = lastAction.drafts;
        
        for (let r=0; r<9; r++) {
            for (let c=0; c<9; c++) {
                if (puzzle[r][c] !== 0) continue;
                const cell = getCellDOM(r, c);
                if (userBoard[r][c] !== 0) {
                    cell.textContent = userBoard[r][c];
                    if (userBoard[r][c] !== solution[r][c]) cell.classList.add('error');
                    else cell.classList.remove('error');
                } else {
                    cell.textContent = '';
                    cell.classList.remove('error');
                    renderDrafts(r, c);
                }
            }
        }
        updateNumpad();
        let r = selectedCell ? selectedCell.r : null;
        let c = selectedCell ? selectedCell.c : null;
        updateHighlights(r, c);
        persistGame();
    });

    const getCandidatesMap = () => {
        let map = Array(9).fill(null).map(() => Array(9).fill(null));
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (userBoard[r][c] !== 0) continue;
                let cands = [];
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(userBoard, r, c, num)) {
                        cands.push(num);
                    }
                }
                map[r][c] = cands;
            }
        }
        return map;
    };

      const applyHintAction = (r, c, ans, title) => {
        saveState();
        userBoard[r][c] = ans;
        selectCell(r, c);
        
        const cell = getCellDOM(r, c);
        cell.textContent = ans;
        cell.classList.remove('error');
        drafts[r][c].clear();
        clearDraftsFor(r, c, ans);
        updateNumpad();
        checkWin();
        
        clearVisualHints();
        cell.classList.add('hint-target');
        showToast(title);
        
        consumeHintToken();
    };

    const showAdvancedHint = (causeCells, eliminationCells, title) => {
        saveState(); // Permite que o usuario desfaça a adição automatica de rascunhos

        clearVisualHints();
        
        causeCells.forEach(hc => {
            let cell = getCellDOM(hc.r, hc.c);
            cell.classList.add('hint-cause');
            if (hc.cands) {
                hc.cands.forEach(cand => drafts[hc.r][hc.c].add(cand));
                renderDrafts(hc.r, hc.c);
            }
        });
        
        if (eliminationCells && eliminationCells.length > 0) {
            eliminationCells.forEach(hc => {
                let cell = getCellDOM(hc.r, hc.c);
                cell.classList.add('hint-elimination');
                if (hc.cands) {
                    hc.cands.forEach(cand => drafts[hc.r][hc.c].add(cand));
                    renderDrafts(hc.r, hc.c);
                }
            });
        }
        
        showToast(title);
        consumeHintToken();
    };

    const consumeHintToken = () => {
        hintChances--;
        document.getElementById('hint-badge').textContent = hintChances;
        if (hintChances <= 0) {
            hintBtn.style.opacity = 0.5;
            hintBtn.style.cursor = 'not-allowed';
        }
    };

    const provideLogicalHint = () => {
        if (hintChances <= 0) return;
        
        let cands = getCandidatesMap();

        // Nível 1.1: Naked Single
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (cands[r][c] && cands[r][c].length === 1) {
                    let ans = cands[r][c][0];
                    applyHintAction(r, c, ans, window.t('hint-naked-single'));
                    return;
                }
            }
        }

        // Nível 1.2: Hidden Single
        for (let num = 1; num <= 9; num++) {
            for (let r = 0; r < 9; r++) {
                let possibleCols = [];
                for (let c = 0; c < 9; c++) {
                    if (cands[r][c] && cands[r][c].includes(num)) possibleCols.push(c);
                }
                if (possibleCols.length === 1) {
                    applyHintAction(r, possibleCols[0], num, window.t('hint-hidden-single-row', {num}));
                    return;
                }
            }
            for (let c = 0; c < 9; c++) {
                let possibleRows = [];
                for (let r = 0; r < 9; r++) {
                    if (cands[r][c] && cands[r][c].includes(num)) possibleRows.push(r);
                }
                if (possibleRows.length === 1) {
                    applyHintAction(possibleRows[0], c, num, window.t('hint-hidden-single-col', {num}));
                    return;
                }
            }
            for (let b = 0; b < 9; b++) {
                let startRow = Math.floor(b / 3) * 3;
                let startCol = (b % 3) * 3;
                let possibleCells = [];
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        let r = startRow + i;
                        let c = startCol + j;
                        if (cands[r][c] && cands[r][c].includes(num)) possibleCells.push({r, c});
                    }
                }
                if (possibleCells.length === 1) {
                    applyHintAction(possibleCells[0].r, possibleCells[0].c, num, window.t('hint-hidden-single-box', {num}));
                    return;
                }
            }
        }

        // Nível 2.1: Pointing Pairs
        for (let b = 0; b < 9; b++) {
            let startRow = Math.floor(b / 3) * 3;
            let startCol = (b % 3) * 3;
            for (let num = 1; num <= 9; num++) {
                let possibleCells = [];
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        let r = startRow + i;
                        let c = startCol + j;
                        if (cands[r][c] && cands[r][c].includes(num)) possibleCells.push({r, c, cands: [num]});
                    }
                }
                if (possibleCells.length > 1) {
                    let sameRow = possibleCells.every(cell => cell.r === possibleCells[0].r);
                    if (sameRow) {
                        let r = possibleCells[0].r;
                        let elims = [];
                        for (let c = 0; c < 9; c++) {
                            if (c < startCol || c >= startCol + 3) {
                                if (cands[r][c] && cands[r][c].includes(num)) elims.push({r, c, cands: [num]});
                            }
                        }
                        if (elims.length > 0) {
                            showAdvancedHint(possibleCells, elims, window.t('hint-pointing-pairs-row', {num}));
                            return;
                        }
                    }
                    
                    let sameCol = possibleCells.every(cell => cell.c === possibleCells[0].c);
                    if (sameCol) {
                        let c = possibleCells[0].c;
                        let elims = [];
                        for (let r = 0; r < 9; r++) {
                            if (r < startRow || r >= startRow + 3) {
                                if (cands[r][c] && cands[r][c].includes(num)) elims.push({r, c, cands: [num]});
                            }
                        }
                        if (elims.length > 0) {
                            showAdvancedHint(possibleCells, elims, window.t('hint-pointing-pairs-col', {num}));
                            return;
                        }
                    }
                }
            }
        }

        // Nível 2.2: Naked Pairs
        for (let b = 0; b < 9; b++) {
            let startRow = Math.floor(b / 3) * 3;
            let startCol = (b % 3) * 3;
            let cellsInBox = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    let r = startRow + i; let c = startCol + j;
                    if (cands[r][c] && cands[r][c].length === 2) {
                        cellsInBox.push({r, c, cands: cands[r][c]});
                    }
                }
            }
            if (cellsInBox.length >= 2) {
                for (let i=0; i<cellsInBox.length; i++) {
                    for (let j=i+1; j<cellsInBox.length; j++) {
                        if (cellsInBox[i].cands.join(',') === cellsInBox[j].cands.join(',')) {
                            let pairCands = cellsInBox[i].cands;
                            let elims = [];
                            for (let r=startRow; r<startRow+3; r++) {
                                for (let c=startCol; c<startCol+3; c++) {
                                    if ((r !== cellsInBox[i].r || c !== cellsInBox[i].c) && (r !== cellsInBox[j].r || c !== cellsInBox[j].c)) {
                                        if (cands[r][c] && (cands[r][c].includes(pairCands[0]) || cands[r][c].includes(pairCands[1]))) {
                                            elims.push({r, c, cands: pairCands});
                                        }
                                    }
                                }
                            }
                            if (elims.length > 0) {
                                showAdvancedHint([cellsInBox[i], cellsInBox[j]], elims, window.t('hint-naked-pairs'));
                                return;
                            }
                        }
                    }
                }
            }
        }

        for (let r=0; r<9; r++) {
            for (let c=0; c<9; c++) {
                if (userBoard[r][c] === 0) {
                    applyHintAction(r, c, solution[r][c], window.t('hint-advanced-move'));
                    return;
                }
            }
        }
    };

    hintBtn.addEventListener('click', provideLogicalHint);

    const disarmNumber = () => {
        armedNumber = null;
        numBtns.forEach(b => b.classList.remove('armed'));
    };

    fastFillBtn.addEventListener('click', () => {
        fastFillMode = !fastFillMode;
        const badge = document.getElementById('fast-badge');
        if (fastFillMode) {
            fastFillBtn.classList.add('fast-fill-active');
            if (badge) {
                badge.textContent = 'ON';
                badge.style.backgroundColor = 'var(--primary-color)';
            }
        } else {
            fastFillBtn.classList.remove('fast-fill-active');
            if (badge) {
                badge.textContent = 'OFF';
                badge.style.backgroundColor = '#a0aec0';
            }
            disarmNumber();
        }
    });

    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            let num = parseInt(btn.dataset.val);
            if (fastFillMode) {
                if (armedNumber === num) {
                    disarmNumber();
                    let r = selectedCell ? selectedCell.r : null;
                    let c = selectedCell ? selectedCell.c : null;
                    updateHighlights(r, c);
                } else {
                    disarmNumber();
                    armedNumber = num;
                    btn.classList.add('armed');
                    updateHighlights(null, null, num);
                }
            } else {
                handleInput(num);
            }
        });
    });

    draftBtn.addEventListener('click', () => {
        draftMode = !draftMode;
        if (draftMode) {
            draftBtn.classList.add('draft-active');
            document.getElementById('draft-badge').textContent = 'ON';
            document.getElementById('draft-badge').style.backgroundColor = 'var(--primary-color)';
        } else {
            draftBtn.classList.remove('draft-active');
            document.getElementById('draft-badge').textContent = 'OFF';
            document.getElementById('draft-badge').style.backgroundColor = '#a0aec0';
        }
        if (selectedCell) {
            updateHighlights(selectedCell.r, selectedCell.c);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            handleInput(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            eraseInput();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (!selectedCell) return;
            let {r, c} = selectedCell;
            if (e.key === 'ArrowUp' && r > 0) r--;
            if (e.key === 'ArrowDown' && r < 8) r++;
            if (e.key === 'ArrowLeft' && c > 0) c--;
            if (e.key === 'ArrowRight' && c < 8) c++;
            selectCell(r, c);
        }
    });

    // Iniciar
    const updateTimerVisibility = () => {
        if (timerElement) {
            timerElement.style.display = settings.timer ? 'inline' : 'none';
        }
    };

    // Iniciar
    window.addEventListener('load', () => {
        showStartScreen();
        
        const settingsModal = document.getElementById('settings-modal');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsBtnStart = document.getElementById('settings-btn-start');
        const closeSettingsBtn = document.getElementById('close-settings-modal');

        const openSettings = () => {
            const darkModeSwitch = document.getElementById('setting-dark-mode');
            const timerSwitch = document.getElementById('setting-timer');
            const errorLimitSwitch = document.getElementById('setting-error-limit');
            const autoClearSwitch = document.getElementById('setting-auto-clear-drafts');

            if (darkModeSwitch) darkModeSwitch.checked = settings.darkMode;
            if (timerSwitch) timerSwitch.checked = settings.timer;
            if (errorLimitSwitch) errorLimitSwitch.checked = settings.errorLimit;
            if (autoClearSwitch) autoClearSwitch.checked = settings.autoClearDrafts;

            // Realce de células (Select dropdown)
            const selectHighlight = document.getElementById('setting-highlight-mode');
            if (selectHighlight) {
                if (settings.highlightCrosshair || settings.highlightExclusion) {
                    selectHighlight.value = 'full';
                } else {
                    selectHighlight.value = 'simple';
                }
            }

            if (settingsModal) settingsModal.classList.remove('hidden');
        };

        const closeSettings = () => {
            if (settingsModal) settingsModal.classList.add('hidden');
        };

        if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
        if (settingsBtnStart) settingsBtnStart.addEventListener('click', openSettings);
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);

        // Fechar clicando fora do modal
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) closeSettings();
            });
        }

        // Event listeners para os switches de configurações
        const setupSwitchListener = (id, settingKey, onChange = null) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    settings[settingKey] = e.target.checked;
                    saveSettingsToStorage();
                    if (onChange) onChange(e.target.checked);
                });
            }
        };

        setupSwitchListener('setting-dark-mode', 'darkMode', (checked) => {
            toggleTheme(checked);
        });

        setupSwitchListener('setting-timer', 'timer', () => {
            updateTimerVisibility();
        });

        setupSwitchListener('setting-error-limit', 'errorLimit', () => {
            const isMultiplayer = !document.getElementById('multiplayer-bar')?.classList.contains('hidden');
            if (settings.errorLimit || isMultiplayer) {
                mistakesCounter.textContent = `Erros: ${mistakes}/${maxMistakes}`;
            } else {
                mistakesCounter.textContent = `Erros: ${mistakes}`;
            }
        });

        setupSwitchListener('setting-auto-clear-drafts', 'autoClearDrafts');

        // Event listener para o select de realce
        const selectHighlight = document.getElementById('setting-highlight-mode');
        if (selectHighlight) {
            selectHighlight.addEventListener('change', (e) => {
                if (e.target.value === 'full') {
                    settings.highlightCrosshair = true;
                    settings.highlightExclusion = true;
                    settings.highlightSame = true;
                } else {
                    settings.highlightCrosshair = false;
                    settings.highlightExclusion = false;
                    settings.highlightSame = true;
                }
                saveSettingsToStorage();
                let r = selectedCell ? selectedCell.r : null;
                let c = selectedCell ? selectedCell.c : null;
                updateHighlights(r, c);
            });
        }

        // Event listener para o select de idioma
        const selectLang = document.getElementById('setting-language');
        if (selectLang) {
            selectLang.addEventListener('change', (e) => {
                applyLanguage(e.target.value);
            });
        }

        // Inicializa visibilidade do timer e aplica idioma padrão
        updateTimerVisibility();
        applyLanguage(settings.language);
    });

    // Exportações para o módulo multiplayer (game_net.js)
    window.startMultiplayerGameLocal = (puz, sol, diff) => {
        if (startScreen) startScreen.classList.add('hidden');
        if (modal) modal.classList.add('hidden');
        mistakes = 0;
        if (mistakesCounter) mistakesCounter.textContent = `Erros: 0/${maxMistakes}`;
        if (gameDifficultyLabel) {
            gameDifficultyLabel.textContent = diff ? `Batalha (${diff})` : 'Batalha';
        }
        selectedCell = null;
        disarmNumber();
        startTimer(0);
        history = [];
        hintChances = 3;
        const hintBadge = document.getElementById('hint-badge');
        if (hintBadge) hintBadge.textContent = 3;
        if (hintBtn) { hintBtn.style.opacity = 1; hintBtn.style.cursor = 'pointer'; }
        drafts = Array.from({length: 9}, () => Array.from({length: 9}, () => new Set()));
        puzzle = puz;
        solution = sol;
        userBoard = Array.from({length: 9}, () => Array(9).fill(0));
        renderBoard();
    };

    window.showGameOver = (win, message) => {
        clearInterval(timerInterval);
        if (modalTitle) {
            modalTitle.textContent = win ? 'Fim de Batalha!' : 'Game Over';
            modalTitle.style.color = win ? 'var(--primary-color)' : 'var(--error-color)';
        }
        if (modalMessage) modalMessage.textContent = message;
        if (modal) modal.classList.remove('hidden');
        try { localStorage.removeItem('sudoku_save'); } catch(e) {}
    };

    window.showToast = showToast;
});

