function choice(x) {
    return x[Math.floor(Math.random() * x.length)];
}

function drawMap(map : Grid) {
    var i, j, tile, world;

    world = document.getElementById("world");
    world.style.width = (map.width * 103) + "px";
    world.style.height = (map.height * 104) + "px";

    for (i = 0; i < map.tiles[0].length; i++) {
        for (j = 0; j < map.tiles.length; j++) {
            tile = document.createElement("div");

            tile.classList.add("tile");
            if (j === 0) {
                tile.classList.add("new-row");
            }

            tile.innerHTML = map.tiles[i][j].terrain + "<br>" + map.tiles[i][j].features.join(" ");

            world.appendChild(tile);
        }
    }
}

interface Tile {
    terrain : string;
    features : string[];
}

interface Grid {
    width : number;
    height : number;
    tiles : Tile[][];
}


function genMap(width : number = 2, height : number = 2) : Grid {
    var i, j, map, types;

    map = {};

    map.width = width !== undefined ? width : 80;
    map.height = height !== undefined ? height : 40;

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
            map.tiles[i][j] = {};
            map.tiles[i][j].terrain = choice(Object.keys(types));
            map.tiles[i][j].features = [];
            if (Math.random() < 0.5) {
                map.tiles[i][j].features.push(choice(types[map.tiles[i][j].terrain]));
            }
        }
    }

    return map;
}

drawMap(genMap());