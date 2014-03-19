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

// Default options
var config : any = {
    BARB_ID: 0,
    PLAYER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500
};

var game = new Game(1, 20, 40);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();
var controller = new Controller();

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

new Units.Warrior(config.PLAYER_ID, [10, 20]);
new Units.Chariot(config.PLAYER_ID, [10, 20]);
new Units.Chariot(config.PLAYER_ID, [10, 20]);
new Units.Chariot(config.PLAYER_ID, [10, 20]);
new Units.Chariot(config.PLAYER_ID, [10, 20]);
new Units.Warrior(config.BARB_ID, [10, 21]);
new Units.Warrior(config.BARB_ID, [10, 21]);
new Units.Chariot(config.BARB_ID, [10, 21]);

//var c = new Combat.Battle(u1, u2);
//c.fight();

game.newTurn();