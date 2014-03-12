///<reference path='Random.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>

var game = new Game(1, 40, 80);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();

new Units.Warrior(0, [1, 1]);
new Units.Warrior(0, [20, 40]);
for (var i = 0; i < 2; i++) {
    new Units.Warrior(1, [Math.floor(40 * Math.random()), Math.floor(80 * Math.random())]);
}

game.newTurn();