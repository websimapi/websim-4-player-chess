export const BOARD_SIZE = 14;

export const COLORS = {
    RED: 'red',
    BLUE: 'blue',
    YELLOW: 'yellow',
    GREEN: 'green'
};

export const TURN_ORDER = [COLORS.RED, COLORS.BLUE, COLORS.YELLOW, COLORS.GREEN];

export const PIECE_TYPES = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king'
};

// Map logical piece types to asset filenames
export const ASSETS = {
    [PIECE_TYPES.PAWN]: 'pawn.png',
    [PIECE_TYPES.ROOK]: 'rook.png',
    [PIECE_TYPES.KNIGHT]: 'knight.png',
    [PIECE_TYPES.BISHOP]: 'bishop.png',
    [PIECE_TYPES.QUEEN]: 'queen.png',
    [PIECE_TYPES.KING]: 'king.png'
};

// Define valid board area (14x14 minus 3x3 corners)
export const isSquareValid = (r, c) => {
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    // Corners are void
    if ((r < 3 && c < 3) || 
        (r < 3 && c > 10) || 
        (r > 10 && c < 3) || 
        (r > 10 && c > 10)) {
        return false;
    }
    return true;
};