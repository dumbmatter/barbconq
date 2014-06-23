///<reference path='Util.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='AI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Promotions.ts'/>
///<reference path='Units.ts'/>
///<reference path='Cities.ts'/>
///<reference path='Combat.ts'/>
///<reference path='Debug.ts'/>

// JS libs
declare var Howl : any;
declare var EasyStar : any;
var easystar : any = new EasyStar.js();

// assets : {[name: string] : HTMLImageElement}
var assets : any, chromeUI : ChromeUI, controller : Controller, game : Game, mapUI : MapUI;

// Default options
var config : any = {
    NUM_PLAYERS: 1,
    BARB_ID: 0,
    USER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500,
    BATTLE_ROUND_UI_DELAY: 300,
    DISABLE_FOG_OF_WAR: true
};

function loadAssets(assetsToLoad : {[name: string] : string}, cb : () => void) {
    var afterEachAsset : () => void, name : string, numAssetsRemaining : number;

    numAssetsRemaining = Object.keys(assetsToLoad).length;

    afterEachAsset = function () {
        numAssetsRemaining -= 1;
        if (numAssetsRemaining === 0) {
            cb();
        }
    }

    assets = {};
    assets.battleStart = new Howl({
        urls: ["assets/battle-start.ogg", "assets/battle-start.mp3"]
    });
    assets.battleWon = new Howl({
        urls: ["assets/battle-won.ogg", "assets/battle-won.mp3"]
    });
    assets.battleLost = new Howl({
        urls: ["assets/battle-lost.ogg", "assets/battle-lost.mp3"]
    });

    for (name in assetsToLoad) {
        if (assetsToLoad[name].indexOf(".png") >= 0) {
            assets[name] = new Image();
            assets[name].src = "assets/" + assetsToLoad[name];
            assets[name].onload = afterEachAsset;
        } else {
        }
    }
}

var u1;
function init() {
    var i : number, j : number, placedCity : boolean, r : number, theta : number;

    game = new Game(20, 40);
    chromeUI = new ChromeUI();
    mapUI = new MapUI();
    controller = new Controller();

/*    //new Units.Group(config.USER_ID, [new Units.Chariot(config.USER_ID, [10, 20]), new Units.Chariot(config.USER_ID, [10, 20])]);

    u1 = new Units.Scout(config.USER_ID, [10, 20]);
//    u1.promotions.push("drill1");
//    u1.promotions.push("drill2");
    u1.xp += 400;
    var u = new Units.Scout(config.BARB_ID, [9, 21]);

    new Cities.City(config.BARB_ID, [10, 21]);*/

    // Place landing party on the leftmost land tile of middle row
    i = Math.floor(game.map.rows / 2);
    for (j = 0; j < game.map.cols; j++) {
        if (game.getTile([i, j], -1).terrain !== "sea") {
            break;
        }
    }
    new Units.Scout(config.USER_ID, [i, j]);
    new Units.Warrior(config.USER_ID, [i, j]);
    new Units.Archer(config.USER_ID, [i, j]);
    new Units.Chariot(config.USER_ID, [i, j]);
    new Units.Spearman(config.USER_ID, [i, j]);
    new Units.Axeman(config.USER_ID, [i, j]);

    // Place barb city on the right half of the island
    placedCity = false;
    while (!placedCity) {
        // Use polar coordinates to ensure fair distribution
        r = Math.random() * (Math.min(game.map.rows, game.map.cols) * 0.25);
        theta = Math.random() * Math.PI - Math.PI / 2; // Right half of circle

        // Convert to map coords
        i = Math.round(game.map.rows / 2 + Math.sin(theta) * r);
        j = Math.round(game.map.cols / 2 + Math.cos(theta) * r);

        // If this tile is on land, place city
        if (game.getTile([i, j], -1).terrain !== "sea") {
            new Cities.City(config.BARB_ID, [i, j]);
            placedCity = true;
        }
    }

    game.newTurn();
    game.nextPlayer(); // Will skip from default (0, barbs) to the player (1)
}

function startBarbConq() {
    loadAssets({
        hills: "terrain/hills.png",
        forest: "terrain/forest.png",
        city: "white-tower.png",
        cityCaptured: "tower-fall.png",
        whiteScout: "units/white/tread.png",
        whiteWarrior: "units/white/stone-axe.png",
        whiteArcher: "units/white/high-shot.png",
        whiteChariot: "units/white/horse-head.png",
        whiteSpearman: "units/white/spears.png",
        whiteAxeman: "units/white/battle-axe.png",
        blackScout: "units/black/tread.png",
        blackWarrior: "units/black/stone-axe.png",
        blackArcher: "units/black/high-shot.png",
        blackChariot: "units/black/horse-head.png",
        blackSpearman: "units/black/spears.png",
        blackAxeman: "units/black/battle-axe.png"
    }, init);
}