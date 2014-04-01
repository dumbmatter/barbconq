///<reference path='Util.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
///<reference path='Cities.ts'/>
///<reference path='Combat.ts'/>

// JS libs
declare var Howl : any;
declare var EasyStar : any;
var easystar : any = new EasyStar.js();

// assets : {[name: string] : HTMLImageElement}
var assets : any, chromeUI : ChromeUI, controller : Controller, game : Game, mapUI : MapUI;

// Default options
var config : any = {
    BARB_ID: 0,
    PLAYER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500,
    DISABLE_FOG_OF_WAR: false
};

/*var assets : any = {};
assets.hills = new Image();
assets.hills.src = 'assets/hills.png';
assets.hills.onload = function () {
    assets.forest = new Image();
    assets.forest.src = 'assets/forest.png';
    assets.forest.onload = function () {
        assets.Warrior = new Image();
        assets.Warrior.src = 'assets/stone-axe.png';
        assets.Warrior.onload = function () {
            assets.Chariot = new Image();
            assets.Chariot.src = 'assets/horse-head.png';
            assets.Chariot.onload = init;
        };
    };
};*/

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
    game = new Game(1, 20, 40);
    chromeUI = new ChromeUI();
    mapUI = new MapUI();
    controller = new Controller();

    game.map.updateVisibility();

    for (var i = 0; i < 200; i++) {
    //    new Units.Warrior(config.BARB_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
    }
    for (var i = 0; i < 1; i++) {
    //    new Units.Warrior(config.PLAYER_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
    }

    /*var u1 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
    var u2 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
    var u3 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
    for (i = 0; i < 10; i++) {
        var u4 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
    }
    new Units.Group(config.PLAYER_ID, [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]);
    [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]
    new Units.Group(config.PLAYER_ID, [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]);*/

/*    new Units.Scout(config.PLAYER_ID, [10, 20]);
    new Units.Warrior(config.PLAYER_ID, [10, 20]);
    new Units.Archer(config.PLAYER_ID, [10, 20]);*/
    u1 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
    u1.promotions.push("drill1");
    u1.promotions.push("drill2");
    u1.xp += 5;
    new Units.Archer(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
/*    new Units.Spearman(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
    new Units.Warrior(config.BARB_ID, [10, 21]);
    new Units.Warrior(config.BARB_ID, [10, 21]);*/
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Spearman(config.BARB_ID, [10, 21]);
    new Units.Axeman(config.BARB_ID, [10, 21]);
    new Units.Chariot(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Cities.City(config.BARB_ID, [10, 21]);

    game.newTurn();
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