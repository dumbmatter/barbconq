// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

class Controller {
    hoveredTile : number[] = [-1, -1];

    constructor() {
        document.addEventListener("keydown", function (e) {
            var activeUnit;

            mapUI.onKeyDown(e.keyCode);

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
        document.addEventListener("keyup", function (e) {
            mapUI.onKeyUp(e.keyCode);
        });

        // Handle hover
        mapUI.canvas.addEventListener("mousemove", function(e) {
            var i, j, left, top;

            // Top left coordinate in pixels, relative to the whole map
            top = mapUI.Y - mapUI.VIEW_HEIGHT / 2;
            left = mapUI.X - mapUI.VIEW_WIDTH / 2;

            // Coordinates in tiles
            i = Math.floor((top + e.y) / mapUI.TILE_SIZE);
            j = Math.floor((left + e.x) / mapUI.TILE_SIZE);

            if ((i !== this.hoveredTile[0] || j !== this.hoveredTile[1]) && i >= 0 && j >= 0 && i < game.map.height && j < game.map.width) {
                this.hoveredTile = [i, j];

                chromeUI.onHoverTile(game.map.tiles[i][j]);
            }
        }.bind(this));
        mapUI.canvas.addEventListener("mouseout", function(e) {
            chromeUI.onHoverTile();
        }.bind(this));
    }
}