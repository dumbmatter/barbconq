// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game

class Game {
    map : MapMaker.Map;
    maxId : number = 0;
    names: string[] = [];
    units : {}[] = []; // One object in array for each player. Then in object, can use unit ID as key
    unitGroups : Units.UnitGroup[][] = [];
    activeUnit : Units.BaseUnitOrGroup = null;
    turn : number = 0;

    constructor(numPlayers : number, mapRows : number, mapCols : number) {
        var i;

        this.map = new MapMaker.DefaultMap(mapRows, mapCols);

        // + 1 is for barbarians at index 0
        for (i = 0; i < numPlayers + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
            this.unitGroups.push([]);
        }
    }

    getTile(coords : number[]) {
        if (this.map.validCoords(coords)) {
            return this.map.tiles[coords[0]][coords[1]];
        } else {
            return null;
        }
    }

    newTurn() {
        var i, j, unit;

        // See if anything still has to be moved, after the initial turn
        if (game.turn > 0 && this.moveUnits()) {
            return;
        }

        game.turn++;
        chromeUI.onNewTurn();

        // Reset all movement counters
        for (i = 0; i < this.units.length; i++) {
            for (j in this.units[i]) {
                unit = this.units[i][j];
                unit.moved = false;
                unit.currentMovement = unit.movement;
            }
        }

        this.moveUnits();
    }

    moveUnits() : boolean {
        var i, j, unit;

        for (i = 0; i < this.names.length; i++) {
            // Player 1
            if (i === 1) {
                // First look for ones not on a path towards targetCoords
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (!unit.moved && !unit.targetCoords) {
                        unit.activate();
                        return true;
                    }
                }

                // Then process all the targetCoords ones
                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (!unit.moved) {
                        unit.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }
            } else {
                // Should auto-move AI units here
            }
        }

        // If we made it this far, everybody has moved
        chromeUI.onMovesDone();
        return false;
    }
}