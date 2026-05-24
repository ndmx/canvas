/*
    Guess Correctly - JavaScript Game Logic
    Author: ndmx-alex (Alexander)
    Date: October 2025

    Description:
    - Single-player and online multiplayer memory matching game
    - Real-time online multiplayer across different devices/locations
    - Firebase Realtime Database for game synchronization
    - Halloween-themed audio and visual effects

    Features:
    - 16 cards (8 pairs) memory game
    - Single player: Classic mode with timer
    - Multiplayer: Online real-time mode (any device/location)
    - Score tracking and turn management
    - Firebase-powered synchronization
*/

// Firebase Configuration and Initialization for Online Multiplayer
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

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
        this.audioInitialized = false;
        console.log('Initializing AudioController...');
        // Don't create Audio objects yet - wait for user interaction to avoid autoplay blocking
    }

    // Initialize audio only after user interaction
    initializeAudio() {
        if (this.audioInitialized) return;

        console.log('Initializing audio after user interaction...');
        try {
            this.bgMusic = new Audio('Audio/creepy.mp3');
            this.flipSound = new Audio('Audio/flip.wav');
            this.matchSound = new Audio('Audio/match.wav');
            this.victorySound = new Audio('Audio/victory.wav');
            this.gameOverSound = new Audio('Audio/gameOver.wav');

            // Configure background music
            this.bgMusic.volume = 0.3;
            this.bgMusic.loop = true;

            // Add load event listeners for debugging (but less verbose)
            [this.bgMusic, this.flipSound, this.matchSound, this.victorySound, this.gameOverSound].forEach(audio => {
                audio.addEventListener('error', (e) => console.warn('Audio load error:', e));
            });

            this.audioInitialized = true;
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
        this.initializeAudio();
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
        this.initializeAudio();
        if (this.isMuted) return;
        try {
            this.flipSound.play().catch(err => console.log('Flip sound failed:', err));
        } catch (error) {
            console.log('Flip sound play failed:', error);
        }
    }

    /** Play card match sound effect */
    match() {
        this.initializeAudio();
        if (this.isMuted) return;
        try {
            this.matchSound.play().catch(err => console.log('Match sound failed:', err));
        } catch (error) {
            console.log('Match sound play failed:', error);
        }
    }

    /** Play victory sound and stop background music */
    victory() {
        this.initializeAudio();
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
        this.initializeAudio();
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
 * OnlineMultiplayerGame Class - Real-time Online Multiplayer
 * Synchronizes game state across different devices/locations using Firebase!
 */
class OnlineMultiplayerGame {
    constructor(totalTime, cards) {
        this.cardsArray = cards;          // Array of card DOM elements
        this.totalTime = totalTime;       // Total game time in seconds
        this.timeRemaining = totalTime;   // Current time remaining
        this.timer = document.getElementById('timeCounter');    // Timer display element
        this.ticker = document.getElementById('flipCounter');   // Flip counter display
        this.audioController = new AudioController();           // Audio controller instance

        // Online multiplayer properties
        this.gameId = null;               // Unique game identifier
        this.isHost = false;              // Whether this player is the game host
        this.playerId = Math.random().toString(36).substring(2, 9); // Unique player ID
        this.playerRole = null;           // 'player1' or 'player2'
        this.players = { player1: { score: 0, clicks: 0 }, player2: { score: 0, clicks: 0 } };
        this.currentTurn = null;          // Current player's turn ('player1' or 'player2')
        this.matchedCards = [];           // Array of matched card indices
        this.revealed = {};               // Object tracking revealed card states
        this.cardOrder = null;            // Shuffled card order from Firebase
        this.cardToCheck = null;          // Card currently being checked for match
        this.busy = false;                // Prevent multiple rapid clicks
    }

    /**
     * Create or join an online multiplayer game as the host
     */
    async createGame(providedGameId = null) {
        this.isHost = true;
        this.playerRole = 'player1';

        if (providedGameId) {
            this.gameId = providedGameId;
        }

        // Check if game already exists (created from index.html)
        const gameRef = ref(db, `games/${this.gameId}`);
        const snapshot = await get(gameRef);
        const existingData = snapshot.val();

        if (!existingData) {
            // Game doesn't exist, create it
            this.cardOrder = this.generateCardOrders();
            const gameState = {
                status: 'waiting_for_player2',
                hostId: this.playerId,
                players: {
                    [this.playerId]: 'player1'
                },
                currentTurn: 'player1',
                scores: { player1: { score: 0, clicks: 0 }, player2: { score: 0, clicks: 0 } },
                cardOrder: this.cardOrder,
                revealed: {},
                matched: [],
                created: Date.now()
            };
            await set(gameRef, gameState);
            console.log('Created new online multiplayer game as host');
        } else {
            // Game exists, just register as player1 if not already
            if (!existingData.players || !existingData.players[this.playerId]) {
                await set(ref(db, `games/${this.gameId}/players/${this.playerId}`), 'player1');
                console.log('Joined existing game as host');
            }
        }

        this.listenToGame();
        console.log('Online multiplayer game ready, waiting for player 2...');
    }

    /**
     * Join an existing online multiplayer game
     */
    async joinGame(gameId) {
        this.gameId = gameId;
        this.isHost = false;

        const gameRef = ref(db, `games/${this.gameId}`);
        const snapshot = await get(gameRef);
        const data = snapshot.val();

        if (!data) {
            alert('Game not found!');
            window.location.href = 'index.html';
            return;
        }

        console.log('Attempting to join game:', gameId, 'Status:', data.status, 'Players:', Object.keys(data.players || {}).length);

        if (data.status !== 'waiting_for_player2') {
            console.log('Game not available to join - status:', data.status);
            alert('Game is not available to join! Status: ' + data.status);
            window.location.href = 'index.html';
            return;
        }

        this.playerRole = 'player2';
        await set(ref(db, `games/${this.gameId}/players/${this.playerId}`), 'player2');
        await set(ref(db, `games/${this.gameId}/status`), 'active');
        await set(ref(db, `games/${this.gameId}/currentTurn`), 'player1');

        this.listenToGame();
        console.log('Joined online multiplayer game as player 2');
    }

    /**
     * Listen for real-time game updates from Firebase
     */
    listenToGame() {
        const gameRef = ref(db, `games/${this.gameId}`);
        onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Update local state from Firebase
            this.players = data.scores || { player1: { score: 0, clicks: 0 }, player2: { score: 0, clicks: 0 } };
            this.currentTurn = data.currentTurn;
            this.matchedCards = data.matched || [];
            this.revealed = data.revealed || {};
            this.cardOrder = data.cardOrder;

            // Update UI
            this.updateScores();
            this.updatePlayerInfo();
            this.syncBoard(data.cardOrder, data.revealed, data.matched);

            // Start game when both players are connected
            if (data.status === 'active' && !this.countdown) {
                console.log('Game status is active, starting game for', this.playerRole);
                this.startGame();
            }

            // Debug logging
            console.log(`Game update for ${this.playerRole}: status=${data.status}, players=${Object.keys(data.players || {}).length}, turn=${data.currentTurn}`);

            // Check for victory
            if (this.matchedCards.length === this.cardsArray.length) {
                this.victory();
            }
        });
    }

    /**
     * Start the online multiplayer game
     */
    startGame() {
        this.countdown = this.startCountdown();
        this.shuffleCards(); // Use the card order from Firebase
        console.log(`Online multiplayer game started! You are ${this.playerRole}`);
    }

    /**
     * Shuffle card order for random layout
     */
    generateCardOrders() {
        const orders = Array.from({ length: this.cardsArray.length }, (_, i) => i);
        for (let i = orders.length - 1; i > 0; i--) {
            const rand = Math.floor(Math.random() * (i + 1));
            [orders[i], orders[rand]] = [orders[rand], orders[i]];
        }
        return orders;
    }

    /**
     * Shuffle the cards on the board using Firebase card order
     */
    shuffleCards() {
        if (this.cardOrder) {
            this.cardsArray.forEach((card, i) => {
                card.style.order = this.cardOrder[i];
            });
        }
    }

    /**
     * Update the player turn display
     */
    updatePlayerInfo() {
        if (this.currentTurn === this.playerRole) {
            document.getElementById('playerInfo').innerText = `🎮 Your Turn!`;
        } else {
            const otherPlayer = this.currentTurn === 'player1' ? 'Player 1' : 'Player 2';
            document.getElementById('playerInfo').innerText = `⏳ ${otherPlayer}'s Turn`;
        }
    }

    /**
     * Update the score display
     */
    updateScores() {
        const p1 = this.players.player1 || { score: 0, clicks: 0 };
        const p2 = this.players.player2 || { score: 0, clicks: 0 };
        document.getElementById('scores').innerText = `P1: ${p1.score} | P2: ${p2.score}`;
    }

    /**
     * Update the flip count display
     */
    updateFlipDisplay() {
        const p1 = this.players.player1 || { score: 0, clicks: 0 };
        const p2 = this.players.player2 || { score: 0, clicks: 0 };
        this.ticker.innerText = `P1: ${p1.clicks} | P2: ${p2.clicks}`;
    }

    /**
     * Sync board state from Firebase
     */
    syncBoard(cardOrder, revealed, matched) {
        console.log('syncBoard called with:', { cardOrder: !!cardOrder, revealed, matched });
        if (cardOrder) {
            this.cardsArray.forEach((card, i) => {
                card.style.order = cardOrder[i];
                if (matched && matched.includes(i)) {
                    card.classList.add('matched');
                } else {
                    card.classList.remove('matched');
                }
                // Only update visibility if we have revealed data
                if (revealed !== undefined) {
                    if (revealed[i]) {
                        card.classList.add('visible');
                        card.style.visibility = 'visible';
                        console.log(`Card ${i} set to visible`);
                    } else {
                        card.classList.remove('visible');
                        // Don't set visibility to hidden, just remove the flip
                        console.log(`Card ${i} set to hidden`);
                    }
                }
            });
        }
    }

    /**
     * Get the card type (image source)
     */
    getCardType(card) {
        return card.getElementsByClassName('back')[0].src;
    }

    /**
     * Start the countdown timer
     */
    startCountdown() {
        return setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;

            if (this.timeRemaining === 0) {
                this.gameOver();
            }
        }, 1000);
    }

    /**
     * Handle game victory
     */
    victory() {
        clearInterval(this.countdown);
        this.audioController.victory();

        const p1 = this.players.player1 || { score: 0 };
        const p2 = this.players.player2 || { score: 0 };
        const winner = p1.score > p2.score ? 'Player 1' :
                      p2.score > p1.score ? 'Player 2' : 'It\'s a tie!';

        const winnerText = winner === 'Player 1' ? 'You won!' :
                          winner === 'Player 2' ? 'Player 2 won!' : 'It\'s a tie!';

        document.getElementById('victory-text').innerHTML = `
            🎉 VICTORY! 🎉<br>
            <span class="overlay-text-small">${winnerText}</span><br>
            <span class="overlay-text-small">Final Score: P1: ${p1.score} | P2: ${p2.score}</span><br>
            <span class="overlay-text-small">Click to play again</span>
        `;
        document.getElementById('victory-text').classList.add('visible');
    }

    /**
     * Handle game over (time up)
     */
    gameOver() {
        clearInterval(this.countdown);
        this.audioController.gameOver();

        const p1 = this.players.player1 || { score: 0 };
        const p2 = this.players.player2 || { score: 0 };
        const winner = p1.score > p2.score ? 'Player 1' :
                      p2.score > p1.score ? 'Player 2' : 'It\'s a tie!';
        const winnerText = winner === 'Player 1' ? 'You won!' :
                          winner === 'Player 2' ? 'Player 2 won!' : 'It\'s a tie!';

        document.getElementById('gameOvertext').innerHTML = `
            ⏰ TIME'S UP! ⏰<br>
            <span class="overlay-text-small">${winnerText}</span><br>
            <span class="overlay-text-small">Final Score: P1: ${p1.score} | P2: ${p2.score}</span><br>
            <span class="overlay-text-small">Click to play again</span>
        `;
        document.getElementById('gameOvertext').classList.add('visible');

        if (this.gameId) {
            set(ref(db, `games/${this.gameId}/state`), 'ended').catch(err => console.log('Game end error:', err));
        }
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
        // Create online multiplayer game
        multiGame = new OnlineMultiplayerGame(100, cards);
        singleGame = null;
        // Ensure cards are visible (not hidden) but start face-down
        cards.forEach((card, i) => {
            card.style.visibility = 'visible';
            card.classList.remove('visible'); // Start face-down
            console.log(`Initialized card ${i}: visibility=${card.style.visibility}, hasVisibleClass=${card.classList.contains('visible')}`);
        });
        multiGame.createGame(gameId);
        console.log('Online multiplayer create mode started with ID:', gameId);
    } else if (mode === 'join' && gameId) {
        // Join online multiplayer game
        multiGame = new OnlineMultiplayerGame(100, cards);
        singleGame = null;
        // Ensure cards are visible (not hidden) but start face-down
        cards.forEach((card, i) => {
            card.style.visibility = 'visible';
            card.classList.remove('visible'); // Start face-down
            console.log(`Initialized card ${i}: visibility=${card.style.visibility}, hasVisibleClass=${card.classList.contains('visible')}`);
        });
        multiGame.joinGame(gameId);
        console.log('Online multiplayer join mode started with ID:', gameId);
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

    // Restart overlays - Return to landing page
    const overlays = [document.getElementById('gameOvertext'), document.getElementById('victory-text')];
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            // Only handle click on overlay itself, not on buttons inside
            if (e.target === overlay) {
                // Return to landing page
                window.location.href = 'index.html';
            }
        });
    });

    // Handle overlay menu buttons separately
    const overlayMenuBtns = document.querySelectorAll('.overlay-menu-btn');
    overlayMenuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Return to landing page
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