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
        return vertexDatas[0];
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
class Building extends BABYLON.Mesh {
    constructor(width = 8, depth = 8, floors = 2) {
        super("building");
        this.width = width;
        this.depth = depth;
        this.floors = floors;
        this._wallColumnMaterial = new BABYLON.StandardMaterial("wall-column-material", Main.Scene);
        this._wallColumnMaterial.diffuseColor.copyFromFloats(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
        this._wallColumnMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
        this._wallBorderMaterial = new BABYLON.StandardMaterial("wall-border-material", Main.Scene);
        let r = Math.random() * 0.25 + 0.25;
        this._wallBorderMaterial.diffuseColor.copyFromFloats(r, r, r);
        this._wallBorderMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
        this._windowGlassMaterial = new BABYLON.StandardMaterial("window-glass-material", Main.Scene);
        this._windowGlassMaterial.diffuseColor.copyFromFloats(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1);
        this._windowGlassMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
        this._windowForgeMaterial = new BABYLON.StandardMaterial("window-forge-material", Main.Scene);
        r = Math.random() * 0.25;
        this._windowForgeMaterial.diffuseColor.copyFromFloats(r, r, r);
        this._windowForgeMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
    }
    async instantiate() {
        let datas = await VertexDataLoader.instance.get("building_toon_test");
        let wallMainData = datas.get("wall-main");
        if (wallMainData) {
            wallMainData = BuildingVertexData.WidthDepth(wallMainData, this.width, this.depth);
            let wallMainMaterial = new BABYLON.StandardMaterial("wall-main-material", Main.Scene);
            wallMainMaterial.diffuseColor.copyFromFloats(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5);
            wallMainMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            for (let i = 0; i < this.floors; i++) {
                let wallMain = new BABYLON.Mesh("wall-main");
                wallMainData.applyToMesh(wallMain);
                wallMain.position.y = 3 * i;
                wallMain.material = wallMainMaterial;
                let x0 = -1.2 - (this.width / 2 - 1);
                let l = Math.abs(2 * x0);
                let n = Math.floor(l / 2.5);
                let d = l / (2 * n);
                if (n > 0) {
                    let windowData = datas.get("window");
                    if (windowData) {
                        for (let j = 0; j < n; j++) {
                            let window = new BABYLON.Mesh("window");
                            windowData.applyToMesh(window);
                            window.position.x = x0 + d + 2 * d * j;
                            window.position.y = 3 * i + 1.8;
                            window.position.z = 1.35 + (this.depth / 2 - 1);
                            window.material = this._wallColumnMaterial;
                        }
                    }
                    let windowGlassData = datas.get("window-glass");
                    if (windowGlassData) {
                        for (let j = 0; j < n; j++) {
                            let windowGlass = new BABYLON.Mesh("window-glass");
                            windowGlassData.applyToMesh(windowGlass);
                            windowGlass.position.x = x0 + d + 2 * d * j;
                            windowGlass.position.y = 3 * i + 1.8;
                            windowGlass.position.z = 1.35 + (this.depth / 2 - 1);
                            windowGlass.material = this._windowGlassMaterial;
                        }
                    }
                    let windowForgeData = datas.get("window-forge");
                    if (windowForgeData) {
                        for (let j = 0; j < n; j++) {
                            let windowForge = new BABYLON.Mesh("window-forge");
                            windowForgeData.applyToMesh(windowForge);
                            windowForge.position.x = x0 + d + 2 * d * j;
                            windowForge.position.y = 3 * i + 1.8;
                            windowForge.position.z = 1.35 + (this.depth / 2 - 1);
                            windowForge.material = this._windowForgeMaterial;
                        }
                    }
                }
            }
        }
        let wallMainShadowData = datas.get("wall-main-shadow");
        if (wallMainShadowData) {
            wallMainShadowData = BuildingVertexData.WidthDepth(wallMainShadowData, this.width, this.depth);
            let wallMainShadowMaterial = new BABYLON.StandardMaterial("wall-main-shadow-material", Main.Scene);
            wallMainShadowMaterial.diffuseTexture = new BABYLON.Texture("datas/textures/square_frame_shadow.png", Main.Scene);
            wallMainShadowMaterial.diffuseTexture.hasAlpha = true;
            wallMainShadowMaterial.useAlphaFromDiffuseTexture = true;
            wallMainShadowMaterial.specularColor.copyFromFloats(0, 0, 0);
            for (let i = 0; i < this.floors; i++) {
                let wallMainShadow = new BABYLON.Mesh("wall-main-shadow");
                wallMainShadowData.applyToMesh(wallMainShadow);
                wallMainShadow.position.y = 3 * i;
                wallMainShadow.material = wallMainShadowMaterial;
                wallMainShadow.visibility = 0.5;
            }
        }
        let wallBorderData = datas.get("wall-border");
        if (wallBorderData) {
            wallBorderData = BuildingVertexData.WidthDepth(wallBorderData, this.width, this.depth);
            for (let i = 0; i < this.floors; i++) {
                let wallBorder = new BABYLON.Mesh("wall-border");
                wallBorderData.applyToMesh(wallBorder);
                wallBorder.position.y = 3 * i;
                wallBorder.material = this._wallBorderMaterial;
            }
        }
        let wallColumnData = datas.get("wall-column");
        if (wallColumnData) {
            wallColumnData = BuildingVertexData.WidthDepth(wallColumnData, this.width, this.depth);
            for (let i = 0; i < this.floors; i++) {
                let wallColumn = new BABYLON.Mesh("wall-column");
                wallColumnData.applyToMesh(wallColumn);
                wallColumn.position.y = 3 * i;
                wallColumn.material = this._wallColumnMaterial;
            }
        }
        let roofTopData = datas.get("roof-top");
        if (roofTopData) {
            roofTopData = BuildingVertexData.WidthDepth(roofTopData, this.width, this.depth);
            let roofTop = new BABYLON.Mesh("roof-top");
            roofTopData.applyToMesh(roofTop);
            roofTop.position.y = 3 * this.floors;
        }
        let roofBorderData = datas.get("roof-border");
        if (roofBorderData) {
            roofBorderData = BuildingVertexData.WidthDepth(roofBorderData, this.width, this.depth);
            let roofBorder = new BABYLON.Mesh("roof-border");
            roofBorderData.applyToMesh(roofBorder);
            roofBorder.position.y = 3 * this.floors;
            roofBorder.material = this._wallBorderMaterial;
        }
    }
}
class BuildingVertexData {
    static WidthDepth(vertexData, w, d) {
        let newData = VertexDataLoader.clone(vertexData);
        let newPositions = [...newData.positions];
        let l = newPositions.length / 3;
        let xOffset = w / 2 - 1;
        let zOffset = d / 2 - 1;
        for (let i = 0; i < l; i++) {
            if (newPositions[3 * i] < 0) {
                newPositions[3 * i] -= xOffset;
            }
            else if (newPositions[3 * i] > 0) {
                newPositions[3 * i] += xOffset;
            }
            if (newPositions[3 * i + 2] < 0) {
                newPositions[3 * i + 2] -= zOffset;
            }
            else if (newPositions[3 * i + 2] > 0) {
                newPositions[3 * i + 2] += zOffset;
            }
        }
        newData.positions = newPositions;
        return newData;
    }
}
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
        this.onFighterOrderUpdated();
    }
    onFighterOrderUpdated() { }
    initializeTurn() {
        this.onTurnInitialized();
    }
    onTurnInitialized() { }
    ;
    initializePhase() {
        let fighter = this.getActiveFighter();
        if (fighter) {
            fighter.hasMoved = false;
            fighter.hasAttacked = false;
        }
        this.onPhaseInitialized();
    }
    onPhaseInitialized() { }
    ;
    moveFighter(fighterId, tileI, tileJ) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            let tile = this._board.getTileByIJ(tileI, tileJ);
            if (tile) {
                tile.setFighter(fighter);
                fighter.hasMoved = true;
                this.onFighterMoved(fighter);
            }
        }
    }
    onFighterMoved(fighter) { }
    attackFighter(fighterId, targetId) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            fighter.hasAttacked = true;
            let target = this.getFighterByID(targetId);
            if (target) {
                this.onFighterHasAttacked(fighter, target);
            }
        }
    }
    onFighterHasAttacked(fighter, target) { }
    ;
    woundFighter(fighterId, amount) {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            fighter.hp -= amount;
            this.onFighterWounded(fighter, amount);
        }
    }
    onFighterWounded(fighter, amount) { }
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
            let idElement = document.createElement("div");
            idElement.textContent = "ID = " + fighter.id;
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
    onPhaseInitialized() {
        let activeFighter = this.getActiveFighter();
        if (activeFighter) {
            if (activeFighter.team === this._team) {
                activeFighter.showUI();
            }
        }
    }
    ;
    onFighterMoved(fighter) {
        if (fighter instanceof AlphaFighter) {
            fighter.updateMesh(Main.Scene);
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterMoved();
            }
        }
    }
    onFighterHasAttacked(fighter, target) {
        if (fighter instanceof AlphaFighter) {
            fighter.updateMesh(Main.Scene);
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterAttacked();
            }
        }
    }
    onFighterWounded(fighter, amount) {
        if (fighter instanceof AlphaFighter) {
            fighter.updateHitPointMesh();
        }
    }
    ;
    onFighterKilled(fighter) { }
    ;
    onFighterPhaseDelayed(fighter) {
        if (fighter instanceof AlphaFighter) {
            fighter.hideReachableTiles();
        }
    }
    onFighterPhaseEnded(fighter) {
        if (fighter instanceof AlphaFighter) {
            fighter.hideUI();
            fighter.hideReachableTiles();
        }
    }
}
class IFighterData {
}
class Fighter {
    constructor(team) {
        this.speed = 10;
        this.range = 3;
        this.stamina = 10;
        this.power = 3;
        this.hp = 10;
        this.hasMoved = false;
        this.hasAttacked = false;
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
        this.speed = Math.floor(Math.random() * 100);
        this.range = Math.floor(Math.random() * 3 + 2);
        this.stamina = Math.floor(Math.random() * 3) * 5 + 10;
        this.power = Math.floor(Math.random() * 5 + 2);
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
            speed: this.speed
        };
        if (this._tile) {
            data.i = this._tile.i;
            data.j = this._tile.j;
        }
        return data;
    }
    static deserialize(data, fighter) {
        fighter.team = data.team;
        fighter.id = data.id;
        fighter.speed = data.speed;
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
    constructor() {
        super(...arguments);
        this._reacheableTilesMeshes = [];
    }
    updateMesh(scene) {
        if (!this.transformMesh) {
            this.transformMesh = new BABYLON.Mesh("fighter-" + this.id);
        }
        if (!this._fighterMesh) {
            this._fighterMesh = BABYLON.MeshBuilder.CreateBox("fighter-mesh-" + this.id, {
                size: 0.5
            }, scene);
            this._fighterMesh.parent = this.transformMesh;
            this._fighterMesh.position.y = 0.5;
        }
        if (!this._turnStatusMesh) {
            this._turnStatusMesh = BABYLON.MeshBuilder.CreateIcoSphere("turn-status-" + this.id, {
                radius: 0.2,
                subdivisions: 2
            }, Main.Scene);
            this._turnStatusMesh.parent = this._fighterMesh;
            this._turnStatusMesh.position.y = 1;
        }
        if (!this._teamIndicatorMesh) {
            this._teamIndicatorMesh = new BABYLON.Mesh("team-indicator-" + this.id);
            this._teamIndicatorMesh.parent = this.transformMesh;
            SpaceMeshBuilder.CreateHexagonVertexData(0.35, 0.41).applyToMesh(this._teamIndicatorMesh);
            if (this.team === 0) {
                this._teamIndicatorMesh.material = Main.blueMaterial;
            }
            else if (this.team === 1) {
                this._teamIndicatorMesh.material = Main.redMaterial;
            }
        }
        if (!this._hpLeftMesh) {
            this._hpLeftMesh = new BABYLON.Mesh("hp-left-" + this.id);
            this._hpLeftMesh.parent = this.transformMesh;
            this._hpLeftMesh.material = Main.greenMaterial;
        }
        if (!this._hpLostMesh) {
            this._hpLostMesh = new BABYLON.Mesh("hp-lost-" + this.id);
            this._hpLostMesh.parent = this.transformMesh;
            this._hpLostMesh.material = Main.redMaterial;
        }
        if (!this._selectionMesh) {
            this._selectionMesh = new BABYLON.Mesh("selection-" + this.id);
            this._selectionMesh.parent = this.transformMesh;
            SpaceMeshBuilder.CreateHexagonVertexData(0.15, 0.27).applyToMesh(this._selectionMesh);
            if (this.team === 0) {
                this._selectionMesh.material = Main.blueMaterial;
            }
            else if (this.team === 1) {
                this._selectionMesh.material = Main.redMaterial;
            }
            this._selectionMesh.isVisible = false;
        }
        this.transformMesh.position.x = 0.75 * this._tile.i;
        this.transformMesh.position.z = (this._tile.i * 0.5 + this._tile.j) * COS30;
        this.updateHitPointMesh();
    }
    updateHitPointMesh() {
        let ratio = this.hp / this.stamina;
        if (ratio <= 0) {
            this._hpLeftMesh.isVisible = false;
            this._hpLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, 0, 1).applyToMesh(this._hpLostMesh);
        }
        else if (ratio >= 1) {
            this._hpLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, 0, 1).applyToMesh(this._hpLeftMesh);
            this._hpLostMesh.isVisible = false;
        }
        else {
            this._hpLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, 0, ratio).applyToMesh(this._hpLeftMesh);
            this._hpLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, ratio, 1).applyToMesh(this._hpLostMesh);
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
        for (let i = -5; i <= 4; i++) {
            for (let j = -6; j <= 7; j++) {
                if (HexagonMath.Distance(0, 0, i, j) <= 3) {
                    let tileI = this._tile.i + i;
                    let tileJ = this._tile.j + j;
                    let tile = AlphaClient.Instance.alphaBoard.getTileByIJ(tileI, tileJ);
                    if (tile) {
                        if (!tile.getFighter()) {
                            let mesh = BABYLON.MeshBuilder.CreateCylinder("reachable-tile", {
                                height: 0.1,
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
/// <reference path="../../lib/babylon.d.ts"/>
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
        let camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), Main.Scene);
        camera.setPosition(new BABYLON.Vector3(-10, 25, 30));
        camera.attachControl(Main.Canvas, true);
        camera.lowerRadiusLimit = 6;
        camera.upperRadiusLimit = 200;
        camera.wheelPrecision *= 4;
        Main.Camera = camera;
    }
    async initialize() {
        await this.initializeScene();
    }
    async initializeScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
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
        // Skybox seed : 1vt3h8rxhb28
        Main.Skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", { diameter: 3000.0 }, Main.Scene);
        Main.Skybox.layerMask = 1;
        Main.Skybox.infiniteDistance = true;
        let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", Main.Scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.emissiveTexture = new BABYLON.Texture("./datas/textures/sky.png", Main.Scene);
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        Main.Skybox.material = skyboxMaterial;
        new VertexDataLoader(Main.Scene);
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
            let team0Fighter = new Fighter(0);
            team0Fighter.initialize();
            let tile = this._board.getTileByIJ(-3, -1 + 2 * i);
            tile.setFighter(team0Fighter);
            this._fighters.push(team0Fighter);
        }
        for (let i = 0; i < 3; i++) {
            let team1Fighter = new Fighter(1);
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
        });
        // Trigger event.
        this._clients.forEach(c => {
            c.updateFightersOrder(this._fighterOrder);
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
                        target.hp -= fighter.power;
                        // Trigger event.
                        this._clients.forEach(c => {
                            c.attackFighter(fighterId, targetId);
                        });
                        this._clients.forEach(c => {
                            c.woundFighter(targetId, fighter.power);
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
