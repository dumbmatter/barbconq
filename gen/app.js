// Random - utility functions like Python's random module
var Random;
(function (Random) {
    function choice(x) {
        return x[Math.floor(Math.random() * x.length)];
    }
    Random.choice = choice;
})(Random || (Random = {}));
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

                requestAnimationFrame(mapUI.render.bind(mapUI));
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
                } else if (e.keyCode === this.KEYS.S && activeUnit.actions.indexOf("sentry") >= 0) {
                    activeUnit.sentry();
                }
            }
        }.bind(this));

        // Unit movement with right click
        mapUI.canvas.addEventListener("contextmenu", function (e) {
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
                game.activeUnit[el.dataset.action]();
            }
        });
        chromeUI.elBottomActions.addEventListener("mouseover", function (e) {
            var el;

            el = e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                chromeUI.onHoverAction(el.dataset.action);
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
                        if (units[i].active || (units[i].stack && units[i].stack.active)) {
                            currentMetric += 1000;
                        }

                        if (currentMetric > maxMetric) {
                            unit = units[i];
                            maxMetric = currentMetric;
                        }
                    }

                    if (unit) {
                        if (e.altKey) {
                            // Create stack of all units on tile with moves and activate it
                            Units.addUnitsToNewStack(config.PLAYER_ID, units);
                        } else if (e.ctrlKey) {
                            // Create stack of all units on tile with moves and same type as top unit and activate it
                            Units.addUnitsWithTypeToNewStack(config.PLAYER_ID, units, unit.type);
                        } else {
                            // Normal left click: select top unit or stack
                            if (unit.stack) {
                                unit.stack.activate(false);
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
            var activeUnit, activeStack, clickedId, clickedOwner, clickedSid, el, i, newStack, newUnits, units, type;

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
                    Units.addUnitsToNewStack(clickedOwner, units);
                } else if (e.ctrlKey && e.shiftKey) {
                    type = game.units[clickedOwner][clickedId].type;

                    if (game.activeUnit instanceof Units.BaseUnit) {
                        // Individual unit is active
                        // Create a stack with the active unit and all units of the clicked type with currentMovement > 0
                        activeUnit = game.activeUnit; // So TypeScript knows it's not a stack

                        // Find all units of type
                        newUnits = [activeUnit];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && unit.id !== activeUnit.id) {
                                newUnits.push(unit);

                                // Remove from current stack, if it exists
                                if (unit.stack) {
                                    unit.stack.remove(unit.id, false);
                                }
                            }
                        });

                        // New stack with units of type and activeUnit
                        newStack = new Units.Stack(clickedOwner, newUnits);
                        newStack.activate(false);
                    } else if (game.activeUnit instanceof Units.Stack) {
                        // Unit stack is active
                        // Add all units of the clicked type with currentMovement > 0 to that stack
                        activeStack = game.activeUnit; // So TypeScript knows it's not an individual unit

                        // Find units of type that aren't already in stack
                        newUnits = [];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && (!unit.stack || unit.stack.id !== activeStack.id)) {
                                newUnits.push(unit);

                                // Remove from current stack, if it exists
                                if (unit.stack) {
                                    unit.stack.remove(unit.id, false);
                                }
                            }
                        });

                        if (newUnits.length > 0) {
                            activeStack.add(newUnits);

                            // Redraw everything, since there is no Unit.activate call here to do that otherwise
                            chromeUI.onUnitActivated();
                            window.requestAnimationFrame(mapUI.render.bind(mapUI));
                        }
                    } else {
                        // No unit active (like if they all got separateed above)
                        newStack = new Units.Stack(clickedOwner, newUnits);
                        newStack.activate(false);
                    }
                } else if (e.ctrlKey) {
                    Units.addUnitsWithTypeToNewStack(clickedOwner, units, game.units[clickedOwner][clickedId].type);
                } else if (e.shiftKey) {
                    if (game.activeUnit instanceof Units.BaseUnit) {
                        // Individual unit is active
                        if (game.activeUnit.id !== clickedId) {
                            // If clicked unit is not the active unit, add it to a new stack with clicked unit
                            newStack = new Units.Stack(clickedOwner, [game.activeUnit, game.units[clickedOwner][clickedId]]);
                            newStack.activate(false);
                        }
                    } else if (game.activeUnit instanceof Units.Stack) {
                        activeStack = game.activeUnit; // So TypeScript knows it's not an individual unit

                        // Unit stack is active
                        if (activeStack === game.units[clickedOwner][clickedId].stack) {
                            // Clicked unit is in the active stack, remove it from that stack
                            activeStack.remove(clickedId);
                        } else {
                            // Clicked unit is not in the active stack, add it to that stack
                            activeStack.add([game.units[clickedOwner][clickedId]]);
                        }

                        // Redraw everything, since there is no Unit.activate call here to do that otherwise
                        chromeUI.onUnitActivated();
                        window.requestAnimationFrame(mapUI.render.bind(mapUI));
                    }
                } else {
                    if (clickedSid !== null) {
                        // Clicked unit is in a stack
                        if (game.activeUnit.id === clickedSid) {
                            // Clicked unit is member of active stack, so separate it and activate clicked unit
                            game.stacks[clickedOwner][clickedSid].separate(false);
                            game.units[clickedOwner][clickedId].activate(false);
                        } else {
                            // Clicked unit is in an inactive stack, so activate the stack
                            game.stacks[clickedOwner][clickedSid].activate(false);
                        }
                    } else {
                        // Clicked unit is not in stack, so just activate it
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
        this.elTurnBox = document.getElementById("turn-box");
        this.elBottomInfo = document.getElementById("bottom-info");
        this.elBottomActions = document.getElementById("bottom-actions");
        this.elBottomText = document.getElementById("bottom-text");
        this.elBottomUnits = document.getElementById("bottom-units");
    }
    ChromeUI.prototype.strengthFraction = function (unit) {
        if (unit.strength === unit.currentStrength) {
            return unit.currentStrength + ' S';
        } else {
            return unit.currentStrength + '/' + unit.strength + ' S';
        }
    };

    ChromeUI.prototype.movementFraction = function (unit) {
        if (unit.movement === unit.currentMovement) {
            return unit.currentMovement + ' M';
        } else {
            return unit.currentMovement + '/' + unit.movement + ' M';
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
        var content, i;

        if (tile) {
            content = "";

            for (i = 0; i < tile.units.length; i++) {
                content += this.hoverBoxUnitSummary(tile.units[i]);
            }

            // Show tile terrain and features
            content += '<p>' + tile.features.join("/") + (tile.features.length ? "/" : "") + tile.terrain + '</p>';

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

    ChromeUI.prototype.hoverBoxUnitSummary = function (unit) {
        var content;

        content = "";
        content += '<p><span class="unit-name">' + unit.type + '</span>, ';
        content += this.strengthFraction(unit) + ', ';
        content += this.movementFraction(unit) + ', ';
        content += game.names[unit.owner];
        content += '</p>';

        return content;
    };

    ChromeUI.prototype.onHoverAction = function (action) {
        if (typeof action === "undefined") { action = null; }
        if (action === "fortify") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Fortify</span> <span class="action-shortcut">&lt;F&gt;</span></p><p>The unit prepares itself to defend. A unit gets a 5% defensive bonus for each turn it is fortified (maximum 25%). Units also heal while fortified.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "skipTurn") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Skip Turn</span> <span class="action-shortcut">&lt;Space Bar&gt;</span></p><p>The unit does nothing this turn, but will ask for orders again next turn.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "sentry") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Sentry</span> <span class="action-shortcut">&lt;S&gt;</span></p><p>The unit remains inactive until it sees an enemy unit.</p>';
            this.elHoverBox.style.display = "block";
        } else if (action === "separate") {
            this.elHoverBox.innerHTML = '<p><span class="action-name">Separate</span></p><p>Separates the stack so you can move each unit individually.</p>';
            this.elHoverBox.style.display = "block";
        } else {
            this.elHoverBox.style.display = "none";
        }
    };

    ChromeUI.prototype.onNewTurn = function () {
        this.elTurnBox.innerHTML = "Turn " + game.turn;
        this.updateBottomText();
    };

    ChromeUI.prototype.onMovesDone = function () {
        this.updateBottomText("Press &lt;ENTER&gt; to begin the next turn...");
    };

    // Can be called even if no unit is active, in which case it'll remove all displayed unit info
    ChromeUI.prototype.updateActiveUnit = function () {
        var activeUnit, actionName, addCommas, content, counts, i, units, type;

        activeUnit = game.activeUnit; // Really should have separate variables for unit and stack, like in unit icon click handling

        // Reset
        this.elBottomActions.innerHTML = "";
        this.elBottomInfo.innerHTML = "";
        this.elBottomUnits.innerHTML = "";

        if (game.activeUnit) {
            // Update bottom-info
            if (activeUnit instanceof Units.BaseUnit) {
                this.elBottomInfo.innerHTML = "<h1>" + activeUnit.type + "</h1>" + "<table>" + "<tr><td>Strength:</td><td>" + this.strengthFraction(activeUnit) + "</td></tr>" + "<tr><td>Movement:</td><td>" + this.movementFraction(activeUnit) + "</td></tr>" + "<tr><td>Level:</td><td>" + activeUnit.level + "</td></tr>" + "<tr><td>Experience:</td><td>" + activeUnit.xp + "</td></tr>" + "</table>";
            } else if (activeUnit instanceof Units.Stack) {
                content = "<h1>Unit Stack (" + activeUnit.units.length + ")</h1>" + "<table>" + "<tr><td>Movement: " + this.movementFraction(activeUnit) + "</td></tr>" + '<tr><td><div class="stack-types">Units: ';

                // List individual unit types in stack
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

            for (i = 0; i < activeUnit.actions.length; i++) {
                // Convert camel case to title case
                actionName = activeUnit.actions[i].replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2"); // http://stackoverflow.com/a/7225474
                actionName = actionName.charAt(0).toUpperCase() + actionName.slice(1); // Fix first character

                this.elBottomActions.innerHTML += '<button class="action" data-action="' + activeUnit.actions[i] + '">' + actionName + '</button>';
            }

            // Update bottom-units
            units = game.getTile(game.activeUnit.coords).units;
            for (i = 0; i < units.length; i++) {
                this.elBottomUnits.appendChild(this.unitIcon(units[i]));
            }
        }
    };

    ChromeUI.prototype.unitIcon = function (unit) {
        var healthPct, healthBar, icon, iconWrapper, movementIndicator;

        iconWrapper = document.createElement("div");
        iconWrapper.classList.add("unit-icon-wrapper");
        iconWrapper.dataset.owner = unit.owner;
        iconWrapper.dataset.id = unit.id;
        if (unit.stack) {
            iconWrapper.dataset.gid = unit.stack.id;
        }

        // Unit icon
        icon = document.createElement("div");
        icon.classList.add("unit-icon");
        icon.innerHTML = unit.type.slice(0, 2);
        if (unit.active || (unit.stack && unit.stack.active)) {
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
        if (unit.currentMovement === unit.movement) {
            movementIndicator.classList.add("movement-all");
        } else if (unit.currentMovement > 0) {
            movementIndicator.classList.add("movement-some");
        } else {
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
    return ChromeUI;
})();
// MapUI - Everything related to the display and interactivity of the on-screen map (including units, but not including non-map chrome)
var MapUI = (function () {
    function MapUI() {
        // Constants
        this.TILE_SIZE = 50;
        this.pathFindingSearch = false;
        // Colors!
        this.terrainColors = {
            peak: "#000",
            snow: "#fff",
            desert: "#f1eabd",
            tundra: "#ddd",
            sea: "#00f",
            coast: "#7c7cff",
            grassland: "#070",
            plains: "#fd0"
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
            requestAnimationFrame(function () {
                this.setCanvasSize();
                this.render();
            }.bind(this));
        }.bind(this));

        this.setCanvasSize();

        // Initial render
        window.requestAnimationFrame(this.render.bind(this));
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
            var i, pixels;

            if (renderMapFirst) {
                this.render();
            }

            if (path && path.length > 1) {
                // Origin
                this.context.beginPath();
                pixels = this.coordsToPixels(path[0][0], path[0][1]);
                this.context.moveTo(pixels[0], pixels[1]);

                for (i = 1; i < path.length; i++) {
                    pixels = this.coordsToPixels(path[i][0], path[i][1]);
                    this.context.lineTo(pixels[0], pixels[1]);
                }

                this.context.strokeStyle = "#000";
                this.context.lineWidth = 2;
                this.context.setLineDash([5]);
                this.context.stroke();
                this.context.setLineDash([]); // Reset dash state
            }
        }.bind(this));
    };

    MapUI.prototype.render = function () {
        var bottom, left, leftTile, right, tileOffsetX, tileOffsetY, top, topTile, x, y;

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

        // Loop over all tiles, call cb on each tile in the viewport
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

        // First pass: draw tiles and units
        drawViewport(function (i, j, x, y) {
            var k, maxStrength, unit, units;

            // Background
            this.context.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
            this.context.fillRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

            // Grid lines
            this.context.strokeStyle = "#000";
            this.context.lineWidth = 1;
            this.context.strokeRect(x * this.TILE_SIZE - tileOffsetX, y * this.TILE_SIZE - tileOffsetY, this.TILE_SIZE, this.TILE_SIZE);

            // Text - list units
            units = game.map.tiles[i][j].units;
            if (units.length > 0) {
                // Pick which unit to show on top of tile
                if (units.length === 1) {
                    // Only one to show...
                    unit = units[0];
                } else if (game.activeUnit && game.activeUnit.coords[0] === i && game.activeUnit.coords[1] === j) {
                    // Active unit/stack on this tile
                    if (game.activeUnit instanceof Units.Stack) {
                        // Stack is active, show highest currentStrength from the stack
                        maxStrength = -Infinity;
                        for (k = 0; k < units.length; k++) {
                            if (units[k].currentStrength > maxStrength && (units[k].stack && units[k].stack.id === game.activeUnit.id)) {
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

                this.context.fillStyle = this.terrainFontColors[game.map.tiles[i][j].terrain];
                this.context.textBaseline = "top";
                this.context.fillText(unit.type, x * this.TILE_SIZE - tileOffsetX + 2, y * this.TILE_SIZE - tileOffsetY);
            }
        }.bind(this));

        // Highlight active unit
        if (game.activeUnit) {
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
    };

    MapUI.prototype.renderMiniMap = function () {
        var bottom, bottomTile, i, j, k, left, leftTile, right, rightTile, top, topTile, unit;

        // Clear canvas and redraw everything
        this.miniContext.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
        this.miniContext.fillStyle = "#000";
        this.miniContext.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

        for (i = 0; i < game.map.rows; i++) {
            for (j = 0; j < game.map.cols; j++) {
                // Background
                this.miniContext.fillStyle = this.terrainColors[game.map.tiles[i][j].terrain];
                this.miniContext.fillRect(j * this.miniTileSize, i * this.miniTileSize, this.miniTileSize, this.miniTileSize);
            }
        }

        for (i = 0; i < game.map.rows; i++) {
            for (j = 0; j < game.map.cols; j++) {
                // Highlight active tile
                if (game.map.tiles[i][j].units.length > 0) {
                    for (k = 0; k < game.map.tiles[i][j].units.length; k++) {
                        unit = game.map.tiles[i][j].units[k];

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
        window.requestAnimationFrame(this.render.bind(this));
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
            var grid, i, j;

            if (!unit || !this.validCoords(unit.coords) || !this.validCoords(targetCoords) || (unit.coords[0] === targetCoords[0] && unit.coords[1] === targetCoords[1])) {
                cb(); // Clear any previous paths
                return;
            }

            grid = [];
            for (i = 0; i < this.rows; i++) {
                grid[i] = [];
                for (j = 0; j < this.cols; j++) {
                    // Two types: two move (2), one move (1), and blocked
                    // But 2 move only matters if unit can move more than once
                    if (this.tiles[i][j].features.indexOf("hills") >= 0 || this.tiles[i][j].features.indexOf("forest") >= 0 || this.tiles[i][j].features.indexOf("jungle") >= 0) {
                        grid[i][j] = unit.movement > 1 ? 2 : 1;
                    } else if (this.tiles[i][j].terrain === "snow" || this.tiles[i][j].terrain === "desert" || this.tiles[i][j].terrain === "tundra" || this.tiles[i][j].terrain === "grassland" || this.tiles[i][j].terrain === "plains") {
                        grid[i][j] = 1;
                    } else {
                        grid[i][j] = 0;
                    }
                }
            }

            easystar.setGrid(grid);
            easystar.setAcceptableTiles([1, 2]);
            easystar.enableDiagonals();
            easystar.setTileCost(2, 2);

            // Note that easystar coords are (x=col, y=row), so I have to switch things around since all the c4c internal coords are the opposite.
            easystar.findPath(unit.coords[1], unit.coords[0], targetCoords[1], targetCoords[0], function (path) {
                var i;

                if (path) {
                    for (i = 0; i < path.length; i++) {
                        path[i] = [path[i].y, path[i].x]; // Swap back rows/cols from easystar
                    }
                }
                cb(path);
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
        // Doesn't call render automatically, since this is often called multiple times before rendering (like for moving a stack)
        Map.prototype.moveUnit = function (unit, coords) {
            var i, tileUnits;

            // Delete old unit in map
            tileUnits = game.getTile(unit.coords).units;
            for (i = 0; i < tileUnits.length; i++) {
                if (tileUnits[i].id === unit.id) {
                    tileUnits.splice(i, 1);
                    break;
                }
            }

            // Add unit at new tile
            game.getTile(coords).units.push(unit);
        };
        return Map;
    })();
    MapMaker.Map = Map;

    var DefaultMap = (function (_super) {
        __extends(DefaultMap, _super);
        function DefaultMap(rows, cols) {
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
                        units: []
                    };
                    if (Math.random() < 0.5 && types[this.tiles[i][j].terrain].length > 0) {
                        this.tiles[i][j].features.push(Random.choice(types[this.tiles[i][j].terrain]));
                    }
                }
            }
        }
        return DefaultMap;
    })(Map);
    MapMaker.DefaultMap = DefaultMap;
})(MapMaker || (MapMaker = {}));
// Game - store the state of the game here, any non-UI stuff that would need for saving/loading a game
var Game = (function () {
    function Game(numPlayers, mapRows, mapCols) {
        this.maxId = 0;
        this.names = [];
        this.units = [];
        this.stacks = [];
        this.activeUnit = null;
        this.turn = 0;
        var i;

        this.map = new MapMaker.DefaultMap(mapRows, mapCols);

        for (i = 0; i < numPlayers + 1; i++) {
            if (i === 0) {
                this.names.push("Barbarian");
            } else {
                this.names.push("Player " + i);
            }

            this.units.push({});
            this.stacks.push({});
        }
    }
    Game.prototype.getTile = function (coords) {
        if (this.map.validCoords(coords)) {
            return this.map.tiles[coords[0]][coords[1]];
        } else {
            return null;
        }
    };

    Game.prototype.newTurn = function () {
        var i, j, unit, stack;

        // See if anything still has to be moved, after the initial turn
        if (game.turn > 0 && this.moveUnits()) {
            return;
        }

        game.turn++;
        chromeUI.onNewTurn();

        for (i = 0; i < this.units.length; i++) {
            for (j in this.units[i]) {
                unit = this.units[i][j];
                unit.moved = false;
                unit.currentMovement = unit.movement;
            }
            for (j in this.stacks[i]) {
                stack = this.stacks[i][j];
                stack.moved = false;
                stack.currentMovement = stack.movement;
            }
        }

        this.moveUnits();
    };

    Game.prototype.moveUnits = function () {
        var i, j, unit, stack;

        for (i = 0; i < this.names.length; i++) {
            // User
            if (i === config.PLAYER_ID) {
                for (j in this.stacks[i]) {
                    stack = this.stacks[i][j];
                    if (!stack.moved && !stack.targetCoords) {
                        stack.activate();
                        return true;
                    }
                }

                for (j in this.stacks[i]) {
                    stack = this.stacks[i][j];
                    if (!stack.moved) {
                        stack.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }

                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (!unit.moved && !unit.targetCoords && !unit.stack) {
                        unit.activate();
                        return true;
                    }
                }

                for (j in this.units[i]) {
                    unit = this.units[i][j];
                    if (!unit.moved && !unit.stack) {
                        unit.activate(true, true); // Activate, center screen, and auto-move to targetCoords
                        return true;
                    }
                }
            } else {
                // Should auto-move AI units here
            }
        }

        // If we made it this far, everybody has moved
        chromeUI.onMovesDone();
        return false;
    };
    return Game;
})();
/*
Units - classes for the various units types
Inheritance chart:
BaseUnitOrStack - properties and functions that apply to all units and stacks of units
-> BaseUnit - stuff specific to individual units
-> All the individual unit classes, like Warrior
-> Stack - stacks of units
The general idea for stacks of units is that they should expose the same API as regular units, so
all the rest of the code can treat them the same. Mainly through the use of getters and setters,
they take the appropriate action with updating each variable (some things trickle down to individual
units, like move counting, and others don't).
*/
var Units;
(function (Units) {
    // Things that both individual units and stacks of units have in common
    var BaseUnitOrStack = (function () {
        function BaseUnitOrStack() {
            this._targetCoords = null;
            // Turn stuff
            this._active = false;
            this._moved = false;
            // Set unique ID for unit or stack
            this.id = game.maxId;
            game.maxId += 1;
        }
        Object.defineProperty(BaseUnitOrStack.prototype, "owner", {
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
        Object.defineProperty(BaseUnitOrStack.prototype, "movement", {
            get: function () {
                return this._movement;
            },
            set: function (value) {
                this._movement = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "currentMovement", {
            get: function () {
                return this._currentMovement;
            },
            set: function (value) {
                this._currentMovement = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "coords", {
            get: function () {
                return this._coords;
            },
            set: function (value) {
                this._coords = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "targetCoords", {
            get: function () {
                return this._targetCoords;
            },
            set: function (value) {
                this._targetCoords = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "landOrSea", {
            get: function () {
                return this._landOrSea;
            },
            set: function (value) {
                this._landOrSea = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "canAttack", {
            get: function () {
                return this._canAttack;
            },
            set: function (value) {
                this._canAttack = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "canDefend", {
            get: function () {
                return this._canDefend;
            },
            set: function (value) {
                this._canDefend = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "actions", {
            get: function () {
                return this._actions;
            },
            set: function (value) {
                this._actions = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "active", {
            get: function () {
                return this._active;
            },
            set: function (value) {
                this._active = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseUnitOrStack.prototype, "moved", {
            get: function () {
                return this._moved;
            },
            set: function (value) {
                this._moved = value;
            },
            enumerable: true,
            configurable: true
        });

        // goToCoords can be set to false if you don't want the map centered on the unit after activating, like on a left click
        BaseUnitOrStack.prototype.activate = function (centerDisplay, autoMoveTowardsTarget) {
            if (typeof centerDisplay === "undefined") { centerDisplay = true; }
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
                }.bind(this), config.UNIT_MOVEMENT_UI_DELAY);
            }

            // Activate this unit
            this.active = true;
            game.activeUnit = this;
            if (centerDisplay) {
                mapUI.goToCoords(this.coords);
            }

            chromeUI.onUnitActivated();
            window.requestAnimationFrame(mapUI.render.bind(mapUI));
        };

        // Set as moved, because it used up all its moves or because its turn was skipped or something
        BaseUnitOrStack.prototype.setMoved = function () {
            this.moved = true;
            this.active = false;
            game.activeUnit = null; // Is this needed? Next unit will set it, if it exists

            // After delay, move to next unit
            setTimeout(function () {
                game.moveUnits();
            }, config.UNIT_MOVEMENT_UI_DELAY);
        };

        // Should be able to make this general enough to handle all units
        // Handle fight initiation here, if move goes to tile with enemy on it
        BaseUnitOrStack.prototype.move = function (direction) {
            var newCoords;

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
                this.moveToCoords(newCoords);
            }
        };

        // Needs to be defined separately for individual and stack
        BaseUnitOrStack.prototype.moveOnMap = function (coords) {
        };

        // Check for valid coords before calling
        BaseUnitOrStack.prototype.moveToCoords = function (coords) {
            // Move the unit(s) in the map data structure
            this.moveOnMap(coords);

            // Keep track of movement locally
            this.coords = coords;
            this.currentMovement -= 1; // Should depend on terrain/improvements
            if (this.currentMovement <= 0) {
                this.currentMovement = 0;
                this.setMoved();
            }

            window.requestAnimationFrame(mapUI.render.bind(mapUI));
        };

        // Sets the unit on a path towards a coordinate on the map
        BaseUnitOrStack.prototype.initiatePath = function (coords) {
            // See if there is a path to these coordinates
            game.map.pathFinding(this, coords, function (path) {
                if (path) {
                    this.targetCoords = coords;

                    // This render is usually redundant if the user is setting a new path by right click, since that path is already on screen.
                    // But if the path is not set by right click, this is necessary.
                    // Also, if the path is set by right click but there is an old path and no moves, then mapUI.render would otherwise not be called after this point and the old path would be shown instead from a prior mapUI.render call.
                    window.requestAnimationFrame(mapUI.render.bind(mapUI));

                    this.moveTowardsTarget();
                } else {
                    // No path found!
                    this.targetCoords = null;
                    window.requestAnimationFrame(mapUI.render.bind(mapUI));
                }
            }.bind(this));
        };

        // Use up the player's moves by moving towards its targetCoords
        BaseUnitOrStack.prototype.moveTowardsTarget = function () {
            game.map.pathFinding(this, this.targetCoords, function (path) {
                var tryToMove;

                if (path) {
                    path.shift(); // Discard first one, since it's the current tile

                    // Move until moves are used up or target is reached
                    tryToMove = function (cb) {
                        if (this.currentMovement > 0 && path.length > 0) {
                            this.moveToCoords(path.shift());

                            // Delay so that the map can update before the next move
                            setTimeout(function () {
                                tryToMove(cb);
                            }, config.UNIT_MOVEMENT_UI_DELAY);
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

        // Mark as moved and go to the next active unit
        BaseUnitOrStack.prototype.skipTurn = function () {
            this.setMoved();

            // Clear any saved path
            this.targetCoords = null;

            requestAnimationFrame(mapUI.render.bind(mapUI));
        };

        BaseUnitOrStack.prototype.fortify = function () {
            console.log("FORTIFY");
        };

        BaseUnitOrStack.prototype.sentry = function () {
            console.log("SENTRY");
        };
        return BaseUnitOrStack;
    })();
    Units.BaseUnitOrStack = BaseUnitOrStack;

    var BaseUnit = (function (_super) {
        __extends(BaseUnit, _super);
        function BaseUnit(owner, coords) {
            _super.call(this);
            // Key attributes
            this.level = 1;
            this.xp = 0;
            // Set some defaults for special unit properties
            this.landOrSea = "land";
            this.canAttack = true;
            this.canDefend = true;

            this.owner = owner;

            // Set coordinates of unit and put a reference to the unit in the map
            this.coords = coords;
            game.map.tiles[coords[0]][coords[1]].units.push(this);

            // Store reference to unit in game.units
            game.units[this.owner][this.id] = this;
        }
        BaseUnit.prototype.moveOnMap = function (coords) {
            // It's an individual unit!
            game.map.moveUnit(this, coords);
        };
        return BaseUnit;
    })(BaseUnitOrStack);
    Units.BaseUnit = BaseUnit;

    var Stack = (function (_super) {
        __extends(Stack, _super);
        function Stack(owner, units) {
            _super.call(this);
            this.units = [];

            this.owner = owner;

            this.add(units);

            // Initialize private variables
            this.coords = units[0].coords;

            // Store reference to stack in game.stacks
            game.stacks[this.owner][this.id] = this;
        }

        Object.defineProperty(Stack.prototype, "owner", {
            // Read value from stack, since they're all the same
            get: function () {
                return this._owner;
            },
            // Getters/setters for stacks
            // Set for stack and every stack member, like if the entire stack is captured
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


        Object.defineProperty(Stack.prototype, "movement", {
            // Find minimum of stack members
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
            // Do nothing, can't be changed at stack level
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Stack.prototype, "currentMovement", {
            // Find minimum of stack members
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
            // Update each unit in stack with difference, and keep track at stack level for comparison here
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


        Object.defineProperty(Stack.prototype, "coords", {
            // Read value from stack, since they're all the same
            get: function () {
                return this._coords;
            },
            // Set for stack and every stack member
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


        Object.defineProperty(Stack.prototype, "targetCoords", {
            // Read value from stack
            get: function () {
                return this._targetCoords;
            },
            // Set for stack
            set: function (value) {
                this._targetCoords = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Stack.prototype, "landOrSea", {
            // Find from units, all have the same value
            get: function () {
                return this.units[0].landOrSea;
            },
            // Do nothing, can't be changed at stack level
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Stack.prototype, "canAttack", {
            get: function () {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    if (this.units[i].canAttack) {
                        return true;
                    }
                }
                return false;
            },
            // Do nothing, can't be changed at stack level
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Stack.prototype, "canDefend", {
            get: function () {
                var i;

                for (i = 0; i < this.units.length; i++) {
                    if (this.units[i].canAttack) {
                        return true;
                    }
                }
                return false;
            },
            // Do nothing, can't be changed at stack level
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Stack.prototype, "actions", {
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
            // Do nothing, can't be changed at stack level
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Stack.prototype, "active", {
            get: function () {
                return this._active;
            },
            set: function (value) {
                this._active = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Stack.prototype, "moved", {
            get: function () {
                return this._moved;
            },
            set: function (value) {
                this._moved = value;
            },
            enumerable: true,
            configurable: true
        });

        Stack.prototype.moveOnMap = function (coords) {
            var i;

            for (i = 0; i < this.units.length; i++) {
                game.map.moveUnit(this.units[i], coords);
            }
        };

        Stack.prototype.add = function (units) {
            var i;

            for (i = 0; i < units.length; i++) {
                this.units.push(units[i]);
                units[i].stack = this;
            }
        };

        Stack.prototype.remove = function (id, activateUnitIfSeparate) {
            if (typeof activateUnitIfSeparate === "undefined") { activateUnitIfSeparate = true; }
            var i;

            for (i = 0; i < this.units.length; i++) {
                if (this.units[i].id === id) {
                    this.units[i].stack = null;
                    this.units.splice(i, 1);
                    break;
                }
            }

            // Don't keep a unit of 1 around
            if (this.units.length === 1) {
                this.separate(activateUnitIfSeparate);
            }
        };

        Stack.prototype.separate = function (activateUnitAtEnd) {
            if (typeof activateUnitAtEnd === "undefined") { activateUnitAtEnd = true; }
            var i, toActivate;

            // Save the first member of this unit to arbitrarily activate at the end
            toActivate = this.units[0];

            for (i = 0; i < this.units.length; i++) {
                this.units[i].stack = null;
            }

            // Delete stack
            if (this.active) {
                game.activeUnit = null;
            }
            delete game.stacks[this.owner][this.id];

            // If desired, activate one of the members of the separateed stack
            if (activateUnitAtEnd) {
                toActivate.activate();
            }
        };

        Stack.prototype.merge = function () {
        };
        return Stack;
    })(BaseUnitOrStack);
    Units.Stack = Stack;

    var Warrior = (function (_super) {
        __extends(Warrior, _super);
        function Warrior() {
            _super.apply(this, arguments);
            this.type = "Warrior";
            this.strength = 2;
            this.currentStrength = 2;
            this.movement = 1;
            this.currentMovement = 1;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn", "sentry"];
        }
        return Warrior;
    })(BaseUnit);
    Units.Warrior = Warrior;

    var Chariot = (function (_super) {
        __extends(Chariot, _super);
        function Chariot() {
            _super.apply(this, arguments);
            this.type = "Chariot";
            this.strength = 4;
            this.currentStrength = 4;
            this.movement = 2;
            this.currentMovement = 2;
            this.landOrSea = "land";
            this.actions = ["fortify", "skipTurn", "sentry"];
        }
        return Chariot;
    })(BaseUnit);
    Units.Chariot = Chariot;

    // Functions for working with units or groups of units
    // Like alt+click
    function addUnitsToNewStack(owner, units) {
        var newUnits, newStack;

        // Separate any current stacks on the tile
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.stack) {
                unit.stack.separate(false);
            }
            if (unit.currentMovement > 0) {
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new stack with all units with currentMovement > 0 and activate it
            newStack = new Units.Stack(owner, newUnits);
            newStack.activate(false);
        }
    }
    Units.addUnitsToNewStack = addUnitsToNewStack;

    // Like ctrl+click
    function addUnitsWithTypeToNewStack(owner, units, type) {
        var newUnits, newStack;

        // Separate any current stacks on this tile involving this type
        newUnits = [];
        units.forEach(function (unit) {
            if (unit.currentMovement > 0 && unit.type === type) {
                if (unit.stack) {
                    unit.stack.separate(false);
                }
                newUnits.push(unit);
            }
        });

        if (newUnits.length > 0) {
            // Make a new stack from all the units of the clicked type with currentMovement > 0
            newStack = new Units.Stack(owner, newUnits);
            newStack.activate(false);
        }
    }
    Units.addUnitsWithTypeToNewStack = addUnitsWithTypeToNewStack;
})(Units || (Units = {}));
///<reference path='Random.ts'/>
///<reference path='Controller.ts'/>
///<reference path='ChromeUI.ts'/>
///<reference path='MapUI.ts'/>
///<reference path='MapMaker.ts'/>
///<reference path='Game.ts'/>
///<reference path='Units.ts'/>
var easystar = new EasyStar.js();

var config = {
    BARB_ID: 0,
    PLAYER_ID: 1,
    UNIT_MOVEMENT_UI_DELAY: 500
};

var game = new Game(1, 20, 40);
var chromeUI = new ChromeUI();
var mapUI = new MapUI();
var controller = new Controller();

for (var i = 0; i < 200; i++) {
    //    new Units.Warrior(config.BARB_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
}
for (var i = 0; i < 1; i++) {
    //    new Units.Warrior(config.PLAYER_ID, [Math.floor(game.map.rows * Math.random()), Math.floor(game.map.cols * Math.random())]);
}

var u1 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
var u2 = new Units.Warrior(config.PLAYER_ID, [10, 20]);
var u3 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
for (i = 0; i < 10; i++) {
    var u4 = new Units.Chariot(config.PLAYER_ID, [10, 20]);
}
new Units.Stack(config.PLAYER_ID, [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]);
[new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])];
new Units.Stack(config.PLAYER_ID, [new Units.Chariot(config.PLAYER_ID, [10, 20]), new Units.Chariot(config.PLAYER_ID, [10, 20])]);

game.newTurn();
//# sourceMappingURL=app.js.map
