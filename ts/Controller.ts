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
            var coords, mouseMoveWhileDown, mouseUp;

            if (e.button === 2 && game.activeUnit) { // Right click only! Active unit only!
                e.preventDefault();

                // Find path to clicked tile
                coords = mapUI.pixelsToCoords(e.layerX, e.layerY);
                game.map.pathFinding(game.activeUnit, coords);
//game.activeUnit.pathFinding(coords);

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
    }

    // if one of your units is on the clicked tile, activate it and DO NOT CENTER THE MAP
    // if one of your units is not on the clicked tile, center the map
    initMapClick() {
        mapUI.canvas.addEventListener("click", function (e) {
            var foundUnit, i, coords, units;

            if (e.button === 0) { // Left click only!
                e.preventDefault();

                coords = mapUI.pixelsToCoords(e.layerX, e.layerY);

                if (game.map.validCoords(coords)) {
                    units = game.getTile(coords).units;
                    foundUnit = false;

                    // This should be made smarter (i.e. pick the strongest unit with moves left - easy if units is sorted by strength by default)
                    for (i = 0; i < units.length; i++) {
                        if (units[i].owner === 1) {
                            units[i].activate(false); // Activate, but don't center map!
                            foundUnit = true;
                            requestAnimationFrame(mapUI.render.bind(mapUI));
                            return;
                        }
                    }

                    // If we made it this far, none of the user's units are on this tile
                    mapUI.goToCoords(coords);
                }
            }
        });

        mapUI.miniCanvas.addEventListener("mousedown", function (e) {
            var coords, miniMapPan, miniMapPanStop;

            if (e.button === 0) { // Left click only!
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
            var clickedGid : number, clickedId : number, clickedOwner : number, el : any, i : number, newGroup : Units.UnitGroup, newUnits : Units.BaseUnit[], units : Units.BaseUnit[], type : string;

            el = <HTMLElement> e.target;
            if (el && el.dataset.id) {
                e.preventDefault();

                // Metadata from clicked icon
                clickedGid = el.dataset.gid !== undefined ? parseInt(el.dataset.gid, 10) : null;
                clickedId = parseInt(el.dataset.id, 10);
                clickedOwner = parseInt(el.dataset.owner, 10);

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
console.log(el.dataset);

                // Handle all the different key modifiers
                if (e.altKey) { // In GNOME, alt+click is captured for window dragging, but alt+ctrl+click works for this
                    // Disband any current groups on the tile
                    newUnits = [];
                    units.forEach(function (unit) {
                        if (unit.unitGroup) {
                            unit.unitGroup.disband(false);
                        }
                        if (unit.currentMovement > 0) {
                            newUnits.push(unit);
                        }
                    });

console.log(newUnits);
                    if (newUnits.length > 0) {
                        // Make a new group with all units with currentMovement > 0 and activate it
                        newGroup = new Units.UnitGroup(clickedOwner, newUnits);
                        newGroup.activate(false);
                    }
                } else if (e.ctrlKey && e.shiftKey) {
                    // If a group is currently active, add all units of the clicked type with currentMovement > 0 to that group
                    // If no group is currently active, create one with all of the units of the clicked type with currentMovement > 0
console.log('ctrl+shift');
                } else if (e.ctrlKey) {
                    type = game.units[clickedOwner][clickedId].type;

                    // Disband any current groups on this tile involving this type
                    newUnits = [];
                    units.forEach(function (unit) {
                        if (unit.currentMovement > 0 && unit.type === type) {
                            if (unit.unitGroup) {
                                unit.unitGroup.disband(false);
                            }
                            newUnits.push(unit);
                        }
                    });

console.log(newUnits);
                    if (newUnits.length > 0) {
                        // Make a new group from all the units of the clicked type with currentMovement > 0
                        newGroup = new Units.UnitGroup(clickedOwner, newUnits);
                        newGroup.activate(false);
                    }
                } else if (e.shiftKey) {
                    if (game.activeUnit instanceof Units.BaseUnit) {
                        // Individual unit is active
                        if (game.activeUnit.id !== clickedId) {
                            // If clicked unit is not the active unit, add it to a new group with clicked unit
                            newGroup = new Units.UnitGroup(clickedOwner, [game.activeUnit, game.units[clickedOwner][clickedId]]);
                            newGroup.activate(false);
                        }
                    } else if (game.activeUnit instanceof Units.UnitGroup) {
                        // Unit group is active
                        if (game.activeUnit === game.units[clickedOwner][clickedId].unitGroup) {
                            // Clicked unit is in the active group, remove it from that group
                            game.activeUnit.remove(clickedId);
                        } else {
                            // Clicked unit is not in the active group, add it to that group
                            game.activeUnit.add([game.units[clickedOwner][clickedId]]);
                        }
                        // Redraw everything, since there is no Unit.activate call here to do that otherwise
                        chromeUI.onUnitActivated();
                        window.requestAnimationFrame(mapUI.render.bind(mapUI));
                    }
                } else {
                    if (clickedGid !== null) {
                        // Clicked unit is in a group
                        if (game.activeUnit.id === clickedGid) {
                            // Clicked unit is member of active group, so disband it and activate clicked unit
                            game.unitGroups[clickedOwner][clickedGid].disband(false);
                            game.units[clickedOwner][clickedId].activate(false);
                        } else {
                            // Clicked unit is in an inactive group, so activate the group
                            game.unitGroups[clickedOwner][clickedGid].activate(false);
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

            el = <HTMLElement> e.target;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon(parseInt(el.dataset.owner, 10), parseInt(el.dataset.id, 10));
            }
        });
        chromeUI.elBottomUnits.addEventListener("mouseout", function (e) {
            var el;

            el = <HTMLElement> e.target;
            if (el && el.dataset.id) {
                e.preventDefault();
                chromeUI.onHoverUnitIcon();
            }
        });
    }
}