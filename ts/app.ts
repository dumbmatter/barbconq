///<reference path='Random.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>

var game : Game = {
    map: MapMaker.generate(80, 40)
};

var mapUI = new MapUI();