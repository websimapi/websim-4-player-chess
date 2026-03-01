import { GameEngine } from './engine.js';
import { GameUI } from './ui.js';
import confetti from 'confetti';

const container = document.getElementById('game-container');
const boardEl = document.getElementById('board');
const resetBtn = document.getElementById('reset-btn');
const modalClose = document.getElementById('modal-close');
const modal = document.getElementById('modal-overlay');

let engine;
let ui;

function init() {
    engine = new GameEngine();
    ui = new GameUI(container, boardEl, handleInteraction);
    
    // Initial render
    ui.render(engine.board, engine.lastMove);
    ui.updateHeader(engine.getCurrentTurn());
}

function handleInteraction(r1, c1, r2, c2) {
    const currentTurn = engine.getCurrentTurn();
    
    // If r2, c2 provided, it's a move attempt
    if (r2 !== null && c2 !== null) {
        const result = engine.executeMove(r1, c1, r2, c2);
        
        ui.playSound(result.isCapture ? 'capture' : 'move');
        
        if (result.capturedKing) {
            // Check win condition
            const winner = engine.checkWinCondition();
            if (winner) {
                ui.render(engine.board, engine.lastMove);
                ui.showWin(winner);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                return;
            }
        }
        
        engine.nextTurn();
        ui.render(engine.board, engine.lastMove);
        ui.updateHeader(engine.getCurrentTurn());
        return;
    }
    
    // Selection logic
    const piece = engine.getPiece(r1, c1);
    
    // If clicking own piece
    if (piece && piece.color === currentTurn) {
        const validMoves = engine.getValidMoves(r1, c1);
        ui.highlightSelection(r1, c1, validMoves);
    } else {
        // Clicking empty space or enemy piece without a selection (handled by move if selection exists)
        ui.clearSelection();
    }
}

resetBtn.addEventListener('click', () => {
    init();
});

modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
    init();
});

// Start
init();