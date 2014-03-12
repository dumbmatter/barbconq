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

for (var i = 0; i < 200; i++) {
    new Units.Warrior(0, [Math.floor(40 * Math.random()), Math.floor(80 * Math.random())]);
}
for (var i = 0; i < 1; i++) {
    new Units.Warrior(1, [Math.floor(40 * Math.random()), Math.floor(80 * Math.random())]);
}

game.newTurn();