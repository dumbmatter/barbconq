// Random - utility functions like Python's random module
var Random;
(function (Random) {
    function choice(x) {
        return x[Math.floor(Math.random() * x.length)];
    }
    Random.choice = choice;
})(Random || (Random = {}));
// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game
var Controller = (function () {
    function Controller() {
        this.KEYS = {
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            LEFT: 37,
            NUMPAD_1: 97,
            NUMPAD_2: 98,
            NUMPAD_3: 99,
            NUMPAD_4: 100,
            NUMPAD_6: 102,
            NUMPAD_7: 103,
            NUMPAD_8: 104,
            NUMPAD_9: 105,
            C: 67,
            SPACE_BAR: 32
        };
        // Only needed for some keys
        this.keysPressed = {
            38: false,
            39: false,
            40: false,
            37: false
        };
        this._hoveredTile = null;
        // Start listening for various kinds of user input
        this.initMapPanning();
        this.initUnitActions();
        this.initHoverTile();
        this.initMapClick();
    }
    Object.defineProperty(Controller.prototype, "hoveredTile", {
        get: function () {
            return this._hoveredTile;
        },
        // Getters and setters, to make Knockout integration easier
        set: function (value) {
            this._hoveredTile = value;
            vm.hoveredTile(game.getTile(value));
        },
        enumerable: true,
        configurable: true
    });

    Controller.prototype.initMapPanning = function () {
        document.addEventListener("keydown", function (e) {
            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = true;

                // Panning viewport based on keyboard arrows
                if (this.keysPressed[this.KEYS.UP]) {
                    mapUI.Y = mapUI.Y - 20;
                }
                if (this.keysPressed[this.KEYS.RIGHT]) {
                    mapUI.X = mapUI.X + 20;
                }
                if (this.keysPressed[this.KEYS.DOWN]) {
                    mapUI.Y = mapUI.Y + 20;
                }
                if (this.keysPressed[this.KEYS.LEFT]) {
                    mapUI.X = mapUI.X - 20;
                }

                requestAnimationFrame(mapUI.render.bind(mapUI));
            }
        }.bind(this));
        document.addEventListener("keyup", function (e) {
            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = false;
            }
        }.bind(this));
    };

    Controller.prototype.initUnitActions = function () {
        document.addEventListener("keydown", function (e) {
            // Active unit stuff
            if (game.activeUnit) {
                // Unit movement
                if (e.keyCode === this.KEYS.NUMPAD_1) {
                    game.activeUnit.move("SW");
                } else if (e.keyCode === this.KEYS.NUMPAD_2) {
                    game.activeUnit.move("S");
                } else if (e.keyCode === this.KEYS.NUMPAD_3) {
                    game.activeUnit.move("SE");
                } else if (e.keyCode === this.KEYS.NUMPAD_4) {
                    game.activeUnit.move("W");
                } else if (e.keyCode === this.KEYS.NUMPAD_6) {
                    game.activeUnit.move("E");
                } else if (e.keyCode === this.KEYS.NUMPAD_7) {
                    game.activeUnit.move("NW");
                } else if (e.keyCode === this.KEYS.NUMPAD_8) {
                    game.activeUnit.move("N");
                } else if (e.keyCode === this.KEYS.NUMPAD_9) {
                    game.activeUnit.move("NE");
                }

                // Center on active unit
                if (e.keyCode === this.KEYS.C) {
                    mapUI.goToCoords(game.activeUnit.coords);
                }

                // Unit-specific actions, might not always apply
                if (e.keyCode === this.KEYS.SPACE_BAR && game.activeUnit.actions.indexOf("skipTurn") >= 0) {
                    game.activeUnit.skipTurn();
                }
            }
        }.bind(this));
    };

    Controller.prototype.initHoverTile = function () {
        this.hoveredTile = [-1, -1]; // Dummy value for out of map

        mapUI.canvas.addEventListener("mousemove", function (e) {
            var coords;

            coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

            if (coords) {
                // Over a tile
                if (coords[0] !== this.hoveredTile[0] || coords[1] !== this.hoveredTile[1]) {
                    // Only update if new tile
                    this.hoveredTile = coords;
                }
            } else {
                // Not over tile, over some other part of the canvas
                this.hoveredTile = [-1, -1];
            }
        }.bind(this));
        mapUI.canvas.addEventListener("mouseout", function (e) {
            this.hoveredTile = [-1, -1];
        }.bind(this));
    };

    // if one of your units is on the clicked tile, activate it and DO NOT CENTER THE MAP
    // if one of your units is not on the clicked tile, center the map
    Controller.prototype.initMapClick = function () {
        mapUI.canvas.addEventListener("click", function (e) {
            var foundUnit, i, coords, units;

            coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

            if (mapUI.validCoords(coords)) {
                units = game.getTile(coords).units;
                foundUnit = false;

                for (i = 0; i < units.length; i++) {
                    if (units[i].owner === 1) {
                        units[i].activate(false); // Activate, but don't center map!
                        foundUnit = true;
                        requestAnimationFrame(mapUI.render.bind(mapUI));
                        return;
                    }
                }

                // If we made it this far, none of the user's units are on this tile
                mapUI.goToCoords(coords);
            }
        });

        mapUI.miniCanvas.addEventListener("mousedown", function (e) {
            var coords, miniMapPan, miniMapPanStop;

            coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

            if (mapUI.validCoords(coords)) {
                mapUI.goToCoords(coords);
            }

            // Pan as click is held and mouse is moved
            miniMapPan = function (e) {
                var coords;

                coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

                if (mapUI.validCoords(coords)) {
                    mapUI.goToCoords(coords);
                }
            };
            mapUI.miniCanvas.addEventListener("mousemove", miniMapPan);

            // Stop panning when mouse click ends
            miniMapPanStop = function (e) {
                mapUI.miniCanvas.removeEventListener("mousemove", miniMapPan);
                document.removeEventListener("mouseup", miniMapPanStop);
            };
            document.addEventListener("mouseup", miniMapPanStop);
        });
    };
    return Controller;
})();
// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map/minimap)
var ChromeUI = (function () {
    function ChromeUI() {
        this.elHoverBox = document.getElementById("hover-box");
        this.elBottomInfo = document.getElementById("bottom-info");
        this.elBottomActions = document.getElementById("bottom-actions");
    }
    ChromeUI.prototype.strengthFraction = function (unit) {
        if (unit.strength === unit.currentStrength) {
            return unit.currentStrength + ' S';
        } else {
            return unit.currentStrength + '/' + unit.strength + ' S';
        }
    };

    ChromeUI.prototype.movementFraction = function (unit) {
        if (unit.movement === unit.currentMovement) {
            return unit.currentMovement + ' M';
        } else {
            return unit.currentMovement + '/' + unit.movement + ' M';
        }
    };

    ChromeUI.prototype.onHoverTile = function (tile) {
        if (typeof tile === "undefined") { tile = null; }
        var content, i, unit;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                unit = tile.units[i];
                content += '<span class="unit-name">' + unit.type + '</span>, ';
                content += this.strengthFraction(unit) + ', ';
                content += this.movementFraction(unit) + ', ';
                content += game.names[unit.owner];
                content += '<br>';
            }

            // Show tile terrain and features
            content += tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain;

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            // Hide hover box
            this.elHoverBox.style.display = "none";
        }
    };

    ChromeUI.prototype.onUnitActivated = function () {
        var activeUnit;

        activeUnit = game.activeUnit;

        // Update bottom-info
        this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" + "<table>" + "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" + "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" + "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" + "<tr><td>Experience:</td><td>" + activeUnit.xp + "</td></tr>" + "</table>";
        // Update bottom-actions
    };
    return ChromeUI;
})();
// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)
var MapUI = (function () {
    function MapUI() {
        // Constants
        this.TILE_SIZE = 50;
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

        // Minimap
        this.miniCanvas = document.getElementById("minimap");
        this.miniContext = this.miniCanvas.getContext("2d");

        // See whether it's height or width limited based on the aspect ratio
        if (game.map.width / game.map.height > this.miniCanvas.width / this.miniCanvas.height) {
            // Bound based on map width
            this.miniTileSize = this.miniCanvas.width / game.map.width;
        } else {
            // Bound based on map height
            this.miniTileSize = this.miniCanvas.height / game.map.height;
        }

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
        this.context.fillStyle = "#000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
                unit = game.map.tiles[i][j].units[0];

                this.context.fillStyle = this.terrainFontColors[game.map.tiles[i][j].terrain];
                this.context.textBaseline = "top";
                this.context.fillText(unit.type, x * this.TILE_SIZE - tileOffsetX + 2, y * this.TILE_SIZE - tileOffsetY);
            }
        }.bind(this));

        // Second pass: highlight active unit
        drawViewport(function (i, j, x, y) {
            var k, unit;

            // Highlight active tile
            if (game.map.tiles[i][j].units.length > 0) {
                for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                    unit = game.map.tiles[i][j].units[k];

                    if (unit.active) {
                        this.context.strokeStyle = "#f00";
                        this.context.lineWidth = 4;
                        this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX - 2, y * this.TILE_SIZE - tileOffsetY - 2, this.TILE_SIZE + 2, this.TILE_SIZE + 2);
                        break;
                    }
                }
            }
        }.bind(this));

        // Render minimap at the end
        this.renderMiniMap();
    };

    MapUI.prototype.renderMiniMap = function () {
        var bottom, bottomTile, i, j, k, left, leftTile, right, rightTile, top, topTile, unit;

        // Clear canvas and redraw everything
        this.miniContext.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
        this.miniContext.fillStyle = "#000";
        this.miniContext.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

        for (i = 0; i < game.map.height; i++) {
            for (j = 0; j < game.map.width; j++) {
                // Background
                this.miniContext.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
                this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
            }
        }

        for (i = 0; i < game.map.height; i++) {
            for (j = 0; j < game.map.width; j++) {
                // Highlight active tile
                if (game.map.tiles[i][j].units.length > 0) {
                    for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                        unit = game.map.tiles[i][j].units[k];

                        if (unit.active) {
                            this.miniContext.fillStyle = "#f00";
                            this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
                            break;
                        }
                    }
                }
            }
        }

        // Show box for viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;
        topTile = top / this.TILE_SIZE; // Don't need to floor these since they're just being used for drawing
        rightTile = right / this.TILE_SIZE;
        bottomTile = bottom / this.TILE_SIZE;
        leftTile = left / this.TILE_SIZE;
        this.miniContext.strokeStyle = "#f00";
        this.miniContext.lineWidth = 2;
        this.miniContext.strokeRect(leftTile * this.miniTileSize, topTile * this.miniTileSize, (rightTile - leftTile) * this.miniTileSize, (bottomTile - topTile) * this.miniTileSize);
    };

    MapUI.prototype.goToCoords = function (coords) {
        // ith row, jth column, 0 indexed
        this.X = coords[1] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.Y = coords[0] * this.TILE_SIZE + this.TILE_SIZE / 2;
        window.requestAnimationFrame(this.render.bind(this));
    };

    // Input: pixel coordinates from canvas events like "click" and "mousemove". Output: tile coordinates (row, col) 0 indexed
    MapUI.prototype.pixelsToCoords = function (x, y) {
        var coords, left, top;

        // Top left coordinate in pixels, relative to the whole map
        top = this.Y - this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Coordinates in tiles
        coords = [
            Math.floor((top + y) / this.TILE_SIZE),
            Math.floor((left + x) / this.TILE_SIZE)
        ];

        // Only return coordinates in map
        if (this.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    };

    // Same as above, but for minimap
    MapUI.prototype.miniPixelsToCoords = function (x, y) {
        var coords, left, top;

        // Coordinates in tiles
        coords = [
            Math.floor(y / this.miniTileSize),
            Math.floor(x / this.miniTileSize)
        ];

        // Only return coordinates in map
        if (this.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    };

    // Make sure coords are on map
    MapUI.prototype.validCoords = function (coords) {
        if (coords) {
            return coords[0] >= 0 && coords[1] >= 0 && coords[0] < game.map.height && coords[1] < game.map.width;
        }

        return false;
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
        this._turn = 0;
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
    Object.defineProperty(Game.prototype, "turn", {
        get: function () {
            return this._turn;
        },
        // Getters and setters, to make Knockout integration easier
        set: function (value) {
            this._turn = value;
            vm.turn(value);
        },
        enumerable: true,
        configurable: true
    });

    Game.prototype.getTile = function (coords) {
        if (mapUI.validCoords(coords)) {
            return this.map.tiles[coords[0]][coords[1]];
        } else {
            return null;
        }
    };

    Game.prototype.newTurn = function () {
        var i, j, unit;

        game.turn++;

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
            // Key attributes
            this.level = 1;
            this.xp = 0;
            this.canAttack = true;
            this.canDefend = true;
            // Turn stuff
            this._active = false;
            this.moved = false;
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.map.tiles[coords[0]][coords[1]].units.push(this);

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }
        Object.defineProperty(BaseUnit.prototype, "active", {
            get: function () {
                return this._active;
            },
            // Getters and setters, to make Knockout integration easier
            set: function (value) {
                this._active = value;
            },
            enumerable: true,
            configurable: true
        });

        BaseUnit.prototype.getName = function (inputClass) {
            return inputClass.constructor.name;
        };

        // goToCoords can be set to false if you don't want the map centered on the unit after activating, like on a left click
        BaseUnit.prototype.activate = function (goToCoords) {
            if (typeof goToCoords === "undefined") { goToCoords = true; }
            // Deactivate current active unit, if there is one
            if (game.activeUnit) {
                game.activeUnit.active = false;
                //                game.activeUnit = null; // Is this needed? Next unit will set it, if it exists
            }

            // Activate this unit
            this.active = true;
            game.activeUnit = this;
            if (goToCoords) {
                mapUI.goToCoords(this.coords);
            }

            chromeUI.onUnitActivated();
        };

        // Set as moved, because it used up all its moves or because its turn was skipped or something
        BaseUnit.prototype.setMoved = function () {
            this.moved = true;
            this.active = false;

            //            game.activeUnit = null; // Is this needed? Next unit will set it, if it exists
            // After delay, move to next unit
            setTimeout(function () {
                game.moveUnits();
            }, 500);
        };

        BaseUnit.prototype.move = function (direction) {
            var i, initialCoords, tileUnits;

            // Should be able to make this general enough to handle all units
            // Handle fight initiation here, if move goes to tile with enemy on it
            // Short circuit if no moves are available
            if (this.currentMovement <= 0) {
                return;
            }

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
                game.getTile(this.coords).units.push(this);

                // Keep track of movement
                this.currentMovement -= 1; // Should depend on terrain/improvements
                if (this.currentMovement <= 0) {
                    this.currentMovement = 0;
                    this.setMoved();
                }

                requestAnimationFrame(mapUI.render.bind(mapUI));
            }
        };

        // Mark as moved and go to the next active unit
        BaseUnit.prototype.skipTurn = function () {
            this.setMoved();
            requestAnimationFrame(mapUI.render.bind(mapUI));
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
            this.actions = ["fortify", "skipTurn", "sentry"];
        }
        return Warrior;
    })(BaseUnit);
    Units.Warrior = Warrior;
})(Units || (Units = {}));
///<reference path='lib/knockout.d.ts' />
///<reference path='Random.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
var vm = {
    turn: ko.observable(),
    hoveredTile: ko.observable()
};

var game = new Game(1, 20, 40);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();
var controller = new Controller();

for (var i = 0; i < 200; i++) {
    new Units.Warrior(0, [Math.floor(game.map.height * Math.random()), Math.floor(game.map.width * Math.random())]);
}
for (var i = 0; i < 1; i++) {
    //    new Units.Warrior(1, [Math.floor(game.map.height * Math.random()), Math.floor(game.map.width * Math.random())]);
}

new Units.Warrior(1, [0, 0]);
new Units.Warrior(1, [1, 0]);

ko.applyBindings(vm);

// Start game
game.newTurn();
//# sourceMappingURL=app.js.map
