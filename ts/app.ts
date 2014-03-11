///<reference path='Random.ts'/>
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
new Units.Warrior(1, [21, 40]);
new Units.Warrior(1, [20, 40]);

game.turn();