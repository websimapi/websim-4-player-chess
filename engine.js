import { BOARD_SIZE, COLORS, PIECE_TYPES, isSquareValid, TURN_ORDER } from './constants.js';

export class GameEngine {
    constructor() {
        this.board = []; // 14x14 grid
        this.turnIndex = 0;
        this.alivePlayers = {
            [COLORS.RED]: true,
            [COLORS.BLUE]: true,
            [COLORS.YELLOW]: true,
            [COLORS.GREEN]: true
        };
        this.lastMove = null;
        this.initBoard();
    }

    initBoard() {
        // Create empty board
        for (let r = 0; r < BOARD_SIZE; r++) {
            this.board[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                this.board[r][c] = null;
            }
        }

        // Setup pieces
        this.setupPlayer(COLORS.RED, 13, 12, 3);    // Bottom
        this.setupPlayer(COLORS.YELLOW, 0, 1, 3);   // Top
        this.setupPlayer(COLORS.BLUE, 3, 3, 0);     // Left (Note coords will be flipped logic)
        this.setupPlayer(COLORS.GREEN, 3, 3, 13);   // Right
    }
    
    setupPlayer(color, backRow, pawnRow, startCol) {
        const order = [PIECE_TYPES.ROOK, PIECE_TYPES.KNIGHT, PIECE_TYPES.BISHOP, PIECE_TYPES.KING, PIECE_TYPES.QUEEN, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT, PIECE_TYPES.ROOK];
        
        // Adjust for Left/Right players who are oriented vertically
        // Actually, let's just manually place them to avoid confusion
        
        if (color === COLORS.RED) {
            // Bottom (Rows 13, 12. Cols 3-10)
            for (let i = 0; i < 8; i++) {
                this.place(13, 3+i, { type: order[i], color });
                this.place(12, 3+i, { type: PIECE_TYPES.PAWN, color });
            }
        } else if (color === COLORS.YELLOW) {
            // Top (Rows 0, 1. Cols 3-10)
            // Note: King/Queen usually align with opposite. Red King is on Left (d-file logic). 
            // In 4p chess, King is usually on the right of the Queen from player perspective?
            // Let's stick to standard: Queen on her own color square is meaningless here.
            // Let's mirror Red: King at index 3 (d-fileish).
            for (let i = 0; i < 8; i++) {
                this.place(0, 3+i, { type: order[i], color });
                this.place(1, 3+i, { type: PIECE_TYPES.PAWN, color });
            }
        } else if (color === COLORS.BLUE) {
            // Left (Cols 0, 1. Rows 3-10)
            // Pieces vertical.
            for (let i = 0; i < 8; i++) {
                this.place(3+i, 0, { type: order[i], color });
                this.place(3+i, 1, { type: PIECE_TYPES.PAWN, color });
            }
        } else if (color === COLORS.GREEN) {
            // Right (Cols 13, 12. Rows 3-10)
            for (let i = 0; i < 8; i++) {
                this.place(3+i, 13, { type: order[i], color });
                this.place(3+i, 12, { type: PIECE_TYPES.PAWN, color });
            }
        }
    }

    place(r, c, piece) {
        if (isSquareValid(r, c)) {
            this.board[r][c] = piece;
            piece.hasMoved = false;
        }
    }

    getCurrentTurn() {
        return TURN_ORDER[this.turnIndex];
    }
    
    nextTurn() {
        let attempts = 0;
        do {
            this.turnIndex = (this.turnIndex + 1) % 4;
            attempts++;
        } while (!this.alivePlayers[TURN_ORDER[this.turnIndex]] && attempts < 5);
        
        return this.getCurrentTurn();
    }

    getPiece(r, c) {
        if (!isSquareValid(r, c)) return null;
        return this.board[r][c];
    }

    // Move validation
    getValidMoves(r, c) {
        const piece = this.getPiece(r, c);
        if (!piece) return [];
        
        const moves = [];
        const directions = {
            [PIECE_TYPES.ROOK]: [[0,1], [0,-1], [1,0], [-1,0]],
            [PIECE_TYPES.BISHOP]: [[1,1], [1,-1], [-1,1], [-1,-1]],
            [PIECE_TYPES.KNIGHT]: [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]],
            [PIECE_TYPES.QUEEN]: [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
            [PIECE_TYPES.KING]: [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]
        };
        
        if (piece.type === PIECE_TYPES.PAWN) {
            this.getPawnMoves(r, c, piece, moves);
        } else if (piece.type === PIECE_TYPES.KNIGHT || piece.type === PIECE_TYPES.KING) {
            const dirs = directions[piece.type];
            for (let d of dirs) {
                const nr = r + d[0];
                const nc = c + d[1];
                if (isSquareValid(nr, nc)) {
                    const target = this.getPiece(nr, nc);
                    if (!target || target.color !== piece.color) {
                        moves.push({ r: nr, c: nc, isCapture: !!target });
                    }
                }
            }
        } else {
            // Sliding pieces
            const dirs = directions[piece.type];
            for (let d of dirs) {
                let nr = r + d[0];
                let nc = c + d[1];
                while (isSquareValid(nr, nc)) {
                    const target = this.getPiece(nr, nc);
                    if (!target) {
                        moves.push({ r: nr, c: nc, isCapture: false });
                    } else {
                        if (target.color !== piece.color) {
                            moves.push({ r: nr, c: nc, isCapture: true });
                        }
                        break; // Blocked
                    }
                    nr += d[0];
                    nc += d[1];
                }
            }
        }
        
        return moves;
    }

    getPawnMoves(r, c, piece, moves) {
        let dr = 0, dc = 0;
        let startRow = false; // Check if pawn is on start line for double move
        
        // Define forward direction based on color
        if (piece.color === COLORS.RED) {
            dr = -1;
            if (r === 12) startRow = true;
        } else if (piece.color === COLORS.YELLOW) {
            dr = 1;
            if (r === 1) startRow = true;
        } else if (piece.color === COLORS.BLUE) {
            dc = 1;
            if (c === 1) startRow = true;
        } else if (piece.color === COLORS.GREEN) {
            dc = -1;
            if (c === 12) startRow = true;
        }

        // 1. Move forward 1
        let nr = r + dr, nc = c + dc;
        if (isSquareValid(nr, nc) && !this.getPiece(nr, nc)) {
            moves.push({ r: nr, c: nc, isCapture: false });
            
            // 2. Move forward 2 (if on start)
            if (startRow) {
                let nr2 = nr + dr, nc2 = nc + dc;
                if (isSquareValid(nr2, nc2) && !this.getPiece(nr2, nc2)) {
                    moves.push({ r: nr2, c: nc2, isCapture: false });
                }
            }
        }

        // 3. Captures
        // Red/Yellow move vertically, capture diagonally
        // Blue/Green move horizontally, capture diagonally
        const captureOffsets = [];
        if (dr !== 0) { // Moving vertical
            captureOffsets.push([dr, -1], [dr, 1]);
        } else { // Moving horizontal
            captureOffsets.push([-1, dc], [1, dc]);
        }

        for (let off of captureOffsets) {
            let cr = r + off[0];
            let cc = c + off[1];
            if (isSquareValid(cr, cc)) {
                const target = this.getPiece(cr, cc);
                if (target && target.color !== piece.color) {
                    moves.push({ r: cr, c: cc, isCapture: true });
                }
            }
        }
    }

    executeMove(fromR, fromC, toR, toC) {
        const piece = this.board[fromR][fromC];
        const target = this.board[toR][toC];
        let capturedKingColor = null;

        if (target) {
            if (target.type === PIECE_TYPES.KING) {
                capturedKingColor = target.color;
                this.alivePlayers[target.color] = false;
                this.removePlayerPieces(target.color);
            }
        }
        
        // Move piece
        this.board[toR][toC] = piece;
        this.board[fromR][fromC] = null;
        piece.hasMoved = true;

        // Pawn Promotion (Auto-Queen for simplicity)
        if (piece.type === PIECE_TYPES.PAWN) {
            if (this.isPromotionSquare(toR, toC, piece.color)) {
                piece.type = PIECE_TYPES.QUEEN;
            }
        }

        this.lastMove = { fromR, fromC, toR, toC };
        
        return {
            capturedKing: capturedKingColor,
            isCapture: !!target
        };
    }

    removePlayerPieces(color) {
        for(let r=0; r<BOARD_SIZE; r++){
            for(let c=0; c<BOARD_SIZE; c++){
                if(this.board[r][c] && this.board[r][c].color === color){
                    this.board[r][c] = null; // Remove all pieces of eliminated player
                }
            }
        }
    }

    isPromotionSquare(r, c, color) {
        // Promote if hitting the 'back wall' of any opponent relative to start
        // Simplified: Center 8x8 is the battleground. If you cross it completely.
        if (color === COLORS.RED && r <= 3) return true; // Hitting top player zone or corners
        if (color === COLORS.YELLOW && r >= 10) return true;
        if (color === COLORS.BLUE && c >= 10) return true;
        if (color === COLORS.GREEN && c <= 3) return true;
        return false;
    }
    
    checkWinCondition() {
        const alive = Object.keys(this.alivePlayers).filter(k => this.alivePlayers[k]);
        if (alive.length === 1) return alive[0];
        return null;
    }
}