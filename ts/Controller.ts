// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

document.addEventListener("keydown", function (e) {
    var activeUnit;

    mapUI.onKeyDown(e.keyCode);

    // Unit stuff
    if (game.activeUnit) {
        activeUnit = game.getUnit(game.activeUnit);
console.log("ACTIVE UNIT");
        // Unit movement
        if (e.keyCode === 97) {
            activeUnit.move("SW");
        } else if (e.keyCode === 98) {
            activeUnit.move("S");
        } else if (e.keyCode === 99) {
            activeUnit.move("SE");
        } else if (e.keyCode === 100) {
            activeUnit.move("W");
        } else if (e.keyCode === 102) {
            activeUnit.move("E");
        } else if (e.keyCode === 103) {
            activeUnit.move("NW");
        } else if (e.keyCode === 104) {
            activeUnit.move("N");
        } else if (e.keyCode === 105) {
            activeUnit.move("NE");
        }
    }
});
document.addEventListener("keyup", function (e) {
    mapUI.onKeyUp(e.keyCode);
});
