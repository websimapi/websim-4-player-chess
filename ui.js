import { BOARD_SIZE, COLORS, ASSETS, isSquareValid } from './constants.js';

export class GameUI {
    constructor(gameContainer, boardElement, onMoveRequest) {
        this.container = gameContainer;
        this.boardEl = boardElement;
        this.onMoveRequest = onMoveRequest;
        this.cells = [];
        this.selectedCell = null; // {r, c}
        this.highlightedMoves = []; // [{r, c, isCapture}]
        
        this.initGrid();
        
        // Sounds
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.loadSounds();
    }
    
    async loadSounds() {
        const load = async (url) => {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioCtx.decodeAudioData(arrayBuffer);
        };
        
        try {
            this.sounds.move = await load('move.mp3');
            this.sounds.capture = await load('capture.mp3');
            this.sounds.win = await load('win.mp3');
        } catch(e) {
            console.error("Audio load failed", e);
        }
    }
    
    playSound(name) {
        if (this.sounds[name]) {
            const source = this.audioCtx.createBufferSource();
            source.buffer = this.sounds[name];
            source.connect(this.audioCtx.destination);
            source.start(0);
        }
    }

    initGrid() {
        this.boardEl.innerHTML = '';
        this.cells = [];
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            this.cells[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (isSquareValid(r, c)) {
                    cell.classList.add('valid');
                    // Check pattern
                    if ((r + c) % 2 === 1) {
                        cell.classList.add('dark');
                    }
                    
                    cell.dataset.r = r;
                    cell.dataset.c = c;
                    
                    cell.addEventListener('click', (e) => this.handleCellClick(r, c));
                } else {
                    cell.classList.add('void');
                }
                
                this.boardEl.appendChild(cell);
                this.cells[r][c] = cell;
            }
        }
    }

    handleCellClick(r, c) {
        // If clicking a valid move highlight
        const move = this.highlightedMoves.find(m => m.r === r && m.c === c);
        if (move) {
            this.onMoveRequest(this.selectedCell.r, this.selectedCell.c, r, c);
            this.clearSelection();
            return;
        }

        // If clicking a piece
        this.onMoveRequest(r, c, null, null); // Just request selection logic from main
    }

    render(boardState, lastMove) {
        // Clear previous state visual
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.cells[r][c];
                if (!cell.classList.contains('void')) {
                    cell.innerHTML = ''; // Clear piece
                    cell.classList.remove('last-move');
                }
            }
        }

        // Render pieces
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = boardState[r][c];
                if (piece) {
                    const img = document.createElement('div');
                    img.className = `piece ${piece.color}`;
                    img.style.backgroundImage = `url(${ASSETS[piece.type]})`;
                    this.cells[r][c].appendChild(img);
                }
            }
        }
        
        // Render last move
        if (lastMove) {
            this.cells[lastMove.fromR][lastMove.fromC].classList.add('last-move');
            this.cells[lastMove.toR][lastMove.toC].classList.add('last-move');
        }
    }
    
    highlightSelection(r, c, validMoves) {
        this.clearSelection();
        this.selectedCell = { r, c };
        this.cells[r][c].classList.add('selected');
        
        this.highlightedMoves = validMoves;
        for (let move of validMoves) {
            const cell = this.cells[move.r][move.c];
            if (move.isCapture) {
                cell.classList.add('hint-capture');
            } else {
                cell.classList.add('hint-move');
            }
        }
    }
    
    clearSelection() {
        if (this.selectedCell) {
            this.cells[this.selectedCell.r][this.selectedCell.c].classList.remove('selected');
        }
        for (let move of this.highlightedMoves) {
            const cell = this.cells[move.r][move.c];
            cell.classList.remove('hint-move');
            cell.classList.remove('hint-capture');
        }
        this.selectedCell = null;
        this.highlightedMoves = [];
    }

    updateHeader(color) {
        const ind = document.getElementById('turn-indicator');
        ind.innerText = `${color.charAt(0).toUpperCase() + color.slice(1)}'s Turn`;
        
        // UI Colors
        const map = {
            'red': '#ff4444',
            'blue': '#4488ff',
            'yellow': '#ffcc00',
            'green': '#44cc44'
        };
        ind.style.borderColor = map[color];
        ind.style.color = map[color];
    }
    
    showWin(winner) {
        const modal = document.getElementById('modal-overlay');
        const msg = document.getElementById('modal-message');
        const title = document.getElementById('modal-title');
        
        modal.classList.remove('hidden');
        title.innerText = "Victory!";
        msg.innerText = `${winner.toUpperCase()} WINS!`;
        msg.style.color = winner;
        this.playSound('win');
    }
}