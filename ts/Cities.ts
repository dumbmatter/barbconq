// Cities

module Cities {
    // Things that both individual units and groups of units have in common
    export class City {
        id : number; // Unique, incrementing
        owner : number;
        coords : number[];

        constructor(owner : number, coords : number[]) {
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of city and put a reference to the city in the map
            this.coords = coords;
            game.getTile(coords, false).city = this;

            // Store reference to unit in game.units
            game.cities[this.owner][this.id] = this;
        }

        capture(newOwner : number) {
            game.cities[newOwner][this.id] = this;
            delete game.cities[this.owner][this.id];
            this.owner = newOwner;
        }
    }
}