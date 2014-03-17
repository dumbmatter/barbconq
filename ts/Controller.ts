// Handle user input from keyboard and mouse, and route it to the appropriate place based on the state of the game

class Controller {
    KEYS = {
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
    keysPressed = {
        38: false,
        39: false,
        40: false,
        37: false
    };

    hoveredTile : number[];

    constructor() {
        // Start listening for various kinds of user input
        this.initMapPanning();
        this.initUnitActions();
        this.initUnitIcons();
        this.initHoverTile();
        this.initMapClick();
        this.initGameActions();
    }

    initMapPanning() {
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
    }

    initUnitActions() {
        document.addEventListener("keydown", function (e) {
            var activeUnit : Units.BaseUnitOrStack;

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
                    mapUI.goToCoords(activeUnit.coords)
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
            var coords : number[], mouseMoveWhileDown, mouseUp;

            if (e.button === 2 && game.activeUnit) { // Right click only! Active unit only!
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
                    var coordsNew : number[];

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
                    var coordsNew : number[];

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

            el = <HTMLElement> e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                game.activeUnit[el.dataset.action]();
            }
        });
        chromeUI.elBottomActions.addEventListener("mouseover", function (e) {
            var el;

            el = <HTMLElement> e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                chromeUI.onHoverAction(el.dataset.action);
            }
        });
        chromeUI.elBottomActions.addEventListener("mouseout", function (e) {
            var el;

            el = <HTMLElement> e.target;
            if (el && el.dataset.action) {
                e.preventDefault();
                chromeUI.onHoverAction();
            }
        });
    }

    initHoverTile() {
        this.hoveredTile = [-1, -1]; // Dummy value for out of map

        mapUI.canvas.addEventListener("mousemove", function (e) {
            var coords : number[];

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
    }

    // if one of your units is on the clicked tile, activate it and DO NOT CENTER THE MAP
    // if one of your units is not on the clicked tile, center the map
    initMapClick() {
        mapUI.canvas.addEventListener("click", function (e) {
            var i : number, coords : number[], currentMetric : number, maxMetric : number, unit, units : Units.BaseUnit[];

            if (e.button === 0) { // Left click only!
                e.preventDefault();

                coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

                if (game.map.validCoords(coords)) {
                    units = game.getTile(coords).units;

                    // Find the strongest unit with moves left
                    maxMetric = -Infinity;
                    for (i = 0; i < units.length; i++) {
                         // Sort by criteria: 1. if active already; 2. if currentMovement > 0; 3. currentStrength
                        currentMetric = units[i].currentStrength;
                        if (units[i].currentMovement > 0) { currentMetric += 100; }
                        if (units[i].active || (units[i].stack && units[i].stack.active)) { currentMetric += 1000; }

                        if (currentMetric > maxMetric) {
                            unit = units[i];
                            maxMetric = currentMetric;
                        }
                    }

                    if (unit) {
                        if (e.altKey) { // In GNOME, alt+click is captured for window dragging, but alt+ctrl+click works for this
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
            var coords : number[], miniMapPan, miniMapPanStop;

            if (e.button === 0) { // Left click only!
                e.preventDefault();

                coords = mapUI.miniPixelsToCoords(e.layerX, e.layerY);

                if (game.map.validCoords(coords)) {
                    mapUI.goToCoords(coords);
                }

                // Pan as click is held and mouse is moved
                miniMapPan = function (e) {
                    var coords : number[];

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
    }

    initGameActions() {
        document.addEventListener("keydown", function (e) {
            if (e.keyCode === this.KEYS.ENTER) {
                game.newTurn();
            }
        }.bind(this));
    }

    initUnitIcons() {
        // Unit icons at the bottom
        chromeUI.elBottomUnits.addEventListener("click", function (e) {
            var activeUnit : Units.BaseUnit, activeStack : Units.Stack, clickedId : number, clickedOwner : number, clickedSid : number, el : any, i : number, newStack : Units.Stack, newUnits : Units.BaseUnit[], units : Units.BaseUnit[], type : string;

            el = <HTMLElement> e.target;
            el = <any> el.parentNode;
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
                if (e.altKey) { // In GNOME, alt+click is captured for window dragging, but alt+ctrl+click works for this
                    Units.addUnitsToNewStack(clickedOwner, units);
                } else if (e.ctrlKey && e.shiftKey) {
                    type = game.units[clickedOwner][clickedId].type;

                    if (game.activeUnit instanceof Units.BaseUnit) {
                        // Individual unit is active
                        // Create a stack with the active unit and all units of the clicked type with currentMovement > 0

                        activeUnit = <Units.BaseUnit> game.activeUnit; // So TypeScript knows it's not a stack


                        // Find all units of type
                        newUnits = [activeUnit];
                        units.forEach(function (unit) {
                            if (unit.currentMovement > 0 && unit.type === type && unit.id !== activeUnit.id) { // Skip activeUnit!
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

                        activeStack = <Units.Stack> game.activeUnit; // So TypeScript knows it's not an individual unit

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
                            newStack = new Units.Stack(clickedOwner, [<Units.BaseUnit> game.activeUnit, game.units[clickedOwner][clickedId]]);
                            newStack.activate(false);
                        }
                    } else if (game.activeUnit instanceof Units.Stack) {
                        activeStack = <Units.Stack> game.activeUnit; // So TypeScript knows it's not an individual unit
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

            el = <HTMLElement> e.target;
            el = <any> el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon(parseInt(el.dataset.owner, 10), parseInt(el.dataset.id, 10));
            }
        });
        chromeUI.elBottomUnits.addEventListener("mouseout", function (e) {
            var el;

            el = <HTMLElement> e.target;
            el = <any> el.parentNode;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon();
            }
        });
    }
}