// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

document.addEventListener("keydown", function (e) {
    mapUI.onKeyDown(e.keyCode);
});
document.addEventListener("keyup", function (e) {
    mapUI.onKeyUp(e.keyCode);
});
