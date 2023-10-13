class MixOrMatchMultiplayer {
    constructor(totalTime, cards, players) {
        this.cardsArray = cards;
        this.totalTime = totalTime;
        this.timeRemaining = totalTime;
        this.timer = document.getElementById('timeCounter');
        this.ticker = document.getElementById('flipCounter');
        this.players = players;
        this.currentPlayerIndex = 0; // Index of the current player
        this.audioController = new AudioController();
    }

    startGame() {
        this.totalClicks = 0;
        this.timeRemaining = this.totalTime;
        this.cardToCheck = null;
        this.matchedCards = [];
        this.busy = true;
        this.currentPlayerIndex = 0; // Start with the first player
        this.updatePlayerInfo(); // Display current player info
        setTimeout(() => {
            this.audioController.startMusic();
            this.shuffleCards(this.cardsArray);
            this.countdown = this.startCountdown();
            this.busy = false;
        }, 500);
        this.hideCards();
        this.timer.innerText = this.timeRemaining;
        this.ticker.innerText = this.totalClicks;
    }

    // ... (rest of the methods remain the same)

    flipCard(card) {
        if (this.canFlipCard(card)) {
            this.audioController.flip();
            this.totalClicks++;
            this.ticker.innerText = this.totalClicks;
            card.classList.add('visible');

            if (this.cardToCheck) {
                this.checkForCardMatch(card);
            } else {
                this.cardToCheck = card;
            }
        }
    }

    // ... (rest of the methods remain the same)

    // Add a method to update player information on the UI
    updatePlayerInfo() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        document.getElementById('playerInfo').innerText = `Current Player: ${currentPlayer.name} - Score: ${currentPlayer.score}`;
    }
}

// Create an array of player objects
const players = [
    { name: 'Player 1', score: 0 },
    { name: 'Player 2', score: 0 },
];

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

function ready() {
    let overlays = Array.from(document.getElementsByClassName('overlay-text'));
    let cards = Array.from(document.getElementsByClassName('card'));
    let game = new MixOrMatchMultiplayer(100, cards, players);

    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            game.startGame();
        });
    });

    cards.forEach(card => {
        card.addEventListener('click', () => {
            game.flipCard(card);
        });
    });
}
