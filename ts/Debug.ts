/*
Debug - collection of small functions used for debugging
*/

module Debug {
    // Display the map barbs are seeing
    export function viewBarbMap() {
        game.config.USER_ID = 0;
        game.turnID = 0;
        game.map.updateVisibility(); // Only necessary on first turn. Not sure why. Should never be necessary. Probably a bug somewhere.
        mapUI.render();
    }
}