class IBoardData {
}
class Board {
    constructor() {
        this._tiles = [];
    }
    initialize(r) {
        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                if (i * j < 0 || Math.abs(i) + Math.abs(j) <= r) {
                    this._tiles.push(new Tile(i, j));
                }
            }
        }
    }
    getTileByIJ(i, j) {
        return this._tiles.find(t => { return t.i === i && t.j === j; });
    }
    serialize() {
        let data = {
            tiles: []
        };
        for (let i = 0; i < this._tiles.length; i++) {
            data.tiles.push(this._tiles[i]);
        }
        return data;
    }
    static deserialize(data, board) {
        for (let i = 0; i < data.tiles.length; i++) {
            board._tiles.push(Tile.deserialize(data.tiles[i]));
        }
        return board;
    }
}
/// <reference path="../Common/Board.ts"/>
class AlphaBoard extends Board {
    constructor() {
        super();
        this._hexagon = [];
        for (let i = 0; i < 6; i++) {
            this._hexagon.push(new BABYLON.Vector3(0.47 * Math.cos(i * Math.PI / 3), 0, 0.47 * Math.sin(i * Math.PI / 3)));
        }
        this._hexagon.push(this._hexagon[0]);
    }
    updateMesh(scene) {
        if (this._boardMesh) {
            this._boardMesh.dispose();
        }
        let lines = [];
        for (let i = 0; i < this._tiles.length; i++) {
            let tile = this._tiles[i];
            let line = [];
            this._hexagon.forEach(p => {
                let pp = p.clone();
                pp.x += 0.75 * tile.i;
                pp.z += (tile.i * 0.5 + tile.j) * COS30;
                line.push(pp);
            });
            lines.push(line);
        }
        this._boardMesh = BABYLON.MeshBuilder.CreateLineSystem("board", {
            lines: lines
        }, scene);
        this._boardMesh.isPickable = false;
    }
}
class AlphaCamera extends BABYLON.ArcRotateCamera {
    constructor() {
        super("alpha-camera", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), Main.Scene);
        this.currentRadius = 4;
        this._currentTargetPos = BABYLON.Vector3.Zero();
        this._update = () => {
            if (this.currentTarget instanceof BABYLON.Vector3) {
                this._currentTargetPos.copyFrom(this.currentTarget);
            }
            else if (this.currentTarget instanceof BABYLON.AbstractMesh) {
                this._currentTargetPos.copyFrom(this.currentTarget.position);
            }
            else {
                return;
            }
            BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
            this.radius = this.radius * 0.95 + this.currentRadius * 0.05;
            let dir = 3 * Math.PI / 2 - this.alpha;
            if (dir !== this._lastDir) {
                this._lastDir = dir;
                AlphaClient.Instance.forEachFighter((f) => {
                    f.rotateHPShieldMesh(dir);
                });
            }
        };
        this.setPosition(new BABYLON.Vector3(-0, 5, -10));
        this.attachControl(Main.Canvas, true);
        this.lowerRadiusLimit = 1;
        this.upperRadiusLimit = 40;
        this.wheelPrecision *= 8;
        Main.Camera = this;
        Main.Scene.onBeforeRenderObservable.add(this._update);
    }
}
class Client {
    constructor(_team) {
        this._team = _team;
        this._fighters = [];
        this._fighterOrder = [];
    }
    connectGame(game) {
        this.game = game;
    }
    getFighterByID(id) {
        return this._fighters.find(f => { return f.id === id; });
    }
    getActiveFighter() {
        let activeFighterId = this._fighterOrder[0];
        if (isFinite(activeFighterId)) {
            let activeFighter = this.getFighterByID(activeFighterId);
            return activeFighter;
        }
    }
    initializeBoard(boardData) {
        if (!this._board) {
            this._board = new Board();
        }
        Board.deserialize(boardData, this._board);
        this.onBoardInitialized();
    }
    onBoardInitialized() { }
    createFighter(data) {
        let fighter = new Fighter();
        Fighter.deserialize(data, fighter);
        return fighter;
    }
    addFighters(fighterDatas) {
        let fightersAdded = [];
        for (let i = 0; i < fighterDatas.length; i++) {
            let data = fighterDatas[i];
            let fighter = this.createFighter(data);
            let tile = this._board.getTileByIJ(data.i, data.j);
            if (tile) {
                tile.setFighter(fighter);
            }
            fighter.initialize();
            this._fighters.push(fighter);
            fightersAdded.push(fighter);
        }
        this.onFightersAdded(fightersAdded);
    }
    onFightersAdded(fightersAdded) { }
    updateFightersOrder(fightersOrder) {
        this._fighterOrder = [];
        for (let i = 0; i < fightersOrder.length; i++) {
            this._fighterOrder[i] = fightersOrder[i];
        }
        console.log(this._fighterOrder);
        this.onFighterOrderUpdated();
    }
    onFighterOrderUpdated() { }
    initializeTurn() {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            fighter.hasMoved = false;
            fighter.hasAttacked = false;
            fighter.shield = Math.min(fighter.shieldCapacity, fighter.shield + fighter.shieldSpeed);
        }
        this.onTurnInitialized();
    }
    onTurnInitialized() { }
    ;
    initializePhase() {
        this.onPhaseInitialized();
    }
    onPhaseInitialized() { }
    ;
    moveFighter(fighterId, tileI, tileJ) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            let tile = this._board.getTileByIJ(tileI, tileJ);
            if (tile) {
                this.onBeforeFighterMoved(fighter, tileI, tileJ);
                tile.setFighter(fighter);
                fighter.hasMoved = true;
                this.onFighterMoved(fighter);
            }
        }
    }
    onBeforeFighterMoved(fighter, tileI, tileJ) { }
    onFighterMoved(fighter) { }
    attackFighter(fighterId, targetId, result) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            fighter.hasAttacked = true;
            let target = this.getFighterByID(targetId);
            if (target) {
                this.onFighterHasAttacked(fighter, target, result);
            }
        }
    }
    onFighterHasAttacked(fighter, target, result) { }
    ;
    updateFighterHPShield(fighterId, hp, shield) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            fighter.hp = hp;
            fighter.shield = shield;
            if (fighter.hp <= 0) {
                fighter.kill();
                let fighterIndex = this._fighters.indexOf(fighter);
                if (fighterIndex !== -1) {
                    this._fighters.splice(fighterIndex, 1);
                }
                let fighterIdIndex = this._fighterOrder.indexOf(fighterId);
                if (fighterIdIndex !== -1) {
                    this._fighterOrder.splice(fighterIdIndex, 1);
                }
            }
            this.onFighterHPShieldUpdated(fighter);
        }
    }
    onFighterHPShieldUpdated(fighter) { }
    ;
    killFighter(fighterId) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            this.onFighterKilled(fighter);
        }
    }
    onFighterKilled(fighter) { }
    ;
    delayFighterPhase(fighterId) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            this.onFighterPhaseDelayed(fighter);
        }
    }
    onFighterPhaseDelayed(fighter) { }
    endFighterPhase(fighterId) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            this.onFighterPhaseEnded(fighter);
        }
    }
    onFighterPhaseEnded(fighter) { }
    endTurn() {
        this.onTurnEnded();
    }
    onTurnEnded() { }
    ;
    endGame(winner) { }
}
// Can implement the following in children
/*
    protected onBoardInitialized(): void {}
    protected onFightersAdded(fightersAdded: Fighter[]): void {}
    protected onFighterOrderUpdated(): void {}
    protected onTurnInitialized(): void {};
    protected onPhaseInitialized(): void {};
    protected onFighterMoved(fighter: Fighter): void {}
    protected onFighterHasAttacked(fighter: Fighter, target: Fighter) {};
    protected onFighterWounded(fighter: Fighter, amount: number) {};
    protected onFighterKilled(fighter: Fighter) {};
    protected onFighterPhaseDelayed(fighter: Fighter): void {}
    protected onFighterPhaseEnded(fighter: Fighter): void {}
    protected onTurnEnded(): void {};
*/ 
/// <reference path="Client.ts"/>
class AlphaClient extends Client {
    get alphaBoard() {
        if (this._board instanceof AlphaBoard) {
            return this._board;
        }
    }
    constructor(team) {
        super(team);
        AlphaClient.Instance = this;
        this._board = new AlphaBoard();
        new AlphaFighterSelector();
    }
    findFighter(filter) {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            if (fighter instanceof AlphaFighter) {
                if (filter(fighter)) {
                    return fighter;
                }
            }
        }
    }
    forEachFighter(callback) {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            if (fighter instanceof AlphaFighter) {
                callback(fighter);
            }
        }
    }
    onBoardInitialized() {
        this.alphaBoard.updateMesh(Main.Scene);
    }
    createFighter(data) {
        let fighter = new AlphaFighter();
        Fighter.deserialize(data, fighter);
        return fighter;
    }
    onFightersAdded(fightersAdded) {
        for (let i = 0; i < fightersAdded.length; i++) {
            let fighter = fightersAdded[i];
            fighter.updateMesh(Main.Scene);
        }
    }
    onFighterOrderUpdated() {
        let container = document.getElementById("fighters-order");
        container.innerHTML = "";
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            fighter.updateTurnStatus(-1);
        }
        for (let i = 0; i < this._fighterOrder.length; i++) {
            let fighterId = this._fighterOrder[i];
            let fighter = this.getFighterByID(fighterId);
            fighter.updateTurnStatus(i);
            let dElement = document.createElement("div");
            dElement.classList.add("fighter-order-element");
            dElement.style.color = "white";
            let idElement = document.createElement("div");
            idElement.textContent = fighter.pilot.name + " #" + fighter.id;
            dElement.appendChild(idElement);
            let speedElement = document.createElement("div");
            speedElement.textContent = "SPEED = " + fighter.speed;
            dElement.appendChild(speedElement);
            let teamElement = document.createElement("div");
            teamElement.textContent = "TEAM = " + fighter.team;
            dElement.appendChild(teamElement);
            let hasMoved = document.createElement("div");
            hasMoved.textContent = "HAS MOVED = " + fighter.hasMoved;
            dElement.appendChild(hasMoved);
            if (fighter.team === 0) {
                dElement.style.borderColor = "blue";
            }
            else if (fighter.team === 1) {
                dElement.style.borderColor = "red";
            }
            container.appendChild(dElement);
        }
    }
    onTurnInitialized() {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            fighter.updateHitPointMesh();
        }
    }
    ;
    onPhaseInitialized() {
        let activeFighter = this.getActiveFighter();
        if (activeFighter) {
            Main.Camera.currentTarget = activeFighter.transformMesh;
            Main.Camera.currentRadius = 5;
            if (activeFighter.team === this._team) {
                activeFighter.showText(SpeechSituation.Ready);
                activeFighter.showUI();
            }
        }
    }
    ;
    onBeforeFighterMoved(fighter, tileI, tileJ) {
        if (fighter instanceof AlphaFighter) {
            fighter.showText(SpeechSituation.Move);
            let x0 = fighter.transformMesh.position.x;
            let z0 = fighter.transformMesh.position.z;
            let x1 = 0.75 * tileI;
            let z1 = (tileI * 0.5 + tileJ) * COS30;
            let length = Math.sqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0));
            let moveAnimation = () => {
                let dir = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, fighter.fighterMesh.getWorldMatrix());
                dir.normalize();
                let targetDir2D = new BABYLON.Vector2(x1, z1);
                targetDir2D.x -= fighter.transformMesh.position.x;
                targetDir2D.y -= fighter.transformMesh.position.z;
                let dist = targetDir2D.length();
                let a = Math2D.AngleFromTo(targetDir2D, new BABYLON.Vector2(0, 1), true);
                if (dist > 0.01) {
                    let dA = Math2D.StepFromToCirular(fighter.fighterMesh.rotation.y, a, Math.PI / 40);
                    fighter.fighterMesh.rotation.y = dA;
                    fighter.transformMesh.position.x += dir.x * Math.min(dist, length) / 30;
                    fighter.transformMesh.position.z += dir.z * Math.min(dist, length) / 30;
                    requestAnimationFrame(moveAnimation);
                }
                else {
                    fighter.transformMesh.position.x = x1;
                    fighter.transformMesh.position.z = z1;
                }
            };
            moveAnimation();
        }
    }
    onFighterMoved(fighter) {
        if (fighter instanceof AlphaFighter) {
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterMoved();
            }
        }
    }
    onFighterHasAttacked(fighter, target, result) {
        if (fighter instanceof AlphaFighter && target instanceof AlphaFighter) {
            fighter.showText(SpeechSituation.Attack);
            let aimAnimation = () => {
                let dir = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, fighter.fighterMesh.getWorldMatrix());
                dir.normalize();
                let targetDir2D = new BABYLON.Vector2(target.transformMesh.position.x, target.transformMesh.position.z);
                targetDir2D.x -= fighter.transformMesh.position.x;
                targetDir2D.y -= fighter.transformMesh.position.z;
                let a = Math2D.AngleFromTo(targetDir2D, new BABYLON.Vector2(0, 1), false);
                if (!Math2D.AreEqualsCircular(a, fighter.fighterMesh.rotation.y, Math.PI / 120)) {
                    let dA = Math2D.StepFromToCirular(fighter.fighterMesh.rotation.y, a, Math.PI / 120);
                    fighter.fighterMesh.rotation.y = dA;
                    requestAnimationFrame(aimAnimation);
                }
                else {
                    console.log("Shoot !");
                    fighter.fighterMesh.rotation.y = a;
                    fighter.shoot(target.transformMesh.position);
                }
            };
            aimAnimation();
            setTimeout(() => {
                if (result === 0) {
                    fighter.showText(SpeechSituation.AttackMiss);
                }
                if (result === 1) {
                    fighter.showText(SpeechSituation.AttackSuccess);
                }
                if (result === 2) {
                    fighter.showText(SpeechSituation.AttackCritical);
                }
                if (result === 3) {
                    fighter.showText(SpeechSituation.AttackKill);
                }
            }, 3000);
            fighter.updateMesh(Main.Scene);
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterAttacked();
            }
        }
    }
    onFighterHPShieldUpdated(fighter) {
        if (fighter instanceof AlphaFighter) {
            if (fighter.hp <= 0) {
                fighter.transformMesh.dispose();
            }
            else {
                fighter.updateHitPointMesh();
            }
        }
    }
    ;
    onFighterKilled(fighter) { }
    ;
    onFighterPhaseDelayed(fighter) {
        if (fighter instanceof AlphaFighter) {
            if (fighter.team === this._team) {
                fighter.showText(SpeechSituation.Hold);
            }
            fighter.hideReachableTiles();
        }
    }
    onFighterPhaseEnded(fighter) {
        if (fighter instanceof AlphaFighter) {
            if (fighter.team === this._team) {
                fighter.showText(SpeechSituation.Pass);
            }
            fighter.hideUI();
            fighter.hideReachableTiles();
        }
    }
}
class IFighterData {
}
class Fighter {
    constructor(team) {
        this.speed = 50;
        this.stamina = 10;
        this.shieldCapacity = 5;
        this.shieldSpeed = 1;
        this.armor = 0;
        this.moveRange = 3;
        this.attackRange = 1;
        this.attackPower = 5;
        this.accuracy = 95;
        this.staticAttack = false;
        this.criticalRate = 5;
        this.dodgeRate = 5;
        this.hp = 10;
        this.shield = 5;
        this.hasMoved = false;
        this.hasAttacked = false;
        this.isAlive = true;
        this.id = Fighter.ID;
        Fighter.ID += 1;
        this.team = team;
    }
    get tileI() {
        if (this._tile) {
            return this._tile.i;
        }
    }
    get tileJ() {
        if (this._tile) {
            return this._tile.j;
        }
    }
    initialize() {
        this.spaceship.initialize();
        this.pilot.initialize();
    }
    kill() {
        this.isAlive = false;
        if (this._tile) {
            this._tile.removeFighter(this);
        }
    }
    setTile(t) {
        if (this._tile) {
            this._tile.removeFighter(this);
        }
        if (t !== this._tile) {
            this._tile = t;
            this._tile.setFighter(this);
        }
    }
    serialize() {
        let data = {
            id: this.id,
            team: this.team,
            pilot: this.pilot.serialize(),
            spaceship: this.spaceship.serialize()
        };
        if (this._tile) {
            data.i = this._tile.i;
            data.j = this._tile.j;
        }
        return data;
    }
    static deserialize(data, fighter) {
        fighter.id = data.id;
        fighter.team = data.team;
        fighter.pilot = new Pilot(fighter);
        Pilot.Deserialize(data.pilot, fighter.pilot);
        fighter.spaceship = new Spaceship(fighter);
        Spaceship.Deserialize(data.spaceship, fighter.spaceship);
        return fighter;
    }
    static CreateRandom(team) {
        let fighter = new Fighter(team);
        fighter.pilot = new Pilot(fighter);
        Pilot.Deserialize(Pilot.RandomData(), fighter.pilot);
        fighter.spaceship = new Spaceship(fighter);
        Spaceship.Deserialize(Spaceship.RandomData(), fighter.spaceship);
        return fighter;
    }
}
Fighter.ID = 0;
class ActionPanel extends HTMLElement {
    constructor() {
        super();
        this._initialized = false;
        this._update = () => {
            if (!this._target) {
                return;
            }
            let dView = this._target.position.subtract(Main.Camera.position);
            let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
            n.normalize();
            n.scaleInPlace(-0.5);
            let p = this._target.position.add(n);
            let screenPos = BABYLON.Vector3.Project(p, BABYLON.Matrix.Identity(), this._target.getScene().getTransformMatrix(), Main.Camera.viewport.toGlobal(1, 1));
            this.style.left = (screenPos.x * Main.Canvas.width) + "px";
            this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height - this.clientHeight * 0.5) + "px";
        };
    }
    static CreateActionPanel() {
        let panel = document.createElement("action-panel");
        document.body.appendChild(panel);
        return panel;
    }
    connectedCallback() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        this.moveButton = this.addButton("MOVE");
        this.attackButton = this.addButton("ATTACK");
        this.holdButton = this.addButton("HOLD");
        this.passButton = this.addButton("PASS");
        this.backButton = this.addButton("BACK");
    }
    dispose() {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        document.body.removeChild(this);
    }
    setTarget(mesh) {
        this.style.position = "fixed";
        this._target = mesh;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }
    addButton(value, onClickCallback) {
        let inputElement = document.createElement("input");
        inputElement.classList.add("action-button");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        if (onClickCallback) {
            inputElement.onclick = onClickCallback;
        }
        this.appendChild(inputElement);
        return inputElement;
    }
}
window.customElements.define("action-panel", ActionPanel);
class SpacePanel extends HTMLElement {
    constructor() {
        super();
        this._initialized = false;
        this._htmlLines = [];
        this._isVisible = true;
        this._update = () => {
            if (!this._target) {
                return;
            }
            let dView = this._target.position.subtract(Main.Camera.position);
            let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
            n.normalize();
            n.scaleInPlace(-0.5);
            let p = this._target.position.add(n);
            let screenPos = BABYLON.Vector3.Project(p, BABYLON.Matrix.Identity(), this._target.getScene().getTransformMatrix(), Main.Camera.viewport.toGlobal(1, 1));
            this.style.left = (screenPos.x * Main.Canvas.width) + "px";
            this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height - this.clientHeight * 0.5) + "px";
        };
    }
    static CreateSpacePanel() {
        let panel = document.createElement("space-panel");
        document.body.appendChild(panel);
        return panel;
    }
    connectedCallback() {
        if (this._initialized) {
            return;
        }
        this._innerBorder = document.createElement("div");
        this._innerBorder.classList.add("space-panel-inner-border");
        this.appendChild(this._innerBorder);
        this._toggleVisibilityInput = document.createElement("button");
        this._toggleVisibilityInput.classList.add("space-panel-toggle-visibility");
        this._toggleVisibilityInput.textContent = "^";
        this._toggleVisibilityInput.addEventListener("click", () => {
            if (this._isVisible) {
                this.hide();
            }
            else {
                this.show();
            }
        });
        this._innerBorder.appendChild(this._toggleVisibilityInput);
        this._initialized = true;
    }
    dispose() {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        document.body.removeChild(this);
    }
    show() {
        this._toggleVisibilityInput.textContent = "^";
        this._isVisible = true;
        console.log("SHOW");
        this._htmlLines.forEach((l) => {
            l.style.display = "block";
        });
    }
    hide() {
        this._toggleVisibilityInput.textContent = "v";
        this._isVisible = false;
        console.log("HIDE");
        this._htmlLines.forEach((l) => {
            l.style.display = "none";
        });
    }
    setTarget(mesh) {
        this.style.position = "fixed";
        this._target = mesh;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }
    addTitle1(title) {
        let titleLine = document.createElement("div");
        titleLine.classList.add("space-title-1-line");
        let e = document.createElement("h1");
        e.classList.add("space-title-1");
        e.textContent = title;
        titleLine.appendChild(e);
        let eShadow = document.createElement("span");
        eShadow.classList.add("space-title-1-shadow");
        eShadow.textContent = title;
        titleLine.appendChild(eShadow);
        this._innerBorder.appendChild(titleLine);
    }
    addTitle2(title) {
        let e = document.createElement("h2");
        e.classList.add("space-title-2");
        e.textContent = title;
        this._innerBorder.appendChild(e);
        this._htmlLines.push(e);
    }
    addNumberInput(label, value, onInputCallback, precision = 1) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-number");
        inputElement.setAttribute("type", "number");
        inputElement.value = value.toFixed(precision);
        let step = 1 / (Math.pow(2, Math.round(precision)));
        inputElement.setAttribute("step", step.toString());
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                let v = parseFloat(ev.srcElement.value);
                if (isFinite(v)) {
                    if (onInputCallback) {
                        onInputCallback(v);
                    }
                }
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addTextInput(label, text, onInputCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-text");
        inputElement.setAttribute("type", "text");
        inputElement.value = text;
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                if (onInputCallback) {
                    onInputCallback(ev.srcElement.value);
                }
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addLargeButton(value, onClickCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-lg");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        inputElement.addEventListener("click", () => {
            onClickCallback();
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addConditionalButton(label, value, onClickCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-inline");
        inputElement.setAttribute("type", "button");
        inputElement.value = value();
        inputElement.addEventListener("click", () => {
            onClickCallback();
            inputElement.value = value();
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addMediumButtons(value1, onClickCallback1, value2, onClickCallback2) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement1 = document.createElement("input");
        inputElement1.classList.add("space-button");
        inputElement1.setAttribute("type", "button");
        inputElement1.value = value1;
        inputElement1.addEventListener("click", () => {
            onClickCallback1();
        });
        lineElement.appendChild(inputElement1);
        let inputs = [inputElement1];
        if (value2 && onClickCallback2) {
            let inputElement2 = document.createElement("input");
            inputElement2.classList.add("space-button");
            inputElement2.setAttribute("type", "button");
            inputElement2.value = value2;
            inputElement2.addEventListener("click", () => {
                onClickCallback2();
            });
            lineElement.appendChild(inputElement2);
            inputs.push(inputElement2);
        }
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputs;
    }
    addCheckBox(label, value, onToggleCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-toggle");
        inputElement.setAttribute("type", "checkbox");
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                onToggleCallback(ev.srcElement.checked);
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
}
window.customElements.define("space-panel", SpacePanel);
class SpacePanelLabel extends HTMLElement {
    constructor() {
        super();
    }
}
window.customElements.define("space-panel-label", SpacePanelLabel);
/// <reference path="../Common/Fighter.ts"/>
/// <reference path="./SpacePanel.ts"/>
class AlphaFighterSelector {
    constructor() {
        this.overloadPointerUpCallback = undefined;
        AlphaFighterSelector._Instance = this;
        Main.Scene.onPointerObservable.add((eventData) => {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                let pickedMesh = eventData.pickInfo.pickedMesh;
                if (pickedMesh && pickedMesh.parent) {
                    let fighter = AlphaClient.Instance.findFighter(f => { return f.transformMesh === pickedMesh || f.transformMesh === pickedMesh.parent; });
                    if (fighter) {
                        if (this.overloadPointerUpCallback) {
                            this.overloadPointerUpCallback(fighter);
                            this.overloadPointerUpCallback = undefined;
                        }
                        else {
                            this.setSelectedFighter(fighter);
                        }
                    }
                }
            }
        });
    }
    static get Instance() {
        if (!AlphaFighterSelector._Instance) {
            AlphaFighterSelector._Instance = new AlphaFighterSelector();
        }
        return AlphaFighterSelector._Instance;
    }
    setSelectedFighter(fighter) {
        if (fighter !== this.selectedFighter) {
            if (this.selectedFighter) {
                this.selectedFighter.unselect();
            }
            this.selectedFighter = fighter;
            if (this.selectedFighter) {
                this.selectedFighter.select();
            }
        }
    }
}
class AlphaFighter extends Fighter {
    constructor(team) {
        super(team);
        this._reacheableTilesMeshes = [];
        this.nature = PilotNature.Professional;
        this.clearSpeechBubbleTimeout = -1;
        if (Math.random() < 0.5) {
            this.nature = PilotNature.Cool;
        }
        PilotSpeech.LoadProfessionalSpeeches();
        PilotSpeech.LoadCoolSpeeches();
        setInterval(() => {
            this.updateHitPointMesh();
        }, 1000);
    }
    updateMesh(scene) {
        if (!this.transformMesh) {
            this.transformMesh = new BABYLON.Mesh("fighter-" + this.id);
        }
        if (!this.fighterMesh) {
            this.fighterMesh = new SpaceShip();
            this.fighterMesh.name = "Demo";
            this.fighterMesh.initialize({
                type: "root",
                name: this.spaceship.body.reference,
                children: [
                    {
                        type: "wingL",
                        name: this.spaceship.wingL.reference
                    },
                    {
                        type: "wingR",
                        name: this.spaceship.wingR.reference
                    }
                ]
            }, "#ffffff", "#505050");
            this.fighterMesh.scaling.copyFromFloats(0.15, 0.15, 0.15);
            this.fighterMesh.parent = this.transformMesh;
            this.fighterMesh.position.y = 0.25;
        }
        if (!this._turnStatusMesh) {
            this._turnStatusMesh = BABYLON.MeshBuilder.CreateIcoSphere("turn-status-" + this.id, {
                radius: 0.2,
                subdivisions: 2
            }, Main.Scene);
            this._turnStatusMesh.parent = this.fighterMesh;
            this._turnStatusMesh.position.y = 1;
        }
        if (!this._teamIndicatorMesh) {
            this._teamIndicatorMesh = BABYLON.MeshBuilder.CreateGround("team-indicator-" + this.id, { width: 0.7, height: 0.7 }, Main.Scene);
            this._teamIndicatorMesh.parent = this.transformMesh;
            let material = new BABYLON.StandardMaterial("base-material", Main.Scene);
            material.diffuseTexture = new BABYLON.Texture("./datas/textures/base-blue.png", Main.Scene);
            material.diffuseTexture.hasAlpha = true;
            material.useAlphaFromDiffuseTexture = true;
            material.emissiveColor.copyFromFloats(1, 1, 1);
            material.specularColor.copyFromFloats(0, 0, 0);
            this._teamIndicatorMesh.material = material;
        }
        if (!this._hpLeftMesh) {
            this._hpLeftMesh = new BABYLON.Mesh("hp-left-" + this.id);
            this._hpLeftMesh.parent = this._teamIndicatorMesh;
            this._hpLeftMesh.material = Main.greenMaterial;
        }
        if (!this._hpLostMesh) {
            this._hpLostMesh = new BABYLON.Mesh("hp-lost-" + this.id);
            this._hpLostMesh.parent = this._teamIndicatorMesh;
            this._hpLostMesh.material = Main.redMaterial;
        }
        if (!this._shieldLeftMesh) {
            this._shieldLeftMesh = new BABYLON.Mesh("shield-left-" + this.id);
            this._shieldLeftMesh.parent = this._teamIndicatorMesh;
            this._shieldLeftMesh.material = Main.cyanMaterial;
        }
        if (!this._shieldLostMesh) {
            this._shieldLostMesh = new BABYLON.Mesh("shield-lost-" + this.id);
            this._shieldLostMesh.parent = this._teamIndicatorMesh;
            this._shieldLostMesh.material = Main.whiteMaterial;
        }
        if (!this._selectionMesh) {
            let lines = [[], []];
            for (let i = 0; i <= 32; i++) {
                let p = new BABYLON.Vector3(Math.cos(i / 24 * Math.PI * 2), 0, Math.sin(i / 24 * Math.PI * 2));
                lines[0].push(p.scale(0.37));
                lines[1].push(p.scale(0.24).addInPlaceFromFloats(0, 0, 0.05));
            }
            this._selectionMesh = BABYLON.MeshBuilder.CreateLineSystem("selection-mesh-" + this.id, {
                lines: lines
            }, Main.Scene);
            this._selectionMesh.parent = this._teamIndicatorMesh;
            this._selectionMesh.isVisible = false;
        }
        this.transformMesh.position.x = 0.75 * this._tile.i;
        this.transformMesh.position.z = (this._tile.i * 0.5 + this._tile.j) * COS30;
        this.updateHitPointMesh();
    }
    rotateHPShieldMesh(r) {
        this._teamIndicatorMesh.rotation.y = r;
    }
    updateHitPointMesh() {
        let ratioHP = this.hp / this.stamina;
        if (ratioHP <= 0) {
            this._hpLeftMesh.isVisible = false;
            this._hpLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPVertexData(0, 1).applyToMesh(this._hpLostMesh);
        }
        else if (ratioHP >= 1) {
            this._hpLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPVertexData(0, 1).applyToMesh(this._hpLeftMesh);
            this._hpLostMesh.isVisible = false;
        }
        else {
            this._hpLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPVertexData(0, 1 - ratioHP).applyToMesh(this._hpLostMesh);
            this._hpLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPVertexData(1 - ratioHP, 1).applyToMesh(this._hpLeftMesh);
        }
        let ratioShield = 0;
        if (this.shieldCapacity > 0) {
            ratioShield = this.shield / this.shieldCapacity;
        }
        if (ratioShield <= 0) {
            this._shieldLeftMesh.isVisible = false;
            this._shieldLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateShieldVertexData(0, 1).applyToMesh(this._shieldLostMesh);
        }
        else if (ratioShield >= 1) {
            this._shieldLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateShieldVertexData(0, 1).applyToMesh(this._shieldLeftMesh);
            this._shieldLostMesh.isVisible = false;
        }
        else {
            this._shieldLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateShieldVertexData(ratioShield, 1).applyToMesh(this._shieldLostMesh);
            this._shieldLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateShieldVertexData(0, ratioShield).applyToMesh(this._shieldLeftMesh);
        }
    }
    updateTurnStatus(status) {
        if (status < 0) {
            this._turnStatusMesh.material = Main.greyMaterial;
        }
        else if (status === 0) {
            this._turnStatusMesh.material = Main.greenMaterial;
        }
        else if (status > 0) {
            this._turnStatusMesh.material = Main.yellowMaterial;
        }
    }
    select() {
        this._selectionMesh.isVisible = true;
        this.showText(SpeechSituation.Selected);
    }
    unselect() {
        this._selectionMesh.isVisible = false;
    }
    showUI() {
        this.hideUI();
        AlphaFighter.ActionPanel = ActionPanel.CreateActionPanel();
        AlphaFighter.ActionPanel.moveButton.onclick = () => {
            if (!this.hasMoved) {
                AlphaFighter.ActionPanel.moveButton.style.display = "none";
                AlphaFighter.ActionPanel.attackButton.style.display = "none";
                AlphaFighter.ActionPanel.holdButton.style.display = "none";
                AlphaFighter.ActionPanel.passButton.style.display = "none";
                AlphaFighter.ActionPanel.backButton.style.display = "";
                AlphaFighter.ActionPanel.backButton.onclick = () => {
                    this.onAfterFighterMoved();
                };
                this.showReachableTiles();
            }
        };
        AlphaFighter.ActionPanel.attackButton.onclick = () => {
            if (!this.hasAttacked) {
                AlphaFighter.ActionPanel.moveButton.style.display = "none";
                AlphaFighter.ActionPanel.attackButton.style.display = "none";
                AlphaFighter.ActionPanel.holdButton.style.display = "none";
                AlphaFighter.ActionPanel.passButton.style.display = "none";
                AlphaFighter.ActionPanel.backButton.style.display = "";
                AlphaFighter.ActionPanel.backButton.onclick = () => {
                    this.onAfterFighterAttacked();
                };
                AlphaFighterSelector.Instance.overloadPointerUpCallback = (fighter) => {
                    AlphaClient.Instance.game.requestAttack(this.id, fighter.id);
                };
            }
        };
        AlphaFighter.ActionPanel.holdButton.onclick = () => {
            AlphaClient.Instance.game.requestDelay(this.id);
        };
        AlphaFighter.ActionPanel.passButton.onclick = () => {
            AlphaClient.Instance.game.requestEndTurn(this.id);
        };
        AlphaFighter.ActionPanel.setTarget(this.transformMesh);
        AlphaFighter.ActionPanel.backButton.style.display = "none";
        this.updateUI();
    }
    hideUI() {
        if (AlphaFighter.ActionPanel) {
            AlphaFighter.ActionPanel.dispose();
            delete AlphaFighter.ActionPanel;
        }
    }
    updateUI() {
        AlphaFighter.ActionPanel.holdButton.style.display = "";
        if (this.hasMoved) {
            AlphaFighter.ActionPanel.moveButton.style.display = "none";
            AlphaFighter.ActionPanel.holdButton.style.display = "none";
        }
        else {
            AlphaFighter.ActionPanel.moveButton.style.display = "";
        }
        if (this.hasAttacked) {
            AlphaFighter.ActionPanel.attackButton.style.display = "none";
            AlphaFighter.ActionPanel.holdButton.style.display = "none";
        }
        else {
            AlphaFighter.ActionPanel.attackButton.style.display = "";
        }
    }
    onAfterFighterMoved() {
        this.hideReachableTiles();
        AlphaFighter.ActionPanel.moveButton.style.display = "";
        AlphaFighter.ActionPanel.attackButton.style.display = "";
        AlphaFighter.ActionPanel.holdButton.style.display = "";
        AlphaFighter.ActionPanel.passButton.style.display = "";
        AlphaFighter.ActionPanel.backButton.style.display = "none";
        this.updateUI();
    }
    onAfterFighterAttacked() {
        AlphaFighterSelector.Instance.overloadPointerUpCallback = undefined;
        AlphaFighter.ActionPanel.moveButton.style.display = "";
        AlphaFighter.ActionPanel.attackButton.style.display = "";
        AlphaFighter.ActionPanel.holdButton.style.display = "";
        AlphaFighter.ActionPanel.passButton.style.display = "";
        AlphaFighter.ActionPanel.backButton.style.display = "none";
        this.updateUI();
    }
    showReachableTiles() {
        this.hideReachableTiles();
        for (let i = -this.moveRange; i <= this.moveRange; i++) {
            for (let j = -this.moveRange; j <= this.moveRange; j++) {
                if (HexagonMath.Distance(0, 0, i, j) <= this.moveRange) {
                    let tileI = this._tile.i + i;
                    let tileJ = this._tile.j + j;
                    let tile = AlphaClient.Instance.alphaBoard.getTileByIJ(tileI, tileJ);
                    if (tile) {
                        if (!tile.getFighter()) {
                            let mesh = BABYLON.MeshBuilder.CreateCylinder("reachable-tile", {
                                height: 0.01,
                                diameter: 0.8,
                                tessellation: 6
                            }, Main.Scene);
                            mesh.position.x = 0.75 * tileI;
                            mesh.position.z = (tileI * 0.5 + tileJ) * COS30;
                            mesh.material = Main.greenMaterial;
                            this._reacheableTilesMeshes.push({
                                mesh: mesh,
                                pointerUpCallback: () => {
                                    AlphaClient.Instance.game.requestMove(this.id, tileI, tileJ);
                                }
                            });
                        }
                    }
                }
            }
        }
        this._pointerObserver = Main.Scene.onPointerObservable.add((eventData) => {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                let reachableTileMesh = this._reacheableTilesMeshes.find(a => { return a.mesh === eventData.pickInfo.pickedMesh; });
                if (reachableTileMesh) {
                    reachableTileMesh.pointerUpCallback();
                }
            }
        });
    }
    hideReachableTiles() {
        Main.Scene.onPointerObservable.remove(this._pointerObserver);
        while (this._reacheableTilesMeshes.length > 0) {
            this._reacheableTilesMeshes.pop().mesh.dispose();
        }
    }
    showText(situation) {
        clearTimeout(this.clearSpeechBubbleTimeout);
        if (this.speechBubble) {
            this.speechBubble.dispose();
        }
        this.speechBubble = SpeechBubble.CreateSpeechBubble(this.transformMesh, PilotSpeech.GetText(this.nature, situation));
        this.speechBubble.setTarget(this.transformMesh);
        this.clearSpeechBubbleTimeout = setTimeout(() => {
            this.speechBubble.dispose();
            this.speechBubble = undefined;
        }, 3000);
    }
    shoot(target) {
        let dir = target.subtract(this.transformMesh.position).normalize();
        this.fighterMesh.shoot(dir);
    }
}
class SpaceMath {
    static ProjectPerpendicularAt(v, at) {
        let p = BABYLON.Vector3.Zero();
        let k = (v.x * at.x + v.y * at.y + v.z * at.z);
        k = k / (at.x * at.x + at.y * at.y + at.z * at.z);
        p.copyFrom(v);
        p.subtractInPlace(at.multiplyByFloats(k, k, k));
        return p;
    }
    static Angle(from, to) {
        let pFrom = BABYLON.Vector3.Normalize(from);
        let pTo = BABYLON.Vector3.Normalize(to);
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        return angle;
    }
    static AngleFromToAround(from, to, around) {
        let pFrom = SpaceMath.ProjectPerpendicularAt(from, around).normalize();
        let pTo = SpaceMath.ProjectPerpendicularAt(to, around).normalize();
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        if (BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(pFrom, pTo), around) < 0) {
            angle = -angle;
        }
        return angle;
    }
    static CatmullRomPath(path) {
        let interpolatedPoints = [];
        for (let i = 0; i < path.length; i++) {
            let p0 = path[(i - 1 + path.length) % path.length];
            let p1 = path[i];
            let p2 = path[(i + 1) % path.length];
            let p3 = path[(i + 2) % path.length];
            interpolatedPoints.push(BABYLON.Vector3.CatmullRom(p0, p1, p2, p3, 0.5));
        }
        for (let i = 0; i < interpolatedPoints.length; i++) {
            path.splice(2 * i + 1, 0, interpolatedPoints[i]);
        }
    }
}
class Shield extends BABYLON.Mesh {
    constructor(spaceShip) {
        super(spaceShip.name + "-Shield", spaceShip.getScene());
        this._spaceShip = spaceShip;
        this.layerMask = 1;
    }
    initialize() {
        let template = BABYLON.MeshBuilder.CreateSphere("template", {
            diameterX: 6,
            diameterY: 3,
            diameterZ: 6,
            segments: 12
        }, Main.Scene);
        let data = BABYLON.VertexData.ExtractFromMesh(template);
        data.applyToMesh(this);
        template.dispose();
        this.isVisible = false;
        /*
        let shieldMaterial: ShieldMaterial = new ShieldMaterial(this.name, this.getScene());
        shieldMaterial.color = new BABYLON.Color4(0.13, 0.52, 0.80, 1);
        shieldMaterial.tex = new BABYLON.Texture("./datas/white-front-gradient.png", Main.Scene);
        shieldMaterial.noiseAmplitude = 0.05;
        shieldMaterial.noiseFrequency = 16;
        this.material = shieldMaterial;
        */
    }
    flashAt(position, space = BABYLON.Space.LOCAL, speed = 0.2) {
        /*
        if (this.material instanceof ShieldMaterial) {
            if (space === BABYLON.Space.WORLD) {
                let worldToLocal: BABYLON.Matrix = BABYLON.Matrix.Invert(this.getWorldMatrix());
                BABYLON.Vector3.TransformCoordinatesToRef(position, worldToLocal, position);
            }
            this.material.flashAt(position, speed);
        }
        */
    }
}
class SpaceMeshBuilder {
    static CreateHPBar(r, h, from, to) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let normals = [];
        let p0 = new BABYLON.Vector3(r * Math.cos(4 * Math.PI / 3), 0, r * Math.sin(4 * Math.PI / 3));
        let p1 = new BABYLON.Vector3(r * Math.cos(5 * Math.PI / 3), 0, r * Math.sin(5 * Math.PI / 3));
        let p2 = p0.clone();
        p2.x -= h * Math.cos(Math.PI / 3);
        p2.z += h * Math.sin(Math.PI / 3);
        let p3 = p1.clone();
        p3.x += h * Math.cos(Math.PI / 3);
        p3.z += h * Math.sin(Math.PI / 3);
        positions.push(...BABYLON.Vector3.Lerp(p0, p1, from).asArray());
        positions.push(...BABYLON.Vector3.Lerp(p0, p1, to).asArray());
        positions.push(...BABYLON.Vector3.Lerp(p2, p3, to).asArray());
        positions.push(...BABYLON.Vector3.Lerp(p2, p3, from).asArray());
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        indices.push(0, 1, 2);
        indices.push(0, 2, 3);
        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        return data;
    }
    static CreateHPVertexData(min, max) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let normals = [];
        let a0 = 10 * Math.PI / 12;
        let a1 = 3 * Math.PI / 2;
        let aMin = a0 * (1 - min) + a1 * min;
        let aMax = a0 * (1 - max) + a1 * max;
        let r0 = 0.285;
        let r1 = 0.22;
        let rMin = r0 * (1 - min) + r1 * min;
        let rMax = r0 * (1 - max) + r1 * max;
        for (let i = 0; i <= 12; i++) {
            let f = i / 12;
            let a = aMin * (1 - f) + aMax * f;
            let r = rMin * (1 - f) + rMax * f;
            let p = new BABYLON.Vector3(Math.cos(a), 0.05, Math.sin(a));
            positions.push(p.x * r, -0.001, p.z * r, p.x * 0.335, -0.001, p.z * 0.335);
            normals.push(0, 1, 0, 0, 1, 0);
        }
        for (let i = 0; i < 12; i++) {
            indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
            indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
        }
        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        return data;
    }
    static CreateShieldVertexData(min, max) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let normals = [];
        let a0 = 3 * Math.PI / 2;
        let a1 = 26 * Math.PI / 12;
        let aMin = a0 * (1 - min) + a1 * min;
        let aMax = a0 * (1 - max) + a1 * max;
        let r0 = 0.22;
        let r1 = 0.285;
        let rMin = r0 * (1 - min) + r1 * min;
        let rMax = r0 * (1 - max) + r1 * max;
        for (let i = 0; i <= 12; i++) {
            let f = i / 12;
            let a = aMin * (1 - f) + aMax * f;
            let r = rMin * (1 - f) + rMax * f;
            let p = new BABYLON.Vector3(Math.cos(a), 0.05, Math.sin(a));
            positions.push(p.x * r, -0.001, p.z * r, p.x * 0.335, -0.001, p.z * 0.335);
            normals.push(0, 1, 0, 0, 1, 0);
        }
        for (let i = 0; i < 12; i++) {
            indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
            indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
        }
        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        return data;
    }
    static CreateHexagonVertexData(rMin, rMax) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let normals = [];
        for (let i = 0; i < 6; i++) {
            let p = new BABYLON.Vector3(Math.cos(i * Math.PI / 3), 0, Math.sin(i * Math.PI / 3));
            positions.push(p.x * rMin, 0, p.z * rMin, p.x * rMax, 0, p.z * rMax);
            normals.push(0, 1, 0, 0, 1, 0);
        }
        for (let i = 0; i < 5; i++) {
            indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
            indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
        }
        indices.push(10, 11, 1);
        indices.push(10, 1, 0);
        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        return data;
    }
}
class StupidClient extends Client {
    onPhaseInitialized() {
        let activeFighter = this.getActiveFighter();
        if (activeFighter) {
            if (activeFighter.team === this._team) {
                setTimeout(() => {
                    if (Math.random() < 0.5) {
                        if (this.game.requestDelay(activeFighter.id)) {
                            return;
                        }
                    }
                    this.game.requestEndTurn(activeFighter.id);
                }, Math.random() * 500 + 500);
            }
        }
    }
}
class TrailMesh extends BABYLON.Mesh {
    constructor(name, generator, scene, diameter = 1, length = 60) {
        super(name, scene);
        this._sectionPolygonPointsCount = 4;
        this._update = () => {
            let positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            let normals = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            for (let i = 3 * this._sectionPolygonPointsCount; i < positions.length; i++) {
                positions[i - 3 * this._sectionPolygonPointsCount] = positions[i] - normals[i] / this._length * this._diameter;
            }
            for (let i = 3 * this._sectionPolygonPointsCount; i < normals.length; i++) {
                normals[i - 3 * this._sectionPolygonPointsCount] = normals[i];
            }
            let l = positions.length - 3 * this._sectionPolygonPointsCount;
            let alpha = 2 * Math.PI / this._sectionPolygonPointsCount;
            for (let i = 0; i < this._sectionPolygonPointsCount; i++) {
                this._sectionVectors[i].copyFromFloats(Math.cos(i * alpha) * this._diameter, Math.sin(i * alpha) * this._diameter, 0);
                this._sectionNormalVectors[i].copyFromFloats(Math.cos(i * alpha), Math.sin(i * alpha), 0);
                BABYLON.Vector3.TransformCoordinatesToRef(this._sectionVectors[i], this._generator.getWorldMatrix(), this._sectionVectors[i]);
                BABYLON.Vector3.TransformNormalToRef(this._sectionNormalVectors[i], this._generator.getWorldMatrix(), this._sectionNormalVectors[i]);
            }
            for (let i = 0; i < this._sectionPolygonPointsCount; i++) {
                positions[l + 3 * i] = this._sectionVectors[i].x;
                positions[l + 3 * i + 1] = this._sectionVectors[i].y;
                positions[l + 3 * i + 2] = this._sectionVectors[i].z;
                normals[l + 3 * i] = this._sectionNormalVectors[i].x;
                normals[l + 3 * i + 1] = this._sectionNormalVectors[i].y;
                normals[l + 3 * i + 2] = this._sectionNormalVectors[i].z;
            }
            this.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, true, false);
            this.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, false);
        };
        this.layerMask = 1;
        this._generator = generator;
        this._diameter = diameter;
        this._length = length;
        this._sectionVectors = [];
        this._sectionNormalVectors = [];
        for (let i = 0; i < this._sectionPolygonPointsCount; i++) {
            this._sectionVectors[i] = BABYLON.Vector3.Zero();
            this._sectionNormalVectors[i] = BABYLON.Vector3.Zero();
        }
        this._createMesh();
        scene.onBeforeRenderObservable.add(this._update);
    }
    destroy() {
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
        this.dispose();
    }
    foldToGenerator() {
        let positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let generatorWorldPosition = this._generator.absolutePosition;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = generatorWorldPosition.x;
            positions[i + 1] = generatorWorldPosition.y;
            positions[i + 2] = generatorWorldPosition.z;
        }
    }
    _createMesh() {
        let data = new BABYLON.VertexData();
        let positions = [];
        let normals = [];
        let indices = [];
        let alpha = 2 * Math.PI / this._sectionPolygonPointsCount;
        for (let i = 0; i < this._sectionPolygonPointsCount; i++) {
            positions.push(Math.cos(i * alpha) * this._diameter, Math.sin(i * alpha) * this._diameter, -this._length);
            normals.push(Math.cos(i * alpha), Math.sin(i * alpha), 0);
        }
        for (let i = 1; i <= this._length; i++) {
            for (let j = 0; j < this._sectionPolygonPointsCount; j++) {
                positions.push(Math.cos(j * alpha) * this._diameter, Math.sin(j * alpha) * this._diameter, -this._length + i);
                normals.push(Math.cos(j * alpha), Math.sin(j * alpha), 0);
            }
            let l = positions.length / 3 - 2 * this._sectionPolygonPointsCount;
            for (let j = 0; j < this._sectionPolygonPointsCount - 1; j++) {
                indices.push(l + j, l + j + this._sectionPolygonPointsCount, l + j + this._sectionPolygonPointsCount + 1);
                indices.push(l + j, l + j + this._sectionPolygonPointsCount + 1, l + j + 1);
            }
            indices.push(l + this._sectionPolygonPointsCount - 1, l + this._sectionPolygonPointsCount - 1 + this._sectionPolygonPointsCount, l + this._sectionPolygonPointsCount);
            indices.push(l + this._sectionPolygonPointsCount - 1, l + this._sectionPolygonPointsCount, l);
        }
        data.positions = positions;
        data.normals = normals;
        data.indices = indices;
        data.applyToMesh(this, true);
        let trailMaterial = new BABYLON.StandardMaterial("white", this.getScene());
        trailMaterial.diffuseColor.copyFromFloats(1, 1, 1);
        trailMaterial.emissiveColor.copyFromFloats(1, 1, 1);
        trailMaterial.specularColor.copyFromFloats(0, 0, 0);
        this.material = trailMaterial;
    }
}
class FlashParticle extends BABYLON.Mesh {
    constructor(name, scene, size, lifespan) {
        super(name, scene);
        this.size = size;
        this.lifespan = lifespan;
        this._timer = 0;
        this._update = () => {
            this._timer += this.getScene().getEngine().getDeltaTime() / 1000;
            let s = this.size * this._timer / (this.lifespan / 2);
            let target;
            if (Main.Scene.activeCameras && Main.Scene.activeCameras[0]) {
                target = Main.Scene.activeCameras[0].position;
            }
            else {
                target = Main.Scene.activeCamera.position;
            }
            if (this.parent) {
                target = target.clone();
                let invParentWorld = this.parent.getWorldMatrix().clone().invert();
                BABYLON.Vector3.TransformCoordinatesToRef(target, invParentWorld, target);
            }
            this.lookAt(target);
            if (this._timer < this.lifespan / 2) {
                this.scaling.copyFromFloats(s, s, s);
                return;
            }
            else {
                this.scaling.copyFromFloats(this.size, this.size, this.size);
                if (this._timer > this.lifespan) {
                    this._timer = 0;
                    this.scaling.copyFromFloats(0, 0, 0);
                    this.getScene().onBeforeRenderObservable.removeCallback(this._update);
                }
            }
        };
        let template = BABYLON.MeshBuilder.CreatePlane("template", { size: 1 }, scene);
        let data = BABYLON.VertexData.ExtractFromMesh(template);
        data.applyToMesh(this);
        template.dispose();
        let material = new BABYLON.StandardMaterial(name + "-material", scene);
        material.diffuseTexture = new BABYLON.Texture("./datas/textures/" + name + ".png", scene);
        material.diffuseTexture.hasAlpha = true;
        material.specularColor.copyFromFloats(0, 0, 0);
        material.emissiveTexture = material.diffuseTexture;
        this.material = material;
        this.scaling.copyFromFloats(0, 0, 0);
        this.layerMask = 1;
    }
    destroy() {
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
        this.dispose();
    }
    flash(position) {
        if (this._timer > 0) {
            return;
        }
        this.position.copyFrom(position);
        this.scaling.copyFromFloats(0, 0, 0);
        this.getScene().onBeforeRenderObservable.add(this._update);
    }
}
class SpeechBubble extends HTMLElement {
    constructor() {
        super();
        this._initialized = false;
        this._update = () => {
            if (!this._target) {
                return;
            }
            let dView = this._target.position.subtract(Main.Camera.position);
            let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
            n.normalize();
            n.scaleInPlace(0.2);
            let p = this._target.position.add(n);
            p.y += 0.4;
            let screenPos = BABYLON.Vector3.Project(p, BABYLON.Matrix.Identity(), this._target.getScene().getTransformMatrix(), Main.Camera.viewport.toGlobal(1, 1));
            this.style.right = ((1 - screenPos.x) * Main.Canvas.width) + "px";
            this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height) + "px";
        };
    }
    static CreateSpeechBubble(target, text) {
        let bubble = document.createElement("speech-bubble");
        document.body.appendChild(bubble);
        bubble.textContent = text.toLocaleUpperCase();
        return bubble;
    }
    connectedCallback() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
    }
    dispose() {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        document.body.removeChild(this);
    }
    setTarget(mesh) {
        this.style.position = "fixed";
        this._target = mesh;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }
    addButton(value, onClickCallback) {
        let inputElement = document.createElement("input");
        inputElement.classList.add("action-button");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        if (onClickCallback) {
            inputElement.onclick = onClickCallback;
        }
        this.appendChild(inputElement);
        return inputElement;
    }
}
window.customElements.define("speech-bubble", SpeechBubble);
class MeshLoader {
    constructor(scene) {
        this.scene = scene;
        this.lookup = new Map();
        MeshLoader.instance = this;
    }
    get(name, callback) {
        let mesh = this.lookup.get(name);
        if (mesh) {
            callback(mesh.createInstance(mesh.name + "-instance"));
        }
        else {
            BABYLON.SceneLoader.ImportMesh("", "./datas/" + name + ".babylon", "", this.scene, (meshes, particleSystems, skeletons) => {
                let mesh = meshes[0];
                if (mesh instanceof BABYLON.Mesh) {
                    this.lookup.set(name, mesh);
                    mesh.isVisible = false;
                    callback(mesh.createInstance(mesh.name + "-instance"));
                    if (mesh.material instanceof BABYLON.StandardMaterial) {
                        if (mesh.material.name.endsWith("metro")) {
                            console.log("Texture loading for " + mesh.material.name);
                            mesh.material.diffuseTexture = new BABYLON.Texture("./datas/metro.png", this.scene);
                            mesh.material.diffuseColor.copyFromFloats(1, 1, 1);
                            mesh.material.bumpTexture = new BABYLON.Texture("./datas/metro-normal.png", this.scene);
                            mesh.material.specularColor.copyFromFloats(0.6, 0.6, 0.6);
                        }
                    }
                    if (mesh.material && mesh.material instanceof BABYLON.MultiMaterial) {
                        mesh.material.subMaterials.forEach((m) => {
                            if (m instanceof BABYLON.StandardMaterial) {
                                if (m.name.endsWith("Floor")) {
                                    console.log("Texture loading");
                                    m.diffuseTexture = new BABYLON.Texture("./datas/floor.png", this.scene);
                                    m.diffuseColor.copyFromFloats(1, 1, 1);
                                    m.bumpTexture = new BABYLON.Texture("./datas/floor-normal.png", this.scene);
                                    m.specularColor.copyFromFloats(0.6, 0.6, 0.6);
                                }
                                if (m.name.endsWith("Road")) {
                                    console.log("Texture loading");
                                    m.diffuseTexture = new BABYLON.Texture("./datas/road.png", this.scene);
                                    m.diffuseColor.copyFromFloats(1, 1, 1);
                                    m.bumpTexture = new BABYLON.Texture("./datas/road-normal.png", this.scene);
                                    m.specularColor.copyFromFloats(0.6, 0.6, 0.6);
                                }
                                if (m.name.endsWith("Wall")) {
                                    console.log("Texture loading");
                                    m.diffuseTexture = new BABYLON.Texture("./datas/wall.png", this.scene);
                                    m.diffuseColor.copyFromFloats(1, 1, 1);
                                    m.bumpTexture = new BABYLON.Texture("./datas/wall-normal.png", this.scene);
                                    m.specularColor.copyFromFloats(0.6, 0.6, 0.6);
                                }
                            }
                        });
                    }
                }
                else {
                    this.lookup.set(name, null);
                    callback(null);
                }
            });
        }
    }
}
class SpaceshipVertexDataLoader {
    constructor(scene) {
        this.scene = scene;
        this._vertexDatas = new Map();
        SpaceshipVertexDataLoader.instance = this;
    }
    async getSpaceshipPartVertexData(spaceshipName, partName, baseColor, frameColor, color1, color2, color3) {
        let vertexDatas = await this._getSpaceshipPartVertexDatas(spaceshipName, partName);
        let positions = [];
        let indices = [];
        let normals = [];
        let colors = [];
        if (!vertexDatas) {
            console.log(this._vertexDatas);
            debugger;
        }
        vertexDatas.forEach((colorVertexData, colorName) => {
            let r = 1;
            let g = 1;
            let b = 1;
            let checkColor = (checkedColorName, associatedColor) => {
                if (colorName === checkedColorName) {
                    if (associatedColor instanceof BABYLON.Color3) {
                        r = associatedColor.r;
                        g = associatedColor.g;
                        b = associatedColor.b;
                    }
                    else if (typeof (associatedColor) === "string") {
                        let color = BABYLON.Color3.FromHexString(associatedColor);
                        r = color.r;
                        g = color.g;
                        b = color.b;
                    }
                }
            };
            checkColor("base", baseColor);
            checkColor("base-dark", baseColor);
            checkColor("frame", frameColor);
            checkColor("color-1", color1);
            checkColor("color-2", color2);
            checkColor("color-3", color3);
            let l = positions.length / 3;
            positions.push(...colorVertexData.positions);
            normals.push(...colorVertexData.normals);
            for (let i = 0; i < colorVertexData.positions.length / 3; i++) {
                colors.push(r, g, b, 1);
            }
            for (let i = 0; i < colorVertexData.indices.length; i++) {
                indices.push(colorVertexData.indices[i] + l);
            }
        });
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.indices = indices;
        vertexData.colors = colors;
        return vertexData;
    }
    async _getSpaceshipPartVertexDatas(spaceshipName, partName) {
        let spaceshipParts = await this._getSpaceshipParts(spaceshipName);
        if (spaceshipParts) {
            return spaceshipParts.get(partName);
        }
    }
    async _getSpaceshipParts(spaceshipName) {
        let spaceshipParts = this._vertexDatas.get(spaceshipName);
        if (spaceshipParts) {
            return spaceshipParts;
        }
        spaceshipParts = new Map();
        let loadedFile = await BABYLON.SceneLoader.ImportMeshAsync("", "./datas/meshes/" + spaceshipName + ".babylon", "", Main.Scene);
        loadedFile.meshes = loadedFile.meshes.sort((m1, m2) => {
            if (m1.name < m2.name) {
                return -1;
            }
            else if (m1.name > m2.name) {
                return 1;
            }
            return 0;
        });
        for (let i = 0; i < loadedFile.meshes.length; i++) {
            let loadedMesh = loadedFile.meshes[i];
            if (loadedMesh instanceof BABYLON.Mesh) {
                let partName = loadedMesh.name.split("-")[0];
                let colorName = loadedMesh.name.substr(partName.length + 1);
                let partVertexDatas = spaceshipParts.get(partName);
                if (!partVertexDatas) {
                    partVertexDatas = new Map();
                    spaceshipParts.set(partName, partVertexDatas);
                }
                let vertexData = BABYLON.VertexData.ExtractFromMesh(loadedMesh);
                partVertexDatas.set(colorName, vertexData);
                loadedMesh.dispose();
            }
        }
        this._vertexDatas.set(spaceshipName, spaceshipParts);
        return spaceshipParts;
    }
}
class VertexDataLoader {
    constructor(scene) {
        this.scene = scene;
        this._vertexDatas = new Map();
        VertexDataLoader.instance = this;
    }
    static clone(data) {
        let clonedData = new BABYLON.VertexData();
        clonedData.positions = [...data.positions];
        clonedData.indices = [...data.indices];
        clonedData.normals = [...data.normals];
        if (data.matricesIndices) {
            clonedData.matricesIndices = [...data.matricesIndices];
        }
        if (data.matricesWeights) {
            clonedData.matricesWeights = [...data.matricesWeights];
        }
        if (data.uvs) {
            clonedData.uvs = [...data.uvs];
        }
        if (data.colors) {
            clonedData.colors = [...data.colors];
        }
        return clonedData;
    }
    async get(name) {
        if (this._vertexDatas.get(name)) {
            return this._vertexDatas.get(name);
        }
        let vertexData = undefined;
        let loadedFile = await BABYLON.SceneLoader.ImportMeshAsync("", "./datas/meshes/" + name + ".babylon", "", Main.Scene);
        let vertexDatas = new Map();
        loadedFile.meshes = loadedFile.meshes.sort((m1, m2) => {
            if (m1.name < m2.name) {
                return -1;
            }
            else if (m1.name > m2.name) {
                return 1;
            }
            return 0;
        });
        for (let i = 0; i < loadedFile.meshes.length; i++) {
            let loadedMesh = loadedFile.meshes[i];
            if (loadedMesh instanceof BABYLON.Mesh) {
                vertexData = BABYLON.VertexData.ExtractFromMesh(loadedMesh);
                vertexDatas.set(loadedMesh.name, vertexData);
            }
        }
        loadedFile.meshes.forEach(m => { m.dispose(); });
        loadedFile.skeletons.forEach(s => { s.dispose(); });
        return vertexDatas;
    }
    async getColorized(name, baseColorHex = "#FFFFFF", frameColorHex = "", color1Hex = "", // Replace red
    color2Hex = "", // Replace green
    color3Hex = "" // Replace blue
    ) {
        let vertexDatas = await this.getColorizedMultiple(name, baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);
        console.log(vertexDatas);
        return vertexDatas.values().next().value;
    }
    async getColorizedMultiple(name, baseColorHex = "#FFFFFF", frameColorHex = "", color1Hex = "", // Replace red
    color2Hex = "", // Replace green
    color3Hex = "" // Replace blue
    ) {
        let baseColor;
        if (baseColorHex !== "") {
            baseColor = BABYLON.Color3.FromHexString(baseColorHex);
        }
        let frameColor;
        if (frameColorHex !== "") {
            frameColor = BABYLON.Color3.FromHexString(frameColorHex);
        }
        let color1;
        if (color1Hex !== "") {
            color1 = BABYLON.Color3.FromHexString(color1Hex);
        }
        let color2;
        if (color2Hex !== "") {
            color2 = BABYLON.Color3.FromHexString(color2Hex);
        }
        let color3;
        if (color3Hex !== "") {
            color3 = BABYLON.Color3.FromHexString(color3Hex);
        }
        let vertexDatas = await VertexDataLoader.instance.get(name);
        let colorizedVertexDatas = new Map();
        vertexDatas.forEach((vertexData, name) => {
            let colorizedVertexData = VertexDataLoader.clone(vertexData);
            if (colorizedVertexData.colors) {
                for (let i = 0; i < colorizedVertexData.colors.length / 4; i++) {
                    let r = colorizedVertexData.colors[4 * i];
                    let g = colorizedVertexData.colors[4 * i + 1];
                    let b = colorizedVertexData.colors[4 * i + 2];
                    if (baseColor) {
                        if (r === 1 && g === 1 && b === 1) {
                            colorizedVertexData.colors[4 * i] = baseColor.r;
                            colorizedVertexData.colors[4 * i + 1] = baseColor.g;
                            colorizedVertexData.colors[4 * i + 2] = baseColor.b;
                            continue;
                        }
                    }
                    if (frameColor) {
                        if (r === 0.502 && g === 0.502 && b === 0.502) {
                            colorizedVertexData.colors[4 * i] = frameColor.r;
                            colorizedVertexData.colors[4 * i + 1] = frameColor.g;
                            colorizedVertexData.colors[4 * i + 2] = frameColor.b;
                            continue;
                        }
                    }
                    if (color1) {
                        if (r === 1 && g === 0 && b === 0) {
                            colorizedVertexData.colors[4 * i] = color1.r;
                            colorizedVertexData.colors[4 * i + 1] = color1.g;
                            colorizedVertexData.colors[4 * i + 2] = color1.b;
                            continue;
                        }
                    }
                    if (color2) {
                        if (r === 0 && g === 1 && b === 0) {
                            colorizedVertexData.colors[4 * i] = color2.r;
                            colorizedVertexData.colors[4 * i + 1] = color2.g;
                            colorizedVertexData.colors[4 * i + 2] = color2.b;
                            continue;
                        }
                    }
                    if (color3) {
                        if (r === 0 && g === 0 && b === 1) {
                            colorizedVertexData.colors[4 * i] = color3.r;
                            colorizedVertexData.colors[4 * i + 1] = color3.g;
                            colorizedVertexData.colors[4 * i + 2] = color3.b;
                            continue;
                        }
                    }
                }
            }
            else {
                let colors = [];
                for (let i = 0; i < colorizedVertexData.positions.length / 3; i++) {
                    colors[4 * i] = baseColor.r;
                    colors[4 * i + 1] = baseColor.g;
                    colors[4 * i + 2] = baseColor.b;
                    colors[4 * i + 3] = 1;
                }
                colorizedVertexData.colors = colors;
            }
            colorizedVertexDatas.set(name, colorizedVertexData);
        });
        return colorizedVertexDatas;
    }
}
var SpeechSituation;
(function (SpeechSituation) {
    SpeechSituation[SpeechSituation["Ready"] = 0] = "Ready";
    SpeechSituation[SpeechSituation["Selected"] = 1] = "Selected";
    SpeechSituation[SpeechSituation["Move"] = 2] = "Move";
    SpeechSituation[SpeechSituation["Attack"] = 3] = "Attack";
    SpeechSituation[SpeechSituation["AttackSuccess"] = 4] = "AttackSuccess";
    SpeechSituation[SpeechSituation["AttackMiss"] = 5] = "AttackMiss";
    SpeechSituation[SpeechSituation["AttackCritical"] = 6] = "AttackCritical";
    SpeechSituation[SpeechSituation["AttackKill"] = 7] = "AttackKill";
    SpeechSituation[SpeechSituation["WoundLight"] = 8] = "WoundLight";
    SpeechSituation[SpeechSituation["WoundMedium"] = 9] = "WoundMedium";
    SpeechSituation[SpeechSituation["WoundHeavy"] = 10] = "WoundHeavy";
    SpeechSituation[SpeechSituation["Hold"] = 11] = "Hold";
    SpeechSituation[SpeechSituation["Pass"] = 12] = "Pass";
})(SpeechSituation || (SpeechSituation = {}));
class PilotSpeech {
    static GetText(nature, situation) {
        let speeches = PilotSpeech._Texts.get(nature).get(situation);
        return speeches[Math.floor(Math.random() * speeches.length)];
    }
    static LoadProfessionalSpeeches() {
        if (PilotSpeech._Texts.get(PilotNature.Professional)) {
            return;
        }
        let speeches = new Map();
        PilotSpeech._Texts.set(PilotNature.Professional, speeches);
        speeches.set(SpeechSituation.Ready, [
            "Ready.",
            "Waiting for order."
        ]);
        speeches.set(SpeechSituation.Selected, [
            "Situation : Ok.",
            "Status : Ready."
        ]);
        speeches.set(SpeechSituation.Move, [
            "Copy that.",
            "Here I go."
        ]);
        speeches.set(SpeechSituation.Attack, [
            "Target acquired.",
            "Aiming at target.",
            "Threat is in line of sight."
        ]);
        speeches.set(SpeechSituation.AttackSuccess, [
            "Target hit. Pending damage evaluation...",
            "Target hit. Asserting damages..."
        ]);
        speeches.set(SpeechSituation.AttackMiss, [
            "Target missed. I repeat : Target missed.",
            "Negative. Threat is still operational."
        ]);
        speeches.set(SpeechSituation.AttackCritical, [
            "Target hit for substantial damages."
        ]);
        speeches.set(SpeechSituation.AttackKill, [
            "Target neutralized.",
            "Threat status : Eradicated."
        ]);
        speeches.set(SpeechSituation.Hold, [
            "Holding position, over.",
            "Standing by."
        ]);
        speeches.set(SpeechSituation.Pass, [
            "Over."
        ]);
    }
    static LoadCoolSpeeches() {
        if (PilotSpeech._Texts.get(PilotNature.Cool)) {
            return;
        }
        let speeches = new Map();
        PilotSpeech._Texts.set(PilotNature.Cool, speeches);
        speeches.set(SpeechSituation.Ready, [
            "Up and ready !",
            "Diving in !"
        ]);
        speeches.set(SpeechSituation.Selected, [
            "Yeah ?",
            "What's up ?"
        ]);
        speeches.set(SpeechSituation.Move, [
            "Let's go !",
            "On my way captain."
        ]);
        speeches.set(SpeechSituation.Attack, [
            "He does not stand a chance !",
            "Lock and loaded !",
            "Yahaa !"
        ]);
        speeches.set(SpeechSituation.AttackSuccess, [
            "Eat that !",
            "Take that !"
        ]);
        speeches.set(SpeechSituation.AttackMiss, [
            "Oops...",
            "I sliped captain...",
            "Let's forget about this one..."
        ]);
        speeches.set(SpeechSituation.AttackCritical, [
            "Ha ! In your face !",
            "Boom ! Wanna cry ?",
            "Hahahaha !"
        ]);
        speeches.set(SpeechSituation.AttackKill, [
            "See ya !",
            "Good bye !",
            "Youhou ! Did you guys see that ?",
            "Bouhou ! Go back to your mother !"
        ]);
        speeches.set(SpeechSituation.Hold, [
            "I can do that.",
            "Let them come !",
            "Wait and see, got it."
        ]);
        speeches.set(SpeechSituation.Pass, [
            "Be right back !",
            "Now it's up to you guys !"
        ]);
    }
}
PilotSpeech._Texts = new Map();
class Projectile extends BABYLON.Mesh {
    constructor(direction, shooter) {
        super("projectile", shooter.getScene());
        this.shotSpeed = 150;
        this._lifeSpan = 3;
        this._update = () => {
            let dt = this.getEngine().getDeltaTime() / 1000;
            this._lifeSpan -= dt;
            if (this._lifeSpan < 0) {
                console.log("Destroy projectile (negative lifespan)");
                return this.destroy();
            }
            let hitSpaceship = Math.random() < 0.01;
            if (hitSpaceship) {
                console.log("Destroy projectile (hit spaceship");
                return this.destroy();
            }
            this.position.addInPlace(this._direction.scale(this.shotSpeed * dt));
            let zAxis = this._direction;
            let yAxis;
            if (Main.Scene.activeCameras && Main.Scene.activeCameras[0]) {
                yAxis = Main.Scene.activeCameras[0].position.subtract(this.position);
            }
            else {
                yAxis = Main.Scene.activeCamera.position.subtract(this.position);
            }
            let xAxis = BABYLON.Vector3.Cross(yAxis, zAxis).normalize();
            BABYLON.Vector3.CrossToRef(zAxis, xAxis, yAxis);
            BABYLON.Quaternion.RotationQuaternionFromAxisToRef(xAxis, yAxis, zAxis, this.rotationQuaternion);
        };
        this._direction = direction;
        this.shooter = shooter;
        this.shotSpeed = this.shooter.shootSpeed;
        this.position.copyFrom(shooter.absolutePosition);
        this.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(shooter.rotation);
        this.scaling.copyFromFloats(0.15, 0.15, 0.15);
        this._displacementRay = new BABYLON.Ray(this.absolutePosition, this._direction.clone());
        this.getScene().onBeforeRenderObservable.add(this._update);
    }
    async instantiate() {
        let vertexData = await VertexDataLoader.instance.getColorized("blaster-trail");
        console.log(vertexData);
        if (vertexData && !this.isDisposed()) {
            vertexData.applyToMesh(this);
        }
        Main.Camera.currentTarget = this;
    }
    destroy() {
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
        this.dispose();
    }
}
class RepairDrone extends BABYLON.TransformNode {
    constructor(spaceship) {
        super("Repair-Drone", spaceship.getScene());
        this.spaceship = spaceship;
        this.basePosition = new BABYLON.Vector3(0, 1, 0);
        this._speed = 0;
        this.cooldown = 10;
        this._basedTime = 5;
        this.repairStepsMax = 4;
        this.healPower = 3;
        this._targetPositions = [];
        this._kIdle = 0;
        this._isBased = false;
        this._update = () => {
            if (this._isBased) {
                BABYLON.Vector3.LerpToRef(this.position, this.basePosition, 0.05, this.position);
                BABYLON.Vector3.LerpToRef(this.container.position, BABYLON.Vector3.Zero(), 0.05, this.container.position);
                BABYLON.Quaternion.SlerpToRef(this.rotationQuaternion, BABYLON.Quaternion.Identity(), 0.05, this.rotationQuaternion);
            }
            else {
                this.container.position.x = 0.25 * Math.sin(this._kIdle / 200 * Math.PI * 2);
                this.container.position.y = 0.25 * Math.sin(this._kIdle / 100 * Math.PI * 2);
                this.container.position.z = 0.25 * Math.sin(this._kIdle / 400 * Math.PI * 2);
                this._kIdle++;
                let deltaTime = this.getScene().getEngine().getDeltaTime() / 1000;
                let targetPosition = this._targetPositions[0];
                if (targetPosition) {
                    if (!this._m) {
                        //this._m = BABYLON.MeshBuilder.CreateBox("m", {size: 0.2}, Main.Scene);
                        //this._m.parent = this.spaceship;
                    }
                    let dir = targetPosition.subtract(this.position);
                    let dist = dir.length();
                    dir.scaleInPlace(1 / dist);
                    if (dist > 0) {
                        this.position.addInPlace(dir.scale(Math.min(dist, this._speed * deltaTime)));
                    }
                    let zAxis = this.position.scale(-1).normalize();
                    let xAxis = BABYLON.Vector3.Cross(BABYLON.Axis.Y, zAxis);
                    let yAxis = BABYLON.Vector3.Cross(zAxis, xAxis);
                    BABYLON.Quaternion.SlerpToRef(this.rotationQuaternion, BABYLON.Quaternion.RotationQuaternionFromAxis(xAxis, yAxis, zAxis), 0.05, this.rotationQuaternion);
                    this.laser.position.copyFrom(targetPosition.subtract(BABYLON.Vector3.Normalize(targetPosition)));
                    let invWorld = this.spaceship.mesh.getWorldMatrix().clone().invert();
                    this.armRTip.computeWorldMatrix(true);
                    let armTipWorldPosition = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Zero(), this.armRTip.getWorldMatrix());
                    let armTipPos = BABYLON.Vector3.TransformCoordinates(armTipWorldPosition, invWorld);
                    //this._m.position.copyFrom(armTipWorldPosition);
                    this.laser.scaling.z = BABYLON.Vector3.Distance(armTipPos, this.laser.position);
                    this.laser.lookAt(armTipPos, 0, Math.PI, Math.PI, BABYLON.Space.LOCAL);
                    this.repairParticle.mesh.lookAt(armTipPos, 0, Math.PI / 2, Math.PI, BABYLON.Space.LOCAL);
                }
            }
        };
        this._kFold = 0;
        this._fold = () => {
            this._kFold++;
            let ratio = this._kFold / 60;
            BABYLON.Vector3.LerpToRef(RepairDrone.BodyBottomUnFoldPosition, RepairDrone.BodyBottomFoldPosition, ratio, this.bodyBottom.position);
            BABYLON.Vector3.LerpToRef(RepairDrone.AntennaUnFoldScaling, RepairDrone.AntennaFoldScaling, ratio, this.antenna.scaling);
            BABYLON.Vector3.LerpToRef(RepairDrone.ArmLUnFoldScaling, RepairDrone.ArmLFoldScaling, ratio, this.armL.scaling);
            BABYLON.Vector3.LerpToRef(RepairDrone.ArmRUnFoldScaling, RepairDrone.ArmRFoldScaling, ratio, this.armR.scaling);
            BABYLON.Vector3.LerpToRef(RepairDrone.WingLUnFoldRotation, RepairDrone.WingLFoldRotation, ratio, this.wingL.rotation);
            BABYLON.Vector3.LerpToRef(RepairDrone.WingRUnFoldRotation, RepairDrone.WingRFoldRotation, ratio, this.wingR.rotation);
            if (this._kFold > 60) {
                this.bodyBottom.position.copyFrom(RepairDrone.BodyBottomFoldPosition);
                this.antenna.scaling.copyFrom(RepairDrone.AntennaFoldScaling);
                this.armR.scaling.copyFrom(RepairDrone.ArmLFoldScaling);
                this.armL.scaling.copyFrom(RepairDrone.ArmRFoldScaling);
                this.wingL.rotation.copyFrom(RepairDrone.WingLFoldRotation);
                this.wingR.rotation.copyFrom(RepairDrone.WingRFoldRotation);
                this.getScene().onBeforeRenderObservable.removeCallback(this._fold);
            }
        };
        this._kUnFold = 0;
        this._unFold = () => {
            this._kUnFold++;
            let ratio = RepairDrone.easeOutElastic(this._kUnFold / 60);
            BABYLON.Vector3.LerpToRef(RepairDrone.BodyBottomFoldPosition, RepairDrone.BodyBottomUnFoldPosition, ratio, this.bodyBottom.position);
            BABYLON.Vector3.LerpToRef(RepairDrone.AntennaFoldScaling, RepairDrone.AntennaUnFoldScaling, ratio, this.antenna.scaling);
            BABYLON.Vector3.LerpToRef(RepairDrone.ArmLFoldScaling, RepairDrone.ArmLUnFoldScaling, ratio, this.armL.scaling);
            BABYLON.Vector3.LerpToRef(RepairDrone.ArmRFoldScaling, RepairDrone.ArmRUnFoldScaling, ratio, this.armR.scaling);
            BABYLON.Vector3.LerpToRef(RepairDrone.WingLFoldRotation, RepairDrone.WingLUnFoldRotation, ratio, this.wingL.rotation);
            BABYLON.Vector3.LerpToRef(RepairDrone.WingRFoldRotation, RepairDrone.WingRUnFoldRotation, ratio, this.wingR.rotation);
            if (this._kUnFold > 60) {
                this.bodyBottom.position.copyFrom(RepairDrone.BodyBottomUnFoldPosition);
                this.antenna.scaling.copyFrom(RepairDrone.AntennaUnFoldScaling);
                this.armR.scaling.copyFrom(RepairDrone.ArmLUnFoldScaling);
                this.armL.scaling.copyFrom(RepairDrone.ArmRUnFoldScaling);
                this.wingL.rotation.copyFrom(RepairDrone.WingLUnFoldRotation);
                this.wingR.rotation.copyFrom(RepairDrone.WingRUnFoldRotation);
                this.getScene().onBeforeRenderObservable.removeCallback(this._unFold);
            }
        };
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        spaceship.onDestroyObservable.add(() => {
            this.destroy();
        });
    }
    static easeOutElastic(t) {
        let p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }
    destroy() {
        this.dispose();
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
    async initialize(baseColor, detailColor) {
        this.container = new BABYLON.TransformNode("container", this.getScene());
        this.container.parent = this;
        return new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh("", "./datas/models/repair-drone.babylon", "", this.getScene(), (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    if (mesh instanceof BABYLON.Mesh) {
                        let data = BABYLON.VertexData.ExtractFromMesh(mesh);
                        if (data.colors) {
                            let baseColor3 = BABYLON.Color3.FromHexString(baseColor);
                            let detailColor3 = BABYLON.Color3.FromHexString(detailColor);
                            for (let i = 0; i < data.colors.length / 4; i++) {
                                let r = data.colors[4 * i];
                                let g = data.colors[4 * i + 1];
                                let b = data.colors[4 * i + 2];
                                if (r === 1 && g === 0 && b === 0) {
                                    data.colors[4 * i] = detailColor3.r;
                                    data.colors[4 * i + 1] = detailColor3.g;
                                    data.colors[4 * i + 2] = detailColor3.b;
                                }
                                else if (r === 1 && g === 1 && b === 1) {
                                    data.colors[4 * i] = baseColor3.r;
                                    data.colors[4 * i + 1] = baseColor3.g;
                                    data.colors[4 * i + 2] = baseColor3.b;
                                }
                                else if (r === 0.502 && g === 0.502 && b === 0.502) {
                                    data.colors[4 * i] = baseColor3.r * 0.5;
                                    data.colors[4 * i + 1] = baseColor3.g * 0.5;
                                    data.colors[4 * i + 2] = baseColor3.b * 0.5;
                                }
                            }
                        }
                        data.applyToMesh(mesh);
                        if (mesh.name === "antenna") {
                            this.antenna = mesh;
                        }
                        else if (mesh.name === "body-top") {
                            this.bodyTop = mesh;
                        }
                        else if (mesh.name === "body-bottom") {
                            this.bodyBottom = mesh;
                        }
                        else if (mesh.name === "arm-L") {
                            this.armL = mesh;
                        }
                        else if (mesh.name === "arm-R") {
                            this.armR = mesh;
                        }
                        else if (mesh.name === "wing-L") {
                            this.wingL = mesh;
                        }
                        else if (mesh.name === "wing-R") {
                            this.wingR = mesh;
                        }
                        else if (mesh.name === "laser") {
                            this.laser = mesh;
                        }
                        mesh.material = SpaceShipFactory.cellShadingMaterial;
                        mesh.layerMask = 1;
                        ScreenLoger.instance.log(mesh.name);
                        mesh.parent = this.container;
                    }
                }
                this.armL.parent = this.bodyBottom;
                this.armR.parent = this.bodyBottom;
                this.armRTip = new BABYLON.TransformNode("armRTip", this.getScene());
                this.armRTip.parent = this.armR;
                this.armRTip.position.copyFromFloats(0, 0, 0.65);
                this.laser.parent = this.spaceship.mesh;
                this.laser.isVisible = false;
                this.bodyBottom.position.copyFrom(RepairDrone.BodyBottomFoldPosition);
                this.antenna.scaling.copyFrom(RepairDrone.AntennaFoldScaling);
                this.armR.scaling.copyFrom(RepairDrone.ArmLFoldScaling);
                this.armL.scaling.copyFrom(RepairDrone.ArmRFoldScaling);
                this.wingL.rotation.copyFrom(RepairDrone.WingLFoldRotation);
                this.wingR.rotation.copyFrom(RepairDrone.WingRFoldRotation);
                this._isBased = true;
                let particleMaterial = new BABYLON.StandardMaterial(name + "-material", this.getScene());
                particleMaterial.diffuseTexture = new BABYLON.Texture("./datas/textures/impact-white.png", this.getScene());
                particleMaterial.diffuseTexture.hasAlpha = true;
                particleMaterial.specularColor.copyFromFloats(0, 0, 0);
                particleMaterial.emissiveTexture = particleMaterial.diffuseTexture;
                // SPS creation
                var plane = BABYLON.Mesh.CreatePlane("plane", 5, this.getScene());
                this.repairParticle = new BABYLON.SolidParticleSystem('SPS', this.getScene());
                this.repairParticle.addShape(plane, 20);
                var mesh = this.repairParticle.buildMesh();
                mesh.material = particleMaterial;
                mesh.position.y = -50;
                plane.dispose(); // free memory
                // SPS behavior definition
                var speed = 0.08;
                var gravity = -0.005;
                // init
                this.repairParticle.initParticles = () => {
                    // just recycle everything
                    for (var p = 0; p < this.repairParticle.nbParticles; p++) {
                        this.repairParticle.recycleParticle(this.repairParticle.particles[p]);
                    }
                };
                // recycle
                this.repairParticle.recycleParticle = (particle) => {
                    // Set particle new velocity, scale and rotation
                    // As this function is called for each particle, we don't allocate new
                    // memory by using "new BABYLON.Vector3()" but we set directly the
                    // x, y, z particle properties instead
                    particle.position.x = 0;
                    particle.position.y = 0;
                    particle.position.z = 0;
                    particle.velocity.x = (Math.random() - 0.5) * speed;
                    particle.velocity.y = Math.random() * speed;
                    particle.velocity.z = (Math.random() - 0.5) * speed;
                    var scale = 0.015 + Math.random() * 0.055;
                    particle.scale.x = scale;
                    particle.scale.y = scale;
                    particle.scale.z = scale;
                    particle.rotation.x = Math.random() * 3.5;
                    particle.rotation.y = Math.random() * 3.5;
                    particle.rotation.z = Math.random() * 3.5;
                    particle.color.r = Math.random() * 0.4 + 0.3;
                    particle.color.g = 1;
                    particle.color.b = particle.color.r;
                    particle.color.a = 1;
                    return particle;
                };
                // update : will be called by setParticles()
                this.repairParticle.updateParticle = (particle) => {
                    // some physics here 
                    if (particle.position.y < 0) {
                        this.repairParticle.recycleParticle(particle);
                    }
                    particle.velocity.y += gravity; // apply gravity to y
                    (particle.position).addInPlace(particle.velocity); // update particle new position
                    particle.position.y += speed / 2;
                    particle.scale.scaleInPlace(0.9);
                    return particle;
                };
                // init all particle values and set them once to apply textures, colors, etc
                this.repairParticle.initParticles();
                this.repairParticle.setParticles();
                // Tuning : plane particles facing, so billboard and no rotation computation
                // colors not changing then, neither textures
                this.repairParticle.billboard = true;
                this.repairParticle.computeParticleRotation = false;
                this.repairParticle.computeParticleColor = false;
                this.repairParticle.computeParticleTexture = false;
                //scene.debugLayer.show();
                // animation
                this.parent = this.spaceship.mesh;
                this.position.copyFrom(this.basePosition);
                this.getScene().onBeforeRenderObservable.add(this._update);
                this.repairCycle();
                ScreenLoger.instance.log("RepairDrone initialized.");
                resolve();
            });
        });
    }
    async repairCycle() {
        /*
        while (!this.isDisposed()) {
            if (this._isBased) {
                await RuntimeUtils.RunCoroutine(this._sleep(3));
                this._basedTime += 3;
            }
            if (this._basedTime > this.cooldown) {
                if (this.spaceship.hitPoint < this.spaceship.stamina) {
                    ScreenLoger.instance.log("SpaceShip is wounded, start repair routine.");
                    for (let i = 0; i < this.repairStepsMax; i++) {
                        if (this.spaceship.hitPoint < this.spaceship.stamina) {
                            ScreenLoger.instance.log("New Repair Step.");
                            let A = this.position.clone();
                            let B = new BABYLON.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
                            B.normalize().scaleInPlace(10);
                            let ray = new BABYLON.Ray(B, B.scale(-1).normalize());
                            ray = BABYLON.Ray.Transform(ray, this.spaceship.mesh.getWorldMatrix());
                            let hit = ray.intersectsMesh(this.spaceship.mesh)
                            if (hit.hit) {
                                let p = hit.pickedPoint;
                                B = BABYLON.Vector3.TransformCoordinates(
                                    p,
                                    this.spaceship.mesh.getWorldMatrix().clone().invert()
                                );
                                B = B.addInPlace(BABYLON.Vector3.Normalize(B));
                            }
                            await RuntimeUtils.RunCoroutine(this._repairStep(A, B));
                        }
                        ScreenLoger.instance.log("Repair Step Done.");
                    }
                    ScreenLoger.instance.log("Back To Base Step.");
                    let A = this.position.clone();
                    let B = this.basePosition.clone();
                    await RuntimeUtils.RunCoroutine(this._baseStep(A, B));
                    ScreenLoger.instance.log("Back To Base Step done.");
                }
                else {
                    await RuntimeUtils.RunCoroutine(this._sleep(3));
                }
            }
        }
        */
    }
    *_sleep(t) {
        let timer = 0;
        while (timer < t) {
            timer += this.getScene().getEngine().getDeltaTime() / 1000;
            yield;
        }
    }
    *_baseStep(A, B) {
        ScreenLoger.instance.log("New Step.");
        // Build a path for the step.
        let n = BABYLON.Vector3.Cross(A, B).normalize();
        let alpha = Math.acos(BABYLON.Vector3.Dot(A.clone().normalize(), B.clone().normalize()));
        let length = Math.ceil(alpha / (Math.PI / 32));
        let step = alpha / length;
        let dA = A.length();
        let dB = B.length();
        this._targetPositions = [A];
        for (let i = 1; i < length; i++) {
            let matrix = BABYLON.Matrix.RotationAxis(n, step * i);
            let p = BABYLON.Vector3.TransformCoordinates(A, matrix);
            let mult = 1.5 - 0.5 * (1 - i / (length / 2)) * (1 - i / (length / 2));
            let r = i / length;
            p.normalize();
            p.scaleInPlace(dA * mult * (1 - r) + dB * mult * r);
            this._targetPositions.push(p);
        }
        this._targetPositions.push(B);
        let l = this._targetPositions.length;
        this.laser.isVisible = false;
        this.fold();
        let startSPS = () => {
            this.repairParticle.setParticles();
        };
        while (this._targetPositions.length > 1) {
            let targetPosition = this._targetPositions[0];
            let d = BABYLON.Vector3.Distance(targetPosition, this.position);
            let ll = this._targetPositions.length;
            this._speed = 1.5 - 0.5 * (1 - ll / (l / 2)) * (1 - ll / (l / 2));
            if (d < 0.5) {
                this._targetPositions.splice(0, 1);
            }
            yield;
        }
        this._isBased = true;
        this._basedTime = 0;
    }
    *_repairStep(A, B) {
        // Build a path for the step.
        let n = BABYLON.Vector3.Cross(A, B).normalize();
        let alpha = Math.acos(BABYLON.Vector3.Dot(A.clone().normalize(), B.clone().normalize()));
        let length = Math.ceil(alpha / (Math.PI / 32));
        let step = alpha / length;
        let dA = A.length();
        let dB = B.length();
        this._targetPositions = [A];
        for (let i = 1; i < length; i++) {
            let matrix = BABYLON.Matrix.RotationAxis(n, step * i);
            let p = BABYLON.Vector3.TransformCoordinates(A, matrix);
            let mult = 1.5 - 0.5 * (1 - i / (length / 2)) * (1 - i / (length / 2));
            let r = i / length;
            p.normalize();
            p.scaleInPlace(dA * mult * (1 - r) + dB * mult * r);
            this._targetPositions.push(p);
        }
        this._targetPositions.push(B);
        let l = this._targetPositions.length;
        this.laser.isVisible = false;
        this.fold();
        let startSPS = () => {
            this.repairParticle.setParticles();
        };
        this._isBased = false;
        while (this._targetPositions.length > 1) {
            let targetPosition = this._targetPositions[0];
            let d = BABYLON.Vector3.Distance(targetPosition, this.position);
            let ll = this._targetPositions.length;
            this._speed = 1.5 - 0.5 * (1 - ll / (l / 2)) * (1 - ll / (l / 2));
            if (d < 0.5) {
                this._targetPositions.splice(0, 1);
            }
            yield;
        }
        let timer = 0;
        this.laser.isVisible = true;
        this.laser.scaling.x = 0;
        this.laser.scaling.y = 0;
        this.unFold();
        this.repairParticle.mesh.isVisible = true;
        this.getScene().registerBeforeRender(startSPS);
        this.repairParticle.mesh.parent = this.spaceship.mesh;
        this.repairParticle.mesh.position = this._targetPositions[0].subtract(this._targetPositions[0].clone().normalize());
        while (timer < 5) {
            this.laser.scaling.x = BABYLON.Scalar.Clamp(1 + 0.25 * Math.cos(timer * 2 * Math.PI), this.laser.scaling.x - 0.1, this.laser.scaling.x + 0.1);
            this.laser.scaling.y = BABYLON.Scalar.Clamp(1 + 0.25 * Math.cos(timer * 2 * Math.PI), this.laser.scaling.y - 0.1, this.laser.scaling.y + 0.1);
            timer += this.getScene().getEngine().getDeltaTime() / 1000;
            //this.spaceship.hitPoint += (this.getScene().getEngine().getDeltaTime() / 1000) / 5 * this.healPower;
            yield;
        }
        this.getScene().unregisterBeforeRender(startSPS);
        this.repairParticle.mesh.isVisible = false;
        ScreenLoger.instance.log("Step Done.");
    }
    fold() {
        this._kFold = 0;
        this.getScene().onBeforeRenderObservable.add(this._fold);
    }
    unFold() {
        this._kUnFold = 0;
        this.getScene().onBeforeRenderObservable.add(this._unFold);
    }
}
RepairDrone.BodyBottomFoldPosition = new BABYLON.Vector3(0, 0.095, 0);
RepairDrone.AntennaFoldScaling = new BABYLON.Vector3(0, 0, 0);
RepairDrone.ArmLFoldScaling = new BABYLON.Vector3(0, 0, 0);
RepairDrone.ArmRFoldScaling = new BABYLON.Vector3(0, 0, 0);
RepairDrone.WingLFoldRotation = new BABYLON.Vector3(0, -1.22, 0);
RepairDrone.WingRFoldRotation = new BABYLON.Vector3(0, 1.22, 0);
RepairDrone.BodyBottomUnFoldPosition = new BABYLON.Vector3(0, 0, 0);
RepairDrone.AntennaUnFoldScaling = new BABYLON.Vector3(1, 1, 1);
RepairDrone.ArmLUnFoldScaling = new BABYLON.Vector3(1, 1, 1);
RepairDrone.ArmRUnFoldScaling = new BABYLON.Vector3(1, 1, 1);
RepairDrone.WingLUnFoldRotation = new BABYLON.Vector3(0, 0, 0);
RepairDrone.WingRUnFoldRotation = new BABYLON.Vector3(0, 0, 0);
class SpaceShip extends BABYLON.Mesh {
    constructor(data, scene) {
        super("spaceship", scene);
        this._colliders = [];
        this.trailMeshes = [];
        this.canons = [];
        this.shootSpeed = 0.1;
        this.shootCoolDown = 0.3;
        this._shootCool = 0;
        this.onDestroyObservable = new BABYLON.Observable();
        this._canonNodes = [];
        this._lastCanonIndex = 0;
        this._localX = new BABYLON.Vector3(1, 0, 0);
        this._localY = new BABYLON.Vector3(0, 1, 0);
        this._localZ = new BABYLON.Vector3(0, 0, 1);
        this.rotation.copyFromFloats(0, 0, 0);
        //this.shield = new Shield(this);
        //this.shield.initialize();
        //this.shield.parent = this;
        this.impactParticle = new BABYLON.ParticleSystem("particles", 2000, scene);
        this.impactParticle.particleTexture = new BABYLON.Texture("./datas/textures/impact.png", scene);
        this.impactParticle.emitter = this.position;
        this.impactParticle.direction1.copyFromFloats(50, 50, 50);
        this.impactParticle.direction2.copyFromFloats(-50, -50, -50);
        this.impactParticle.emitRate = 800;
        this.impactParticle.minLifeTime = 0.02;
        this.impactParticle.maxLifeTime = 0.05;
        this.impactParticle.manualEmitCount = 100;
        this.impactParticle.minSize = 0.05;
        this.impactParticle.maxSize = 0.3;
        this.shootFlashParticle = new FlashParticle("bang-red", scene, 0.8, 0.15);
        this.wingTipLeft = new BABYLON.Mesh("WingTipLeft", scene);
        this.wingTipLeft.parent = this;
        this.wingTipLeft.position.copyFromFloats(-2.91, 0, -1.24);
        this.wingTipRight = new BABYLON.Mesh("WingTipRight", scene);
        this.wingTipRight.parent = this;
        this.wingTipRight.position.copyFromFloats(2.91, 0, -1.24);
        this.trailMeshes = [
            new TrailMesh("Test", this.wingTipLeft, Main.Scene, 0.07, 60),
            new TrailMesh("Test", this.wingTipRight, Main.Scene, 0.07, 60)
        ];
    }
    get localX() {
        return this._localX;
    }
    get localY() {
        return this._localY;
    }
    get localZ() {
        return this._localZ;
    }
    destroy() {
        this.dispose();
        for (let i = 0; i < this.trailMeshes.length; i++) {
            this.trailMeshes[i].destroy();
        }
        this.shootFlashParticle.destroy();
        this.onDestroyObservable.notifyObservers(undefined);
    }
    async initialize(model, baseColor, detailColor) {
        let meshes = [];
        await SpaceShip._InitializeRecursively(model, baseColor, detailColor, this, meshes);
        let invWorldMatrix = this.computeWorldMatrix(true).clone().invert();
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].computeWorldMatrix(true);
        }
        for (let i = 0; i < this._canonNodes.length; i++) {
            let canonPoint = BABYLON.Vector3.Zero();
            this._canonNodes[i].computeWorldMatrix(true);
            BABYLON.Vector3.TransformCoordinatesToRef(this._canonNodes[i].absolutePosition, invWorldMatrix, canonPoint);
            this.canons.push(canonPoint);
        }
        this.mesh = BABYLON.Mesh.MergeMeshes(meshes, true);
        this.mesh.layerMask = 1;
        this.mesh.parent = this;
        this.wingTipLeft.parent = this.mesh;
        this.wingTipRight.parent = this.mesh;
        //this.shield.parent = this.mesh;
        return this.mesh;
    }
    static async _InitializeRecursively(elementData, baseColor, detailColor, spaceship, meshes) {
        let e = await SpaceShipFactory.LoadSpaceshipPart(elementData.name.split("-")[0], elementData.name.split("-")[1], baseColor, detailColor);
        if (meshes) {
            meshes.push(e);
        }
        if (elementData.children) {
            for (let i = 0; i < elementData.children.length; i++) {
                let childData = elementData.children[i];
                let slot = SpaceShipSlots.getSlot(elementData.name, childData.type);
                if (slot) {
                    if (childData.type === "drone") {
                        if (childData.name === "repair-drone") {
                            let drone = new RepairDrone(spaceship);
                            drone.basePosition = slot.pos;
                            drone.initialize(baseColor, detailColor);
                            return drone;
                        }
                    }
                    else {
                        let child = await SpaceShip._InitializeRecursively(childData, baseColor, detailColor, spaceship, meshes);
                        child.parent = e;
                        child.position = slot.pos;
                        child.rotation = slot.rot;
                        if (slot.mirror) {
                            child.scaling.x = -1;
                        }
                        if (child instanceof BABYLON.Mesh) {
                            if (childData.type === "weapon") {
                                let canonTip = MeshUtils.getZMaxVertex(child);
                                let canonTipNode = new BABYLON.TransformNode("_tmpCanonTipNode", spaceship.getScene());
                                canonTipNode.parent = child;
                                canonTipNode.position.copyFrom(canonTip);
                                canonTipNode.computeWorldMatrix(true);
                                spaceship._canonNodes.push(canonTipNode);
                            }
                            if (childData.type.startsWith("wing")) {
                                let wingTip = MeshUtils.getXMinVertex(child);
                                BABYLON.Vector3.TransformCoordinatesToRef(wingTip, child.computeWorldMatrix(true), wingTip);
                                if (childData.type === "wingL") {
                                    spaceship.wingTipLeft.position.copyFrom(wingTip);
                                }
                                else if (childData.type === "wingR") {
                                    spaceship.wingTipRight.position.copyFrom(wingTip);
                                }
                            }
                        }
                    }
                }
            }
        }
        return e;
    }
    shoot(direction) {
        if (this._shootCool > 0) {
            return;
        }
        this._shootCool = this.shootCoolDown;
        let bullet = new Projectile(direction, this);
        this._lastCanonIndex = (this._lastCanonIndex + 1) % this.canons.length;
        let canon = this.canons[this._lastCanonIndex];
        console.log(canon);
        console.log(this.getWorldMatrix());
        this.shootFlashParticle.parent = this.mesh;
        this.shootFlashParticle.flash(canon);
        let canonWorld = BABYLON.Vector3.TransformCoordinates(canon.scale(0.15), this.getWorldMatrix());
        bullet.position.copyFrom(canonWorld);
        bullet.instantiate();
    }
    projectileDurationTo(target) {
        let dist = BABYLON.Vector3.Distance(this.position, target.position);
        return dist / this.shootSpeed;
    }
}
var ISquadRole;
(function (ISquadRole) {
    ISquadRole[ISquadRole["Leader"] = 0] = "Leader";
    ISquadRole[ISquadRole["WingMan"] = 1] = "WingMan";
    ISquadRole[ISquadRole["Default"] = 2] = "Default";
})(ISquadRole || (ISquadRole = {}));
class SpaceShipFactory {
    static get cellShadingMaterial() {
        if (!SpaceShipFactory._cellShadingMaterial) {
            SpaceShipFactory._cellShadingMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
            SpaceShipFactory._cellShadingMaterial.computeHighLevel = true;
        }
        return SpaceShipFactory._cellShadingMaterial;
    }
    static baseColorFromTeam(team) {
        return "#ffffff";
    }
    static detailColorFromTeam(team) {
        if (team === 0) {
            return "#0000ff";
        }
        if (team === 1) {
            return "#ff0000";
        }
        return "#00ff00";
    }
    static async LoadSpaceshipPart(spaceshipName, partName, baseColor, detailColor) {
        let data = await SpaceshipVertexDataLoader.instance.getSpaceshipPartVertexData(spaceshipName, partName, baseColor, detailColor, "#d65915", "#5cd914", "#13c5cf");
        let m = new BABYLON.Mesh(spaceshipName + " " + partName, Main.Scene);
        m.layerMask = 1;
        data.applyToMesh(m);
        m.material = SpaceShipFactory.cellShadingMaterial;
        return m;
    }
}
class SpaceShipSlot {
    constructor(name, pos, rot, mirror = false) {
        this.name = name;
        this.pos = pos;
        this.rot = rot;
        this.mirror = mirror;
    }
}
class SpaceShipSlots {
    static get instance() {
        if (!SpaceShipSlots._instance) {
            SpaceShipSlots._instance = new SpaceShipSlots();
        }
        return SpaceShipSlots._instance;
    }
    constructor() {
        this._slots = new Map();
        this._slots.set("arrow-body", [
            new SpaceShipSlot("engine", new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(0, 0, 0)),
            new SpaceShipSlot("wingL", new BABYLON.Vector3(-0.55, 0, -0.4), new BABYLON.Vector3(0, 0, 0)),
            new SpaceShipSlot("wingR", new BABYLON.Vector3(0.55, 0, -0.4), new BABYLON.Vector3(0, 0, 0), true),
            new SpaceShipSlot("drone", new BABYLON.Vector3(0, 0.7, -0.4), new BABYLON.Vector3(0, 0, 0))
        ]);
        this._slots.set("body-2", [
            new SpaceShipSlot("engine", new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(0, 0, 0)),
            new SpaceShipSlot("wingL", new BABYLON.Vector3(-0.48, 0, -0.27), new BABYLON.Vector3(0, 0, 0)),
            new SpaceShipSlot("wingR", new BABYLON.Vector3(0.48, 0, -0.27), new BABYLON.Vector3(0, 0, 0), true),
            new SpaceShipSlot("drone", new BABYLON.Vector3(0, 0.6, -0.6), new BABYLON.Vector3(0, 0, 0))
        ]);
        this._slots.set("body-3", [
            new SpaceShipSlot("engine", new BABYLON.Vector3(0, 0, -0.7), new BABYLON.Vector3(0, 0, 0)),
            new SpaceShipSlot("wingL", new BABYLON.Vector3(-0.55, 0, -0.37), new BABYLON.Vector3(0, 0, 0)),
            new SpaceShipSlot("wingR", new BABYLON.Vector3(0.55, 0, -0.37), new BABYLON.Vector3(0, 0, 0), true),
            new SpaceShipSlot("drone", new BABYLON.Vector3(0, 0.9, -0.34), new BABYLON.Vector3(0, 0, 0))
        ]);
        this._slots.set("wing-1", [
            new SpaceShipSlot("weapon", new BABYLON.Vector3(-1.23, 0.06, -0.15), new BABYLON.Vector3(0, 0, 0))
        ]);
        this._slots.set("wing-2", [
            new SpaceShipSlot("weapon", new BABYLON.Vector3(-0.6, 0.12, 0), new BABYLON.Vector3(0, 0, 0.12))
        ]);
        this._slots.set("wing-3", [
            new SpaceShipSlot("weapon", new BABYLON.Vector3(-0.9, 0.05, 0.2), new BABYLON.Vector3(0, 0, Math.PI / 2))
        ]);
        this._slots.set("wing-4", [
            new SpaceShipSlot("weapon", new BABYLON.Vector3(-1.31, 0.1, 0.24), new BABYLON.Vector3(0, 0, Math.PI / 4))
        ]);
    }
    static getSlot(elementName, slotName) {
        let slots = SpaceShipSlots.instance._slots.get(elementName);
        if (slots) {
            return slots.find((s) => { return s.name === slotName; });
        }
    }
}
class MeshUtils {
    static getXMinVertex(mesh) {
        let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (positions && positions.length > 3) {
            let tip = new BABYLON.Vector3(positions[0], positions[1], positions[2]);
            for (let i = 3; i < positions.length; i += 3) {
                if (positions[i] < tip.x) {
                    tip.copyFromFloats(positions[i], positions[i + 1], positions[i + 2]);
                }
            }
            return tip;
        }
        return BABYLON.Vector3.Zero();
    }
    static getZMaxVertex(mesh) {
        let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (positions && positions.length > 3) {
            let tip = new BABYLON.Vector3(positions[0], positions[1], positions[2]);
            for (let i = 3; i < positions.length; i += 3) {
                if (positions[i + 2] > tip.z) {
                    tip.copyFromFloats(positions[i], positions[i + 1], positions[i + 2]);
                }
            }
            return tip;
        }
        return BABYLON.Vector3.Zero();
    }
}
class RuntimeUtils {
    static StartCoroutine(coroutine) {
        ScreenLoger.instance.log("Start Coroutine");
        let step = () => {
            if (coroutine.next()) {
                return;
            }
            Main.Scene.onBeforeRenderObservable.removeCallback(step);
        };
        Main.Scene.onBeforeRenderObservable.add(step);
    }
    static async RunCoroutine(coroutine) {
        ScreenLoger.instance.log("Run Coroutine");
        return new Promise((resolve) => {
            let step = () => {
                if (!coroutine.next().done) {
                    return;
                }
                resolve();
                Main.Scene.onBeforeRenderObservable.removeCallback(step);
            };
            Main.Scene.onBeforeRenderObservable.add(step);
        });
    }
    static NextFrame(scene, callback) {
        let todoNextFrame = () => {
            callback();
            scene.unregisterAfterRender(todoNextFrame);
        };
        scene.registerAfterRender(todoNextFrame);
    }
    static Throttle(f, group, timeout = 1000) {
        let now = (new Date()).getTime();
        clearTimeout(RuntimeUtils.throttleTimeout);
        if (!RuntimeUtils.throttleGroups.has(group)) {
            f();
            RuntimeUtils.throttleGroups.set(group, now);
        }
        else {
            let lastCall = RuntimeUtils.throttleGroups.get(group);
            if (now - lastCall > timeout) {
                f();
                RuntimeUtils.throttleGroups.set(group, now);
            }
            else {
                RuntimeUtils.throttleTimeout = setTimeout(() => {
                    f();
                    RuntimeUtils.throttleGroups.set(group, (new Date()).getTime());
                }, timeout - (now - lastCall));
            }
        }
    }
}
RuntimeUtils.throttleTimeout = 0;
RuntimeUtils.throttleGroups = new Map();
class SSMeshBuilder {
    static CreateZCircleMesh(radius, scene, color, updatable, instance) {
        let points = [];
        let colors = [];
        if (!color) {
            color = new BABYLON.Color4(1, 1, 1, 1);
        }
        for (let i = 0; i <= 32; i++) {
            points.push(new BABYLON.Vector3(radius * Math.cos(i / 32 * Math.PI * 2), radius * Math.sin(i / 32 * Math.PI * 2), 0));
            colors.push(color);
        }
        return BABYLON.MeshBuilder.CreateLines("zcircle", {
            points: points,
            colors: colors,
            updatable: updatable,
            instance: instance
        }, scene);
    }
    static CreateZRailMesh(radiusIn, radiusOut, alphaMin, alphaMax, tesselation, scene, color, updatable, instance) {
        let alphaLength = alphaMax - alphaMin;
        let count = Math.round(alphaLength * 64 / (Math.PI * 2));
        if (count < 1) {
            return BABYLON.MeshBuilder.CreateLines("zcircle", {
                points: [],
                colors: [],
                updatable: updatable,
                instance: instance
            }, scene);
        }
        let step = alphaLength / count;
        let points = [];
        let colors = [];
        if (!color) {
            color = new BABYLON.Color4(1, 1, 1, 1);
        }
        for (let i = 0; i <= count; i++) {
            points.push(new BABYLON.Vector3(radiusIn * Math.cos(alphaMin + i * step), radiusIn * Math.sin(alphaMin + i * step), 0));
            colors.push(color);
        }
        for (let i = count; i >= 0; i--) {
            points.push(new BABYLON.Vector3(radiusOut * Math.cos(alphaMin + i * step), radiusOut * Math.sin(alphaMin + i * step), 0));
            colors.push(color);
        }
        points.push(points[0]);
        colors.push(colors[0]);
        return BABYLON.MeshBuilder.CreateLines("zcircle", {
            points: points,
            colors: colors,
            updatable: updatable,
            instance: instance
        }, scene);
    }
}
class ScreenLogerLine extends BABYLON.GUI.TextBlock {
    constructor(text, duration = 30, screenLogger) {
        super("text-line", "\t" + text);
        this.duration = duration;
        this.lifetime = 0;
        this.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.height = "0px";
        this.top = "0px";
        this.paddingLeft = screenLogger.lineHeight + "px";
        this.fontSize = Math.floor(this.heightInPixels * 0.8) + "px";
        this.fontFamily = "Courier New";
        this.color = screenLogger.color;
        //this.outlineColor = screenLogger.outlineColor;
        //this.outlineWidth = 3;
        screenLogger.guiTexture.addControl(this);
    }
}
class ScreenLoger {
    constructor(scene, guiTexture) {
        this.scene = scene;
        this.guiTexture = guiTexture;
        this.maxLines = 10;
        this.lines = [];
        this.lineHeight = 18;
        this.color = "white";
        this.outlineColor = "black";
        this.slideDuration = 0.2;
        this._update = () => {
            let dt = this.scene.getEngine().getDeltaTime() / 1000;
            for (let i = 0; i < this.lines.length; i++) {
                this.lines[i].lifetime += dt;
            }
            let i = 0;
            while (i < this.lines.length) {
                let line = this.lines[i];
                if (line.lifetime > line.duration) {
                    this.lines.splice(i, 1);
                    line.dispose();
                }
                else {
                    i++;
                }
            }
            while (this.lines.length > this.maxLines) {
                let line = this.lines.pop();
                if (line) {
                    line.dispose();
                }
            }
            let y = -this.lineHeight;
            for (let i = 0; i < this.lines.length; i++) {
                let line = this.lines[i];
                if (line.lifetime < this.slideDuration) {
                    line.height = Math.round(this.lineHeight * line.lifetime / this.slideDuration) + "px";
                    line.fontSize = Math.floor(line.heightInPixels * 0.8) + "px";
                }
                else if (line.lifetime > line.duration - this.slideDuration) {
                    line.height = Math.round(this.lineHeight * (line.duration - line.lifetime) / this.slideDuration) + "px";
                    line.fontSize = Math.floor(line.heightInPixels * 0.8) + "px";
                }
                else if (line.heightInPixels !== this.lineHeight) {
                    line.height = this.lineHeight + "px";
                    line.fontSize = Math.floor(line.heightInPixels * 0.8) + "px";
                }
                line.top = y + "px";
                y -= line.heightInPixels;
            }
        };
        ScreenLoger.instance = this;
        scene.onBeforeRenderObservable.add(this._update);
        this.maxLines = Math.floor(guiTexture.getSize().height / this.lineHeight * 0.6 - 2);
        this.log("Max lines = " + this.maxLines);
    }
    log(text, duration) {
        this.lines.splice(0, 0, new ScreenLogerLine(text, duration, this));
    }
}
class HexagonMath {
    static Distance(i1, j1, i2, j2) {
        let dI = i2 - i1;
        let dJ = j2 - j1;
        if (dI * dJ >= 0) {
            return Math.abs(dI) + Math.abs(dJ);
        }
        else {
            return Math.max(Math.abs(dI), Math.abs(dJ));
        }
    }
}
class ITileData {
}
class Tile {
    constructor(i, j) {
        this.i = i;
        this.j = j;
    }
    getFighter() {
        return this._fighter;
    }
    setFighter(f) {
        if (!this._fighter) {
            this._fighter = f;
            this._fighter.setTile(this);
            return true;
        }
        return false;
    }
    removeFighter(f) {
        if (this._fighter === f) {
            this._fighter = undefined;
            return true;
        }
        return false;
    }
    serialize() {
        return {
            i: this.i,
            j: this.j
        };
    }
    static deserialize(data) {
        return new Tile(data.i, data.j);
    }
}
var Gender;
(function (Gender) {
    Gender[Gender["Male"] = 0] = "Male";
    Gender[Gender["Female"] = 1] = "Female";
})(Gender || (Gender = {}));
var PilotNature;
(function (PilotNature) {
    PilotNature[PilotNature["Professional"] = 0] = "Professional";
    PilotNature[PilotNature["Angry"] = 1] = "Angry";
    PilotNature[PilotNature["Calm"] = 2] = "Calm";
    PilotNature[PilotNature["Rookie"] = 3] = "Rookie";
    PilotNature[PilotNature["Cool"] = 4] = "Cool";
})(PilotNature || (PilotNature = {}));
class Pilot {
    constructor(fighter) {
        this.fighter = fighter;
    }
    initialize() {
        if (this.nature === PilotNature.Professional) {
            this.fighter.accuracy += 5;
            this.fighter.criticalRate -= 5;
        }
        if (this.nature === PilotNature.Cool) {
            this.fighter.speed -= 5;
            this.fighter.criticalRate += 5;
        }
        if (this.nature === PilotNature.Angry) {
            this.fighter.attackPower += 5;
            this.fighter.dodgeRate -= 5;
        }
        if (this.nature === PilotNature.Rookie) {
            this.fighter.dodgeRate += 5;
            this.fighter.stamina -= 2;
        }
    }
    serialize() {
        return {
            name: this.name,
            gender: this.gender,
            nature: this.nature,
        };
    }
    static Deserialize(data, pilot) {
        /*
        if (!pilot) {
            pilot = new Pilot();
        }
        */
        pilot.name = data.name;
        pilot.gender = data.gender;
        pilot.nature = data.nature;
        return pilot;
    }
    static RandomData() {
        let gender = Gender.Male;
        if (Math.random() > 0.5) {
            gender = Gender.Female;
        }
        let name = "";
        if (gender === Gender.Male) {
            name = Pilot._MaleNames[Math.floor(Math.random() * Pilot._MaleNames.length)];
        }
        else {
            name = Pilot._FemaleNames[Math.floor(Math.random() * Pilot._FemaleNames.length)];
        }
        let nature;
        let r = Math.random();
        if (r < 0.5) {
            nature = PilotNature.Professional;
        }
        else {
            nature = PilotNature.Cool;
        }
        return {
            name: name,
            gender: gender,
            nature: nature
        };
    }
}
Pilot._MaleNames = [
    "Abraham",
    "Bob",
    "Charly",
    "Denver",
    "Eliott",
    "Frank",
    "Grant",
    "Hobarth",
    "Indiana",
    "Jack",
    "Karl",
    "Leon",
    "Muhammad",
    "Neron",
    "Oscar",
    "Preston",
    "Quill",
    "Rex",
    "Sven",
    "Titus",
    "Ulyss",
    "Victor",
    "Walter",
    "Xavier",
    "Yan",
    "Zu"
];
Pilot._FemaleNames = [
    "Alicia",
    "Beatrix",
    "Chandra",
    "Dulcia",
    "Eliane",
    "Frida",
    "Gerda",
    "Horthense",
    "Ida",
    "Julie",
    "Kat",
    "Loana",
    "Marcia",
    "Nicoletta",
    "Oualie",
    "Paulita",
    "Quinta",
    "Rose",
    "Soumeia",
    "Tatiana",
    "Ursula",
    "Vero",
    "Wachita",
    "Xendra",
    "Yaelle",
    "Zoe"
];
class Spaceship {
    constructor(fighter) {
        this.fighter = fighter;
        this.allParts = [];
    }
    initialize() {
        for (let i = 0; i < this.allParts.length; i++) {
            let spaceshipPart = this.allParts[i];
            this.fighter.speed += spaceshipPart.speed;
            this.fighter.stamina += spaceshipPart.stamina;
            this.fighter.shieldCapacity += spaceshipPart.shieldCapacity;
            this.fighter.shieldSpeed += spaceshipPart.shieldSpeed;
            this.fighter.armor += spaceshipPart.armor;
            this.fighter.moveRange += spaceshipPart.moveRange;
            this.fighter.attackRange += spaceshipPart.attackRange;
            this.fighter.attackPower += spaceshipPart.attackPower;
            this.fighter.accuracy += spaceshipPart.accuracy;
            this.fighter.staticAttack = this.fighter.staticAttack || spaceshipPart.staticAttack;
            this.fighter.criticalRate += spaceshipPart.attackRange;
            this.fighter.dodgeRate += spaceshipPart.dodgeRate;
        }
    }
    serialize() {
        let data = {
            body: { reference: this.body.reference },
            wingL: { reference: this.wingL.reference },
            wingR: { reference: this.wingR.reference },
            engine: { reference: this.engine.reference }
        };
        if (this.canon) {
            data.canon = { reference: this.canon.reference };
        }
        return data;
    }
    static Deserialize(data, spaceship) {
        /*
        if (!spaceship) {
            spaceship = new Spaceship();
        }
        */
        if (data.body) {
            spaceship.body = SpaceshipPart.Deserialize(data.body);
            spaceship.allParts.push(spaceship.body);
        }
        if (data.wingL) {
            spaceship.wingL = SpaceshipPart.Deserialize(data.wingL);
            spaceship.allParts.push(spaceship.wingL);
        }
        if (data.wingR) {
            spaceship.wingR = SpaceshipPart.Deserialize(data.wingR);
            spaceship.allParts.push(spaceship.wingR);
        }
        if (data.canon) {
            spaceship.canon = SpaceshipPart.Deserialize(data.canon);
            spaceship.allParts.push(spaceship.canon);
        }
        if (data.engine) {
            spaceship.engine = SpaceshipPart.Deserialize(data.engine);
            spaceship.allParts.push(spaceship.engine);
        }
        return spaceship;
    }
    static RandomData() {
        let wingData = SpaceshipPart.RandomWingData();
        return {
            body: SpaceshipPart.RandomBodyData(),
            wingL: wingData,
            wingR: wingData,
            engine: { reference: "engine-1" },
            canon: { reference: "canon-1" }
        };
    }
}
class SpaceshipPart {
    constructor() {
        this.reference = "undefined";
        this.name = "Unnamed";
        this.meshName = "";
        this.speed = 0;
        this.stamina = 0;
        this.shieldCapacity = 0;
        this.shieldSpeed = 0;
        this.armor = 0;
        this.moveRange = 0;
        this.attackRange = 0;
        this.attackPower = 0;
        this.accuracy = 0;
        this.staticAttack = false;
        this.criticalRate = 0;
        this.dodgeRate = 0;
    }
    setReference(reference) {
        this.reference = reference;
        if (this.reference === "arrow-body") {
            this.speed += 10;
            this.name = "Arrow";
            this.meshName = "body-1";
        }
        if (this.reference === "hubble-body") {
            this.accuracy += 5;
            this.name = "Hubble";
            this.meshName = "body-2";
        }
        if (this.reference === "moon-body") {
            this.shieldCapacity += 2;
            this.shieldSpeed += 1;
            this.name = "Moon";
            this.meshName = "body-3";
        }
        if (this.reference === "scout-wing") {
            this.moveRange += 1;
            this.name = "Scout";
            this.meshName = "wing-1";
        }
        if (this.reference === "arrow-wing") {
            this.speed += 5;
            this.name = "Arrow";
            this.meshName = "wing-2";
        }
        if (this.reference === "shield-wing") {
            this.armor += 1;
            this.name = "Shield";
            this.meshName = "wing-3";
        }
        if (this.reference === "claw-wing") {
            this.attackPower += 1;
            this.name = "Claw";
            this.meshName = "wing-4";
        }
    }
    serialize() {
        return {
            reference: this.reference
        };
    }
    static Deserialize(data, spaceshipPart) {
        if (!spaceshipPart) {
            spaceshipPart = new SpaceshipPart();
        }
        spaceshipPart.setReference(data.reference);
        return spaceshipPart;
    }
    static RandomBodyData() {
        return {
            reference: SpaceshipPart._BodyReferences[Math.floor(Math.random() * SpaceshipPart._BodyReferences.length)]
        };
    }
    static RandomWingData() {
        return {
            reference: SpaceshipPart._WingReferences[Math.floor(Math.random() * SpaceshipPart._WingReferences.length)]
        };
    }
}
SpaceshipPart._BodyReferences = [
    "arrow-body",
    "hubble-body",
    "moon-body"
];
SpaceshipPart._WingReferences = [
    "scout-wing",
    "arrow-wing",
    "shield-wing",
    "claw-wing",
];
/// <reference path="../../lib/babylon.d.ts"/>
/// <reference path="../../lib/babylon.gui.d.ts"/>
var COS30 = Math.cos(Math.PI / 6);
class Main {
    static get cellShadingMaterial() {
        if (!Main._cellShadingMaterial) {
            Main._cellShadingMaterial = new ToonMaterial("CellMaterial", BABYLON.Color3.White(), Main.Scene);
        }
        return Main._cellShadingMaterial;
    }
    static get terrainCellShadingMaterial() {
        if (!Main._terrainCellShadingMaterial) {
            Main._terrainCellShadingMaterial = new TerrainToonMaterial("CellMaterial", BABYLON.Color3.White(), Main.Scene);
        }
        return Main._terrainCellShadingMaterial;
    }
    constructor(canvasElement) {
        Main.Canvas = document.getElementById(canvasElement);
        Main.Engine = new BABYLON.Engine(Main.Canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    initializeCamera() {
        Main.Camera = new AlphaCamera();
    }
    async initialize() {
        await this.initializeScene();
    }
    async initializeScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
        Main.whiteMaterial = new BABYLON.StandardMaterial("white-material", Main.Scene);
        Main.whiteMaterial.diffuseColor.copyFromFloats(1, 1, 1);
        Main.whiteMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.redMaterial = new BABYLON.StandardMaterial("red-material", Main.Scene);
        Main.redMaterial.diffuseColor.copyFromFloats(1, 0, 0);
        Main.redMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.greenMaterial = new BABYLON.StandardMaterial("green-material", Main.Scene);
        Main.greenMaterial.diffuseColor.copyFromFloats(0, 1, 0);
        Main.greenMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.blueMaterial = new BABYLON.StandardMaterial("blue-material", Main.Scene);
        Main.blueMaterial.diffuseColor.copyFromFloats(0, 0, 1);
        Main.blueMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.greyMaterial = new BABYLON.StandardMaterial("grey-material", Main.Scene);
        Main.greyMaterial.diffuseColor.copyFromFloats(0.5, 0.5, 0.5);
        Main.greyMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.yellowMaterial = new BABYLON.StandardMaterial("yellow-material", Main.Scene);
        Main.yellowMaterial.diffuseColor.copyFromFloats(1, 1, 0);
        Main.yellowMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.cyanMaterial = new BABYLON.StandardMaterial("cyan-material", Main.Scene);
        Main.cyanMaterial.diffuseColor.copyFromFloats(0, 1, 1);
        Main.cyanMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
        Main.GuiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("hud");
        Main.GuiTexture.layer.layerMask = 1 | 2;
        Main.GuiTexture.idealWidth = 1920;
        Main.Loger = new ScreenLoger(Main.Scene, Main.GuiTexture);
        this.initializeCamera();
        Main.Camera.minZ = 0.2;
        Main.Camera.maxZ = 2000;
        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);
        BABYLON.Effect.ShadersStore["EdgeFragmentShader"] = `
			#ifdef GL_ES
			precision highp float;
			#endif
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform sampler2D depthSampler;
			uniform float 		width;
			uniform float 		height;
			void make_kernel_color(inout vec4 n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h));
				n[1] = texture2D(tex, coord + vec2(0.0, -h));
				n[2] = texture2D(tex, coord + vec2(  w, -h));
				n[3] = texture2D(tex, coord + vec2( -w, 0.0));
				n[4] = texture2D(tex, coord);
				n[5] = texture2D(tex, coord + vec2(  w, 0.0));
				n[6] = texture2D(tex, coord + vec2( -w, h));
				n[7] = texture2D(tex, coord + vec2(0.0, h));
				n[8] = texture2D(tex, coord + vec2(  w, h));
			}
			void make_kernel_depth(inout float n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h)).r;
				n[1] = texture2D(tex, coord + vec2(0.0, -h)).r;
				n[2] = texture2D(tex, coord + vec2(  w, -h)).r;
				n[3] = texture2D(tex, coord + vec2( -w, 0.0)).r;
				n[4] = texture2D(tex, coord).r;
				n[5] = texture2D(tex, coord + vec2(  w, 0.0)).r;
				n[6] = texture2D(tex, coord + vec2( -w, h)).r;
				n[7] = texture2D(tex, coord + vec2(0.0, h)).r;
				n[8] = texture2D(tex, coord + vec2(  w, h)).r;
			}
			void main(void) 
			{
				vec4 d = texture2D(depthSampler, vUV);
				float depth = d.r * (2000.0 - 0.2) + 0.2;
				
				float nD[9];
				make_kernel_depth( nD, depthSampler, vUV );
				float sobel_depth_edge_h = nD[2] + (2.0*nD[5]) + nD[8] - (nD[0] + (2.0*nD[3]) + nD[6]);
				float sobel_depth_edge_v = nD[0] + (2.0*nD[1]) + nD[2] - (nD[6] + (2.0*nD[7]) + nD[8]);
				float sobel_depth = sqrt((sobel_depth_edge_h * sobel_depth_edge_h) + (sobel_depth_edge_v * sobel_depth_edge_v));
				float thresholdDepth = 0.002;

				vec4 n[9];
				make_kernel_color( n, textureSampler, vUV );
				vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
				vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
				vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
				float threshold = 0.4 + max((depth - 20.) / 30., 0.);
				
				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
				if (sobel_depth < thresholdDepth || depth > 1000.) {
					if (max(sobel.r, max(sobel.g, sobel.b)) < threshold) {
						gl_FragColor = n[4];
					}
				} 
			}
        `;
        BABYLON.Engine.ShadersRepository = "./shaders/";
        let depthMap = Main.Scene.enableDepthRenderer(Main.Camera).getDepthMap();
        /*
        let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, Main.Camera);
        postProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setFloat("width", Main.Engine.getRenderWidth());
            effect.setFloat("height", Main.Engine.getRenderHeight());
        };
        */
        let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), Main.Scene);
        noPostProcessCamera.parent = Main.Camera;
        noPostProcessCamera.layerMask = 0x10000000;
        Main.Scene.activeCameras.push(Main.Camera, noPostProcessCamera);
        let skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 2000.0 }, Main.Scene);
        skybox.layerMask = 1;
        skybox.rotation.y = Math.PI / 2;
        skybox.infiniteDistance = true;
        let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", Main.Scene);
        skyboxMaterial.backFaceCulling = false;
        let skyboxTexture = new BABYLON.CubeTexture("./datas/skyboxes/green-nebulae", Main.Scene, ["-px.png", "-py.png", "-pz.png", "-nx.png", "-ny.png", "-nz.png"]);
        skyboxMaterial.reflectionTexture = skyboxTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        new VertexDataLoader(Main.Scene);
        new SpaceshipVertexDataLoader(Main.Scene);
        let game = new Game();
        let player0 = new AlphaClient(0);
        let player1 = new StupidClient(1);
        game.connectClient(player0);
        game.connectClient(player1);
        player0.connectGame(game);
        player1.connectGame(game);
        game.initialize();
        game.check();
        console.log("Main scene Initialized.");
    }
    animate() {
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
        });
        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}
window.addEventListener("load", async () => {
    let main = new Main("render-canvas");
    await main.initialize();
    main.animate();
});
class SeaMaterial extends BABYLON.ShaderMaterial {
    constructor(name, scene) {
        super(name, scene, {
            vertex: "sea",
            fragment: "sea",
        }, {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
            needAlphaBlending: true
        });
        this.t = 0;
        this.dir0 = BABYLON.Vector2.Zero();
        this.dir1 = BABYLON.Vector2.Zero();
        this.dir2 = BABYLON.Vector2.Zero();
        this.dir3 = BABYLON.Vector2.Zero();
        this.dir4 = BABYLON.Vector2.Zero();
        this.dir5 = BABYLON.Vector2.Zero();
        this.dir6 = BABYLON.Vector2.Zero();
        this._updateTime = () => {
            this.setFloat("time", this.t++ / 60);
        };
        this.dir0 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.dir1 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.dir2 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.dir3 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.dir4 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.dir5 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.dir6 = new BABYLON.Vector2(Math.random(), Math.random()).normalize();
        this.setVector2("dir0", this.dir0);
        this.setVector2("dir1", this.dir1);
        this.setVector2("dir2", this.dir2);
        this.setVector2("dir3", this.dir3);
        this.setVector2("dir4", this.dir4);
        this.setVector2("dir5", this.dir5);
        this.setVector2("dir6", this.dir6);
        this.setFloat("a0", 1 / 7);
        this.setFloat("a1", 1 / 7);
        this.setFloat("a2", 1 / 7);
        this.setFloat("a3", 1 / 7);
        this.setFloat("a4", 1 / 7);
        this.setFloat("a5", 1 / 7);
        this.setFloat("a6", 1 / 7);
        scene.registerBeforeRender(this._updateTime);
    }
}
class TerrainToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, color, scene) {
        super(name, scene, {
            vertex: "terrainToon",
            fragment: "terrainToon",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
        });
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(0.5 + Math.random(), 2.5 + Math.random(), 1.5 + Math.random())).normalize());
        this.setColor3("colGrass", BABYLON.Color3.FromHexString("#47a632"));
        this.setColor3("colDirt", BABYLON.Color3.FromHexString("#a86f32"));
        this.setColor3("colRock", BABYLON.Color3.FromHexString("#8c8c89"));
        this.setColor3("colSand", BABYLON.Color3.FromHexString("#dbc67b"));
    }
}
class ToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, color, scene) {
        super(name, scene, {
            vertex: "toon",
            fragment: "toon",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
        });
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(0.5 + Math.random(), 2.5 + Math.random(), 1.5 + Math.random())).normalize());
    }
}
class RayIntersection {
    constructor(point, normal) {
        this.point = point;
        this.normal = normal;
    }
}
class SphereIntersection {
    constructor(point) {
        this.point = point;
    }
}
class Intersections3D {
    static SphereCube(center, radius, min, max) {
        let closest = center.clone();
        if (closest.x < min.x) {
            closest.x = min.x;
        }
        else if (closest.x > max.x) {
            closest.x = max.x;
        }
        if (closest.y < min.y) {
            closest.y = min.y;
        }
        else if (closest.y > max.y) {
            closest.y = max.y;
        }
        if (closest.z < min.z) {
            closest.z = min.z;
        }
        else if (closest.z > max.z) {
            closest.z = max.z;
        }
        if (BABYLON.Vector3.DistanceSquared(center, closest) < radius * radius) {
            return new SphereIntersection(closest);
        }
        return undefined;
    }
}
class Math2D {
    static AreEqualsCircular(a1, a2, epsilon = Math.PI / 60) {
        while (a1 < 0) {
            a1 += 2 * Math.PI;
        }
        while (a1 >= 2 * Math.PI) {
            a1 -= 2 * Math.PI;
        }
        while (a2 < 0) {
            a2 += 2 * Math.PI;
        }
        while (a2 >= 2 * Math.PI) {
            a2 -= 2 * Math.PI;
        }
        return Math.abs(a1 - a2) < epsilon;
    }
    static StepFromToCirular(from, to, step = Math.PI / 60) {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        if (Math.abs(to - from) <= step) {
            return to;
        }
        if (Math.abs(to - from) >= 2 * Math.PI - step) {
            return to;
        }
        if (to - from >= 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from + step;
            }
            return from - step;
        }
        if (to - from < 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from - step;
            }
            return from + step;
        }
    }
    static LerpFromToCircular(from, to, amount = 0.5) {
        while (to < from) {
            to += 2 * Math.PI;
        }
        while (to - 2 * Math.PI > from) {
            to -= 2 * Math.PI;
        }
        return from + (to - from) * amount;
    }
    static BissectFromTo(from, to, amount = 0.5) {
        let aFrom = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), from, true);
        let aTo = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), to, true);
        let angle = Math2D.LerpFromToCircular(aFrom, aTo, amount);
        return new BABYLON.Vector2(Math.cos(angle), Math.sin(angle));
    }
    static Dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    static Cross(vector1, vector2) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }
    static DistanceSquared(from, to) {
        return (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y);
    }
    static Distance(from, to) {
        return Math.sqrt(Math2D.DistanceSquared(from, to));
    }
    static AngleFromTo(from, to, keepPositive = false) {
        let dot = Math2D.Dot(from, to) / from.length() / to.length();
        let angle = Math.acos(dot);
        let cross = from.x * to.y - from.y * to.x;
        if (cross === 0) {
            cross = 1;
        }
        angle *= Math.sign(cross);
        if (keepPositive && angle < 0) {
            angle += Math.PI * 2;
        }
        return angle;
    }
    static Rotate(vector, alpha) {
        let v = vector.clone();
        Math2D.RotateInPlace(v, alpha);
        return v;
    }
    static RotateInPlace(vector, alpha) {
        let x = Math.cos(alpha) * vector.x - Math.sin(alpha) * vector.y;
        let y = Math.cos(alpha) * vector.y + Math.sin(alpha) * vector.x;
        vector.x = x;
        vector.y = y;
    }
    static get _Tmp0() {
        if (!Math2D.__Tmp0) {
            Math2D.__Tmp0 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp0;
    }
    static get _Tmp1() {
        if (!Math2D.__Tmp1) {
            Math2D.__Tmp1 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp1;
    }
    static get _Tmp2() {
        if (!Math2D.__Tmp2) {
            Math2D.__Tmp2 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp2;
    }
    static get _Tmp3() {
        if (!Math2D.__Tmp3) {
            Math2D.__Tmp3 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp3;
    }
    static PointSegmentABDistanceSquared(point, segA, segB) {
        Math2D._Tmp0.copyFrom(segB).subtractInPlace(segA).normalize();
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, Math2D._Tmp0);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }
    static PointSegmentAxAyBxByDistanceSquared(point, segAx, segAy, segBx, segBy) {
        Math2D._Tmp2.x = segAx;
        Math2D._Tmp2.y = segAy;
        Math2D._Tmp3.x = segBx;
        Math2D._Tmp3.y = segBy;
        return Math2D.PointSegmentABDistanceSquared(point, Math2D._Tmp2, Math2D._Tmp3);
    }
    static PointSegmentABUDistanceSquared(point, segA, segB, u) {
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, u);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.copyFrom(u).scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }
    static IsPointInSegment(point, segA, segB) {
        if ((point.x - segA.x) * (segB.x - segA.x) + (point.y - segA.y) * (segB.y - segA.y) < 0) {
            return false;
        }
        if ((point.x - segB.x) * (segA.x - segB.x) + (point.y - segB.y) * (segA.y - segB.y) < 0) {
            return false;
        }
        return true;
    }
    static IsPointInRay(point, rayOrigin, rayDirection) {
        if ((point.x - rayOrigin.x) * rayDirection.x + (point.y - rayOrigin.y) * rayDirection.y < 0) {
            return false;
        }
        return true;
    }
    static IsPointInRegion(point, region) {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, Math2D._Tmp1, Math2D._Tmp2)) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    static IsPointInPath(point, path) {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < path.length; i++) {
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, path[i], path[(i + 1) % path.length])) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    static SegmentShapeIntersection(segA, segB, shape) {
        let intersections = [];
        for (let i = 0; i < shape.length; i++) {
            let shapeA = shape[i];
            let shapeB = shape[(i + 1) % shape.length];
            let intersection = Math2D.SegmentSegmentIntersection(segA, segB, shapeA, shapeB);
            if (intersection) {
                intersections.push(intersection);
            }
        }
        return intersections;
    }
    static FattenShrinkPointShape(shape, distance) {
        let newShape = [];
        let edgesDirs = [];
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            edgesDirs[i] = pNext.subtract(p).normalize();
        }
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let edgeDir = edgesDirs[i];
            let edgeDirPrev = edgesDirs[(i - 1 + shape.length) % shape.length];
            let bissection = Math2D.BissectFromTo(edgeDirPrev.scale(-1), edgeDir, 0.5);
            newShape[i] = p.add(bissection.scaleInPlace(distance));
        }
        return newShape;
    }
    static FattenShrinkEdgeShape(shape, distance) {
        let newShape = [];
        let edgesNormals = [];
        let edgesDirs = [];
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            edgesDirs[i] = pNext.subtract(p).normalize();
            edgesNormals[i] = Math2D.Rotate(edgesDirs[i], -Math.PI / 2).scaleInPlace(distance);
        }
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            let edgeDir = edgesDirs[i];
            let edgeDirNext = edgesDirs[(i + 1) % shape.length];
            p = p.add(edgesNormals[i]);
            pNext = pNext.add(edgesNormals[(i + 1) % shape.length]);
            if (Math2D.Cross(edgeDir, edgeDirNext) === 0) {
                newShape[i] = p.add(pNext).scaleInPlace(0.5);
                console.warn("Oups 1");
            }
            else {
                let newP = Math2D.LineLineIntersection(p, edgeDir, pNext, edgeDirNext);
                if (newP) {
                    newShape[i] = newP;
                }
                else {
                    newShape[i] = p;
                    console.warn("Oups 2");
                }
            }
        }
        return newShape;
    }
    static RayRayIntersection(ray1Origin, ray1Direction, ray2Origin, ray2Direction) {
        let x1 = ray1Origin.x;
        let y1 = ray1Origin.y;
        let x2 = x1 + ray1Direction.x;
        let y2 = y1 + ray1Direction.y;
        let x3 = ray2Origin.x;
        let y3 = ray2Origin.y;
        let x4 = x3 + ray2Direction.x;
        let y4 = y3 + ray2Direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, ray1Origin, ray1Direction)) {
                if (Math2D.IsPointInRay(intersection, ray2Origin, ray2Direction)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static LineLineIntersection(line1Origin, line1Direction, line2Origin, line2Direction) {
        let x1 = line1Origin.x;
        let y1 = line1Origin.y;
        let x2 = x1 + line1Direction.x;
        let y2 = y1 + line1Direction.y;
        let x3 = line2Origin.x;
        let y3 = line2Origin.y;
        let x4 = x3 + line2Direction.x;
        let y4 = y3 + line2Direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            return new BABYLON.Vector2(x / det, y / det);
        }
        return undefined;
    }
    static RaySegmentIntersection(rayOrigin, rayDirection, segA, segB) {
        let x1 = rayOrigin.x;
        let y1 = rayOrigin.y;
        let x2 = x1 + rayDirection.x;
        let y2 = y1 + rayDirection.y;
        let x3 = segA.x;
        let y3 = segA.y;
        let x4 = segB.x;
        let y4 = segB.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, rayOrigin, rayDirection)) {
                if (Math2D.IsPointInSegment(intersection, segA, segB)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static SegmentSegmentIntersection(seg1A, seg1B, seg2A, seg2B) {
        let x1 = seg1A.x;
        let y1 = seg1A.y;
        let x2 = seg1B.x;
        let y2 = seg1B.y;
        let x3 = seg2A.x;
        let y3 = seg2A.y;
        let x4 = seg2B.x;
        let y4 = seg2B.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInSegment(intersection, seg1A, seg1B)) {
                if (Math2D.IsPointInSegment(intersection, seg2A, seg2B)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static PointRegionDistanceSquared(point, region) {
        let minimalSquaredDistance = Infinity;
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            let distSquared = Math2D.PointSegmentAxAyBxByDistanceSquared(point, region[i][0], region[i][1], region[(i + 1) % region.length][0], region[(i + 1) % region.length][1]);
            minimalSquaredDistance = Math.min(minimalSquaredDistance, distSquared);
        }
        return minimalSquaredDistance;
    }
}
class VMath {
    // Method adapted from gre's work (https://github.com/gre/bezier-easing). Thanks !
    static easeOutElastic(t, b = 0, c = 1, d = 1) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) {
            return b;
        }
        if ((t /= d) == 1) {
            return b + c;
        }
        if (!p) {
            p = d * .3;
        }
        if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
    static ProjectPerpendicularAt(v, at) {
        let p = BABYLON.Vector3.Zero();
        let k = (v.x * at.x + v.y * at.y + v.z * at.z);
        k = k / (at.x * at.x + at.y * at.y + at.z * at.z);
        p.copyFrom(v);
        p.subtractInPlace(at.multiplyByFloats(k, k, k));
        return p;
    }
    static Angle(from, to) {
        let pFrom = BABYLON.Vector3.Normalize(from);
        let pTo = BABYLON.Vector3.Normalize(to);
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        return angle;
    }
    static AngleFromToAround(from, to, around) {
        let pFrom = VMath.ProjectPerpendicularAt(from, around).normalize();
        let pTo = VMath.ProjectPerpendicularAt(to, around).normalize();
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        if (BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(pFrom, pTo), around) < 0) {
            angle = -angle;
        }
        return angle;
    }
    static CatmullRomPath(path) {
        let interpolatedPoints = [];
        for (let i = 0; i < path.length; i++) {
            let p0 = path[(i - 1 + path.length) % path.length];
            let p1 = path[i];
            let p2 = path[(i + 1) % path.length];
            let p3 = path[(i + 2) % path.length];
            interpolatedPoints.push(BABYLON.Vector3.CatmullRom(p0, p1, p2, p3, 0.5));
        }
        for (let i = 0; i < interpolatedPoints.length; i++) {
            path.splice(2 * i + 1, 0, interpolatedPoints[i]);
        }
    }
}
class Game {
    constructor() {
        this._fighters = [];
        this._fighterOrder = [];
        this._clients = [];
        this._log = new GameLog();
    }
    connectClient(client) {
        this._clients.push(client);
    }
    initialize() {
        this._log.log("initialize");
        this._board = new Board();
        this._board.initialize(10);
        let boardData = this._board.serialize();
        this._clients.forEach(c => {
            c.initializeBoard(boardData);
        });
        for (let i = 0; i < 3; i++) {
            let team0Fighter = Fighter.CreateRandom(0);
            team0Fighter.initialize();
            let tile = this._board.getTileByIJ(-3, -1 + 2 * i);
            tile.setFighter(team0Fighter);
            this._fighters.push(team0Fighter);
        }
        for (let i = 0; i < 3; i++) {
            let team1Fighter = Fighter.CreateRandom(1);
            team1Fighter.initialize();
            let tile = this._board.getTileByIJ(3, -1 + 2 * i);
            tile.setFighter(team1Fighter);
            this._fighters.push(team1Fighter);
        }
        let fighterDatas = [];
        for (let i = 0; i < this._fighters.length; i++) {
            fighterDatas.push(this._fighters[i].serialize());
        }
        this._clients.forEach(c => {
            c.addFighters(fighterDatas);
        });
    }
    initializeTurn() {
        this._log.log("initializeTurn");
        let sortedFighters = this._fighters.sort((a, b) => {
            return b.speed - a.speed;
        });
        this._fighterOrder = [];
        for (let i = 0; i < sortedFighters.length; i++) {
            this._fighterOrder[i] = sortedFighters[i].id;
        }
        this._fighters.forEach(f => {
            f.hasMoved = false;
            f.hasAttacked = false;
            f.shield = Math.min(f.shieldCapacity, f.shield + f.shieldSpeed);
        });
        // Trigger event.
        this._clients.forEach(c => {
            c.updateFightersOrder(this._fighterOrder);
        });
        this._clients.forEach(c => {
            c.initializeTurn();
        });
        this._clients.forEach(c => {
            c.initializePhase();
        });
    }
    getFighterByID(id) {
        return this._fighters.find(f => { return f.id === id; });
    }
    getActiveFighter() {
        let activeFighterId = this._fighterOrder[0];
        if (isFinite(activeFighterId)) {
            let activeFighter = this.getFighterByID(activeFighterId);
            return activeFighter;
        }
    }
    check() {
        if (this._fighterOrder.length === 0) {
            this.initializeTurn();
        }
        else {
            this._clients.forEach(c => {
                c.initializePhase();
            });
        }
    }
    requestMove(fighterId, tileI, tileJ) {
        this._log.log("requestMove " + fighterId + " " + tileI + " " + tileJ);
        let fighter = this.getFighterByID(fighterId);
        if (fighter === this.getActiveFighter()) {
            if (!fighter.hasMoved) {
                let tile = this._board.getTileByIJ(tileI, tileJ);
                if (tile) {
                    if (tile.setFighter(fighter)) {
                        fighter.hasMoved = true;
                        // Trigger event.
                        this._clients.forEach(c => {
                            c.moveFighter(fighterId, tileI, tileJ);
                        });
                        this._log.log("requestMove success");
                        return true;
                    }
                }
            }
        }
        this._log.log("requestMove failure");
        return false;
    }
    requestAttack(fighterId, targetId) {
        this._log.log("requestAttack " + fighterId + " " + targetId);
        let fighter = this.getFighterByID(fighterId);
        if (fighter === this.getActiveFighter()) {
            if (!fighter.hasAttacked) {
                let target = this.getFighterByID(targetId);
                if (target) {
                    if (HexagonMath.Distance(fighter.tileI, fighter.tileJ, target.tileI, target.tileJ) <= 1) {
                        let rand = Math.random() * 100;
                        let result = 0;
                        let damage = fighter.attackPower;
                        if (rand > 100 - fighter.criticalRate) {
                            result = 2;
                            damage *= 2;
                        }
                        else if (rand > 100 - fighter.accuracy + target.dodgeRate) {
                            result = 1;
                        }
                        if (result !== 0) {
                            if (damage < target.shield) {
                                target.shield -= damage;
                                damage = 0;
                            }
                            else {
                                damage -= target.shield;
                                target.shield = 0;
                            }
                            damage -= target.armor;
                            if (damage > 0) {
                                target.hp -= damage;
                                if (target.hp <= 0) {
                                    result = 3;
                                    target.kill();
                                    let targetIndex = this._fighters.indexOf(target);
                                    if (targetIndex !== -1) {
                                        this._fighters.splice(targetIndex, 1);
                                    }
                                    let targetIdIndex = this._fighterOrder.indexOf(targetId);
                                    if (targetIdIndex !== -1) {
                                        this._fighterOrder.splice(targetIdIndex, 1);
                                    }
                                }
                            }
                        }
                        // Trigger event.
                        this._clients.forEach(c => {
                            c.attackFighter(fighterId, targetId, result);
                        });
                        this._clients.forEach(c => {
                            c.updateFighterHPShield(targetId, target.hp, target.shield);
                        });
                        this._log.log("requestAttack success");
                        return true;
                    }
                }
            }
        }
        this._log.log("requestAttack failure");
        return false;
    }
    requestDelay(fighterId) {
        this._log.log("requestDelay " + fighterId);
        let fighter = this.getFighterByID(fighterId);
        if (fighter === this.getActiveFighter()) {
            if (!fighter.hasMoved && !fighter.hasAttacked) {
                let n = 1;
                while (n < this._fighterOrder.length) {
                    let otherFighterId = this._fighterOrder[n];
                    let otherFighter = this.getFighterByID(otherFighterId);
                    if (otherFighter.speed < fighter.speed) {
                        for (let i = 0; i < n; i++) {
                            this._fighterOrder[i] = this._fighterOrder[i + 1];
                        }
                        this._fighterOrder[n] = fighterId;
                        // Trigger event.
                        this._clients.forEach(c => {
                            c.delayFighterPhase(fighterId);
                        });
                        this._clients.forEach(c => {
                            c.updateFightersOrder(this._fighterOrder);
                        });
                        this.check();
                        this._log.log("requestDelay success");
                        return true;
                    }
                    n++;
                }
            }
        }
        this._log.log("requestDelay failure");
        return false;
    }
    requestEndTurn(fighterId) {
        this._log.log("requestEndTurn " + fighterId);
        let fighter = this.getFighterByID(fighterId);
        if (fighter === this.getActiveFighter()) {
            this._fighterOrder.splice(0, 1);
            // Trigger event.
            this._clients.forEach(c => {
                c.endFighterPhase(fighterId);
            });
            this._clients.forEach(c => {
                c.updateFightersOrder(this._fighterOrder);
            });
            this.check();
            this._log.log("requestEndTurn success");
            return true;
        }
        this._log.log("requestEndTurn failure");
        return false;
    }
}
class GameLog {
    constructor() {
        this.lines = [];
    }
    log(obj) {
        let t = new Date();
        let l = t.getTime() + " " + obj;
        this.lines.push(l);
        console.log(l);
    }
}
