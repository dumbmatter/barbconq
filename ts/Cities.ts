// Cities

module Cities {
    // Things that both individual units and groups of units have in common
    export class City {
        id : number; // Unique, incrementing
        owner : number;
        coords : number[];

        constructor(owner : number, coords : number[]) {
            var i : number, tile : MapMaker.Tile;

            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of city and put a reference to the city in the map
            this.coords = coords;
            tile = game.getTile(coords, -1);
            tile.city = this;

            // Store reference to unit in game.units
            game.cities[this.owner][this.id] = this;

            // If tile contains forest or jungle, get rid of it
            if (tile.features.indexOf("forest") >= 0) {
                for (i = 0; i < tile.features.length; i++) {
                    if (tile.features[i] === "forest") {
                        tile.features.splice(i, 1);
                    }
                }
            }
            if (tile.features.indexOf("jungle") >= 0) {
                for (i = 0; i < tile.features.length; i++) {
                    if (tile.features[i] === "jungle") {
                        tile.features.splice(i, 1);
                    }
                }
            }
        }

        capture(newOwner : number) {
            game.cities[newOwner][this.id] = this;
            delete game.cities[this.owner][this.id];
            this.owner = newOwner;

            if (this.owner === config.USER_ID && game.result === "inProgress") {
                game.result = "won";
                chromeUI.showModal("won");
            }
        }
    }
}