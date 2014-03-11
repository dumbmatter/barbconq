// MapMaker - map generation module

module MapMaker {
    export interface Tile {
        terrain : string;
        features : string[];
        units : Units.Stub[];
    }

    export interface Map {
        width : number;
        height : number;
        tiles : Tile[][];
    }

    export function generate(rows : number, cols : number) : Map {
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
}