///<reference path='Random.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>

declare var EasyStar : any;
var easystar : any = new EasyStar.js();

var config : any = {
    BARB_ID: 0,
    PLAYER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500
};

var game = new Game(1, 20, 40);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();
var controller = new Controller();

for (var i = 0; i < 200; i++) {
//    new Units.Warrior(config.BARB_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
}
for (var i = 0; i < 1; i++) {
//    new Units.Warrior(config.PLAYER_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
}

var u1 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
var u2 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
var g = new Units.UnitGroup(config.PLAYER_ID, [u1, u2]);

game.newTurn();