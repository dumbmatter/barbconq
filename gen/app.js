// Random - utility functions like Python's random module
var Random;
(function (Random) {
    function choice(x) {
        return x[Math.floor(Math.random() * x.length)];
    }
    Random.choice = choice;
})(Random || (Random = {}));
// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game
document.addEventListener("keydown", function (e) {
    var activeUnit;

    mapUI.onKeyDown(e.keyCode);

    // Active unit stuff
    if (game.activeUnit) {
        activeUnit = game.getUnit(game.activeUnit);

        // Unit movement
        if (e.keyCode === 97) {
            activeUnit.move("SW");
        } else if (e.keyCode === 98) {
            activeUnit.move("S");
        } else if (e.keyCode === 99) {
            activeUnit.move("SE");
        } else if (e.keyCode === 100) {
            activeUnit.move("W");
        } else if (e.keyCode === 102) {
            activeUnit.move("E");
        } else if (e.keyCode === 103) {
            activeUnit.move("NW");
        } else if (e.keyCode === 104) {
            activeUnit.move("N");
        } else if (e.keyCode === 105) {
            activeUnit.move("NE");
        }

        // Center on active unit
        if (e.keyCode === 67) {
            mapUI.goToCoords(activeUnit.coords);
        }
    }
});
document.addEventListener("keyup", function (e) {
    mapUI.onKeyUp(e.keyCode);
});
// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map)
var ChromeUI = (function () {
    function ChromeUI() {
        this.elInfoBox = document.getElementById("info-box");
    }
    ChromeUI.prototype.onHoverTile = function (tile) {
        if (typeof tile === "undefined") { tile = null; }
        var content, i, unit;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                unit = game.getUnit(tile.units[i]);
                content += '<span class="unit-name">' + unit.type + '</span>, ';
                if (unit.strength === unit.currentStrength) {
                    content += unit.currentStrength + ' S, ';
                } else {
                    content += unit.currentStrength + '/' + unit.strength + ' S, ';
                }
                if (unit.movement === unit.currentMovement) {
                    content += unit.currentMovement + ' M, ';
                } else {
                    content += unit.currentMovement + '/' + unit.movement + ' M, ';
                }
                content += game.names[unit.owner];
                content += '<br>';
            }

            // Show tile terrain and features
            content += tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain;

            this.elInfoBox.innerHTML = content;
            this.elInfoBox.style.display = "block";
        } else {
            // Hide info box
            this.elInfoBox.style.display = "none";
        }
    };
    return ChromeUI;
})();
// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)
var MapUI = (function () {
    function MapUI() {
        // Constants
        this.TILE_SIZE = 50;
        this.WORLD_SIZE = 2000;
        this.KEYS = {
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            LEFT: 37
        };
        // Input
        this.keysPressed = {};
        var key;

        for (key in this.KEYS) {
            this.keysPressed[this.KEYS[key]] = false;
        }

        // Colors!
        this.terrainColors = {
            peak: "#000",
            snow: "#fff",
            desert: "#f1eabd",
            tundra: "#ddd",
            sea: "#00f",
            coast: "#7c7cff",
            grassland: "#070",
            plains: "#fd0"
        };
        this.terrainFontColors = {
            peak: "#fff",
            snow: "#000",
            desert: "#000",
            tundra: "#000",
            sea: "#fff",
            coast: "#000",
            grassland: "#fff",
            plains: "#000"
        };

        this.initMapDisplay();
    }
    MapUI.prototype.initMapDisplay = function () {
        this.X = game.map.width * this.TILE_SIZE / 2;
        this.Y = game.map.height * this.TILE_SIZE / 2;

        this.canvas = document.getElementById("map");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");

        // Handle hover
        this.hoveredTile = [-1, -1];
        this.canvas.addEventListener("mousemove", function (e) {
            var i, j, left, top;

            // Top left coordinate in pixels, relative to the whole map
            top = this.Y - this.VIEW_HEIGHT / 2;
            left = this.X - this.VIEW_WIDTH / 2;

            // Coordinates in tiles
            i = Math.floor((top + e.y) / this.TILE_SIZE);
            j = Math.floor((left + e.x) / this.TILE_SIZE);

            if ((i !== this.hoveredTile[0] || j !== this.hoveredTile[1]) && i >= 0 && j >= 0 && i < game.map.height && j < game.map.width) {
                this.hoveredTile = [i, j];

                chromeUI.onHoverTile(game.map.tiles[i][j]);
            }
        }.bind(this));
        this.canvas.addEventListener("mouseout", function (e) {
            chromeUI.onHoverTile();
        }.bind(this));

        // Handle resize
        window.addEventListener("resize", function () {
            requestAnimationFrame(function () {
                this.setCanvasSize();
                this.render();
            }.bind(this));
        }.bind(this));

        this.setCanvasSize();

        // Initial render
        window.requestAnimationFrame(this.render.bind(this));
    };

    MapUI.prototype.setCanvasSize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.VIEW_WIDTH = this.canvas.width;
        this.VIEW_HEIGHT = this.canvas.height;
        this.VIEW_TILE_WIDTH = Math.floor(this.VIEW_WIDTH / this.TILE_SIZE) + 2;
        this.VIEW_TILE_HEIGHT = Math.floor(this.VIEW_HEIGHT / this.TILE_SIZE) + 2;
    };

    MapUI.prototype.onKeyDown = function (keyCode) {
        if (keyCode in this.keysPressed) {
            this.keysPressed[keyCode] = true;

            // Panning viewport based on keyboard arrows
            if (this.keysPressed[this.KEYS.UP]) {
                this.Y = this.Y - 20;
            }
            if (this.keysPressed[this.KEYS.RIGHT]) {
                this.X = this.X + 20;
            }
            if (this.keysPressed[this.KEYS.DOWN]) {
                this.Y = this.Y + 20;
            }
            if (this.keysPressed[this.KEYS.LEFT]) {
                this.X = this.X - 20;
            }

            requestAnimationFrame(this.render.bind(this));
        }
    };

    MapUI.prototype.onKeyUp = function (keyCode) {
        if (keyCode in this.keysPressed) {
            this.keysPressed[keyCode] = false;
        }
    };

    MapUI.prototype.render = function () {
        var bottom, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile;

        // Check the bounds for the viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Adjust position if hitting the boundary
        if (top < -this.VIEW_HEIGHT / 2) {
            this.Y = 0;
        }
        if (right > game.map.width * this.TILE_SIZE + this.VIEW_WIDTH / 2) {
            this.X = game.map.width * this.TILE_SIZE;
        }
        if (bottom > game.map.height * this.TILE_SIZE + this.VIEW_HEIGHT / 2) {
            this.Y = game.map.height * this.TILE_SIZE;
        }
        if (left < -this.VIEW_WIDTH / 2) {
            this.X = 0;
        }

        // Recalculate bounds after adjustments
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Find top left coordinates
        leftTile = Math.floor(left / this.TILE_SIZE);
        topTile = Math.floor(top / this.TILE_SIZE);

        // Offsets for showing partial tiles
        tileOffsetX = left % this.TILE_SIZE;
        tileOffsetY = top % this.TILE_SIZE;

        // Fix top and left limits (don't really understand this)
        if (tileOffsetY < 0) {
            tileOffsetY += this.TILE_SIZE;
        }
        if (tileOffsetX < 0) {
            tileOffsetX += this.TILE_SIZE;
        }

        // Clear canvas and redraw everything in view
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Loop over all tiles, call cb on each tile in the viewport
        var drawViewport = function (cb) {
            var i, j, x, y;

            for (x = 0; x < this.VIEW_TILE_WIDTH; x++) {
                for (y = 0; y < this.VIEW_TILE_HEIGHT; y++) {
                    // Coordinates in the map
                    i = topTile + y;
                    j = leftTile + x;

                    // The "if" restricts this to only draw tiles that are in view
                    if (i >= 0 && j >= 0 && i < game.map.height && j < game.map.width) {
                        cb(i, j, x, y);
                    }
                }
            }
        }.bind(this);

        // First pass: draw tiles and units
        drawViewport(function (i, j, x, y) {
            var unit;

            // Background
            this.context.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
            this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

            // Grid lines
            this.context.strokeStyle = "#000";
            this.context.lineWidth = 1;
            this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

            // Text - list units
            if (game.map.tiles[i][j].units.length > 0) {
                // Show first unit, arbitrarily
                unit = game.getUnit(game.map.tiles[i][j].units[0]);

                this.context.fillStyle = this.terrainFontColors[game.map.tiles[i][j].terrain];
                this.context.textBaseline = "top";
                this.context.fillText(unit.type, x * this.TILE_SIZE - tileOffsetX + 2, y * this.TILE_SIZE - tileOffsetY);
            }
        }.bind(this));

        // Second pass: highlight
        drawViewport(function (i, j, x, y) {
            var k, unit;

            // Highlight active tile
            if (game.map.tiles[i][j].units.length > 0) {
                for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                    unit = game.getUnit(game.map.tiles[i][j].units[k]);

                    if (unit.active) {
                        this.context.strokeStyle = "#f00";
                        this.context.lineWidth = 4;
                        this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX - 2, y * this.TILE_SIZE - tileOffsetY - 2, this.TILE_SIZE + 2, this.TILE_SIZE + 2);
                    }
                }
            }
        }.bind(this));
    };

    MapUI.prototype.goToCoords = function (coords) {
        // ith row, jth column, 0 indexed
        this.X = coords[1] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.Y = coords[0] * this.TILE_SIZE + this.TILE_SIZE / 2;
        window.requestAnimationFrame(this.render.bind(this));
    };
    return MapUI;
})();
// MapMaker - map generation module
var MapMaker;
(function (MapMaker) {
    function generate(rows, cols) {
        var i, j, map, types;

        map = {};

        map.width = cols !== undefined ? cols : 80;
        map.height = rows !== undefined ? rows : 40;

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
                map.tiles[i][j] = {
                    units: []
                };
                map.tiles[i][j].terrain = Random.choice(Object.keys(types));
                map.tiles[i][j].features = [];
                if (Math.random() < 0.5 && types[map.tiles[i][j].terrain].length > 0) {
                    map.tiles[i][j].features.push(Random.choice(types[map.tiles[i][j].terrain]));
                }
            }
        }

        return map;
    }
    MapMaker.generate = generate;
})(MapMaker || (MapMaker = {}));
// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game
var Game = (function () {
    function Game(numPlayers, mapRows, mapCols) {
        this.maxId = 0;
        this.activeUnit = null;
        this.turn = 0;
        var i;

        this.map = MapMaker.generate(mapRows, mapCols);

        this.names = [];
        this.units = [];

        for (i = 0; i < numPlayers + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
        }
    }
    Game.prototype.getUnit = function (unitStub) {
        return this.units[unitStub.owner][unitStub.id];
    };

    Game.prototype.getTile = function (coords) {
        return this.map.tiles[coords[0]][coords[1]];
    };

    Game.prototype.newTurn = function () {
        var i, j, unit;

        game.turn++;
        console.log("Start of turn " + game.turn);

        for (i = 0; i < this.units.length; i++) {
            for (j in this.units[i]) {
                unit = this.units[i][j];
                unit.moved = false;
                unit.currentMovement = unit.movement;
            }
        }

        this.moveUnits();
    };

    Game.prototype.moveUnits = function () {
        var i, j, unit;

        for (i = 0; i < this.names.length; i++) {
            // Player 1
            if (i === 1) {
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (!unit.moved) {
                        unit.activate();
                        return;
                    }
                }
            } else {
                // Should auto-move AI units here
            }
        }

        // If we made it this far, everybody has moved
        this.newTurn();
    };
    return Game;
})();
// Units - classes for the various units types
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Units;
(function (Units) {
    

    var BaseUnit = (function () {
        function BaseUnit(owner, coords) {
            this.canAttack = true;
            this.canDefend = true;
            // Turn stuff
            this.active = false;
            this.moved = false;
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.map.tiles[coords[0]][coords[1]].units.push(this.stub());

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }
        BaseUnit.prototype.getName = function (inputClass) {
            return inputClass.constructor.name;
        };

        // Used as a lightweight ID for this unit
        BaseUnit.prototype.stub = function () {
            return {
                id: this.id,
                owner: this.owner
            };
        };

        BaseUnit.prototype.activate = function () {
            this.active = true;
            game.activeUnit = this.stub();
            mapUI.goToCoords(this.coords);
        };

        BaseUnit.prototype.move = function (direction) {
            var i, initialCoords, tileUnits;

            // Should be able to make this general enough to handle all units
            // Handle fight initiation here, if move goes to tile with enemy on it
            // Save a copy
            initialCoords = this.coords.slice();

            // Implement movement
            if (direction === "SW") {
                this.coords[0] += 1;
                this.coords[1] -= 1;
            } else if (direction === "S") {
                this.coords[0] += 1;
            } else if (direction === "SE") {
                this.coords[0] += 1;
                this.coords[1] += 1;
            } else if (direction === "W") {
                this.coords[1] -= 1;
            } else if (direction === "E") {
                this.coords[1] += 1;
            } else if (direction === "NW") {
                this.coords[0] -= 1;
                this.coords[1] -= 1;
            } else if (direction === "N") {
                this.coords[0] -= 1;
            } else if (direction === "NE") {
                this.coords[0] -= 1;
                this.coords[1] += 1;
            }

            // Don't walk off the map!
            if (this.coords[0] < 0) {
                this.coords[0] = 0;
            }
            if (this.coords[1] < 0) {
                this.coords[1] = 0;
            }
            if (this.coords[0] >= game.map.height - 1) {
                this.coords[0] = game.map.height - 1;
            }
            if (this.coords[1] >= game.map.width) {
                this.coords[1] = game.map.width - 1;
            }

            // If moved, update shit and render map
            if (this.coords[0] !== initialCoords[0] || this.coords[1] !== initialCoords[1]) {
                // Delete old unit in map
                tileUnits = game.getTile(initialCoords).units;
                for (i = 0; i < tileUnits.length; i++) {
                    if (tileUnits[i].id === this.id) {
                        tileUnits.splice(i);
                        break;
                    }
                }

                // Add unit at new tile
                game.getTile(this.coords).units.push(this.stub());

                // Keep track of movement
                this.currentMovement -= 1; // Should depend on terrain/improvements
                if (this.currentMovement <= 0) {
                    this.currentMovement = 0;
                    this.moved = true;
                    this.active = false;
                    game.activeUnit = null;

                    // After delay, move to next unit
                    setTimeout(function () {
                        game.moveUnits();
                    }, 500);
                }

                mapUI.render();
            }
        };
        return BaseUnit;
    })();
    Units.BaseUnit = BaseUnit;

    var Warrior = (function (_super) {
        __extends(Warrior, _super);
        function Warrior() {
            _super.apply(this, arguments);
            this.type = "Warrior";
            this.strength = 2;
            this.currentStrength = 2;
            this.movement = 2;
            this.currentMovement = 2;
            this.landOrSea = "land";
        }
        return Warrior;
    })(BaseUnit);
    Units.Warrior = Warrior;
})(Units || (Units = {}));
///<reference path='Random.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
var game = new Game(1, 40, 80);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();

for (var i = 0; i < 200; i++) {
    new Units.Warrior(0, [Math.floor(40 * Math.random()), Math.floor(80 * Math.random())]);
}
for (var i = 0; i < 1; i++) {
    new Units.Warrior(1, [Math.floor(40 * Math.random()), Math.floor(80 * Math.random())]);
}

game.newTurn();
//# sourceMappingURL=app.js.map