///<reference path='Util.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
///<reference path='Combat.ts'/>

// Load easystar.js
declare var EasyStar : any;
var easystar : any = new EasyStar.js();

var assets : any, chromeUI, controller, game, mapUI;

// Default options
var config : any = {
    BARB_ID: 0,
    PLAYER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500,
    DISABLE_FOG_OF_WAR: true
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

function loadAssets(assetsToLoad, cb) {
    var name : string, numAssetsRemaining : number;

    numAssetsRemaining = Object.keys(assetsToLoad).length;

    assets = {};
    for (name in assetsToLoad) {
        assets[name] = new Image();
        assets[name].src = "assets/" + assetsToLoad[name];
        assets[name].onload = function () {
            numAssetsRemaining -= 1;
            if (numAssetsRemaining === 0) {
                cb();
            }
        }
    }
}

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

    new Units.Scout(config.PLAYER_ID, [10, 20]);
    new Units.Warrior(config.PLAYER_ID, [10, 20]);
    new Units.Archer(config.PLAYER_ID, [10, 20]);
    new Units.Chariot(config.PLAYER_ID, [10, 20]);
    new Units.Spearman(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
    new Units.Warrior(config.BARB_ID, [10, 21]);
    new Units.Warrior(config.BARB_ID, [10, 21]);
    new Units.Chariot(config.BARB_ID, [10, 21]);

    //var c = new Combat.Battle(u1, u2);
    //c.fight();

    game.newTurn();
}

loadAssets({
    hills: "terrain/hills.png",
    forest: "terrain/forest.png",
    WhiteScout: "units/white/tread.png",
    WhiteWarrior: "units/white/stone-axe.png",
    WhiteArcher: "units/white/high-shot.png",
    WhiteChariot: "units/white/horse-head.png",
    WhiteSpearman: "units/white/spears.png",
    WhiteAxeman: "units/white/battle-axe.png",
    BlackScout: "units/black/tread.png",
    BlackWarrior: "units/black/stone-axe.png",
    BlackArcher: "units/black/high-shot.png",
    BlackChariot: "units/black/horse-head.png",
    BlackSpearman: "units/black/spears.png",
    BlackAxeman: "units/black/battle-axe.png"
}, init);