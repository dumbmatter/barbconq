interface Game {
    map : Mapp;
}

interface UI {
    // Constants
    TILE_SIZE : number;
    WORLD_SIZE : number;
    TILES_IN_A_LINE : number;
    KEYS : any;

    // Input
    keysPressed : any;

    // Display
    // (X, Y) is the center of the region of the map displayed on the screen.
    X : number;
    Y : number;
    canvas : HTMLCanvasElement;
    context : CanvasRenderingContext2D;
    VIEW_WIDTH : number;
    VIEW_HEIGHT : number;
    VIEW_TILE_WIDTH : number;
    VIEW_TILE_HEIGHT : number;
}

var game : Game = <any>{};
var ui : UI = <any>{};

ui.TILE_SIZE = 50;
ui.WORLD_SIZE = 2000;
ui.TILES_IN_A_LINE = Math.floor(ui.WORLD_SIZE / ui.TILE_SIZE);

// Keyboard shortcuts
ui.KEYS = {
    UP: 87,
    RIGHT: 68,
    DOWN: 83,
    LEFT: 65
};
ui.keysPressed = {};
ui.keysPressed[ui.KEYS.RIGHT] = false;
ui.keysPressed[ui.KEYS.LEFT] = false;
ui.keysPressed[ui.KEYS.UP] = false;
ui.keysPressed[ui.KEYS.DOWN] = false;

// Start in the middle.
ui.X = ui.WORLD_SIZE / 2;
ui.Y = ui.WORLD_SIZE / 2;

function choice(x : any[]) {
    return x[Math.floor(Math.random() * x.length)];
}

function setCanvasSize() {
    ui.canvas.width = window.innerWidth;
    ui.canvas.height = window.innerHeight;
    ui.VIEW_WIDTH = ui.canvas.width;
    ui.VIEW_HEIGHT = ui.canvas.height;
    ui.VIEW_TILE_WIDTH = Math.floor(ui.VIEW_WIDTH / ui.TILE_SIZE) + 2;
    ui.VIEW_TILE_HEIGHT = Math.floor(ui.VIEW_HEIGHT / ui.TILE_SIZE) + 2;
}

function initMapDisplay() {
    ui.canvas = <HTMLCanvasElement> document.getElementById("canvas");
    ui.canvas.width = window.innerWidth;
    ui.canvas.height = window.innerHeight;
    ui.context = ui.canvas.getContext("2d");

    // Handle key presses
    document.addEventListener("keydown", function (e) {
        if (e.keyCode in ui.keysPressed) {
            ui.keysPressed[e.keyCode] = true;
            requestAnimationFrame(render);
        }
    });
    document.addEventListener("keyup", function (e) {
        if (e.keyCode in ui.keysPressed) {
            ui.keysPressed[e.keyCode] = false;
            requestAnimationFrame(render);
        }
    });

    // Handle resize
    window.addEventListener("resize", function () {
    requestAnimationFrame(function () {
        setCanvasSize();
        render();
    });
});

    setCanvasSize();
}

function goToCoords(i, j) {
    // ith row, jth column, 0 indexed
    ui.X = i * ui.TILES_IN_A_LINE + ui.TILE_SIZE / 2;
    ui.Y = j * ui.TILES_IN_A_LINE + ui.TILE_SIZE / 2;
    window.requestAnimationFrame(render);
}

/*function updateMapDisplay(map : Mapp) {
    var i, j, tile, world;

    world = document.getElementById("world");
    world.style.width = (map.width * 103) + "px";
    world.style.height = (map.height * 104) + "px";

    for (i = 0; i < map.tiles[0].length; i++) {
        for (j = 0; j < map.tiles.length; j++) {
            tile = document.createElement("div");

            tile.classList.add("tile");
            if (j === 0) {
                tile.classList.add("new-row");
            }

            tile.innerHTML = map.tiles[i][j].terrain + "<br>" + map.tiles[i][j].features.join(" ");

            world.appendChild(tile);
        }
    }
}*/

function render() {
    var bottom, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile, x, y;

    // Has there been movement?
    if (ui.keysPressed[ui.KEYS.RIGHT]) {
        ui.X = ui.X + 20;
    }
    if (ui.keysPressed[ui.KEYS.LEFT]) {
        ui.X = ui.X - 20;
    }
    if (ui.keysPressed[ui.KEYS.UP]) {
        ui.Y = ui.Y - 20;
    }
    if (ui.keysPressed[ui.KEYS.DOWN]) {
        ui.Y = ui.Y + 20;
    }

    // Check the bounds for the view
    top = ui.Y - ui.VIEW_HEIGHT/2;
    right = ui.X + ui.VIEW_WIDTH/2;
    bottom = ui.Y + ui.VIEW_HEIGHT/2;
    left = ui.X - ui.VIEW_WIDTH/2;

    // Adjust position if hitting the boundary
    if (top < -ui.TILE_SIZE) {
        ui.Y = ui.VIEW_HEIGHT / 2 - ui.TILE_SIZE;
    }
    if (right > ui.WORLD_SIZE + ui.TILE_SIZE) {
        ui.X = ui.WORLD_SIZE + ui.TILE_SIZE - ui.VIEW_WIDTH / 2;
    }
    if (bottom > ui.WORLD_SIZE + ui.TILE_SIZE) {
        ui.Y = ui.WORLD_SIZE + ui.TILE_SIZE - ui.VIEW_HEIGHT / 2;
    }
    if (left < -ui.TILE_SIZE) {
        ui.X = ui.VIEW_WIDTH / 2 - ui.TILE_SIZE;
    }

    // Recalculate bounds after adjustments
    top = ui.Y - ui.VIEW_HEIGHT/2;
    right = ui.X + ui.VIEW_WIDTH/2;
    bottom = ui.Y + ui.VIEW_HEIGHT/2;
    left = ui.X - ui.VIEW_WIDTH/2;

    // Find top left coordinates
    leftTile = Math.floor(left / ui.TILE_SIZE);
    topTile = Math.floor(top / ui.TILE_SIZE);

    // Offsets for showing partial tiles
    tileOffsetX = left % ui.TILE_SIZE;
    tileOffsetY = top % ui.TILE_SIZE;

    // Fix top and left limits (don't really understand this)
    if (tileOffsetY < 0) {
        tileOffsetY += ui.TILE_SIZE;
    }
    if (tileOffsetX < 0) {
        tileOffsetX += ui.TILE_SIZE;
    }
    
    // Clear canvas and redraw everything in view
    ui.context.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    for (x = 0; x < ui.VIEW_TILE_WIDTH; x++) {
        for (y = 0; y < ui.VIEW_TILE_HEIGHT; y++) {
            // The "if" restricts this to only draw tiles that are in view
            if (leftTile + x >= 0 && topTile + y >= 0 && leftTile + x < ui.TILES_IN_A_LINE && topTile + y < ui.TILES_IN_A_LINE) {
                // Background
                ui.context.fillStyle = "#aaa";
                ui.context.fillRect(x * ui.TILE_SIZE - tileOffsetX, y * ui.TILE_SIZE - tileOffsetY, ui.TILE_SIZE, ui.TILE_SIZE);

                // Grid lines
                ui.context.strokeStyle = "#000";
                ui.context.strokeRect(x * ui.TILE_SIZE - tileOffsetX, y * ui.TILE_SIZE - tileOffsetY, ui.TILE_SIZE, ui.TILE_SIZE);

                // Text
                ui.context.fillStyle = "#fff";
                ui.context.textBaseline = "top";
                ui.context.fillText("text", x * ui.TILE_SIZE - tileOffsetX + 2, y * ui.TILE_SIZE - tileOffsetY);
            }
        }
    }
}

interface Tile {
    terrain : string;
    features : string[];
}

interface Mapp {
    width : number;
    height : number;
    tiles : Tile[][];
}


function genMap(width : number, height : number) : Mapp {
    var i, j, map, types;

    map = {};

    map.width = width !== undefined ? width : 80;
    map.height = height !== undefined ? height : 40;

    types = {
        peak: [],
        snow: ["hills"],
        desert: ["flood-plains", "hills", "oasis"],
        tundra: ["forest", "hills"],
        sea: ["ice"],
        coast: ["ice"],
        grassland: ["forest", "hills", "jungle"],
        plains: ["forest", "hills"]
    };

    map.tiles = [];
    for (i = 0; i < map.height; i++) {
        map.tiles[i] = [];
        for (j = 0; j < map.width; j++) {
            map.tiles[i][j] = {};
            map.tiles[i][j].terrain = choice(Object.keys(types));
            map.tiles[i][j].features = [];
            if (Math.random() < 0.5) {
                map.tiles[i][j].features.push(choice(types[map.tiles[i][j].terrain]));
            }
        }
    }

    return map;
}

game.map = genMap(ui.TILES_IN_A_LINE, ui.TILES_IN_A_LINE);

initMapDisplay();
window.requestAnimationFrame(render);