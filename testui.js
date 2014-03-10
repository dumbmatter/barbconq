// http://gamedev.stackexchange.com/a/42047

//DOM
var canvas = document.getElementById ( 'canvas' );
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var context = canvas.getContext ( '2d' );

//CONSTS
var KEYS = {
    UP: 87,
    RIGHT: 68,
    DOWN: 83,
    LEFT: 65
};

var TILE_TYPE_WATER = 0;
var TILE_TYPE_GRASS = 1;
var TILE_TYPE_MOUNTAIN = 2;
var TILE_TYPE_MUD = 3;
var NUM_TILE_TYPES = 4;
var TILE_COLORS = [ '#0000DD', '#00CC00', '#AAAAAA', '#773300' ];

var TILE_SIZE = 50;
var WORLD_SIZE = 2000;
var TILES_IN_A_LINE = Math.floor ( WORLD_SIZE/TILE_SIZE );

//INITIALIZATION
var keysPressed = {};
keysPressed[KEYS.RIGHT] = false;
keysPressed[KEYS.LEFT] = false;
keysPressed[KEYS.UP] = false;
keysPressed[KEYS.DOWN] = false;

var playerX = WORLD_SIZE/2; //center
var playerY = WORLD_SIZE/2; //center

var tileGrid = [];
var tiles = [];

for ( x = 0; x < TILES_IN_A_LINE; x++ ) {
    var collumn = new Array();
    for ( y = 0; y < TILES_IN_A_LINE; y++ ) {
        collumn[y] = Math.floor ( Math.random() * NUM_TILE_TYPES );
    }
    tileGrid[x] = collumn;
}

document.addEventListener ( 'keydown', keyDown, false );
document.addEventListener ( 'keyup', keyUp, false );
//setInterval ( onEnterFrame, 1000 / 30 ); //30 FPS
requestAnimationFrame(onEnterFrame);

var VIEW_HEIGHT, VIEW_TILE_HEIGHT, VIEW_TILE_WIDTH, VIEW_WIDTH;
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    VIEW_WIDTH = canvas.width;
    VIEW_HEIGHT = canvas.height;
    VIEW_TILE_WIDTH = Math.floor ( VIEW_WIDTH / TILE_SIZE ) + 2;
    VIEW_TILE_HEIGHT = Math.floor ( VIEW_HEIGHT / TILE_SIZE ) + 2;
}
setCanvasSize();

function goToCoords(i, j) {
    // ith row, jth column, 0 indexed
    playerX = i * TILES_IN_A_LINE + TILE_SIZE / 2;
    playerY = j * TILES_IN_A_LINE + TILE_SIZE / 2;
    requestAnimationFrame(onEnterFrame);
}

function onEnterFrame() {
    if (keysPressed[KEYS.RIGHT]) playerX = playerX + 20;
    if (keysPressed[KEYS.LEFT]) playerX = playerX - 20;
    if (keysPressed[KEYS.UP]) playerY = playerY - 20;
    if (keysPressed[KEYS.DOWN]) playerY = playerY + 20; 
    
    var top = playerY - VIEW_HEIGHT/2;
    var right = playerX + VIEW_WIDTH/2;
    var bottom = playerY + VIEW_HEIGHT/2;
    var left = playerX - VIEW_WIDTH/2;

    if (top < -TILE_SIZE) {
        playerY = VIEW_HEIGHT / 2 - TILE_SIZE;
        //playerY += 20;
        //return;
    }
    if (right > WORLD_SIZE + TILE_SIZE) {
        playerX = WORLD_SIZE + TILE_SIZE - VIEW_WIDTH / 2;
        //playerX -= 20;
        //return;
    }
    if (bottom > WORLD_SIZE + TILE_SIZE) {
        playerY = WORLD_SIZE + TILE_SIZE - VIEW_HEIGHT / 2;
        //playerY -= 20;
        //return;
    }
    if (left < -TILE_SIZE) {
        playerX = VIEW_WIDTH / 2 - TILE_SIZE;
        //playerX += 20;
        //return;
    }

    // Recalculate
    var top = playerY - VIEW_HEIGHT/2;
    var right = playerX + VIEW_WIDTH/2;
    var bottom = playerY + VIEW_HEIGHT/2;
    var left = playerX - VIEW_WIDTH/2;

    var leftTile = Math.floor ( left / TILE_SIZE );
    var topTile = Math.floor ( top / TILE_SIZE );

    var tileOffsetX = left % TILE_SIZE;
    var tileOffsetY = top % TILE_SIZE;

    // Fix top and left limits
    if (tileOffsetY < 0) {
        tileOffsetY += TILE_SIZE;
    }
    if (tileOffsetX < 0) {
        tileOffsetX += TILE_SIZE;
    }
    
    //var playerLocalX = Math.floor ( playerX / TILE_SIZE ) + tileOffsetX;
    //var playerLocalY = Math.floor ( playerY / TILE_SIZE ) + tileOffsetY;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for ( x = 0; x < VIEW_TILE_WIDTH; x++ ) {
        for ( y = 0; y < VIEW_TILE_HEIGHT; y++ ) {
            if (leftTile+x >= 0 && topTile + y >= 0 && leftTile + x < TILES_IN_A_LINE && topTile + y < TILES_IN_A_LINE) {
                var tileColor = tileGrid[leftTile+x][topTile+y];
                context.fillStyle = TILE_COLORS[tileColor];
                context.fillRect ( x * TILE_SIZE - tileOffsetX, y * TILE_SIZE - tileOffsetY, TILE_SIZE, TILE_SIZE );

                // Grid lines
                context.strokeStyle = "#000";
                context.strokeRect ( x * TILE_SIZE - tileOffsetX, y * TILE_SIZE - tileOffsetY, TILE_SIZE, TILE_SIZE );

                context.fillStyle = "#fff";
                context.textBaseline = "top";
                context.fillText("text", x * TILE_SIZE - tileOffsetX + 2, y * TILE_SIZE - tileOffsetY);
            }
        }
    }
}

function keyDown(e) {
    if (e.keyCode in keysPressed) {
        keysPressed[e.keyCode] = true;
        requestAnimationFrame(onEnterFrame);
    }
}

function keyUp(e) {
    if (e.keyCode in keysPressed) {
        keysPressed[e.keyCode] = false;
        requestAnimationFrame(onEnterFrame);
    }
}

window.addEventListener("resize", function () {
    requestAnimationFrame(function () {
        setCanvasSize();
        onEnterFrame();
    });
});