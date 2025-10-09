# Guess Correctly 🎃

A spooky Halloween-themed memory matching card game with both single-player and online multiplayer modes.

## 🎮 Game Features

- **16 Cards Memory Game**: Match 8 pairs of Halloween-themed cards (Bat, Bones, Cauldron, Dracula, Eye, Ghost, Pumpkin, Skull)
- **Single Player Mode**: Classic memory game with timer and flip counter
- **Multiplayer Mode**: Real-time online gameplay for 2 players via Firebase
- **Turn-based Gameplay**: Players take turns flipping cards in multiplayer
- **Score Tracking**: Points awarded for successful matches
- **Atmospheric Audio**: Halloween-themed background music and sound effects
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Project Structure

```
guess-correctly/
├── canvas/                     # Main game directory (Firebase hosting root)
│   ├── index.html             # Landing page - mode selection
│   ├── game.html              # Main game page
│   ├── script.js              # Game logic and Firebase integration
│   ├── style.css              # Game styling and animations
│   ├── 404.html               # Firebase 404 error page
│   └── Assets/                # Game assets (moved here for deployment)
│       ├── Audio/             # Sound effects and background music
│       │   ├── creepy.mp3
│       │   ├── flip.wav
│       │   ├── match.wav
│       │   ├── victory.wav
│       │   └── gameOver.wav
│       ├── Cursors/           # Custom mouse cursors
│       │   ├── Ghost.cur
│       │   └── GhostHover.cur
│       ├── Fonts/             # Custom Halloween fonts
│       │   ├── Creepy.woff
│       │   ├── Creepy.woff2
│       │   ├── Lunacy.woff
│       │   └── Lunacy.woff2
│       └── Images/            # Game card images and decorations
│           ├── Bat.png
│           ├── Bones.png
│           ├── Cauldron.png
│           ├── cardback1.jpg
│           ├── cardfront1.jpg
│           ├── Cobweb.png
│           ├── CobwebGrey.png
│           ├── Dracula.png
│           ├── Eye.png
│           ├── Ghost.png
│           ├── Pumpkin.png
│           └── Skull.png
├── firebase.json              # Firebase hosting configuration
├── package.json               # Project metadata and scripts
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ for Firebase CLI
- Firebase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ndmx-alex/guess-correctly.git
   cd guess-correctly
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Configure Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create/select your project
   - Enable Realtime Database
   - Update `canvas/script1.js` with your Firebase config

5. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 🎯 How to Play

### Single Player
1. Click "Single Player" from the main menu
2. Click "Start Game" when ready
3. Flip cards to find matching pairs
4. Match all pairs before time runs out (100 seconds)

### Multiplayer
1. **Player 1**: Click "Create Multiplayer Game"
2. **Player 2**: Enter the generated Game ID and click "Join Multiplayer"
3. Take turns flipping two cards each turn
4. Match = score +1 point and keep your turn
5. Mismatch = turn switches to other player
6. Game ends when all pairs are matched or time runs out

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Firebase Realtime Database
- **Audio**: HTML5 Audio API
- **Hosting**: Firebase Hosting
- **Fonts**: Custom Halloween-themed fonts

## 📝 Classes Overview

- **AudioController**: Manages game audio and sound effects
- **MixOrMatch**: Single-player game logic and state management
- **MultiplayerGame**: Online multiplayer game logic with Firebase sync

## 🎨 Customization

### Adding New Card Themes
1. Add new PNG images to `Assets/Images/`
2. Update HTML card structure in `canvas/index.html`
3. Update card matching logic if needed

### Audio Customization
1. Replace audio files in `Assets/Audio/`
2. Update file references in `AudioController` class

### Styling
- Modify `canvas/style.css` for visual changes
- Halloween color scheme: orange, brown, tan backgrounds
- Custom fonts: "Creepy" and "Lunacy"

## 🔧 Development

### Local Development
```bash
# Serve locally (accessible from network)
npm run serve
# or
firebase serve --host 0.0.0.0 --port 5000

# Deploy to production
npm run deploy
# or
firebase deploy
```

### Manual Testing
```bash
# Open in browser for testing
npm test
# This will remind you to open canvas/index.html (landing page) manually
```

### Game Flow
1. **Landing Page** (`index.html`): Choose game mode
2. **Game Page** (`game.html`): Play the actual memory game
3. **Return**: Game over/victory redirects back to landing page

### Firebase Configuration
Update the Firebase config in `canvas/script.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 📄 License

MIT License - see package.json for details.

## 👤 Author

**ndmx-alex (Alexander)**

- Project: Guess Correctly - Spooky Memory Game
- Date: October 2025
- Technologies: JavaScript ES6+, Firebase, HTML5, CSS3

## 🎮 Live Demo

[https://arcadeviva.web.app](https://arcadeviva.web.app)

## 🐛 Troubleshooting

### Game Not Loading
- **Check browser console** for JavaScript errors
- **Verify Firebase config** in `canvas/script1.js` - ensure API keys are correct
- **Check asset paths** - all files in `Assets/` folder should be accessible
- **Clear browser cache** and reload

### Cards Not Flipping
- **Console validation**: Look for "✅ Basic validation passed" message
- **Check card count**: Should be exactly 16 cards
- **Verify game mode**: Must be in active game state (not on mode selection)
- **Network issues**: For multiplayer, ensure stable internet connection

### Audio Not Working
- **Browser permissions**: Some browsers block autoplay audio
- **Use mute button**: 🔊/🔇 button in top-right corner
- **File loading**: Check if audio files exist in `Assets/Audio/`
- **Console errors**: Look for "Audio play failed" messages

### Multiplayer Issues
- **Firebase Database**: Ensure Realtime Database is enabled in Firebase Console
- **Game ID**: Must be shared exactly as shown (case-sensitive)
- **Connection**: Both players need stable internet
- **Browser compatibility**: Test in Chrome/Firefox for best results

### Mobile Issues
- **Touch targets**: Cards are 120x160px minimum on mobile
- **Viewport**: Ensure proper viewport meta tag
- **Performance**: Close other tabs for better performance

### Common Console Messages
- `Game data update:` - Normal multiplayer synchronization
- `Audio play failed:` - Browser blocking audio (use mute button)
- `Expected 16 cards, found:` - HTML structure issue
- `Firebase error:` - Check Firebase configuration

### Performance Tips
- **Close browser tabs** for better performance
- **Use Chrome/Firefox** for best compatibility
- **Stable internet** required for multiplayer
- **Clear cache** if experiencing loading issues

### Debug Mode
Open browser console (F12) to see validation messages and debug information.

---

## 📊 Project Statistics
- **Files**: 28 deployed files
- **Cards**: 16 (8 pairs) Halloween-themed
- **Audio**: 5 sound effects + background music
- **Fonts**: 2 custom Halloween fonts
- **Responsive**: Desktop + mobile optimized
- **Accessibility**: WCAG AA compliant colors, keyboard navigation

*Happy Halloween! 🎃👻*

**Author: ndmx-alex (Alexander)** - October 2025
