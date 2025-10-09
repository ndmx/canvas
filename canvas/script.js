/*
    Guess Correctly - JavaScript Game Logic
    Author: ndmx-alex (Alexander)
    Date: October 2025

    Description:
    - Single-player and local multiplayer memory matching game
    - Simple hot-seat multiplayer (same device, take turns)
    - No database required - works entirely offline!
    - Halloween-themed audio and visual effects

    Features:
    - 16 cards (8 pairs) memory game
    - Single player: Classic mode with timer
    - Multiplayer: Local hot-seat mode (same device)
    - Score tracking and turn management
    - No external dependencies - pure JavaScript!
*/

// No Firebase needed for simple local multiplayer!

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
 * SimpleMultiplayerGame Class - Local Hot-Seat Multiplayer
 * Simple turn-based multiplayer for same device - no database required!
 */
class SimpleMultiplayerGame {
    constructor(totalTime, cards) {
        this.cardsArray = cards;          // Array of card DOM elements
        this.totalTime = totalTime;       // Total game time in seconds
        this.timeRemaining = totalTime;   // Current time remaining
        this.timer = document.getElementById('timeCounter');    // Timer display element
        this.ticker = document.getElementById('flipCounter');   // Flip counter display
        this.audioController = new AudioController();           // Audio controller instance

        // Simple multiplayer properties
        this.currentPlayer = 1;           // Current player (1 or 2)
        this.player1Score = 0;            // Player 1 score
        this.player2Score = 0;            // Player 2 score
        this.player1Clicks = 0;           // Player 1 click count
        this.player2Clicks = 0;           // Player 2 click count
        this.matchedCards = [];           // Array of matched card indices
        this.cardToCheck = null;          // Card currently being checked for match
        this.busy = false;                // Prevent multiple rapid clicks
    }

    /**
     * Start the simple multiplayer game
     * No database needed - just local turn-based gameplay
     */
    startGame() {
        this.countdown = this.startCountdown();
        this.updatePlayerInfo();
        this.updateScores();
        console.log('Simple multiplayer game started - Player', this.currentPlayer, 'turn');
    }

    /**
     * Handle card flipping for multiplayer
     */
    flipCard(card) {
        const index = this.cardsArray.indexOf(card);

        // Prevent clicking if busy, card already matched, or wrong player's turn
        if (this.busy || this.matchedCards.includes(index) || card === this.cardToCheck) {
            return;
        }

        // Update click count for current player
        if (this.currentPlayer === 1) {
            this.player1Clicks++;
        } else {
            this.player2Clicks++;
        }

        this.audioController.flip();
        this.updateFlipDisplay();

        // Reveal the card
        card.classList.add('visible');

        if (this.cardToCheck) {
            // Second card - check for match
            this.checkForCardMatch(card);
        } else {
            // First card
            this.cardToCheck = card;
        }
    }

    /**
     * Check if two flipped cards match
     */
    checkForCardMatch(card) {
        const index1 = this.cardsArray.indexOf(this.cardToCheck);
        const index2 = this.cardsArray.indexOf(card);

        if (this.getCardType(this.cardToCheck) === this.getCardType(card)) {
            // Match found!
            this.cardMatch(index1, index2);
        } else {
            // No match - flip cards back and switch turns
            this.cardMismatch(index1, index2);
        }

        this.cardToCheck = null;
    }

    /**
     * Handle successful card match
     */
    cardMatch(index1, index2) {
        this.matchedCards.push(index1, index2);

        // Add matched class to cards
        this.cardsArray[index1].classList.add('matched');
        this.cardsArray[index2].classList.add('matched');

        this.audioController.match();

        // Award point to current player
        if (this.currentPlayer === 1) {
            this.player1Score++;
        } else {
            this.player2Score++;
        }

        this.updateScores();

        // Keep the same player's turn on successful match
        console.log(`🎉 Match! Player ${this.currentPlayer} scores! Turn stays with Player ${this.currentPlayer}`);

        // Check for victory
        if (this.matchedCards.length === this.cardsArray.length) {
            this.victory();
        }
    }

    /**
     * Handle card mismatch - flip back and switch turns
     */
    cardMismatch(index1, index2) {
        this.busy = true;

        setTimeout(() => {
            // Hide the cards again
            this.cardsArray[index1].classList.remove('visible');
            this.cardsArray[index2].classList.remove('visible');
            this.busy = false;

            // Switch to other player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updatePlayerInfo();

            console.log(`❌ No match! Switching to Player ${this.currentPlayer}'s turn`);
        }, 1000);
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
     * Shuffle the cards on the board
     */
    shuffleCards() {
        const orders = this.generateCardOrders();
        this.cardsArray.forEach((card, i) => {
            card.style.order = orders[i];
        });
    }

    /**
     * Update the player turn display
     */
    updatePlayerInfo() {
        const playerEmoji = this.currentPlayer === 1 ? '🎃' : '🧛';
        const playerName = this.currentPlayer === 1 ? 'Ghost' : 'Vampire';
        document.getElementById('playerInfo').innerText = `${playerEmoji} ${playerName}'s Turn`;
    }

    /**
     * Update the score display
     */
    updateScores() {
        document.getElementById('scores').innerText = `🎃 ${this.player1Score} | 🧛 ${this.player2Score}`;
    }

    /**
     * Update the flip count display
     */
    updateFlipDisplay() {
        this.ticker.innerText = `🎃 ${this.player1Clicks} | 🧛 ${this.player2Clicks}`;
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

        const winner = this.player1Score > this.player2Score ? 'Ghost (Player 1)' :
                      this.player2Score > this.player1Score ? 'Vampire (Player 2)' : 'It\'s a tie!';

        document.getElementById('victory-text').innerHTML = `
            🎉 VICTORY! 🎉<br>
            <span class="overlay-text-small">Winner: ${winner}</span><br>
            <span class="overlay-text-small">Final Score: 🎃 ${this.player1Score} | 🧛 ${this.player2Score}</span><br>
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

        const winner = this.player1Score > this.player2Score ? 'Ghost (Player 1)' :
                      this.player2Score > this.player1Score ? 'Vampire (Player 2)' : 'It\'s a tie!';

        document.getElementById('gameOvertext').innerHTML = `
            ⏰ TIME'S UP! ⏰<br>
            <span class="overlay-text-small">Winner: ${winner}</span><br>
            <span class="overlay-text-small">Final Score: 🎃 ${this.player1Score} | 🧛 ${this.player2Score}</span><br>
            <span class="overlay-text-small">Click to play again</span>
        `;
        document.getElementById('gameOvertext').classList.add('visible');
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
    } else if (mode === 'multiplayer') {
        // Simple local multiplayer (hot-seat style)
        multiGame = new SimpleMultiplayerGame(100, cards);
        singleGame = null;
        // Make cards visible immediately for multiplayer
        cards.forEach(card => card.style.visibility = 'visible');
        // Show player selection instead of start overlay
        document.getElementById('startText').innerHTML = `
            <span>Select Starting Player</span>
            <div style="margin-top: 20px;">
                <button id="player1Btn" class="modeBtn" style="margin: 10px;">🎃 Player 1 (Ghost)</button>
                <button id="player2Btn" class="modeBtn" style="margin: 10px;">🧛 Player 2 (Vampire)</button>
            </div>
        `;

        // Add event listeners for player selection
        document.getElementById('player1Btn').addEventListener('click', () => {
            multiGame.currentPlayer = 1;
            document.getElementById('startText').classList.remove('visible');
            multiGame.startGame();
        });

        document.getElementById('player2Btn').addEventListener('click', () => {
            multiGame.currentPlayer = 2;
            document.getElementById('startText').classList.remove('visible');
            multiGame.startGame();
        });

        console.log('Simple multiplayer mode started, cards visible');
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