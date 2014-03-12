// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

class Controller {
    hoveredTile : number[];

    constructor() {
        // Start listening for various kinds of user input
        this.initMapPanning();
        this.initUnitActions();
        this.initHoverTile();
        this.initMapClick();
    }

    initMapPanning() {
        document.addEventListener("keydown", function (e) {
            mapUI.onKeyDown(e.keyCode);
        });
        document.addEventListener("keyup", function (e) {
            mapUI.onKeyUp(e.keyCode);
        });
    }

    initUnitActions() {
        document.addEventListener("keydown", function (e) {
            var activeUnit;

            // Active unit stuff
            if (game.activeUnit) {
                activeUnit = game.getUnit(game.activeUnit);

                // Unit movement
                if (e.keyCode === 97) { // Numpad 1
                    activeUnit.move("SW");
                } else if (e.keyCode === 98) { // Numpad 2
                    activeUnit.move("S");
                } else if (e.keyCode === 99) { // Numpad 3
                    activeUnit.move("SE");
                } else if (e.keyCode === 100) { // Numpad 4
                    activeUnit.move("W");
                } else if (e.keyCode === 102) { // Numpad 6
                    activeUnit.move("E");
                } else if (e.keyCode === 103) { // Numpad 7
                    activeUnit.move("NW");
                } else if (e.keyCode === 104) { // Numpad 8
                    activeUnit.move("N");
                } else if (e.keyCode === 105) { // Numpad 9
                    activeUnit.move("NE");
                }

                // Center on active unit
                if (e.keyCode === 67) { // c
                    mapUI.goToCoords(activeUnit.coords)
                }
            }
        });
    }

    initHoverTile() {
        this.hoveredTile = [-1, -1]; // Dummy value for out of map

        mapUI.canvas.addEventListener("mousemove", function(e) {
            var coords;

            coords = mapUI.pixelsToCoords(e.x, e.y);

            if (coords) {
                // Over a tile
                if (coords[0] !== this.hoveredTile[0] || coords[1] !== this.hoveredTile[1]) {
                    // Only update if new tile
                    this.hoveredTile = coords;
                    chromeUI.onHoverTile(game.getTile(this.hoveredTile));
                }
            } else {
                // Not over tile, over some other part of the canvas
                this.hoveredTile = [-1, -1];
                chromeUI.onHoverTile();
            }
        }.bind(this));
        mapUI.canvas.addEventListener("mouseout", function(e) {
            this.hoveredTile = [-1, -1];
            chromeUI.onHoverTile();
        }.bind(this));
    }

    // if one of your units is on the clicked tile, activate it and DO NOT CENTER THE MAP
    // if one of your units is not on the clicked tile, center the map
    initMapClick() {
        mapUI.canvas.addEventListener("click", function(e) {
            var foundUnit, i, coords, units;

            coords = mapUI.pixelsToCoords(e.x, e.y);

            units = game.getTile(coords).units;
            foundUnit = false;

            // This should be made smarter (i.e. pick the strongest unit with moves left - easy if units is sorted by strength by default)
            for (i = 0; i < units.length; i++) {
                if (units[i].owner === 1) {
                    game.getUnit(units[i]).activate(false); // Activate, but don't center map!
                    foundUnit = true;
                    requestAnimationFrame(mapUI.render.bind(mapUI));
                    return;
                }
            }

            // If we made it this far, none of the user's units are on this tile
            mapUI.goToCoords(coords);
        });
    }
}