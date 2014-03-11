///<reference path='Random.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>

var game = new Game(1, 40, 80);
var mapUI = new MapUI();

new Units.Warrior(0, [1, 1]);