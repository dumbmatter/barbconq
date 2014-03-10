///<reference path='Random.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>

var game : Game = {
    map: MapMaker.generate(80, 40),
    maxId: 0
};

var mapUI = new MapUI();

var w = new Units.Warrior(0, [1, 1]);