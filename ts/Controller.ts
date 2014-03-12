// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

document.addEventListener("keydown", function (e) {
    var activeUnit;

    mapUI.onKeyDown(e.keyCode);

    // Active unit stuff
    if (game.activeUnit) {
        activeUnit = game.getUnit(game.activeUnit);

        // Unit movement
        if (e.keyCode === 97) { // Numpad 1
            activeUnit.move("SW");
        } else if (e.keyCode === 98) { // Numpad 2
            activeUnit.move("S");
        } else if (e.keyCode === 99) { // Numpad 3
            activeUnit.move("SE");
        } else if (e.keyCode === 100) { // Numpad 4
            activeUnit.move("W");
        } else if (e.keyCode === 102) { // Numpad 6
            activeUnit.move("E");
        } else if (e.keyCode === 103) { // Numpad 7
            activeUnit.move("NW");
        } else if (e.keyCode === 104) { // Numpad 8
            activeUnit.move("N");
        } else if (e.keyCode === 105) { // Numpad 9
            activeUnit.move("NE");
        }

        // Center on active unit
        if (e.keyCode === 67) { // c
            mapUI.goToCoords(activeUnit.coords)
        }
    }
});
document.addEventListener("keyup", function (e) {
    mapUI.onKeyUp(e.keyCode);
});
