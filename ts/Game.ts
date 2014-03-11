// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game

class Game {
    map : MapMaker.Map;
    maxId : number = 0;
    names: string[];
    units : {}[];

    constructor(numPlayers : number, mapRows : number, mapCols : number) {
        var i;

        this.map = MapMaker.generate(mapRows, mapCols);

        this.names = [];
        this.units = [];

        // + 1 is for barbarians at index 0
        for (i = 0; i < numPlayers + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
        }
    }

    getUnit(unitStub : Units.Stub) {
        return this.units[unitStub.owner][unitStub.id];
    }

    moveUnits() {
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
            }
        }
    }
}