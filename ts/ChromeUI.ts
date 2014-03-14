// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map/minimap)

class ChromeUI {
    elBottomInfo : HTMLDivElement;
    elBottomActions : HTMLDivElement;

    constructor() {
        this.elBottomInfo = <HTMLDivElement> document.getElementById("bottom-info");
        this.elBottomActions = <HTMLDivElement> document.getElementById("bottom-actions");
    }

    onUnitActivated() {
        var activeUnit;

        activeUnit = game.activeUnit;

        // Update bottom-info
        /*this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" +
            "<table>" +
            "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" +
            "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" +
            "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" +
            "<tr><td>Experience:</td><td>" + activeUnit.xp + "</td></tr>" +
            "</table>";*/

        // Update bottom-actions
    }
}

// Knockout bindings

ko.bindingHandlers.strengthFraction = {
    update: function (element, valueAccessor) {
        var unit = valueAccessor();
        return ko.bindingHandlers.text.update(element, function () {
            if (unit.strength === unit.currentStrength) {
                return unit.currentStrength + ' S';
            }
            return unit.currentStrength + '/' + unit.strength + ' S';
        });
    }
};

ko.bindingHandlers.movementFraction = {
    update: function (element, valueAccessor) {
        var unit = valueAccessor();
        return ko.bindingHandlers.text.update(element, function () {
            if (unit.movement === unit.currentMovement) {
                return unit.currentMovement + ' M';
            }
            return unit.currentMovement + '/' + unit.movement + ' S';
        });
    }
};

ko.bindingHandlers.ownerName = {
    update: function (element, valueAccessor) {
        var owner = valueAccessor();
        return ko.bindingHandlers.text.update(element, function () {
            return game.names[owner];
        });
    }
};

ko.bindingHandlers.terrainDesc = {
    update: function (element, valueAccessor) {
        var tile = ko.unwrap(valueAccessor());
        return ko.bindingHandlers.text.update(element, function () {
            return tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain;
        });
    }
};