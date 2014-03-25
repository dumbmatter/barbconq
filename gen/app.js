// Random - utility functions like Python's random module
var Random;
(function (Random) {
    function choice(x) {
        return x[Math.floor(Math.random() * x.length)];
    }
    Random.choice = choice;
})(Random || (Random = {}));

// Util - general utility functions
var Util;
(function (Util) {
    function round(value, precision) {
        if (typeof precision === "undefined") { precision = 0; }
        return value.toFixed(precision);
    }
    Util.round = round;

    // Bound x between min and max
    function bound(x, min, max) {
        if (x > max) {
            return max;
        }
        if (x < min) {
            return min;
        }
        return x;
    }
    Util.bound = bound;

    /**
    * Clones an object.
    *
    * Taken from http://stackoverflow.com/a/3284324/786644
    */
    function deepCopy(obj) {
        var key, retVal;

        if (typeof obj !== "object" || obj === null) {
            return obj;
        }
        if (obj.constructor === RegExp) {
            return obj;
        }

        retVal = new obj.constructor();
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                retVal[key] = deepCopy(obj[key]);
            }
        }
        return retVal;
    }
    Util.deepCopy = deepCopy;
})(Util || (Util = {}));
// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game
var Controller = (function () {
    function Controller() {
        this.KEYS = {
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            LEFT: 37,
            NUMPAD_1: 97,
            NUMPAD_2: 98,
            NUMPAD_3: 99,
            NUMPAD_4: 100,
            NUMPAD_6: 102,
            NUMPAD_7: 103,
            NUMPAD_8: 104,
            NUMPAD_9: 105,
            C: 67,
            F: 70,
            S: 83,
            ENTER: 13,
            SPACE_BAR: 32
        };
        // Only needed for some keys
        this.keysPressed = {
            38: false,
            39: false,
            40: false,
            37: false
        };
        // Start listening for various kinds of user input
        this.initMapPanning();
        this.initUnitActions();
        this.initUnitIcons();
        this.initHoverTile();
        this.initMapClick();
        this.initGameActions();
    }
    Controller.prototype.initMapPanning = function () {
        document.addEventListener("keydown", function (e) {
            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = true;

                // Panning viewport based on keyboard arrows
                if (this.keysPressed[this.KEYS.UP]) {
                    mapUI.Y = mapUI.Y - 20;
                }
                if (this.keysPressed[this.KEYS.RIGHT]) {
                    mapUI.X = mapUI.X + 20;
                }
                if (this.keysPressed[this.KEYS.DOWN]) {
                    mapUI.Y = mapUI.Y + 20;
                }
                if (this.keysPressed[this.KEYS.LEFT]) {
                    mapUI.X = mapUI.X - 20;
                }

                mapUI.render();
            }
        }.bind(this));
        document.addEventListener("keyup", function (e) {
            if (e.keyCode in this.keysPressed) {
                this.keysPressed[e.keyCode] = false;
            }
        }.bind(this));
    };

    Controller.prototype.initUnitActions = function () {
        document.addEventListener("keydown", function (e) {
            var activeUnit;

            // Active unit stuff
            if (game.activeUnit) {
                activeUnit = game.activeUnit;

                // Unit movement
                if (e.keyCode === this.KEYS.NUMPAD_1) {
                    activeUnit.move("SW");
                } else if (e.keyCode === this.KEYS.NUMPAD_2) {
                    activeUnit.move("S");
                } else if (e.keyCode === this.KEYS.NUMPAD_3) {
                    activeUnit.move("SE");
                } else if (e.keyCode === this.KEYS.NUMPAD_4) {
                    activeUnit.move("W");
                } else if (e.keyCode === this.KEYS.NUMPAD_6) {
                    activeUnit.move("E");
                } else if (e.keyCode === this.KEYS.NUMPAD_7) {
                    activeUnit.move("NW");
                } else if (e.keyCode === this.KEYS.NUMPAD_8) {
                    activeUnit.move("N");
                } else if (e.keyCode === this.KEYS.NUMPAD_9) {
                    activeUnit.move("NE");
                }

                // Center on active unit
                if (e.keyCode === this.KEYS.C) {
                    mapUI.goToCoords(activeUnit.coords);
                }

                // Unit-specific actions, might not always apply
                if (e.keyCode === this.KEYS.F && activeUnit.actions.indexOf("fortify") >= 0) {
                    activeUnit.fortify();
                } else if (e.keyCode === this.KEYS.SPACE_BAR && activeUnit.actions.indexOf("skipTurn") >= 0) {
                    activeUnit.skipTurn();
                }
            }
        }.bind(this));

        // Unit movement with right click
        window.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        });
        mapUI.canvas.addEventListener("mousedown", function (e) {
            var coords, mouseMoveWhileDown, mouseUp;

            if (e.button === 2 && game.activeUnit) {
                e.preventDefault();

                // Find path to clicked tile
                coords = mapUI.pixelsToCoords(e.layerX, e.layerY);
                game.map.pathFinding(game.activeUnit, coords);

                // If click doesn't start on map, ignore it
                if (!game.map.validCoords(coords)) {
                    return;
                }

                // Let mapUI know that we're searching for paths, so it doesn't draw any others (like current paths)
                mapUI.pathFindingSearch = true;

                // Find paths to hovered tile as button remains down
                mouseMoveWhileDown = function (e) {
                    var coordsNew;

                    coordsNew = mapUI.pixelsToCoords(e.layerX, e.layerY);

                    if (!coordsNew) {
                        game.map.pathFinding(); // Delete currently displayed path
                    } else if (coords[0] !== coordsNew[0] || coords[1] !== coordsNew[1]) {
                        coords = coordsNew;
                        game.map.pathFinding(game.activeUnit, coords);
                    }
                };
                mapUI.canvas.addEventListener("mousemove", mouseMoveWhileDown);

                // Move unit to the tile hovered over when the button is released
                mouseUp = function (e) {
                    var coordsNew;

                    mapUI.pathFindingSearch = false;

                    // Only update coordinates if the target is the map (i.e. not minimap, action buttons, etc, which would have different coordinates)
                    if (e.target === mapUI.canvas) {
                        coordsNew = mapUI.pixelsToCoords(e.layerX, e.layerY);
                    }

                    // Don't need to render map here at all (like by calling game.map.pathFinding)
                    // because that'll happen in game.activeUnit.initiatePath no matter what
                    if (coordsNew && (coords[0] !== coordsNew[0] || coords[1] !== coordsNew[1])) {
                        coords = coordsNew;
                    }

                    if (game.activeUnit) {
                        game.activeUnit.initiatePath(coords); // Set unit on path
                    }

                    mapUI.canvas.removeEventListener("mousemove", mouseMoveWhileDown);
                    document.removeEventListener("mouseup", mouseUp);
                };
                document.addEventListener("mouseup", mouseUp);
            }
        });

        // Actions bar at the bottom
        chromeUI.elBottomActions.addEventListener("click", function (e) {
            var el;

            el = e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                game.activeUnit[el.dataset.action](el.dataset.arg);
                chromeUI.onHoverAction(); // Reset hover display, since stuff might have changed
            }
        });
        chromeUI.elBottomActions.addEventListener("mouseover", function (e) {
            var el;

            el = e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                chromeUI.onHoverAction(el.dataset.action, el.dataset.arg);
            }
        });
        chromeUI.elBottomActions.addEventListener("mouseout", function (e) {
            var el;

            el = e.target;
            if (el && el.dataset.action) {
                e.preventDefault();

                chromeUI.onHoverAction();
            }
        });
    };

    Controller.prototype.initHoverTile = function () {
        this.hoveredTile = [-1, -1]; // Dummy value for out of map

        mapUI.canvas.addEventListener("mousemove", function (e) {
            var coords;

            coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

            if (coords) {
                // Over a tile
                if (coords[0] !== this.hoveredTile[0] || coords[1] !== this.hoveredTile[1]) {
                    // Only update if new tile
                    this.hoveredTile = coords;
                    chromeUI.onHoverTile(game.getTile(this.hoveredTile));
                }
            } else {
                // Not over tile, over some other part of the canvas
                this.hoveredTile = [-1, -1];
                chromeUI.onHoverTile();
            }
        }.bind(this));
        mapUI.canvas.addEventListener("mouseout", function (e) {
            this.hoveredTile = [-1, -1];
            chromeUI.onHoverTile();
        }.bind(this));
    };

    // if one of your units is on the clicked tile, activate it and DO NOT CENTER THE MAP
    // if one of your units is not on the clicked tile, center the map
    Controller.prototype.initMapClick = function () {
        mapUI.canvas.addEventListener("click", function (e) {
            var i, coords, currentMetric, maxMetric, unit, units;

            if (e.button === 0) {
                e.preventDefault();

                coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

                if (game.map.validCoords(coords)) {
                    units = game.getTile(coords).units;

                    // Find the strongest unit with moves left
                    maxMetric = -Infinity;
                    for (i = 0; i < units.length; i++) {
                        // Sort by criteria: 1. if active already; 2. if currentMovement > 0; 3. currentStrength
                        currentMetric = units[i].currentStrength;
                        if (units[i].currentMovement > 0) {
                            currentMetric += 100;
                        }
                        if (units[i].active || (units[i].group && units[i].group.active)) {
                            currentMetric += 1000;
                        }

                        if (currentMetric > maxMetric && units[i].owner === config.PLAYER_ID) {
                            unit = units[i];
                            maxMetric = currentMetric;
                        }
                    }

                    if (unit) {
                        if (e.altKey) {
                            // Create group of all units on tile with moves and activate it
                            Units.addUnitsToNewGroup(config.PLAYER_ID, units);
                        } else if (e.ctrlKey) {
                            // Create group of all units on tile with moves and same type as top unit and activate it
                            Units.addUnitsWithTypeToNewGroup(config.PLAYER_ID, units, unit.type);
                        } else {
                            // Normal left click: select top unit or group
                            if (unit.group) {
                                unit.group.activate(false);
                            } else {
                                unit.activate(false);
                            }
                        }
                    } else {
                        // None of the user's units are on this tile, so pan to it
                        mapUI.goToCoords(coords);
                    }
                }
            }
        });

        mapUI.miniCanvas.addEventListener("mousedown", function (e) {
            var coords, miniMapPan, miniMapPanStop;

            if (e.button === 0) {
                e.preventDefault();

                coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

                if (game.map.validCoords(coords)) {
                    mapUI.goToCoords(coords);
                }

                // Pan as click is held and mouse is moved
                miniMapPan = function (e) {
                    var coords;

                    coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

                    if (game.map.validCoords(coords)) {
                        mapUI.goToCoords(coords);
                    }
                };
                mapUI.miniCanvas.addEventListener("mousemove", miniMapPan);

                // Stop panning when mouse click ends
                miniMapPanStop = function (e) {
                    mapUI.miniCanvas.removeEventListener("mousemove", miniMapPan);
                    document.removeEventListener("mouseup", miniMapPanStop);
                };
                document.addEventListener("mouseup", miniMapPanStop);
            }
        });
    };

    Controller.prototype.initGameActions = function () {
        document.addEventListener("keydown", function (e) {
            if (e.keyCode === this.KEYS.ENTER) {
                game.newTurn();
            }
        }.bind(this));
    };

    Controller.prototype.initUnitIcons = function () {
        // Unit icons at the bottom
        chromeUI.elBottomUnits.addEventListener("click", function (e) {
            var activeUnit, activeGroup, clickedId, clickedOwner, clickedSid, el, i, newGroup, newUnits, units, type;

            el = e.target;
            el = el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();

                // Metadata from clicked icon
                clickedId = parseInt(el.dataset.id, 10);
                clickedOwner = parseInt(el.dataset.owner, 10);
                clickedSid = el.dataset.gid !== undefined ? parseInt(el.dataset.gid, 10) : null;

                // Only continue if clicked unit belongs to player
                if (clickedOwner !== config.PLAYER_ID) {
                    return;
                }

                // Sanity check, could happen due to fast clicking
                if (!game.activeUnit) {
                    return;
                }

                // List of all units on the tile
                units = game.getTile(game.activeUnit.coords).units;

                // Handle all the different key modifiers
                if (e.altKey) {
                    Units.addUnitsToNewGroup(clickedOwner, units);
                } else if (e.ctrlKey && e.shiftKey) {
                    type = game.units[clickedOwner][clickedId].type;

                    if (game.activeUnit instanceof Units.Unit) {
                        // Individual unit is active
                        // Create a group with the active unit and all units of the clicked type with currentMovement > 0
                        activeUnit = game.activeUnit; // So TypeScript knows it's not a group

                        // Find all units of type
                        newUnits = [activeUnit];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && unit.id !== activeUnit.id) {
                                newUnits.push(unit);

                                // Remove from current group, if it exists
                                if (unit.group) {
                                    unit.group.remove(unit.id, false);
                                }
                            }
                        });

                        // New group with units of type and activeUnit
                        newGroup = new Units.Group(clickedOwner, newUnits);
                        newGroup.activate(false);
                    } else if (game.activeUnit instanceof Units.Group) {
                        // Unit group is active
                        // Add all units of the clicked type with currentMovement > 0 to that group
                        activeGroup = game.activeUnit; // So TypeScript knows it's not an individual unit

                        // Find units of type that aren't already in group
                        newUnits = [];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && (!unit.group || unit.group.id !== activeGroup.id)) {
                                newUnits.push(unit);

                                // Remove from current group, if it exists
                                if (unit.group) {
                                    unit.group.remove(unit.id, false);
                                }
                            }
                        });

                        if (newUnits.length > 0) {
                            activeGroup.add(newUnits);

                            // Redraw everything, since there is no Unit.activate call here to do that otherwise
                            chromeUI.onUnitActivated();
                            mapUI.render();
                        }
                    } else {
                        // No unit active (like if they all got separateed above)
                        newGroup = new Units.Group(clickedOwner, newUnits);
                        newGroup.activate(false);
                    }
                } else if (e.ctrlKey) {
                    Units.addUnitsWithTypeToNewGroup(clickedOwner, units, game.units[clickedOwner][clickedId].type);
                } else if (e.shiftKey) {
                    if (game.activeUnit instanceof Units.Unit) {
                        // Individual unit is active
                        if (game.activeUnit.id !== clickedId) {
                            // If clicked unit is not the active unit, add it to a new group with clicked unit
                            newGroup = new Units.Group(clickedOwner, [game.activeUnit, game.units[clickedOwner][clickedId]]);
                            newGroup.activate(false);
                        }
                    } else if (game.activeUnit instanceof Units.Group) {
                        activeGroup = game.activeUnit; // So TypeScript knows it's not an individual unit

                        // Unit group is active
                        if (activeGroup === game.units[clickedOwner][clickedId].group) {
                            // Clicked unit is in the active group, remove it from that group
                            activeGroup.remove(clickedId);
                        } else {
                            // Clicked unit is not in the active group, add it to that group
                            activeGroup.add([game.units[clickedOwner][clickedId]]);
                        }

                        // Redraw everything, since there is no Unit.activate call here to do that otherwise
                        chromeUI.onUnitActivated();
                        mapUI.render();
                    }
                } else {
                    if (clickedSid !== null) {
                        // Clicked unit is in a group
                        if (game.activeUnit.id === clickedSid) {
                            // Clicked unit is member of active group, so separate it and activate clicked unit
                            game.groups[clickedOwner][clickedSid].separate(false);
                            game.units[clickedOwner][clickedId].activate(false);
                        } else {
                            // Clicked unit is in an inactive group, so activate the group
                            game.groups[clickedOwner][clickedSid].activate(false);
                        }
                    } else {
                        // Clicked unit is not in group, so just activate it
                        game.units[clickedOwner][clickedId].activate(false);
                    }
                }
            }
        });
        chromeUI.elBottomUnits.addEventListener("mouseover", function (e) {
            var el;

            el = e.target;
            el = el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon(parseInt(el.dataset.owner, 10), parseInt(el.dataset.id, 10));
            }
        });
        chromeUI.elBottomUnits.addEventListener("mouseout", function (e) {
            var el;

            el = e.target;
            el = el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon();
            }
        });
    };
    return Controller;
})();
// ChromeUI - Everything related to the display and interactivity of the on-screen chrome (everything not on the map/minimap)
var ChromeUI = (function () {
    function ChromeUI() {
        this.elHoverBox = document.getElementById("hover-box");
        this.elTurn = document.getElementById("turn");
        this.elBottomInfo = document.getElementById("bottom-info");
        this.elBottomActions = document.getElementById("bottom-actions");
        this.elBottomText = document.getElementById("bottom-text");
        this.elBottomUnits = document.getElementById("bottom-units");
        this.elEvents = document.getElementById("events");
    }
    ChromeUI.prototype.strengthFraction = function (unit) {
        if (unit.strength === unit.currentStrength) {
            return unit.currentStrength + ' S';
        } else {
            return Util.round(unit.currentStrength, 1) + '/' + unit.strength + ' S';
        }
    };

    ChromeUI.prototype.movementFraction = function (unit) {
        if (unit.movement === unit.currentMovement) {
            return unit.currentMovement + ' M';
        } else {
            return Util.round(unit.currentMovement, 1) + '/' + unit.movement + ' M';
        }
    };

    // Update Chrome that might have changed in render, like unit stuff
    ChromeUI.prototype.onMapRender = function () {
        this.updateActiveUnit();
    };

    ChromeUI.prototype.onUnitActivated = function () {
        this.updateActiveUnit();
    };

    ChromeUI.prototype.onHoverTile = function (tile) {
        if (typeof tile === "undefined") { tile = null; }
        var content, features, i;

        if (tile && tile.terrain !== "unseen") {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                content += this.hoverBoxUnitSummary(tile.units[i], i === 0);
            }

            // Capitalize feature names
            features = [];
            tile.features.forEach(function (feature) {
                features.push(feature[0].toUpperCase() + feature.slice(1));
            });

            // Show tile terrain and features
            content += '<p>' + features.join("/") + (features.length ? "/" : "") + tile.terrain[0].toUpperCase() + tile.terrain.slice(1) + '</p>';

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    };

    ChromeUI.prototype.onHoverUnitIcon = function (owner, id) {
        if (typeof owner === "undefined") { owner = null; }
        if (typeof id === "undefined") { id = null; }
        var content;

        if (owner !== null && id !== null) {
            content = "";
            content += this.hoverBoxUnitSummary(game.units[owner][id]);
            content += '<p>(&lt;CTRL+CLICK&gt; to select all ' + game.units[owner][id].type + ' units)</p>';
            content += '<p>(&lt;ALT+CLICK&gt; to select all units)</p>';

            this.elHoverBox.innerHTML = content;
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    };

    ChromeUI.prototype.onHoverMoveEnemy = function (battle) {
        var appliedBonuses, content, name;

        content = "<p>Combat Odds: " + Util.round(battle.oddsAttackerWinsFight() * 100, 1) + "%</p>";
        content += '<p><span class="text-good">' + Util.round(battle.A, 2) + '</span> vs. <span class="text-bad">' + Util.round(battle.D, 2) + '</span></p>';

        // Combat bonuses
        appliedBonuses = battle.getAppliedBonuses();
        content += '<ul class="text-good">';
        for (name in appliedBonuses[0]) {
            content += '<li>' + this.bonusText(name, appliedBonuses[0][name]) + '</li>';
        }
        content += '</ul>';
        content += '<ul class="text-bad">';
        for (name in appliedBonuses[1]) {
            content += '<li>' + this.bonusText(name, appliedBonuses[1][name]) + '</li>';
        }
        content += '</ul>';

        this.elHoverBox.innerHTML = content;
        this.elHoverBox.style.display = "block";
    };

    ChromeUI.prototype.hoverBoxUnitSummary = function (unit, showCombatBonuses) {
        if (typeof showCombatBonuses === "undefined") { showCombatBonuses = true; }
        var bonuses, content, name;

        content = "";
        content += '<p><span class="unit-name">' + unit.type + '</span>, ';
        content += this.strengthFraction(unit) + ', ';
        content += this.movementFraction(unit) + ', ';
        content += 'XP: (' + unit.xp + '/' + unit.xpForNextLevel() + '), ';
        content += game.names[unit.owner];
        content += '</p>';

        // Combat bonuses
        if (showCombatBonuses) {
            bonuses = unit.getBonuses();
            content += '<ul>';
            for (name in bonuses) {
                content += '<li>' + this.bonusText(name, bonuses[name]) + '</li>';
            }
            content += '</ul>';
        }

        return content;
    };

    ChromeUI.prototype.bonusText = function (name, amount) {
        if (name === "cityDefense") {
            return "+" + amount + "% City Defense";
        } else if (name === "hillsDefense") {
            return "+" + amount + "% Hills Defense";
        } else if (name === "melee") {
            return "+" + amount + "% vs. Melee Units";
        } else if (name === "mounted") {
            return "+" + amount + "% vs. Mounted Units";
        } else if (name === "terrain") {
            return "+" + amount + "% Tile Defense";
        } else {
            throw new Error('Unknown bonus type "' + name + '".');
        }
    };

    ChromeUI.prototype.onHoverAction = function (action, arg) {
        if (typeof action === "undefined") { action = null; }
        if (typeof arg === "undefined") { arg = null; }
        var name, promotion;

        if (action === "fortify") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Fortify</span> <span class="action-shortcut">&lt;F&gt;</span></p><p>The unit prepares itself to defend. A unit gets a 5% defensive bonus for each turn it is fortified (maximum 25%). Units also heal while fortified.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "skipTurn") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Skip Turn</span> <span class="action-shortcut">&lt;Space Bar&gt;</span></p><p>The unit does nothing this turn, but will ask for orders again next turn.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "separate") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Separate</span></p><p>Separates the group so you can move each unit individually.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "promote") {
            promotion = Units.promotions[arg];
            this.elHoverBox.innerHTML = '<p><span class="action-name">Promote Unit (' + promotion.name + ')</span></p><ul>';
            for (name in promotion.bonuses) {
                this.elHoverBox.innerHTML += '<li>' + this.bonusText(name, promotion.bonuses[name]) + '</li>';
            }
            this.elHoverBox.innerHTML += '</ul>';
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    };

    // Can be called multiple times during a turn, so needs to be idempotent
    ChromeUI.prototype.onNewTurn = function () {
        this.elTurn.innerHTML = String(game.turn);
        this.updateBottomText();
    };

    ChromeUI.prototype.onMovesDone = function () {
        this.updateBottomText("Press &lt;ENTER&gt; to begin the next turn...");
    };

    ChromeUI.prototype.onAIMoving = function () {
        this.updateBottomText("Waiting for barbarians to move...");
    };

    // Can be called even if no unit is active, in which case it'll remove all displayed unit info
    ChromeUI.prototype.updateActiveUnit = function () {
        var activeUnit, addCommas, content, counts, i, units, type;

        activeUnit = game.activeUnit; // Really should have separate variables for unit and group, like in unit icon click handling

        // Reset
        this.elBottomActions.innerHTML = "";
        this.elBottomInfo.innerHTML = "";
        this.elBottomUnits.innerHTML = "";

        if (game.activeUnit && game.activeUnit.owner === config.PLAYER_ID) {
            // Update bottom-info
            if (activeUnit instanceof Units.Unit) {
                this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" + "<table>" + "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" + "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" + "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" + "<tr><td>Experience:</td><td>" + activeUnit.xp + "/" + activeUnit.xpForNextLevel() + "</td></tr>" + "</table>";
            } else if (activeUnit instanceof Units.Group) {
                content = "<h1>Unit Group (" + activeUnit.units.length + ")</h1>" + "<table>" + "<tr><td>Movement: " + this.movementFraction(activeUnit) + "</td></tr>" + '<tr><td><div class="group-types">Units: ';

                // List individual unit types in group
                counts = {};
                for (i = 0; i < activeUnit.units.length; i++) {
                    if (activeUnit.units[i].type in counts) {
                        counts[activeUnit.units[i].type] += 1;
                    } else {
                        counts[activeUnit.units[i].type] = 1;
                    }
                }
                addCommas = false;
                for (type in counts) {
                    if (!addCommas) {
                        addCommas = true;
                    } else {
                        content += ", ";
                    }

                    if (counts[type] > 1) {
                        content += type + " (" + counts[type] + ")";
                    } else {
                        content += type;
                    }
                }
                content += "</div></td></tr></table>";

                this.elBottomInfo.innerHTML = content;
            }

            // Update bottom-actions
            this.updateActiveUnitActions();

            // Update bottom-units
            units = game.getTile(game.activeUnit.coords).units;
            for (i = 0; i < units.length; i++) {
                this.elBottomUnits.appendChild(this.unitIcon(units[i]));
            }
        }
    };

    // this.elBottomActions.innerHTML should be emptied before calling this
    ChromeUI.prototype.updateActiveUnitActions = function () {
        var actionName, availablePromotions, i;

        for (i = 0; i < game.activeUnit.actions.length; i++) {
            // Convert camel case to title case
            actionName = game.activeUnit.actions[i].replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2"); // http://stackoverflow.com/a/7225474
            actionName = actionName.charAt(0).toUpperCase() + actionName.slice(1); // Fix first character

            this.elBottomActions.innerHTML += '<button class="action" data-action="' + game.activeUnit.actions[i] + '">' + actionName + '</button>';
        }

        // Second, the promotions
        availablePromotions = game.activeUnit.availablePromotions();
        for (i = 0; i < availablePromotions.length; i++) {
            this.elBottomActions.innerHTML += '<button class="action promote" data-action="promote" data-arg="' + availablePromotions[i] + '">' + Units.promotions[availablePromotions[i]].name + '</button>';
        }
        // Third, the automated tasks
    };

    ChromeUI.prototype.unitIcon = function (unit) {
        var healthPct, healthBar, icon, iconWrapper, movementIndicator;

        iconWrapper = document.createElement("div");
        iconWrapper.classList.add("unit-icon-wrapper");
        iconWrapper.dataset.owner = unit.owner;
        iconWrapper.dataset.id = unit.id;
        if (unit.group) {
            iconWrapper.dataset.gid = unit.group.id;
        }

        // Unit icon
        icon = document.createElement("div");
        icon.classList.add("unit-icon");
        icon.innerHTML = unit.type.slice(0, 2);
        if (unit.active || (unit.group && unit.group.active)) {
            icon.classList.add("active");
        }

        // Health bar
        healthBar = document.createElement("div");
        healthBar.classList.add("health-bar");
        healthPct = Math.round(unit.currentStrength / unit.strength * 100); // 0 to 100
        healthBar.style.width = healthPct + "%";
        if (healthPct >= 67) {
            healthBar.classList.add("health-good");
        } else if (healthPct >= 33) {
            healthBar.classList.add("health-medium");
        } else {
            healthBar.classList.add("health-bad");
        }

        // Movement indicator
        movementIndicator = document.createElement("div");
        movementIndicator.classList.add("movement-indicator");
        if (unit.skippedTurn) {
            movementIndicator.classList.add("movement-skipped");
        } else if (unit.currentMovement === unit.movement) {
            movementIndicator.classList.add("movement-all");
        } else if (unit.currentMovement > 0) {
            movementIndicator.classList.add("movement-some");
        } else if (unit.currentMovement === 0) {
            movementIndicator.classList.add("movement-none");
        }

        iconWrapper.appendChild(icon);
        iconWrapper.appendChild(healthBar);
        iconWrapper.appendChild(movementIndicator);

        return iconWrapper;
    };

    ChromeUI.prototype.updateBottomText = function (text) {
        if (typeof text === "undefined") { text = null; }
        if (!text) {
            this.elBottomText.style.display = "none";
        } else {
            this.elBottomText.innerHTML = text;
            this.elBottomText.style.display = "block";
        }
    };

    ChromeUI.prototype.showModal = function (id) {
        var closeModal, closeModalEsc, modal, modalBackground, modalCloseX, preventCloseModal, resizeModal;

        // Modal content
        modal = document.getElementById(id);
        modal.classList.add("modal-active");
        modal.classList.remove("modal-inactive");

        // Make visible
        modalBackground = document.getElementById("modal-background");
        modalBackground.classList.add("modal-active");
        modalBackground.classList.remove("modal-inactive");

        // Close icon - position relative to scrollbar
        modalCloseX = document.getElementById("modal-close");

        // Set maximum height dynamically
        resizeModal = function () {
            modal.style.maxHeight = (window.innerHeight - 40) + "px";
            modalCloseX.style.right = (modal.offsetWidth - modal.clientWidth - 2) + "px";
        };
        resizeModal();
        window.addEventListener("resize", resizeModal);

        // Close modal with a click outside of it, or escape key
        closeModal = function (e) {
            e.stopPropagation();

            modal.classList.remove("modal-active");
            modal.classList.add("modal-inactive");
            modalBackground.classList.remove("modal-active");
            modalBackground.classList.add("modal-inactive");

            window.removeEventListener("resize", resizeModal);
            modalBackground.removeEventListener("click", closeModal);
            modal.removeEventListener("click", preventCloseModal);
            document.removeEventListener("keydown", closeModalEsc);
        };
        closeModalEsc = function (e) {
            if (e.keyCode === 27) {
                closeModal(e);
            }
        };
        preventCloseModal = function (e) {
            e.stopPropagation();
        };
        modal.addEventListener("click", preventCloseModal);
        modalBackground.addEventListener("click", closeModal);
        document.addEventListener("keydown", closeModalEsc);
    };

    ChromeUI.prototype.eventLog = function (msg, goodOrBad) {
        if (typeof goodOrBad === "undefined") { goodOrBad = null; }
        var event;

        event = document.createElement("li");
        event.innerHTML = msg;
        if (goodOrBad === "good") {
            event.classList.add("text-good");
        } else if (goodOrBad === "bad") {
            event.classList.add("text-bad");
        }
        this.elEvents.appendChild(event);

        window.setTimeout(function () {
            this.elEvents.removeChild(event);
        }.bind(this), 3000);
    };
    return ChromeUI;
})();
// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)
var MapUI = (function () {
    function MapUI() {
        // Constants
        this.TILE_SIZE = 70;
        this.pathFindingSearch = false;
        // Colors!
        this.terrainColors = {
            unseen: "#000",
            peak: "#000",
            snow: "#fff",
            desert: "#f1eabd",
            tundra: "#ddd",
            sea: "#00f",
            coast: "#7c7cff",
            grassland: "#080",
            plains: "#fd0",
            shadow: "rgba(0, 0, 0, 0.5)"
        };
        this.terrainFontColors = {
            peak: "#fff",
            snow: "#000",
            desert: "#000",
            tundra: "#000",
            sea: "#fff",
            coast: "#000",
            grassland: "#fff",
            plains: "#000"
        };

        this.initMapDisplay();
    }
    MapUI.prototype.initMapDisplay = function () {
        this.X = game.map.cols * this.TILE_SIZE / 2;
        this.Y = game.map.rows * this.TILE_SIZE / 2;

        this.canvas = document.getElementById("map");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");

        // Minimap
        this.miniCanvas = document.getElementById("minimap");
        this.miniContext = this.miniCanvas.getContext("2d");

        // See whether it's height or width limited based on the aspect ratio
        if (game.map.cols / game.map.rows > this.miniCanvas.width / this.miniCanvas.height) {
            // Bound based on map width
            this.miniTileSize = this.miniCanvas.width / game.map.cols;
        } else {
            // Bound based on map height
            this.miniTileSize = this.miniCanvas.height / game.map.rows;
        }

        // Handle resize
        window.addEventListener("resize", function () {
            this.setCanvasSize();
            this.render();
        }.bind(this));

        this.setCanvasSize();
    };

    MapUI.prototype.setCanvasSize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.VIEW_WIDTH = this.canvas.width;
        this.VIEW_HEIGHT = this.canvas.height;
        this.VIEW_TILE_WIDTH = Math.floor(this.VIEW_WIDTH / this.TILE_SIZE) + 2;
        this.VIEW_TILE_HEIGHT = Math.floor(this.VIEW_HEIGHT / this.TILE_SIZE) + 2;
    };

    MapUI.prototype.drawPath = function (path, renderMapFirst) {
        if (typeof path === "undefined") { path = []; }
        if (typeof renderMapFirst === "undefined") { renderMapFirst = true; }
        window.requestAnimationFrame(function () {
            var battle, i, pixels, units;

            if (renderMapFirst) {
                this.render(true);
            }

            if (path && path.length > 1) {
                // See if the path ends at an enemy unit. If so, display combat info.
                units = Combat.findBestDefender(game.activeUnit, path[path.length - 1], true);
                if (units.defender) {
                    battle = new Combat.Battle(units.attacker, units.defender);
                    chromeUI.onHoverMoveEnemy(battle);
                }

                // Start at origin
                this.context.beginPath();
                pixels = this.coordsToPixels(path[0][0], path[0][1]);
                this.context.moveTo(pixels[0], pixels[1]);

                for (i = 1; i < path.length; i++) {
                    pixels = this.coordsToPixels(path[i][0], path[i][1]);
                    this.context.lineTo(pixels[0], pixels[1]);
                }

                // Draw path
                if (units.defender) {
                    // Path ends in enemy, so show red
                    this.context.strokeStyle = "#f00";
                } else {
                    this.context.strokeStyle = "#fff";
                }
                this.context.lineWidth = 2;
                this.context.setLineDash([5]);
                this.context.stroke();
                this.context.setLineDash([]); // Reset dash state

                // Draw move numbers on top of path
                (function () {
                    var currentMovement, drawNumber, i, movement, movementCost, numTurns;

                    // Initialize with current values
                    movement = game.activeUnit.movement;
                    currentMovement = game.activeUnit.currentMovement;

                    // If no movement left now, it takes an extra turn to get anywhere
                    if (currentMovement === 0) {
                        numTurns = 1;
                        currentMovement = movement;
                    } else {
                        numTurns = 0;
                    }

                    // Universal text options
                    this.context.textAlign = "center";
                    this.context.textBaseline = "middle";
                    this.context.font = "30px sans-serif";
                    drawNumber = function (i) {
                        var pixels;

                        pixels = this.coordsToPixels(path[i][0], path[i][1]);

                        if (units.defender && i === path.length - 1) {
                            this.context.fillStyle = "#f00";
                        } else {
                            this.context.fillStyle = "#ccc";
                        }
                        this.context.fillText(numTurns, pixels[0], pixels[1]);
                    }.bind(this);

                    for (i = 1; i < path.length; i++) {
                        movementCost = game.map.tileMovementCost(path[i - 1], path[i]);
                        currentMovement -= movementCost;
                        if (currentMovement <= 0) {
                            numTurns += 1;
                            currentMovement = movement;
                            drawNumber(i);
                        }
                    }

                    // Add turns on the last tile if there is still remaining movement
                    if (currentMovement < movement) {
                        numTurns += 1;
                        drawNumber(i - 1);
                    }
                }.bind(this)());
            }
        }.bind(this));
    };

    // If already requested an animation frame, set animationFrameAlreadyRequested to true to avoid race conditions.
    MapUI.prototype.render = function (animationFrameAlreadyRequested) {
        if (typeof animationFrameAlreadyRequested === "undefined") { animationFrameAlreadyRequested = false; }
        var bottom, draw, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile;

        // Check the bounds for the viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Adjust position if hitting the boundary
        if (top < -this.VIEW_HEIGHT / 2) {
            this.Y = 0;
        }
        if (right > game.map.cols * this.TILE_SIZE + this.VIEW_WIDTH / 2) {
            this.X = game.map.cols * this.TILE_SIZE;
        }
        if (bottom > game.map.rows * this.TILE_SIZE + this.VIEW_HEIGHT / 2) {
            this.Y = game.map.rows * this.TILE_SIZE;
        }
        if (left < -this.VIEW_WIDTH / 2) {
            this.X = 0;
        }

        // Recalculate bounds after adjustments
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Find top left coordinates
        leftTile = Math.floor(left / this.TILE_SIZE);
        topTile = Math.floor(top / this.TILE_SIZE);

        // Offsets for showing partial tiles
        tileOffsetX = left % this.TILE_SIZE;
        tileOffsetY = top % this.TILE_SIZE;

        // Fix top and left limits (don't really understand this)
        if (tileOffsetY < 0) {
            tileOffsetY += this.TILE_SIZE;
        }
        if (tileOffsetX < 0) {
            tileOffsetX += this.TILE_SIZE;
        }

        // Clear canvas and redraw everything in view
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "#000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Function to loop over all tiles, call cb on each tile in the viewport
        var drawViewport = function (cb) {
            var i, j, x, y;

            for (x = 0; x < this.VIEW_TILE_WIDTH; x++) {
                for (y = 0; y < this.VIEW_TILE_HEIGHT; y++) {
                    // Coordinates in the map
                    i = topTile + y;
                    j = leftTile + x;

                    // Only draw tiles that are on the map
                    if (i >= 0 && j >= 0 && i < game.map.rows && j < game.map.cols) {
                        cb(i, j, x, y);
                    }
                }
            }
        }.bind(this);

        draw = function () {
            var x, y;

            // First pass: draw tiles and units
            drawViewport(function (i, j, x, y) {
                var cityImage, k, maxStrength, tile, unit, unitImage, units;

                tile = game.getTile([i, j]);

                // Background
                this.context.fillStyle = this.terrainColors[tile.terrain];
                this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

                if (tile.features.indexOf("forest") >= 0) {
                    this.context.drawImage(assets.forest, x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY);
                }
                if (tile.features.indexOf("hills") >= 0) {
                    this.context.globalAlpha = 0.5;
                    this.context.drawImage(assets.hills, x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY);
                    this.context.globalAlpha = 1.0;
                }

                // Grid lines
                this.context.strokeStyle = "#000";
                this.context.lineWidth = 1;
                this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

                // Shadow for non-visible tiles?
                if (!game.map.visibility[i][j] && tile.terrain !== "unseen") {
                    this.context.fillStyle = this.terrainColors.shadow;
                    this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);
                }

                // Show city on tile
                if (tile.city) {
                    if (tile.city.owner === config.PLAYER_ID) {
                        cityImage = assets.cityCaptured;
                    } else {
                        cityImage = assets.city;
                    }
                    this.context.drawImage(cityImage, x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY);
                }

                // Show units on tile
                units = tile.units;
                if (units.length > 0) {
                    // Pick which unit to show on top of tile
                    if (units.length === 1) {
                        // Only one to show...
                        unit = units[0];
                    } else if (game.activeUnit && game.activeUnit.coords[0] === i && game.activeUnit.coords[1] === j) {
                        // Active unit/group on this tile
                        if (game.activeUnit instanceof Units.Group) {
                            // Group is active, show highest currentStrength from the group
                            maxStrength = -Infinity;
                            for (k = 0; k < units.length; k++) {
                                if (units[k].currentStrength > maxStrength && (units[k].group && units[k].group.id === game.activeUnit.id)) {
                                    unit = units[k];
                                    maxStrength = units[k].currentStrength;
                                }
                            }
                        } else {
                            // Individual is active, show it
                            unit = game.activeUnit;
                        }
                    } else {
                        // Nothing active here, show highest currentStrength
                        maxStrength = -Infinity;
                        for (k = 0; k < units.length; k++) {
                            if (units[k].currentStrength > maxStrength) {
                                unit = units[k];
                                maxStrength = units[k].currentStrength;
                            }
                        }
                    }

                    if (unit.owner === config.BARB_ID) {
                        unitImage = assets["black" + unit.type];
                    } else {
                        unitImage = assets["white" + unit.type];
                    }
                    this.context.drawImage(unitImage, x * this.TILE_SIZE - tileOffsetX + 10, y * this.TILE_SIZE - tileOffsetY + 10);
                }
            }.bind(this));

            // Highlight active unit
            if (game.activeUnit && game.activeUnit.owner === config.PLAYER_ID) {
                x = game.activeUnit.coords[1] - leftTile;
                y = game.activeUnit.coords[0] - topTile;

                this.context.strokeStyle = "#f00";
                this.context.lineWidth = 4;
                this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX - 2, y * this.TILE_SIZE - tileOffsetY - 2, this.TILE_SIZE + 2, this.TILE_SIZE + 2);

                // Draw path if unit is moving to a target
                if (game.activeUnit.targetCoords) {
                    // If there is a pathfinding search occurring (like from the user holding down the right click button), don't draw active path
                    if (!this.pathFindingSearch) {
                        game.map.pathFinding(game.activeUnit, game.activeUnit.targetCoords, function (path) {
                            // This is to prevent an infinite loop of render() being called
                            this.drawPath(path, false);
                        }.bind(this));
                    }
                }
            }

            // Render minimap at the end
            this.renderMiniMap();

            // Other UI rendering
            chromeUI.onMapRender();
        }.bind(this);

        if (animationFrameAlreadyRequested) {
            draw();
        } else {
            window.requestAnimationFrame(draw);
        }
    };

    MapUI.prototype.renderMiniMap = function () {
        var bottom, bottomTile, i, j, k, left, leftTile, right, rightTile, top, tile, topTile, unit;

        // Clear canvas and redraw everything
        this.miniContext.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
        this.miniContext.fillStyle = "#000";
        this.miniContext.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

        for (i = 0; i < game.map.rows; i++) {
            for (j = 0; j < game.map.cols; j++) {
                // Background
                tile = game.getTile([i, j]);
                this.miniContext.fillStyle = this.terrainColors[tile.terrain];
                this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);

                // Shadow for non-visible tiles?
                if (!game.map.visibility[i][j] && tile.terrain !== "unseen") {
                    this.miniContext.fillStyle = this.terrainColors.shadow;
                    this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
                }
            }
        }

        for (i = 0; i < game.map.rows; i++) {
            for (j = 0; j < game.map.cols; j++) {
                // Highlight active tile
                tile = game.getTile([i, j]);
                if (tile.units.length > 0) {
                    for (k = 0; k < tile.units.length; k++) {
                        unit = tile.units[k];

                        if (unit.active) {
                            this.miniContext.fillStyle = "#f00";
                            this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
                            break;
                        }
                    }
                }
            }
        }

        // Show box for viewport
        top = this.Y - this.VIEW_HEIGHT / 2;
        right = this.X + this.VIEW_WIDTH / 2;
        bottom = this.Y + this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;
        topTile = top / this.TILE_SIZE; // Don't need to floor these since they're just being used for drawing
        rightTile = right / this.TILE_SIZE;
        bottomTile = bottom / this.TILE_SIZE;
        leftTile = left / this.TILE_SIZE;
        this.miniContext.strokeStyle = "#f00";
        this.miniContext.lineWidth = 2;
        this.miniContext.strokeRect(leftTile * this.miniTileSize, topTile * this.miniTileSize, (rightTile - leftTile) * this.miniTileSize, (bottomTile - topTile) * this.miniTileSize);
    };

    MapUI.prototype.goToCoords = function (coords) {
        // ith row, jth column, 0 indexed
        this.X = coords[1] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.Y = coords[0] * this.TILE_SIZE + this.TILE_SIZE / 2;
        this.render();
    };

    // Input: pixel coordinates from canvas events like "click" and "mousemove". Output: tile coordinates (row, col) 0 indexed
    MapUI.prototype.pixelsToCoords = function (x, y) {
        var coords, left, top;

        // Top left coordinate in pixels, relative to the whole map
        top = this.Y - this.VIEW_HEIGHT / 2;
        left = this.X - this.VIEW_WIDTH / 2;

        // Coordinates in tiles
        coords = [
            Math.floor((top + y) / this.TILE_SIZE),
            Math.floor((left + x) / this.TILE_SIZE)
        ];

        // Only return coordinates in map
        if (game.map.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    };

    // Input: tile coords (row, col) 0 indexed. Output: (x, y) pixels at center of tile in current viewport (can go off screen)
    MapUI.prototype.coordsToPixels = function (i, j) {
        var left, pixels, top;

        if (game.map.validCoords([i, j])) {
            // Top left coordinate in pixels, relative to the whole map
            top = this.Y - this.VIEW_HEIGHT / 2;
            left = this.X - this.VIEW_WIDTH / 2;

            // Pixels at center of tile
            pixels = [
                j * this.TILE_SIZE + this.TILE_SIZE / 2 - left,
                i * this.TILE_SIZE + this.TILE_SIZE / 2 - top
            ];

            return pixels;
        } else {
            return null;
        }
    };

    // Same as above, but for minimap
    MapUI.prototype.miniPixelsToCoords = function (x, y) {
        var coords, left, top;

        // Coordinates in tiles
        coords = [
            Math.floor(y / this.miniTileSize),
            Math.floor(x / this.miniTileSize)
        ];

        // Only return coordinates in map
        if (game.map.validCoords(coords)) {
            return coords;
        } else {
            return null;
        }
    };
    return MapUI;
})();
// MapMaker - map generation module
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MapMaker;
(function (MapMaker) {
    var Map = (function () {
        function Map() {
        }
        // Default callback will draw path (or clear path if it's not valid)
        Map.prototype.pathFinding = function (unit, targetCoords, cb) {
            if (typeof unit === "undefined") { unit = null; }
            if (typeof targetCoords === "undefined") { targetCoords = null; }
            if (typeof cb === "undefined") { cb = mapUI.drawPath.bind(mapUI); }
            var grid, i, j, tile;

            if (!unit || !this.validCoords(unit.coords) || !this.validCoords(targetCoords) || (unit.coords[0] === targetCoords[0] && unit.coords[1] === targetCoords[1])) {
                cb(); // Clear any previous paths
                return;
            }

            grid = [];
            for (i = 0; i < this.rows; i++) {
                grid[i] = [];
                for (j = 0; j < this.cols; j++) {
                    tile = game.getTile([i, j]);
                    if (this.enemyUnits(game.turnID, [i, j]).length > 0 && (i !== targetCoords[0] || j !== targetCoords[1])) {
                        // Avoid enemies, except on the targetCoords tile
                        grid[i][j] = 0;
                    } else {
                        // Two types: two move (2), one move (1), and blocked
                        // But 2 move only matters if unit can move more than once
                        if (tile.features.indexOf("hills") >= 0 || tile.features.indexOf("forest") >= 0 || tile.features.indexOf("jungle") >= 0) {
                            grid[i][j] = unit.movement > 1 ? 2 : 1;
                        } else if (tile.terrain === "snow" || tile.terrain === "desert" || tile.terrain === "tundra" || tile.terrain === "grassland" || tile.terrain === "plains" || tile.terrain === "unseen") {
                            grid[i][j] = 1;
                        } else {
                            grid[i][j] = 0;
                        }
                    }
                }
            }

            easystar.setGrid(grid);
            easystar.setAcceptableTiles([1, 2]);
            easystar.enableDiagonals();
            easystar.setTileCost(2, 2);

            // Note that easystar coords are (x=col, y=row), so I have to switch things around since all the c4c internal coords are the opposite.
            easystar.findPath(unit.coords[1], unit.coords[0], targetCoords[1], targetCoords[0], function (path) {
                var i, pathArray;

                if (path) {
                    // Fix coord labels
                    pathArray = [];
                    for (i = 0; i < path.length; i++) {
                        pathArray[i] = [path[i].y, path[i].x]; // Swap back rows/cols from easystar
                    }
                }
                cb(pathArray);
            });

            // Not sure why the setTimeout is necessary (the easystar readme says to do it), but I get weird errors from easystar if it's not like this
            window.setTimeout(function () {
                easystar.calculate();
            });
        };

        // Make sure coords are on map
        Map.prototype.validCoords = function (coords) {
            if (coords) {
                return coords[0] >= 0 && coords[1] >= 0 && coords[0] < this.rows && coords[1] < this.cols;
            }

            return false;
        };

        // Moves a unit from its current coordinates to coords.
        // Doesn't call render automatically, since this is often called multiple times before rendering (like for moving a group)
        Map.prototype.moveUnit = function (unit, coords) {
            var i, tileUnits;

            // Delete old unit in map
            tileUnits = game.getTile(unit.coords, false).units;
            for (i = 0; i < tileUnits.length; i++) {
                if (tileUnits[i].id === unit.id) {
                    tileUnits.splice(i, 1);
                    break;
                }
            }

            // Add unit at new tile
            game.getTile(coords, false).units.push(unit);
        };

        // Entries in output matrix are visible (1) or not visible (0).
        Map.prototype.updateVisibility = function () {
            var i, j;

            // Find the visibilility of each tile in the grid (could be made smarter by only looking at units that can impact viewport)
            // Init as everything is unseen
            this.visibility = [];
            for (i = 0; i < this.rows; i++) {
                this.visibility[i] = [];
                for (j = 0; j < this.cols; j++) {
                    this.visibility[i][j] = 0; // Not visible
                }
            }

            // Loop through units, set visibility
            Object.keys(game.units[config.PLAYER_ID]).forEach(function (id) {
                var i, j, radius, unit;

                unit = game.units[config.PLAYER_ID][id];

                // Number of tiles away from center that the unit can see
                if (this.tiles[unit.coords[0]][unit.coords[1]].features.indexOf("hills") >= 0) {
                    radius = 2;
                } else {
                    radius = 1;
                }

                for (i = unit.coords[0] - radius; i <= unit.coords[0] + radius; i++) {
                    for (j = unit.coords[1] - radius; j <= unit.coords[1] + radius; j++) {
                        if (this.validCoords([i, j])) {
                            this.visibility[i][j] = 1; // Visible

                            // Cache current state
                            this.tiles[i][j].lastSeenState = {
                                terrain: this.tiles[i][j].terrain,
                                features: this.tiles[i][j].features,
                                units: [],
                                city: this.tiles[i][j].city
                            };
                        }
                    }
                }
            }.bind(this));
        };

        Map.prototype.enemyUnits = function (player_id, coords) {
            return game.getTile(coords).units.filter(function (unit) {
                return unit.owner !== player_id;
            });
        };

        // Cost (in "movement") of moving from coordsFrom to coordsTo
        Map.prototype.tileMovementCost = function (coordsFrom, coordsTo) {
            var tileTo;

            tileTo = game.getTile(coordsTo);
            if (tileTo.features.indexOf("hills") >= 0 || tileTo.features.indexOf("forest") >= 0) {
                return 2;
            }

            return 1;
        };
        return Map;
    })();
    MapMaker.Map = Map;

    var TotallyRandom = (function (_super) {
        __extends(TotallyRandom, _super);
        function TotallyRandom(rows, cols) {
            var i, j, types;

            _super.call(this);

            this.cols = cols !== undefined ? cols : 80;
            this.rows = rows !== undefined ? rows : 40;

            types = {
                peak: [],
                snow: ["hills"],
                desert: ["flood-plains", "hills", "oasis"],
                tundra: ["forest", "hills"],
                sea: ["ice"],
                coast: ["ice"],
                grassland: ["forest", "hills", "jungle"],
                plains: ["forest", "hills"]
            };

            this.tiles = [];
            for (i = 0; i < this.rows; i++) {
                this.tiles[i] = [];
                for (j = 0; j < this.cols; j++) {
                    this.tiles[i][j] = {
                        terrain: Random.choice(Object.keys(types)),
                        features: [],
                        units: [],
                        city: null,
                        lastSeenState: null
                    };
                    if (Math.random() < 0.5 && types[this.tiles[i][j].terrain].length > 0) {
                        this.tiles[i][j].features.push(Random.choice(types[this.tiles[i][j].terrain]));
                    }
                }
            }
        }
        return TotallyRandom;
    })(Map);
    MapMaker.TotallyRandom = TotallyRandom;

    var BigIsland = (function (_super) {
        __extends(BigIsland, _super);
        function BigIsland(rows, cols) {
            var ci, cj, i, j, r, types;

            _super.call(this);

            this.rows = rows !== undefined ? rows : 40;
            this.cols = cols !== undefined ? cols : 80;

            // Center of map
            ci = Math.round(this.rows / 2);
            cj = Math.round(this.cols / 2);

            // Radius of island
            r = Math.round(Math.min(this.rows, this.cols) * 0.5);

            this.tiles = [];
            for (i = 0; i < this.rows; i++) {
                this.tiles[i] = [];
                for (j = 0; j < this.cols; j++) {
                    // Inside circle at center?
                    if (Math.sqrt(Math.pow(ci - i, 2) + Math.pow(cj - j, 2)) <= r * (0.75 + 0.5 * Math.random())) {
                        this.tiles[i][j] = {
                            terrain: "grassland",
                            features: [],
                            units: [],
                            city: null,
                            lastSeenState: null
                        };

                        // Features
                        if (Math.random() < 0.2) {
                            this.tiles[i][j].features.push("hills");
                        }
                        if (Math.random() < 0.3) {
                            this.tiles[i][j].features.push("forest");
                        }
                    } else {
                        this.tiles[i][j] = {
                            terrain: "sea",
                            features: [],
                            units: [],
                            city: null,
                            lastSeenState: null
                        };
                    }
                }
            }
        }
        return BigIsland;
    })(Map);
    MapMaker.BigIsland = BigIsland;
})(MapMaker || (MapMaker = {}));
// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game
var Game = (function () {
    function Game(numPlayers, mapRows, mapCols) {
        this.maxId = 0;
        this.names = [];
        this.units = [];
        this.groups = [];
        this.cities = [];
        this.activeUnit = null;
        this.turn = 0;
        this.result = "inProgress";
        var i;

        this.map = new MapMaker.BigIsland(mapRows, mapCols);

        for (i = 0; i < numPlayers + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
            this.groups.push({});
            this.cities.push({});
        }
    }
    // Returns null if coords are not valid. Otherwise, returns tile info while factoring in visibility
    // onlyVisible can be set when the base tile is needed no matter what, like adding new units at the beginning of the game
    // See also config.DISABLE_FOG_OF_WAR
    Game.prototype.getTile = function (coords, onlyVisible) {
        if (typeof onlyVisible === "undefined") { onlyVisible = true; }
        var i, j;

        i = coords[0];
        j = coords[1];

        if (this.map.validCoords(coords)) {
            if (!onlyVisible || config.DISABLE_FOG_OF_WAR) {
                // Forced to get real tile
                return this.map.tiles[i][j];
            }

            if (!this.map.visibility[i][j]) {
                if (!this.map.tiles[i][j].lastSeenState) {
                    // Never seen this tile, show nothing
                    return {
                        terrain: "unseen",
                        features: [],
                        units: [],
                        city: null
                    };
                } else {
                    // Seen before, show last seen state
                    return this.map.tiles[i][j].lastSeenState;
                }
            } else {
                // Tile is visible (or forced to be shown), show current state
                return this.map.tiles[i][j];
            }
        } else {
            return null;
        }
    };

    Game.prototype.newTurn = function () {
        var group, i, j, u, unit, unitTypes, tile;

        // See if anything still has to be moved, after the initial turn
        if (this.turn > 0 && this.moveUnits()) {
            return;
        }

        this.turn++;
        this.turnID = this.turn === 1 ? 1 : 0; // Skip barbs first turn
        this.map.updateVisibility();

        // Randomly spawn barbs on non-visible tiles
        unitTypes = ["Scout", "Warrior", "Archer", "Chariot", "Spearman", "Axeman"];
        for (i = 0; i < this.map.rows; i++) {
            for (j = 0; j < this.map.cols; j++) {
                if (!this.map.visibility[i][j] && Math.random() < 0.01) {
                    tile = this.getTile([i, j], false);

                    // Spawn land unit
                    if (tile.terrain === "snow" || tile.terrain === "desert" || tile.terrain === "tundra" || tile.terrain === "grassland" || tile.terrain === "plains") {
                        new Units[Random.choice(unitTypes)](config.BARB_ID, [i, j]);
                    }
                }
            }
        }

        for (i = 0; i < this.units.length; i++) {
            for (u in this.units[i]) {
                unit = this.units[i][u];
                unit.skippedTurn = false;
                unit.attacked = false;
                unit.currentMovement = unit.movement;
                unit.updateCanPromoteToLevel();
            }
            for (u in this.groups[i]) {
                group = this.groups[i][u];
                group.skippedTurn = false;
                group.currentMovement = group.movement;
            }
        }

        this.moveUnits();
    };

    Game.prototype.moveUnits = function () {
        var centerViewport, i, j, unit, group;

        for (i = this.turnID; i < this.names.length; i++) {
            if (i === config.PLAYER_ID) {
                // User
                chromeUI.onNewTurn();

                for (j in this.groups[i]) {
                    group = this.groups[i][j];
                    if (group.currentMovement > 0 && !group.skippedTurn && !group.targetCoords) {
                        group.activate();
                        return true;
                    }
                }

                for (j in this.groups[i]) {
                    group = this.groups[i][j];
                    if (group.currentMovement > 0 && !group.skippedTurn) {
                        group.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }

                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn && !unit.targetCoords && !unit.group) {
                        unit.activate();
                        return true;
                    }
                }

                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn && !unit.group) {
                        unit.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }
            } else if (i === config.BARB_ID) {
                chromeUI.onAIMoving();

                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (unit.currentMovement > 0 && !unit.skippedTurn) {
                        centerViewport = !(game.activeUnit && game.activeUnit.id === unit.id); // Don't center viewport if unit is already active (multi-move)
                        unit.activate(centerViewport);

                        setTimeout(function () {
                            // If in city, only move to attack with >75% chance of winning
                            // Attack with >25% chance of winning
                            // Move towards weaker unit
                            // Move into city, if possible
                            // Move away from stronger unit
                            // Hurt, so fortify until healed
                            // Move randomly
                            if (Math.random() < 0.75) {
                                unit.move(Random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]));
                            } else {
                                unit.skipTurn();
                            }
                        }, unit.movementDelay());
                        return true;
                    }
                }
            } else {
                // Should auto-move non-barb AI units here
            }

            this.turnID += 1;
        }

        // If we made it this far, all of the user's units have moved
        chromeUI.onMovesDone();
        mapUI.render();
        return false;
    };
    return Game;
})();
/*
Units - classes for the various units types
Inheritance chart:
UnitOrGroup - properties and functions that apply to all units and groups of units
-> Unit - stuff specific to individual units
-> All the individual unit classes, like Warrior
-> Group - groups of units
The general idea for groups of units is that they should expose the same API as regular units, so
all the rest of the code can treat them the same. Mainly through the use of getters and setters,
they take the appropriate action with updating each variable (some things trickle down to individual
units, like move counting, and others don't).
*/
var Units;
(function (Units) {
    ;

    ;

    Units.promotions = {
        cityGarrison1: {
            name: "City Garrison I",
            bonuses: {
                cityDefense: 20
            },
            categories: ["archery", "gunpowder"],
            prereqs: []
        },
        cityGarrison2: {
            name: "City Garrison II",
            bonuses: {
                cityDefense: 25
            },
            categories: ["archery", "gunpowder"],
            prereqs: [["cityGarrison1"]]
        },
        cityGarrison3: {
            name: "City Garrison III",
            bonuses: {
                cityDefense: 30,
                melee: 10
            },
            categories: ["archery", "gunpowder"],
            prereqs: [["cityGarrison2"]]
        }
    };

    // Things that both individual units and groups of units have in common
    var UnitOrGroup = (function () {
        function UnitOrGroup() {
            this._targetCoords = null;
            this._promotions = [];
            // Turn stuff
            this._active = false;
            this._skippedTurn = false;
            this._attacked = false;
            // Set unique ID for unit or group
            this.id = game.maxId;
            game.maxId += 1;
        }
        Object.defineProperty(UnitOrGroup.prototype, "owner", {
            get: function () {
                return this._owner;
            },
            // Default getters/setters for units
            set: function (value) {
                this._owner = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "movement", {
            get: function () {
                return this._movement;
            },
            set: function (value) {
                this._movement = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "currentMovement", {
            get: function () {
                return this._currentMovement;
            },
            set: function (value) {
                this._currentMovement = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "coords", {
            get: function () {
                return this._coords;
            },
            set: function (value) {
                this._coords = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "targetCoords", {
            get: function () {
                return this._targetCoords;
            },
            set: function (value) {
                this._targetCoords = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "landOrSea", {
            get: function () {
                return this._landOrSea;
            },
            set: function (value) {
                this._landOrSea = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "canAttack", {
            get: function () {
                return this._canAttack;
            },
            set: function (value) {
                this._canAttack = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "canDefend", {
            get: function () {
                return this._canDefend;
            },
            set: function (value) {
                this._canDefend = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "actions", {
            get: function () {
                return this._actions;
            },
            set: function (value) {
                this._actions = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "promotions", {
            get: function () {
                return this._promotions;
            },
            set: function (value) {
                this._promotions = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "active", {
            get: function () {
                return this._active;
            },
            set: function (value) {
                this._active = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "skippedTurn", {
            get: function () {
                return this._skippedTurn;
            },
            set: function (value) {
                this._skippedTurn = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UnitOrGroup.prototype, "attacked", {
            get: function () {
                return this._attacked;
            },
            set: function (value) {
                this._attacked = value;
            },
            enumerable: true,
            configurable: true
        });

        // goToCoords can be set to false if you don't want the map centered on the unit after activating, like on a left click
        UnitOrGroup.prototype.activate = function (centerViewport, autoMoveTowardsTarget) {
            if (typeof centerViewport === "undefined") { centerViewport = true; }
            if (typeof autoMoveTowardsTarget === "undefined") { autoMoveTowardsTarget = false; }
            // Deactivate current active unit, if there is one
            if (game.activeUnit) {
                game.activeUnit.active = false;
                game.activeUnit = null; // Is this needed? Next unit will set it, if it exists
            }

            // If this unit is on a path towards a target, just go along the path instead of activating. If there are still moves left when the target is reached, activate() will be called again.
            if (autoMoveTowardsTarget && this.targetCoords && this.currentMovement > 0) {
                setTimeout(function () {
                    this.moveTowardsTarget();
                }.bind(this), this.movementDelay());
            }

            // Activate this unit
            this.active = true;
            game.activeUnit = this;
            if (centerViewport && this.isVisible()) {
                mapUI.goToCoords(this.coords);
            }

            chromeUI.onUnitActivated();
            mapUI.render();
        };

        // Should be able to make this general enough to handle all units
        // Handle fight initiation here, if move goes to tile with enemy on it
        UnitOrGroup.prototype.move = function (direction) {
            var newCoords, newTerrain;

            // Short circuit if no moves are available
            if (this.currentMovement <= 0) {
                return;
            }

            // Starting point
            newCoords = this.coords.slice();

            // Implement movement
            if (direction === "SW") {
                newCoords[0] += 1;
                newCoords[1] -= 1;
            } else if (direction === "S") {
                newCoords[0] += 1;
            } else if (direction === "SE") {
                newCoords[0] += 1;
                newCoords[1] += 1;
            } else if (direction === "W") {
                newCoords[1] -= 1;
            } else if (direction === "E") {
                newCoords[1] += 1;
            } else if (direction === "NW") {
                newCoords[0] -= 1;
                newCoords[1] -= 1;
            } else if (direction === "N") {
                newCoords[0] -= 1;
            } else if (direction === "NE") {
                newCoords[0] -= 1;
                newCoords[1] += 1;
            } else {
                // No move to make
                return;
            }

            // Don't walk off the map!
            if (game.map.validCoords(newCoords)) {
                // Stay on land!
                newTerrain = game.getTile(newCoords, false).terrain;
                if (newTerrain === "snow" || newTerrain === "desert" || newTerrain === "tundra" || newTerrain === "grassland" || newTerrain === "plains") {
                    this.moveToCoords(newCoords);
                    return;
                }
            }

            // If made it this far, no move was made
            if (game.turnID !== config.PLAYER_ID) {
                game.moveUnits();
            }
        };

        // Needs to be defined separately for individual and group
        UnitOrGroup.prototype.moveOnMap = function (coords) {
            throw new Error('"moveOnMap" needs to be redefined by each derived class.');
        };

        // Check for valid coords before calling. Returns true when successful, false when "maybe successful" (battle takes over because enemy is on coords)
        UnitOrGroup.prototype.moveToCoords = function (coords) {
            var city;

            // Reset skippedTurn status
            this.skippedTurn = false;

            if (Combat.fightIfTileHasEnemy(this, coords)) {
                return false;
            }

            // Move the unit(s) in the map data structure
            this.moveOnMap(coords);

            // City to capture?
            city = game.getTile(coords).city;
            if (city && city.owner !== this.owner) {
                city.capture(this.owner);
            }

            // Keep track of movement locally
            this.coords = coords;

            this.countMovementToCoords(coords);

            return true;
        };

        // Decrease currentMovement as if the unit is moving to coords (this happens during a real movement, and also after winning a battle with enemy units still on the target tile)
        // Last two arguments are only for the special case of attacking with a group but not taking the tile because more enemies remain. "attacker" should be the same as "this", but "this" is UnitOrGroup so the types don't match up.
        UnitOrGroup.prototype.countMovementToCoords = function (coords, attacker) {
            if (typeof attacker === "undefined") { attacker = null; }
            var atEnd, movementCost;

            // Movement cost based on terrain
            movementCost = game.map.tileMovementCost(this.coords, coords);

            // Keep track of unit movement (applies even if the unit fights but does not move)
            this.currentMovement -= movementCost;

            // To update UI stuff after all movement things are done
            atEnd = function () {
                // Update visibility, since something moved this could have changed
                game.map.updateVisibility();

                mapUI.render();
            };

            if (this.currentMovement <= 0) {
                this.currentMovement = 0;

                this.active = false;

                setTimeout(function () {
                    if (!attacker || !attacker.group) {
                        // After delay, move to next unit
                        game.activeUnit = null;

                        // Handle user and AI units differently
                        if (game.turnID === config.PLAYER_ID) {
                            game.moveUnits();
                        } else {
                            // Move only after a delay
                            setTimeout(function () {
                                game.moveUnits();
                            }, this.movementDelay());
                        }
                    } else {
                        // If unit is in a group and moves are used up after an attack while enemies still remain on attacked tile, leave the group
                        attacker.group.remove(attacker.id); // Will activate rest of group

                        // Handle user and AI units differently
                        if (game.turnID !== config.PLAYER_ID) {
                            setTimeout(function () {
                                game.moveUnits();
                            }, this.movementDelay());
                        }
                    }
                    atEnd();
                }.bind(this), this.movementDelay());
            } else if (game.turnID !== config.PLAYER_ID) {
                // For AI units, need to force move again, even if currentMovement > 0
                // No UI_DELAY needed here
                atEnd();
                game.moveUnits();
            } else {
                atEnd();
            }
        };

        // Sets the unit on a path towards a coordinate on the map
        UnitOrGroup.prototype.initiatePath = function (coords) {
            // See if there is a path to these coordinates
            game.map.pathFinding(this, coords, function (path) {
                if (path) {
                    this.targetCoords = coords;

                    // This render is usually redundant if the user is setting a new path by right click, since that path is already on screen.
                    // But if the path is not set by right click, this is necessary.
                    // Also, if the path is set by right click but there is an old path and no moves, then mapUI.render would otherwise not be called after this point and the old path would be shown instead from a prior mapUI.render call.
                    mapUI.render();

                    this.moveTowardsTarget();
                } else {
                    // No path found!
                    this.targetCoords = null;
                    mapUI.render();
                }
            }.bind(this));
        };

        // Use up the player's moves by moving towards its targetCoords
        UnitOrGroup.prototype.moveTowardsTarget = function () {
            game.map.pathFinding(this, this.targetCoords, function (path) {
                var tryToMove;

                if (path) {
                    path.shift(); // Discard first one, since it's the current tile

                    // Move until moves are used up or target is reached
                    tryToMove = function (cb) {
                        if (this.currentMovement > 0 && path.length > 0) {
                            if (this.moveToCoords(path.shift())) {
                                // Delay so that the map can update before the next move
                                setTimeout(function () {
                                    tryToMove(cb);
                                }, this.movementDelay());
                            }
                        } else {
                            cb();
                        }
                    }.bind(this);

                    tryToMove(function () {
                        if (path.length === 0) {
                            // We reached our target!
                            this.targetCoords = null;
                            if (this.currentMovement > 0) {
                                this.activate(false); // Don't recenter, since unit must already be close to center of screen?
                            }
                        }
                    }.bind(this));
                } else {
                    // Must be something blocking the way now
                    this.targetCoords = null;
                }
            }.bind(this));
        };

        // Mark skippedTurn and go to the next active unit
        UnitOrGroup.prototype.skipTurn = function () {
            this.skippedTurn = true;
            this.active = false;

            // After delay, move to next unit
            setTimeout(function () {
                game.activeUnit = null;
                game.moveUnits();
            }, this.movementDelay());

            // Clear any saved path
            this.targetCoords = null;

            mapUI.render();
        };

        UnitOrGroup.prototype.fortify = function () {
            console.log("FORTIFY");
        };

        UnitOrGroup.prototype.isVisible = function () {
            return Boolean(game.map.visibility[this.coords[0]][this.coords[1]]);
        };

        // If unit is visible, add movement delay. If not, don't.
        UnitOrGroup.prototype.movementDelay = function () {
            if (this.isVisible()) {
                return config.UNIT_MOVEMENT_UI_DELAY;
            } else {
                return 0;
            }
        };

        // Needs to be defined separately for individual and group
        UnitOrGroup.prototype.availablePromotions = function () {
            throw new Error('"availablePromotions" needs to be redefined by each derived class.');
            return [];
        };
        return UnitOrGroup;
    })();
    Units.UnitOrGroup = UnitOrGroup;

    var Unit = (function (_super) {
        __extends(Unit, _super);
        function Unit(owner, coords) {
            _super.call(this);
            // Key attributes
            this.level = 1;
            this.canPromoteToLevel = 1;
            this.xp = 0;
            // Set some defaults for special unit properties
            this.landOrSea = "land";
            this.canAttack = true;
            this.canDefend = true;
            this.unitBonuses = {};

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.getTile(coords, false).units.push(this);

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }
        Unit.prototype.moveOnMap = function (coords) {
            // It's an individual unit!
            game.map.moveUnit(this, coords);
        };

        Unit.prototype.delete = function () {
            var i, tileUnits;

            // Remove from group
            if (this.group) {
                this.group.remove(this.id);
            }

            // Remove from map
            tileUnits = game.getTile(this.coords).units;
            for (i = 0; i < tileUnits.length; i++) {
                if (tileUnits[i].id === this.id) {
                    tileUnits.splice(i, 1);
                    break;
                }
            }

            // Remove from game
            delete game.units[this.owner][this.id];

            // Update map visibility
            game.map.updateVisibility();

            if (this.owner === config.PLAYER_ID && game.result === "inProgress" && Object.keys(game.units[config.PLAYER_ID]).length === 0) {
                game.result = "lost";
                chromeUI.showModal("lost");
            }

            // Remove from active
            if (game.activeUnit && game.activeUnit.id === this.id) {
                game.activeUnit = null;
                game.moveUnits(); // Will always render map... right?
            } else {
                mapUI.render();
            }
        };

        // Merge together unitBonuses (from unit type) and bonuses from promotions
        Unit.prototype.getBonuses = function () {
            var bonuses, i, name, promotionBonuses;

            bonuses = Util.deepCopy(this.unitBonuses);

            for (i = 0; i < this.promotions.length; i++) {
                promotionBonuses = Units.promotions[this.promotions[i]].bonuses;
                for (name in promotionBonuses) {
                    if (bonuses.hasOwnProperty(name)) {
                        bonuses[name] += promotionBonuses[name];
                    } else {
                        bonuses[name] = promotionBonuses[name];
                    }
                }
            }

            return bonuses;
        };

        Unit.prototype.hasPrereqs = function (prereqs) {
            var i, j, success;

            // No prereqs
            if (prereqs.length === 0) {
                return true;
            }

            for (i = 0; i < prereqs.length; i++) {
                success = true;

                for (j = 0; j < prereqs[i].length; j++) {
                    // Assume an entry in a string refers to a promotion, unless there is some special logic here to handle other scenarios
                    if (this.promotions.indexOf(prereqs[i][j]) < 0) {
                        success = false;
                    }
                }

                if (success) {
                    return true;
                }
            }

            // If no return by now, prereqs were not met
            return false;
        };

        Unit.prototype.availablePromotions = function () {
            var result;

            result = [];

            if (this.canPromoteToLevel > this.level) {
                for (name in Units.promotions) {
                    if (Units.promotions[name].categories.indexOf(this.category) >= 0 && this.promotions.indexOf(name) < 0 && this.hasPrereqs(Units.promotions[name].prereqs)) {
                        result.push(name);
                    }
                }
            }

            return result;
        };

        Unit.prototype.xpForNextLevel = function () {
            return Math.pow(this.level, 2) + 1;
        };

        Unit.prototype.updateCanPromoteToLevel = function () {
            if (this.xp < 1) {
                this.canPromoteToLevel = 1;
            } else {
                this.canPromoteToLevel = Math.floor(Math.sqrt(this.xp - 1)) + 1;
            }
        };

        Unit.prototype.promote = function (promotionName) {
            if (this.canPromoteToLevel > this.level && this.availablePromotions().indexOf(promotionName) >= 0) {
                this.promotions.push(promotionName);
                this.level += 1;
                if (this.owner === config.PLAYER_ID) {
                    chromeUI.onUnitActivated();
                }
            } else {
                throw new Error('Unit is not allowed to get the ' + promotionName + ' promotion now.');
            }
        };
        return Unit;
    })(UnitOrGroup);
    Units.Unit = Unit;

    var Group = (function (_super) {
        __extends(Group, _super);
        function Group(owner, units) {
            _super.call(this);
            this.units = [];

            this.owner = owner;

            this.add(units);

            // Initialize private variables
            this.coords = units[0].coords;

            // Store reference to group in game.groups
            game.groups[this.owner][this.id] = this;
        }

        Object.defineProperty(Group.prototype, "owner", {
            // Read value from group, since they're all the same
            get: function () {
                return this._owner;
            },
            // Getters/setters for groups
            // Set for group and every group member, like if the entire group is captured
            set: function (value) {
                var i, min;

                for (i = 0; i < this.units.length; i++) {
                    this.units[i].owner = value;
                }
                this._owner = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Group.prototype, "movement", {
            // Find minimum of group members
            get: function () {
                var i, min;

                min = Infinity;
                for (i = 0; i < this.units.length; i++) {
                    if (this.units[i].movement < min) {
                        min = this.units[i].movement;
                    }
                }
                return min;
            },
            // Do nothing, can't be changed at group level
            set: function (value) {
                throw new Error('"movement" can only be set for individual units, not groups.');
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Group.prototype, "currentMovement", {
            // Find minimum of group members
            get: function () {
                var i, min;

                min = Infinity;
                for (i = 0; i < this.units.length; i++) {
                    if (this.units[i].currentMovement < min) {
                        min = this.units[i].currentMovement;
                    }
                }
                return min;
            },
            // Update each unit in group with difference, and keep track at group level for comparison here
            set: function (value) {
                var diff, i;

                if (value === this.movement) {
                    // We're resetting the current movement at the start of a new turn
                } else {
                    // We're moving and need to update
                    diff = this.currentMovement - value;
                    for (i = 0; i < this.units.length; i++) {
                        this.units[i].currentMovement -= diff;
                    }
                }
                this._currentMovement = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Group.prototype, "coords", {
            // Read value from group, since they're all the same
            get: function () {
                return this._coords;
            },
            // Set for group and every group member
            set: function (value) {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    this.units[i].coords = value;
                }
                this._coords = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Group.prototype, "targetCoords", {
            // Read value from group
            get: function () {
                return this._targetCoords;
            },
            // Set for group
            set: function (value) {
                this._targetCoords = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Group.prototype, "landOrSea", {
            // Find from units, all have the same value
            get: function () {
                return this.units[0].landOrSea;
            },
            // Do nothing, can't be changed at group level
            set: function (value) {
                throw new Error('"landOrSea" can only be set for individual units, not groups.');
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Group.prototype, "canAttack", {
            get: function () {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    if (this.units[i].canAttack) {
                        return true;
                    }
                }
                return false;
            },
            // Do nothing, can't be changed at group level
            set: function (value) {
                throw new Error('"canAttack" can only be set for individual units, not groups.');
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Group.prototype, "canDefend", {
            get: function () {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    if (this.units[i].canDefend) {
                        return true;
                    }
                }
                return false;
            },
            // Do nothing, can't be changed at group level
            set: function (value) {
                throw new Error('"canDefend" can only be set for individual units, not groups.');
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Group.prototype, "actions", {
            get: function () {
                var actions, i, j;

                actions = [];
                for (i = 0; i < this.units.length; i++) {
                    for (j = 0; j < this.units[i].actions.length; j++) {
                        if (actions.indexOf(this.units[i].actions[j]) < 0) {
                            actions.push(this.units[i].actions[j]);
                        }
                    }
                }

                actions.push("separate");

                return actions;
            },
            // Do nothing, can't be changed at group level
            set: function (value) {
                throw new Error('"actions" can only be set for individual units, not groups.');
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Group.prototype, "active", {
            get: function () {
                return this._active;
            },
            set: function (value) {
                this._active = value;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Group.prototype, "skippedTurn", {
            get: function () {
                return this._skippedTurn;
            },
            // Set for group and every group member
            set: function (value) {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    this.units[i].skippedTurn = value;
                }
                this._skippedTurn = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Group.prototype, "attacked", {
            // Only true if every group member either can't attack or has already attacked
            get: function () {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    if (!this.units[i].attacked && this.units[i].canAttack) {
                        return false;
                    }
                }
                return true;
            },
            // Do nothing, can't be changed at group level
            set: function (value) {
                throw new Error('"attacked" can only be set for individual units, not groups.');
            },
            enumerable: true,
            configurable: true
        });

        Group.prototype.moveOnMap = function (coords) {
            var i;

            for (i = 0; i < this.units.length; i++) {
                game.map.moveUnit(this.units[i], coords);
            }
        };

        Group.prototype.add = function (units) {
            var i;

            for (i = 0; i < units.length; i++) {
                this.units.push(units[i]);
                units[i].group = this;
            }
        };

        Group.prototype.remove = function (id, activateUnitIfSeparate) {
            if (typeof activateUnitIfSeparate === "undefined") { activateUnitIfSeparate = true; }
            var i;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].id === id) {
                    this.units[i].group = null;
                    this.units.splice(i, 1);
                    break;
                }
            }

            // Don't keep a unit of 1 around
            if (this.units.length === 1) {
                this.separate(activateUnitIfSeparate);
            }
        };

        Group.prototype.separate = function (activateUnitAtEnd) {
            if (typeof activateUnitAtEnd === "undefined") { activateUnitAtEnd = true; }
            var i, toActivate;

            // Save the first member of this unit to arbitrarily activate at the end
            toActivate = this.units[0];

            for (i = 0; i < this.units.length; i++) {
                this.units[i].group = null;
            }

            // Delete group
            if (this.active) {
                game.activeUnit = null;
            }
            delete game.groups[this.owner][this.id];

            // If desired, activate one of the members of the separateed group
            if (activateUnitAtEnd) {
                toActivate.activate();
            }
        };
        return Group;
    })(UnitOrGroup);
    Units.Group = Group;

    var Scout = (function (_super) {
        __extends(Scout, _super);
        function Scout() {
            _super.apply(this, arguments);
            this.type = "Scout";
            this.category = "recon";
            this.strength = 1;
            this.currentStrength = 1;
            this.movement = 2;
            this.currentMovement = 2;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn"];
        }
        return Scout;
    })(Unit);
    Units.Scout = Scout;

    var Warrior = (function (_super) {
        __extends(Warrior, _super);
        function Warrior() {
            _super.apply(this, arguments);
            this.type = "Warrior";
            this.category = "melee";
            this.strength = 2;
            this.currentStrength = 2;
            this.movement = 1;
            this.currentMovement = 1;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn"];
        }
        return Warrior;
    })(Unit);
    Units.Warrior = Warrior;

    var Archer = (function (_super) {
        __extends(Archer, _super);
        function Archer() {
            _super.apply(this, arguments);
            this.type = "Archer";
            this.category = "archery";
            this.strength = 3;
            this.currentStrength = 3;
            this.movement = 1;
            this.currentMovement = 1;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn"];
            this.unitBonuses = { cityDefense: 50, hillsDefense: 25 };
        }
        return Archer;
    })(Unit);
    Units.Archer = Archer;

    var Chariot = (function (_super) {
        __extends(Chariot, _super);
        function Chariot() {
            _super.apply(this, arguments);
            this.type = "Chariot";
            this.category = "mounted";
            this.strength = 4;
            this.currentStrength = 4;
            this.movement = 2;
            this.currentMovement = 2;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn"];
            this.unitBonuses = { attackAxeman: 100 };
        }
        return Chariot;
    })(Unit);
    Units.Chariot = Chariot;

    var Spearman = (function (_super) {
        __extends(Spearman, _super);
        function Spearman() {
            _super.apply(this, arguments);
            this.type = "Spearman";
            this.category = "melee";
            this.strength = 4;
            this.currentStrength = 4;
            this.movement = 1;
            this.currentMovement = 1;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn"];
            this.unitBonuses = { mounted: 100 };
        }
        return Spearman;
    })(Unit);
    Units.Spearman = Spearman;

    var Axeman = (function (_super) {
        __extends(Axeman, _super);
        function Axeman() {
            _super.apply(this, arguments);
            this.type = "Axeman";
            this.category = "melee";
            this.strength = 5;
            this.currentStrength = 5;
            this.movement = 1;
            this.currentMovement = 1;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn"];
            this.unitBonuses = { melee: 50 };
        }
        return Axeman;
    })(Unit);
    Units.Axeman = Axeman;

    // Functions for working with units or groups of units
    // Like alt+click
    function addUnitsToNewGroup(owner, units) {
        var newUnits, newGroup;

        // Separate any current groups on the tile
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.group) {
                unit.group.separate(false);
            }
            if (unit.currentMovement > 0) {
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new group with all units with currentMovement > 0 and activate it
            newGroup = new Units.Group(owner, newUnits);
            newGroup.activate(false);
        }
    }
    Units.addUnitsToNewGroup = addUnitsToNewGroup;

    // Like ctrl+click
    function addUnitsWithTypeToNewGroup(owner, units, type) {
        var newUnits, newGroup;

        // Separate any current groups on this tile involving this type
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.currentMovement > 0 && unit.type === type) {
                if (unit.group) {
                    unit.group.separate(false);
                }
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new group from all the units of the clicked type with currentMovement > 0
            newGroup = new Units.Group(owner, newUnits);
            newGroup.activate(false);
        }
    }
    Units.addUnitsWithTypeToNewGroup = addUnitsWithTypeToNewGroup;
})(Units || (Units = {}));
// Cities
var Cities;
(function (Cities) {
    // Things that both individual units and groups of units have in common
    var City = (function () {
        function City(owner, coords) {
            this.id = game.maxId;
            game.maxId += 1;

            this.owner = owner;

            // Set coordinates of city and put a reference to the city in the map
            this.coords = coords;
            game.getTile(coords, false).city = this;

            // Store reference to unit in game.units
            game.cities[this.owner][this.id] = this;
        }
        City.prototype.capture = function (newOwner) {
            game.cities[newOwner][this.id] = this;
            delete game.cities[this.owner][this.id];
            this.owner = newOwner;

            if (this.owner === config.PLAYER_ID && game.result === "inProgress") {
                game.result = "won";
                chromeUI.showModal("won");
            }
        };
        return City;
    })();
    Cities.City = City;
})(Cities || (Cities = {}));
// Combat - battle between two units
var Combat;
(function (Combat) {
    var Battle = (function () {
        function Battle(attacker, defender) {
            this.hps = [null, null];
            this.damagePerHit = [null, null];
            this.hitsNeededToWin = [null, null];
            this.names = [null, null];
            this.log = [];
            // "attacker" or "defender"
            this.winner = null;
            this.loser = null;
            var defenderBonus;

            this.units = [attacker, defender];

            // Hit points
            this.hps[0] = Math.round(attacker.currentStrength / attacker.strength * 100);
            this.hps[1] = Math.round(defender.currentStrength / defender.strength * 100);

            // Attacker's modified strength
            this.A = attacker.strength * (this.hps[0] / 100);

            // Defender's modified strength
            this.D = defender.strength * (this.hps[1] / 100);
            defenderBonus = this.defenderBonus();
            if (defenderBonus > 0) {
                this.D *= 1 + defenderBonus / 100;
            } else if (defenderBonus < 0) {
                this.D /= 1 - defenderBonus / 100;
            }

            // Damage per hit
            this.damagePerHit[0] = Util.bound(Math.floor(20 * (3 * this.A + this.D) / (3 * this.D + this.A)), 6, 60);
            this.damagePerHit[1] = Util.bound(Math.floor(20 * (3 * this.D + this.A) / (3 * this.A + this.D)), 6, 60);
            this.hitsNeededToWin[0] = Math.ceil(100 / this.damagePerHit[0]);
            this.hitsNeededToWin[1] = Math.ceil(100 / this.damagePerHit[1]);

            // Names
            this.names[0] = game.names[this.units[0].owner] + "'s " + this.units[0].type;
            this.names[1] = game.names[this.units[1].owner] + "'s " + this.units[1].type;
        }
        Battle.prototype.getAppliedBonuses = function () {
            var appliedBonuses, bonuses, attacker, attackerTile, defender, defenderTile, name;

            attacker = this.units[0];
            defender = this.units[1];

            //            attackerTile = game.getTile(attacker.coords, false);
            defenderTile = game.getTile(defender.coords, false);

            // Attacker, defender
            appliedBonuses = [{}, {}];

            // See which bonuses from the attacker apply
            bonuses = attacker.getBonuses();
            for (name in bonuses) {
                if (name === "cityDefense" || name === "hillsDefense") {
                    // Don't apply to attackers
                } else if (name === "attackAxeman") {
                    if (defender.type === "Axeman") {
                        appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "melee") {
                    if (defender.category === "melee") {
                        appliedBonuses[0][name] = bonuses[name];
                    }
                } else if (name === "mounted") {
                    if (defender.category === "mounted") {
                        appliedBonuses[0][name] = bonuses[name];
                    }
                } else {
                    throw new Error('Unknown bonus type "' + name + '".');
                }
            }

            // See which bonuses from the defender apply
            bonuses = defender.getBonuses();
            for (name in bonuses) {
                if (name === "attackAxeman") {
                    // Don't apply to defenders
                } else if (name === "cityDefense") {
                    if (defenderTile.city && defenderTile.city.owner === defender.owner) {
                        appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "hillsDefense") {
                    if (defenderTile.features.indexOf("hills") >= 0) {
                        appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "melee") {
                    if (attacker.category === "melee") {
                        appliedBonuses[1][name] = bonuses[name];
                    }
                } else if (name === "mounted") {
                    if (attacker.category === "mounted") {
                        appliedBonuses[1][name] = bonuses[name];
                    }
                } else {
                    throw new Error('Unknown bonus type "' + name + '".');
                }
            }

            // Add terrain bonuses to the defender category
            appliedBonuses[1]["terrain"] = 0;
            if (defenderTile.features.indexOf("hills") >= 0) {
                appliedBonuses[1]["terrain"] += 25;
            }
            if (defenderTile.features.indexOf("forest") >= 0 || defenderTile.features.indexOf("jungle") >= 0) {
                appliedBonuses[1]["terrain"] += 50;
            }

            return appliedBonuses;
        };

        // Returns the bonus (as a percentage) to apply to the defender's modified strength.
        // Both attacker and defender bonuses are done here.
        // http://www.civfanatics.com/civ4/strategy/combat_explained.php
        Battle.prototype.defenderBonus = function () {
            var appliedBonuses, bonus, name;

            appliedBonuses = this.getAppliedBonuses();

            bonus = 0;

            for (name in appliedBonuses[0]) {
                bonus -= appliedBonuses[0][name];
            }

            for (name in appliedBonuses[1]) {
                bonus += appliedBonuses[1][name];
            }

            return bonus;
        };

        Battle.prototype.factorial = function (n) {
            if (n === 0 || n === 1) {
                return 1;
            }
            return n * this.factorial(n - 1);
        };

        // Based on http://apolyton.net/showthread.php/140622-The-Civ-IV-Combat-System
        Battle.prototype.oddsAttackerWinsFight = function () {
            var i, maxRounds, odds, p;

            maxRounds = this.hitsNeededToWin[0] + this.hitsNeededToWin[1] - 1; // Somebody is dead by this time

            p = this.A / (this.A + this.D); // Probability attacker wins round

            odds = 0;
            for (i = this.hitsNeededToWin[0]; i <= maxRounds; i++) {
                //odds += f(i, maxRounds, p);
                //odds += C(maxRounds, i) * Math.pow(p, i) * Math.pow(1 - p, maxRounds - i);
                odds += this.factorial(maxRounds) / (this.factorial(i) * this.factorial(maxRounds - i)) * Math.pow(p, i) * Math.pow(1 - p, maxRounds - i);
            }

            //            return this.A / (this.A + this.D);
            return odds;
        };

        Battle.prototype.attackerWinsRound = function () {
            return Math.random() < this.A / (this.A + this.D);
        };

        Battle.prototype.fight = function () {
            var baseXP, i, j;

            console.log(JSON.stringify(this.getAppliedBonuses()));
            console.log(this.defenderBonus());
            this.log.push(this.names[0] + " (" + Util.round(this.A, 2) + ") attacked " + this.names[1] + " (" + Util.round(this.D, 2) + ")");
            this.log.push("Combat odds for attacker: " + Math.round(this.oddsAttackerWinsFight() * 100) + "%");

            this.units[0].attacked = true;

            while (this.hps[0] > 0 && this.hps[1] > 0) {
                if (this.attackerWinsRound()) {
                    i = 0; // Winner
                    j = 1; // Loser
                } else {
                    i = 1; // Winner
                    j = 0; // Loser
                }
                this.hps[j] = Util.bound(this.hps[j] - this.damagePerHit[i], 0, 100);
                this.log.push(this.names[j] + " is hit for " + this.damagePerHit[i] + " (" + this.hps[j] + "/100HP)");
            }

            this.log.push(this.names[i] + " defeated " + this.names[j] + "!");
            console.log(this.log);

            // Process results
            this.winner = i === 0 ? "attacker" : "defender";
            this.loser = j === 0 ? "attacker" : "defender";

            // Play sound and show event
            if (this.units[i].owner === config.PLAYER_ID) {
                assets.battleWon.play();
                chromeUI.eventLog("Your " + this.units[i].type + " killed a barbarian " + this.units[j].type + ".", "good");
            } else {
                assets.battleLost.play();
                chromeUI.eventLog("Your " + this.units[j].type + " was killed by a barbarian " + this.units[i].type + ".", "bad");
            }

            // Loser gets deleted
            this.units[j].delete(); // Delete the references we can
            this.units[j].currentStrength = 0; // So any outstanding references can see it's dead
            this.units[j].currentMovement = 0; // So any outstanding references can see it's dead

            // Winner gets damaged
            this.units[i].currentStrength *= this.hps[i] / 100;

            // Winner gets XP
            baseXP = this.winner === "attacker" ? 4 * this.D / this.A : 2 * this.A / this.D;
            this.units[i].xp += Util.bound(Math.floor(baseXP), 1, Infinity);
        };
        return Battle;
    })();
    Combat.Battle = Battle;

    // Find best attacker/defender combo for a unit/group attacking a tile. If no combo found, defender is null.
    // If the third parameter (forceFindDefender) is true, then even invalid attackers are used. This should be used for path finding only, not for actual attacking
    function findBestDefender(attackerUnitOrGroup, coords, forceFindDefender) {
        if (typeof forceFindDefender === "undefined") { forceFindDefender = false; }
        var attacker, defender, findBestDefenderForAttacker;

        // Works on individual attacker; needs to be called on all members of group
        findBestDefenderForAttacker = function (attacker, coords) {
            var battle, defender, maxOdds, newTileUnits, oddsDefenderWinsFight;

            newTileUnits = game.getTile(coords).units;

            // See if an enemy is on that tile, and if so, find the one with max strength against attacker
            defender = null;
            maxOdds = -Infinity;
            newTileUnits.forEach(function (unit) {
                if (unit.owner !== attacker.owner) {
                    battle = new Battle(attacker, unit);
                    oddsDefenderWinsFight = 1 - battle.oddsAttackerWinsFight();
                    if (oddsDefenderWinsFight > maxOdds) {
                        maxOdds = oddsDefenderWinsFight;
                        defender = unit;
                    }
                }
            });

            return {
                defender: defender,
                oddsDefenderWinsFight: maxOdds
            };
        };

        if (attackerUnitOrGroup instanceof Units.Unit) {
            // Attacker is a single unit
            attacker = attackerUnitOrGroup;

            // Only proceed if there is a valid attacker
            if (forceFindDefender || (attacker.canAttack && !attacker.attacked)) {
                defender = findBestDefenderForAttacker(attacker, coords).defender;
            }
        } else if (attackerUnitOrGroup instanceof Units.Group) {
            // Attacker is a group, find the one with the best odds against its best defender
            (function () {
                var attackerGroup, minOdds;

                minOdds = Infinity;

                attackerGroup = attackerUnitOrGroup;
                attackerGroup.units.forEach(function (unit) {
                    var obj;

                    // Only proceed if there is a valid attacker
                    if (forceFindDefender || (unit.canAttack && !unit.attacked)) {
                        obj = findBestDefenderForAttacker(unit, coords);

                        if (obj.oddsDefenderWinsFight < minOdds) {
                            minOdds = obj.oddsDefenderWinsFight;
                            attacker = unit;
                            defender = obj.defender;
                        }
                    }
                });
            }());
        }

        return {
            attacker: attacker !== undefined ? attacker : null,
            defender: defender !== undefined ? defender : null
        };
    }
    Combat.findBestDefender = findBestDefender;
    ;

    // If tile has enemy unit on it, initiate combat (if appropriate) and return true. Otherwise, do nothing and return false.
    function fightIfTileHasEnemy(attackerUnitOrGroup, coords) {
        var attacker, battle, defender, newTileUnits, units;

        newTileUnits = game.getTile(coords).units;

        units = findBestDefender(attackerUnitOrGroup, coords);
        attacker = units.attacker;
        defender = units.defender;

        if (defender) {
            // Delete path
            attackerUnitOrGroup.targetCoords = null;

            // We have a valid attacker and defender! Fight!
            battle = new Battle(attacker, defender);
            battle.fight();
            if (battle.winner === "attacker") {
                if (game.map.enemyUnits(attackerUnitOrGroup.owner, coords).length === 0) {
                    // No enemies left on tile, take it.
                    attackerUnitOrGroup.moveToCoords(coords); // Move entire group, if it's a group
                } else {
                    // Enemies left on tile, don't take it
                    attacker.countMovementToCoords(coords, attacker); // Only count for attacker, not whole group
                }
            } else {
                // Attacker died, so on to the next one
                game.moveUnits();
            }

            // Update hover tile, since this could change, particularly for right click attack when defending tile is hovered over
            chromeUI.onHoverTile(game.getTile(controller.hoveredTile));

            return true;
        } else if (game.map.enemyUnits(attackerUnitOrGroup.owner, coords).length > 0) {
            // Delete path
            attackerUnitOrGroup.targetCoords = null;

            // We didn't find an attacker, because there is an enemy on the tile and we're not attacking
            return true;
        }

        return false;
    }
    Combat.fightIfTileHasEnemy = fightIfTileHasEnemy;
})(Combat || (Combat = {}));
///<reference path='Util.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
///<reference path='Cities.ts'/>
///<reference path='Combat.ts'/>

var easystar = new EasyStar.js();

// assets : {[name: string] : HTMLImageElement}
var assets, chromeUI, controller, game, mapUI;

// Default options
var config = {
    BARB_ID: 0,
    PLAYER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500,
    DISABLE_FOG_OF_WAR: false
};

/*var assets : any = {};
assets.hills = new Image();
assets.hills.src = 'assets/hills.png';
assets.hills.onload = function () {
assets.forest = new Image();
assets.forest.src = 'assets/forest.png';
assets.forest.onload = function () {
assets.Warrior = new Image();
assets.Warrior.src = 'assets/stone-axe.png';
assets.Warrior.onload = function () {
assets.Chariot = new Image();
assets.Chariot.src = 'assets/horse-head.png';
assets.Chariot.onload = init;
};
};
};*/
function loadAssets(assetsToLoad, cb) {
    var afterEachAsset, name, numAssetsRemaining;

    numAssetsRemaining = Object.keys(assetsToLoad).length;

    afterEachAsset = function () {
        numAssetsRemaining -= 1;
        if (numAssetsRemaining === 0) {
            cb();
        }
    };

    assets = {};
    assets.battleWon = new Howl({
        urls: ["assets/battle-won.ogg", "assets/battle-won.mp3"]
    });
    assets.battleLost = new Howl({
        urls: ["assets/battle-lost.ogg", "assets/battle-lost.mp3"]
    });

    for (name in assetsToLoad) {
        if (assetsToLoad[name].indexOf(".png") >= 0) {
            assets[name] = new Image();
            assets[name].src = "assets/" + assetsToLoad[name];
            assets[name].onload = afterEachAsset;
        } else {
        }
    }
}

var u1;
function init() {
    game = new Game(1, 20, 40);
    chromeUI = new ChromeUI();
    mapUI = new MapUI();
    controller = new Controller();

    game.map.updateVisibility();

    for (var i = 0; i < 200; i++) {
        //    new Units.Warrior(config.BARB_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
    }
    for (var i = 0; i < 1; i++) {
        //    new Units.Warrior(config.PLAYER_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
    }

    /*var u1 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
    var u2 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
    var u3 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
    for (i = 0; i < 10; i++) {
    var u4 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
    }
    new Units.Group(config.PLAYER_ID, [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]);
    [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]
    new Units.Group(config.PLAYER_ID, [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]);*/
    /*    new Units.Scout(config.PLAYER_ID, [10, 20]);
    new Units.Warrior(config.PLAYER_ID, [10, 20]);
    new Units.Archer(config.PLAYER_ID, [10, 20]);*/
    u1 = new Units.Archer(config.PLAYER_ID, [10, 20]);
    u1.promotions.push("cityGarrison1");
    u1.xp += 10;
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);

    /*    new Units.Spearman(config.PLAYER_ID, [10, 20]);
    new Units.Axeman(config.PLAYER_ID, [10, 20]);
    new Units.Warrior(config.BARB_ID, [10, 21]);
    new Units.Warrior(config.BARB_ID, [10, 21]);*/
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Spearman(config.BARB_ID, [10, 21]);
    new Units.Axeman(config.BARB_ID, [10, 21]);
    new Units.Chariot(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Units.Archer(config.BARB_ID, [10, 21]);
    new Cities.City(config.BARB_ID, [10, 21]);

    game.newTurn();
}

loadAssets({
    hills: "terrain/hills.png",
    forest: "terrain/forest.png",
    city: "white-tower.png",
    cityCaptured: "tower-fall.png",
    whiteScout: "units/white/tread.png",
    whiteWarrior: "units/white/stone-axe.png",
    whiteArcher: "units/white/high-shot.png",
    whiteChariot: "units/white/horse-head.png",
    whiteSpearman: "units/white/spears.png",
    whiteAxeman: "units/white/battle-axe.png",
    blackScout: "units/black/tread.png",
    blackWarrior: "units/black/stone-axe.png",
    blackArcher: "units/black/high-shot.png",
    blackChariot: "units/black/horse-head.png",
    blackSpearman: "units/black/spears.png",
    blackAxeman: "units/black/battle-axe.png"
}, init);
//# sourceMappingURL=app.js.map
