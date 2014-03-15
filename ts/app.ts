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
    UNIT_MOVEMENT_UI_DELAY: 500
};

var game = new Game(1, 20, 40);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();
var controller = new Controller();

for (var i = 0; i < 200; i++) {
    new Units.Warrior(0, [Math.floor(game.map.height * Math.random()), Math.floor(game.map.width * Math.random())]);
}
for (var i = 0; i < 1; i++) {
//    new Units.Warrior(1, [Math.floor(game.map.height * Math.random()), Math.floor(game.map.width * Math.random())]);
}

new Units.Warrior(1, [0, 0]);
new Units.Warrior(1, [1, 0]);

game.newTurn();