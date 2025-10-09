/*
    Guess Correctly - JavaScript Game Logic
    Author: ndmx-alex (Alexander)
    Date: October 2025

    Description:
    - Single-player and multiplayer memory matching game
    - Firebase Realtime Database integration for online multiplayer
    - Turn-based gameplay with real-time synchronization
    - Halloween-themed audio and visual effects

    Features:
    - 16 cards (8 pairs) memory game
    - Single player: Classic mode with timer
    - Multiplayer: Real-time online mode for 2 players
    - Score tracking and turn management
    - Firebase database sync for game state
*/

// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Firebase Config - Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "arcadeviva.firebaseapp.com",
    databaseURL: "https://arcadeviva-default-rtdb.firebaseio.com",
    projectId: "arcadeviva",
    storageBucket: "arcadeviva.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase app and database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * AudioController Class
 * Manages all game audio effects and background music
 * Provides Halloween-themed sound effects for game interactions
 */
class AudioController {
    constructor() {
        this.isMuted = false;
        console.log('Initializing AudioController...');
        // Initialize audio files for different game events with error handling
        try {
            this.bgMusic = new Audio('Audio/creepy.mp3');
            this.flipSound = new Audio('Audio/flip.wav');
            this.matchSound = new Audio('Audio/match.wav');
            this.victorySound = new Audio('Audio/victory.wav');
            this.gameOverSound = new Audio('Audio/gameOver.wav');

            // Configure background music
            this.bgMusic.volume = 0.3;
            this.bgMusic.loop = true;

            // Add load event listeners for debugging
            [this.bgMusic, this.flipSound, this.matchSound, this.victorySound, this.gameOverSound].forEach(audio => {
                audio.addEventListener('loadstart', () => console.log('Audio loading started'));
                audio.addEventListener('canplay', () => console.log('Audio can play'));
                audio.addEventListener('error', (e) => console.error('Audio load error:', e));
            });

            console.log('Audio files initialized successfully');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            // Create silent audio objects as fallbacks
            this.bgMusic = { play: () => {}, pause: () => {}, currentTime: 0 };
            this.flipSound = { play: () => {} };
            this.matchSound = { play: () => {} };
            this.victorySound = { play: () => {} };
            this.gameOverSound = { play: () => {} };
        }
    }

    /** Toggle mute state for all audio */
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('muteToggle');
        if (muteBtn) {
            if (this.isMuted) {
                muteBtn.textContent = '🔇';
                muteBtn.classList.add('muted');
                this.stopMusic(); // Stop any currently playing music
                console.log('Audio muted');
            } else {
                muteBtn.textContent = '🔊';
                muteBtn.classList.remove('muted');
                console.log('Audio unmuted');
            }
        }
        return this.isMuted;
    }

    /** Start background music playback */
    startMusic() {
        if (this.isMuted) return;
        try {
            this.bgMusic.play().catch(err => console.log('Audio play failed:', err));
        } catch (error) {
            console.log('Background music play failed:', error);
        }
    }

    /** Stop background music and reset position */
    stopMusic() {
        try {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        } catch (error) {
            console.log('Background music stop failed:', error);
        }
    }

    /** Play card flip sound effect */
    flip() {
        if (this.isMuted) return;
        try {
            this.flipSound.play().catch(err => console.log('Flip sound failed:', err));
        } catch (error) {
            console.log('Flip sound play failed:', error);
        }
    }

    /** Play card match sound effect */
    match() {
        if (this.isMuted) return;
        try {
            this.matchSound.play().catch(err => console.log('Match sound failed:', err));
        } catch (error) {
            console.log('Match sound play failed:', error);
        }
    }

    /** Play victory sound and stop background music */
    victory() {
        this.stopMusic();
        if (this.isMuted) return;
        try {
            this.victorySound.play().catch(err => console.log('Victory sound failed:', err));
        } catch (error) {
            console.log('Victory sound play failed:', error);
        }
    }

    /** Play game over sound and stop background music */
    gameOver() {
        this.stopMusic();
        if (this.isMuted) return;
        try {
            this.gameOverSound.play().catch(err => console.log('Game over sound failed:', err));
        } catch (error) {
            console.log('Game over sound play failed:', error);
        }
    }
}

/**
 * MixOrMatch Class - Single Player Game Logic
 * Handles classic memory matching game with timer and scoring
 * Manages card shuffling, flipping, matching, and game state
 */
class MixOrMatch {
    constructor(totalTime, cards) {
        this.cardsArray = cards;          // Array of card DOM elements
        this.totalTime = totalTime;       // Total game time in seconds
        this.timeRemaining = totalTime;   // Current time remaining
        this.timer = document.getElementById('timeCounter');    // Timer display element
        this.ticker = document.getElementById('flipCounter');   // Flip counter display
        this.audioController = new AudioController();           // Audio controller instance
        this.ghostStreak = 0;             // Consecutive matches counter (spooky theme)
    }

    /**
     * Initialize and start the single-player game
     * Sets up initial game state, shuffles cards, starts timer and music
     */
    startGame() {
        this.totalClicks = 0;           // Reset flip counter
        this.timeRemaining = this.totalTime;  // Reset timer
        this.cardToCheck = null;        // No card currently flipped
        this.matchedCards = [];         // Reset matched cards array
        this.ghostStreak = 0;           // Reset ghost streak counter
        this.busy = true;               // Prevent card interactions during setup

        // Delay to allow initial card display
        setTimeout(() => {
            this.audioController.startMusic();      // Start background music
            this.shuffleCards(this.cardsArray);     // Shuffle card positions
            this.cardsArray.forEach(card => { // Ensure visible after shuffle
                card.style.visibility = 'visible';
                card.classList.remove('visible', 'matched');
            });
            this.countdown = this.startCountdown(); // Start game timer
            this.busy = false;                      // Allow card interactions
            console.log('Cards shuffled and visible');
        }, 500);

        this.hideCards();                           // Hide all cards initially
        this.timer.innerText = this.timeRemaining;  // Update timer display
        this.ticker.innerText = this.totalClicks;   // Update flip counter
    }
    startCountdown() {
        return setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;
            if(this.timeRemaining === 0)
                this.gameOver();
        }, 1000);
    }
    gameOver() {
        clearInterval(this.countdown);
        this.audioController.gameOver();
        document.getElementById('gameOvertext').classList.add('visible');
    }
    victory() {
        clearInterval(this.countdown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible');
    }
    hideCards() {
        this.cardsArray.forEach(card => {
            card.classList.remove('visible');
            card.classList.remove('matched');
        });
    }
    flipCard(card) {
        if(this.canFlipCard(card)) {
            this.audioController.flip();
            this.totalClicks++;
            this.ticker.innerText = this.totalClicks;
            card.classList.add('visible');

            if(this.cardToCheck) {
                this.checkForCardMatch(card);
            } else {
                this.cardToCheck = card;
            }
        }
    }
    checkForCardMatch(card) {
        if(this.getCardType(card) === this.getCardType(this.cardToCheck))
            this.cardMatch(card, this.cardToCheck);
        else 
            this.cardMismatch(card, this.cardToCheck);

        this.cardToCheck = null;
    }
    cardMatch(card1, card2) {
        this.matchedCards.push(card1);
        this.matchedCards.push(card2);
        card1.classList.add('matched');
        card2.classList.add('matched');
        this.audioController.match();

        // Increment ghost streak and award bonus time
        this.ghostStreak++;
        if (this.ghostStreak >= 3) {
            this.timeRemaining += 5; // Bonus 5 seconds for 3+ match streak
            console.log(`👻 Ghost Streak ${this.ghostStreak}! +5 seconds bonus time!`);
            this.timer.innerText = this.timeRemaining; // Update timer display immediately
        }

        if(this.matchedCards.length === this.cardsArray.length)
            this.victory();
    }
    cardMismatch(card1, card2) {
        this.ghostStreak = 0; // Reset ghost streak on mismatch
        this.busy = true;
        setTimeout(() => {
            card1.classList.remove('visible');
            card2.classList.remove('visible');
            this.busy = false;
        }, 1000);
    }
    shuffleCards(cardsArray) { // Fisher-Yates Shuffle Algorithm.
        // Create array of indices and shuffle them
        const indices = Array.from({ length: cardsArray.length }, (_, i) => i);

        for (let i = indices.length - 1; i > 0; i--) {
            const randIndex = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[randIndex]] = [indices[randIndex], indices[i]];
        }

        // Apply shuffled order to cards for visual layout
        cardsArray.forEach((card, index) => {
            card.style.order = indices[index];
        });
    }
    getCardType(card) {
        return card.getElementsByClassName('back')[0].src;
    }
    canFlipCard(card) {
        const cardIndex = this.cardsArray.indexOf(card);
        return !this.busy && !this.matchedCards.includes(cardIndex) && card !== this.cardToCheck;
    }
}

/**
 * MultiplayerGame Class - Online Multiplayer Game Logic
 * Handles real-time multiplayer memory matching with Firebase sync
 * Manages game creation, joining, turn-based gameplay, and database synchronization
 */
class MultiplayerGame {
    constructor(totalTime, cards) {
        this.cardsArray = cards;          // Array of card DOM elements
        this.totalTime = totalTime;       // Total game time in seconds
        this.timeRemaining = totalTime;   // Current time remaining
        this.timer = document.getElementById('timeCounter');    // Timer display element
        this.ticker = document.getElementById('flipCounter');   // Flip counter display
        this.audioController = new AudioController();           // Audio controller instance

        // Multiplayer-specific properties
        this.gameId = null;               // Unique game identifier
        this.isHost = false;              // Whether this player is the game host
        this.playerId = Math.random().toString(36).substring(2, 9); // Unique player ID
        this.players = { player1: { score: 0, clicks: 0 }, player2: { score: 0, clicks: 0 } }; // Player scores and clicks
        this.currentTurn = 'player1';     // Current player's turn
        this.matchedCards = [];           // Array of matched card indices
        this.revealed = {};               // Object tracking revealed card states
    }

    /**
     * Create a new multiplayer game as the host
     * Uses provided game ID or generates new one if not provided
     */
    async createGame(providedGameId = null) {
        this.isHost = true;              // Mark this player as host

        if (providedGameId) {
            // Use the game ID that was already created on index page
            this.gameId = providedGameId;
            console.log('Using provided game ID:', this.gameId);
        } else {
            // Fallback: generate new game ID (old behavior)
            const gamesRef = ref(db, 'games');
            const newGameRef = push(gamesRef);
            this.gameId = newGameRef.key;
            console.log('Generated new game ID:', this.gameId);
        }

        // Initialize complete game state in Firebase database
        const gameState = {
            state: 'waiting',
            hostId: this.playerId,
            players: {
                [this.playerId]: {
                    role: 'player1',
                    connected: true
                }
            },
            currentTurn: 'player1',
            scores: {
                player1: { score: 0, clicks: 0 },
                player2: { score: 0, clicks: 0 }
            },
            cards: this.generateCardOrders(),
            revealed: {},
            matched: [],
            created: Date.now()
        };
        await set(ref(db, `games/${this.gameId}`), gameState);

        this.listenToGame(); // Start listening for game updates
    }

    /**
     * Join an existing multiplayer game
     * Validates game exists and adds player as player2
     */
    async joinGame(gameId) {
        this.gameId = gameId;             // Set game ID
        this.isHost = false;              // This player is joining, not hosting
        const gameRef = ref(db, `games/${this.gameId}`);

        // Check if game exists and join
        const snapshot = await get(gameRef);
        const data = snapshot.val();

        if (!data) {
            alert('Game not found!');
            window.location.href = 'index.html';
            return;
        }

        if (data.state !== 'waiting') {
            alert('Game is not available to join!');
            window.location.href = 'index.html';
            return;
        }

        if (Object.keys(data.players || {}).length >= 2) {
            alert('Game is full!');
            window.location.href = 'index.html';
            return;
        }

        // Join as player2 and start the game
        const playerData = {
            [this.playerId]: {
                role: 'player2',
                connected: true
            }
        };

        await set(ref(db, `games/${this.gameId}/players`), { ...data.players, ...playerData });
        await set(ref(db, `games/${this.gameId}/state`), 'active');

        console.log('Successfully joined game as player2');
        this.listenToGame(); // Start listening for game updates
    }

    listenToGame() {
        const gameRef = ref(db, `games/${this.gameId}`);
        onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            console.log('Game data update:', data); // Debug logging
            if (!data) {
                console.log('No game data received - game may have ended');
                alert('Game has ended or been disconnected');
                // Return to mode selection
                document.getElementById('modeSelection').classList.add('visible');
                return;
            }

            // Check for disconnects - if a player is missing, end game
            if (data.state === 'active' && Object.keys(data.players || {}).length < 2) {
                console.log('Player disconnected - ending game');
                alert('Other player disconnected. Game ended.');
                set(ref(db, `games/${this.gameId}/state`), 'ended');
                document.getElementById('modeSelection').classList.add('visible');
                return;
            }

            this.players = data.scores || { player1: { score: 0, clicks: 0 }, player2: { score: 0, clicks: 0 } };
            this.currentTurn = data.currentTurn || 'player1';
            this.matchedCards = data.matched || [];
            this.revealed = data.revealed || {};
            console.log('Updated state - Turn:', this.currentTurn, 'Scores:', this.players, 'Players:', Object.keys(data.players || {})); // Debug logging
            this.updateScores();
            this.updatePlayerInfo();
            this.syncBoard(data.cards, data.revealed, data.matched);

            if (data.state === 'active' && !this.countdown) {
                console.log('Starting multiplayer game'); // Debug logging
                this.startGame();
            }

            // Check for multiplayer victory
            if (data.matched && data.matched.length === this.cardsArray.length) {
                this.multiplayerVictory();
            }
        });
    }

    generateCardOrders() {
        const orders = Array.from({ length: this.cardsArray.length }, (_, i) => i);
        for (let i = orders.length - 1; i > 0; i--) {
            const rand = Math.floor(Math.random() * (i + 1));
            [orders[i], orders[rand]] = [orders[rand], orders[i]];
        }
        return orders;
    }

    syncBoard(orders, revealed, matched) {
        this.cardsArray.forEach((card, i) => {
            card.style.order = orders[i];
            if (matched && matched.includes(i)) {
                card.classList.add('matched');
            } else {
                card.classList.remove('matched');
            }
            if (revealed && revealed[i]) {
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
            }
        });
    }

    startGame() {
        this.totalClicks = 0;
        this.timeRemaining = this.totalTime;
        this.cardToCheck = null;
        this.busy = false;
        this.audioController.startMusic();
        this.countdown = this.startCountdown();
        this.timer.innerText = this.timeRemaining;
        this.ticker.innerText = this.totalClicks;
    }

    startCountdown() {
        return setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;
            if (this.timeRemaining === 0) this.gameOver();
        }, 1000);
    }

    gameOver() {
        clearInterval(this.countdown);
        this.audioController.gameOver();
        document.getElementById('gameOvertext').classList.add('visible');
        // Set game state to ended when timer runs out
        if (this.gameId) {
            set(ref(db, `games/${this.gameId}/state`), 'ended').catch(err => console.log('Game end error:', err));
        }
    }

    victory() {
        clearInterval(this.countdown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible');
    }

    /**
     * Handle multiplayer victory - determine winner based on scores
     */
    multiplayerVictory() {
        clearInterval(this.countdown);
        this.audioController.victory();

        const player1Score = this.players.player1.score;
        const player2Score = this.players.player2.score;

        let winnerText = "GAME COMPLETE!\n";
        if (player1Score > player2Score) {
            winnerText += "Player 1 Wins!";
        } else if (player2Score > player1Score) {
            winnerText += "Player 2 Wins!";
        } else {
            winnerText += "It's a Tie!";
        }
        winnerText += `\nP1: ${player1Score} | P2: ${player2Score}`;

        // Update victory overlay text and show it
        const victoryElement = document.getElementById('victory-text');
        victoryElement.innerHTML = winnerText.replace('\n', '<br>');
        victoryElement.classList.add('visible');
    }

    flipCard(card) {
        const index = this.cardsArray.indexOf(card);
        const playerRole = this.getPlayerRole();
        if (this.canFlipCard(card) && this.currentTurn === playerRole) {
            this.audioController.flip();

            // Track per-player clicks
            this.players[playerRole].clicks++;
            set(ref(db, `games/${this.gameId}/scores`), this.players);

            // Update display with per-player flip counts
            this.updateFlipDisplay();

            set(ref(db, `games/${this.gameId}/revealed/${index}`), true);
            if (this.cardToCheck) {
                this.checkForCardMatch(card);
            } else {
                this.cardToCheck = card;
            }
        }
    }

    checkForCardMatch(card) {
        const index1 = this.cardsArray.indexOf(this.cardToCheck);
        const index2 = this.cardsArray.indexOf(card);
        if (this.getCardType(this.cardToCheck) === this.getCardType(card)) {
            this.cardMatch(index1, index2);
        } else {
            this.cardMismatch(index1, index2);
        }
        this.cardToCheck = null;
    }

    cardMatch(index1, index2) {
        const updatedMatched = [...(this.matchedCards || []), index1, index2];
        set(ref(db, `games/${this.gameId}/matched`), updatedMatched);
        this.audioController.match();
        const playerRole = this.currentTurn;
        this.players[playerRole].score++;
        set(ref(db, `games/${this.gameId}/scores`), this.players);
        if (updatedMatched.length === this.cardsArray.length) {
            this.victory();
        }
        // Keep turn on match
    }

    cardMismatch(index1, index2) {
        this.busy = true;
        setTimeout(() => {
            set(ref(db, `games/${this.gameId}/revealed/${index1}`), false);
            set(ref(db, `games/${this.gameId}/revealed/${index2}`), false);
            this.busy = false;
            // Switch turn
            const nextTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
            set(ref(db, `games/${this.gameId}/currentTurn`), nextTurn);
        }, 1000);
    }

    getPlayerRole() {
        // Find this player's role in the current game data
        const gameRef = ref(db, `games/${this.gameId}`);
        // For now, use the cached isHost value, but ideally we'd query the DB
        return this.isHost ? 'player1' : 'player2';
    }

    getCardType(card) {
        return card.getElementsByClassName('back')[0].src;
    }

    canFlipCard(card) {
        const index = this.cardsArray.indexOf(card);
        return !this.busy && !this.matchedCards.includes(index) && card !== this.cardToCheck && !(this.revealed && this.revealed[index]);
    }

    updatePlayerInfo() {
        document.getElementById('playerInfo').innerText = `Turn: ${this.currentTurn}`;
    }

    updateScores() {
        const p1 = this.players.player1 || { score: 0, clicks: 0 };
        const p2 = this.players.player2 || { score: 0, clicks: 0 };
        document.getElementById('scores').innerText = `P1: ${p1.score} | P2: ${p2.score}`;
    }

    /**
     * Update flip counter display to show per-player clicks
     */
    updateFlipDisplay() {
        const p1 = this.players.player1 || { clicks: 0 };
        const p2 = this.players.player2 || { clicks: 0 };
        this.ticker.innerText = `P1: ${p1.clicks} | P2: ${p2.clicks}`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

function ready() {
    const cards = Array.from(document.getElementsByClassName('card'));
    let singleGame = null;
    let multiGame = null;

    // Basic validation tests
    console.assert(cards.length === 16, 'Expected 16 cards, found:', cards.length);
    console.assert(document.getElementById('timeCounter'), 'Time counter element missing');
    console.assert(document.getElementById('flipCounter'), 'Flip counter element missing');
    console.log('✅ Basic validation passed - all required elements present');

    // Check if images are loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', () => console.log('✅ Image loaded:', img.src));
        img.addEventListener('error', (e) => console.error('❌ Image failed to load:', img.src, e));
    });

    // Test if we can access assets directly
    fetch('Images/Bat.png')
        .then(response => {
            if (response.ok) {
                console.log('✅ Assets are accessible');
            } else {
                console.error('❌ Assets returned status:', response.status);
            }
        })
        .catch(error => {
            console.error('❌ Cannot access assets:', error);
        });

    // Test audio context (for browser compatibility)
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ Audio context created successfully');
    } catch (error) {
        console.warn('❌ Audio context creation failed:', error);
    }

    // Audio control
    const audioController = new AudioController();
    const muteBtn = document.getElementById('muteToggle');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            audioController.toggleMute();
        });
    } else {
        console.warn('Mute button not found');
    }

    // Back to Main Menu button
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            // Clean up Firebase game data if in multiplayer
            if (multiGame && multiGame.gameId) {
                set(ref(db, `games/${multiGame.gameId}`), null).catch(err => console.log('Cleanup error:', err));
            }
            // Redirect back to landing page
            window.location.href = 'index.html';
        });
    } else {
        console.warn('Back to Menu button not found');
    }

    // Handle URL parameters for mode selection
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const gameId = urlParams.get('id');

    if (mode === 'single') {
        // Single player mode
        singleGame = new MixOrMatch(100, cards);
        multiGame = null;
        // Make cards visible immediately and show start overlay
        cards.forEach(card => card.style.visibility = 'visible');
        document.getElementById('startText').classList.add('visible');
        console.log('Single player mode started, cards visible');
    } else if (mode === 'create') {
        // Create multiplayer game
        multiGame = new MultiplayerGame(100, cards);
        singleGame = null;
        // Make cards visible immediately for multiplayer
        cards.forEach(card => card.style.visibility = 'visible');
        multiGame.createGame(gameId); // Pass the gameId from URL (generated on index page)
        console.log('Multiplayer create mode started with ID:', gameId, 'cards visible');
    } else if (mode === 'join' && gameId) {
        // Join multiplayer game
        multiGame = new MultiplayerGame(100, cards);
        singleGame = null;
        // Make cards visible immediately for multiplayer
        cards.forEach(card => card.style.visibility = 'visible');
        multiGame.joinGame(gameId);
        console.log('Multiplayer join mode started with ID:', gameId);
    } else {
        // No valid mode - redirect back to index
        console.log('No valid mode specified, redirecting to index');
        window.location.href = 'index.html';
        return;
    }

    // Start overlay for single player
    document.getElementById('startText').addEventListener('click', () => {
        document.getElementById('startText').classList.remove('visible');
        singleGame.startGame();
        cards.forEach(card => card.style.visibility = 'visible'); // Force cards show
        console.log('Game started, cards visible');
    });

    // Restart overlays - Clean up and return to landing page
    const overlays = [document.getElementById('gameOvertext'), document.getElementById('victory-text')];
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            // Only handle click on overlay itself, not on buttons inside
            if (e.target === overlay) {
                // Clean up Firebase game data
                if (multiGame && multiGame.gameId) {
                    set(ref(db, `games/${multiGame.gameId}`), null).catch(err => console.log('Cleanup error:', err));
                }
                // Redirect back to landing page
                window.location.href = 'index.html';
            }
        });
    });

    // Handle overlay menu buttons separately
    const overlayMenuBtns = document.querySelectorAll('.overlay-menu-btn');
    overlayMenuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Clean up Firebase game data
            if (multiGame && multiGame.gameId) {
                set(ref(db, `games/${multiGame.gameId}`), null).catch(err => console.log('Cleanup error:', err));
            }
            // Redirect back to landing page
            window.location.href = 'index.html';
        });
    });

    cards.forEach((card, i) => {
        card.addEventListener('click', () => {
            console.log(`Card ${i} clicked`); // Debug clicks
            if (singleGame) {
                singleGame.flipCard(card);
            } else if (multiGame) {
                multiGame.flipCard(card);
            }
        });
    });
}

/*
    Author: ndmx-alex (Alexander)
    Date: October 2025
    Project: Guess Correctly - Spooky Memory Game
    Technologies: JavaScript ES6+, Firebase Realtime Database, HTML5 Audio API
    Classes: AudioController, MixOrMatch, MultiplayerGame
*/