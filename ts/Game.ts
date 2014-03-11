// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game

class Game {
    map : MapMaker.Map;
    maxId : number = 0;
    units : {}[];

    constructor(numPlayers : number, mapRows : number, mapCols : number) {
        var i;

        this.map = MapMaker.generate(mapRows, mapCols);
        this.units = [];

        // + 1 is for barbarians at index 0
        for (i = 0; i < numPlayers + 1; i++) {
            this.units.push({});
        }
    }

    getUnit(unitStub : Units.Stub) {
        return this.units[unitStub.owner][unitStub.id];
    }
}