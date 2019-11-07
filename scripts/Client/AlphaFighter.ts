/// <reference path="../Common/Fighter.ts"/>
/// <reference path="./SpacePanel.ts"/>

class AlphaFighterSelector {

    private static _Instance: AlphaFighterSelector;
    public static get Instance(): AlphaFighterSelector {
        if (!AlphaFighterSelector._Instance) {
            AlphaFighterSelector._Instance = new AlphaFighterSelector();
        }
        return AlphaFighterSelector._Instance;
    }

    public selectedFighter: AlphaFighter;

    public overloadPointerUpCallback: (f: AlphaFighter) => any = undefined;

    constructor() {
        AlphaFighterSelector._Instance = this;
        Main.Scene.onPointerObservable.add(
            (eventData) => {
                if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                    let pickedMesh = eventData.pickInfo.pickedMesh;
                    if (pickedMesh && pickedMesh.parent) {
                        let fighter = AlphaClient.Instance.findFighter(f => { return f.transformMesh === pickedMesh || f.transformMesh === pickedMesh.parent});
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
            }
        )
    }

    public setSelectedFighter(fighter: AlphaFighter): void {
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

    private static ActionPanel: ActionPanel;

    public transformMesh: BABYLON.Mesh;
    private _fighterMesh: BABYLON.Mesh;
    private _turnStatusMesh: BABYLON.Mesh;
    private _teamIndicatorMesh: BABYLON.Mesh;
    private _shieldLeftMesh: BABYLON.Mesh;
    private _hpLeftMesh: BABYLON.Mesh;
    private _hpLostMesh: BABYLON.Mesh;
    private _selectionMesh: BABYLON.Mesh;

    private _reacheableTilesMeshes: { mesh: BABYLON.Mesh, pointerUpCallback: () => void }[] = [];
    private _pointerObserver: BABYLON.Observer<BABYLON.PointerInfo>;

    public updateMesh(scene: BABYLON.Scene): void {
        if (!this.transformMesh) {
            this.transformMesh = new BABYLON.Mesh("fighter-" + this.id);
        }
        if (!this._fighterMesh) {
            this._fighterMesh = BABYLON.MeshBuilder.CreateBox(
                "fighter-mesh-" + this.id,
                {
                    size: 0.5
                },
                scene
            );
            this._fighterMesh.parent = this.transformMesh;
            this._fighterMesh.position.y = 0.5;
        }
        if (!this._turnStatusMesh) {
            this._turnStatusMesh = BABYLON.MeshBuilder.CreateIcoSphere(
                "turn-status-" + this.id,
                {
                    radius: 0.2,
                    subdivisions: 2
                },
                Main.Scene
            );
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
        if (!this._shieldLeftMesh) {
            this._shieldLeftMesh = new BABYLON.Mesh("shield-left-" + this.id);
            this._shieldLeftMesh.parent = this.transformMesh;
            this._shieldLeftMesh.position.y = -0.001;
            this._shieldLeftMesh.material = Main.cyanMaterial;
        }
        if (!this._selectionMesh) {
            this._selectionMesh = new BABYLON.Mesh("selection-" + this.id);
            this._selectionMesh.parent = this.transformMesh;
            this._selectionMesh.position.y = -0.001;
            SpaceMeshBuilder.CreateHexagonVertexData(0.33, 0.43).applyToMesh(this._selectionMesh);
            this._selectionMesh.material = Main.whiteMaterial;
            this._selectionMesh.isVisible = false;
        }
        this.transformMesh.position.x = 0.75 * this._tile.i;
        this.transformMesh.position.z = (this._tile.i * 0.5 + this._tile.j) * COS30;
        this.updateHitPointMesh();
    }

    public updateHitPointMesh(): void {
        let ratioHP = this.hp / this.stamina;
        if (ratioHP <= 0) {
            this._hpLeftMesh.isVisible = false;
            this._hpLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, 0, 1).applyToMesh(this._hpLostMesh);
        }
        else if (ratioHP >= 1) {
            this._hpLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, 0, 1).applyToMesh(this._hpLeftMesh);
            this._hpLostMesh.isVisible = false;
        }
        else {
            this._hpLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, 0, ratioHP).applyToMesh(this._hpLeftMesh);
            this._hpLostMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.12, ratioHP, 1).applyToMesh(this._hpLostMesh);
        }

        let ratioShield = 0;
        if (this.shieldCapacity > 0) {
            ratioShield = this.shield / this.shieldCapacity;
        }
        if (ratioShield <= 0) {
            this._shieldLeftMesh.isVisible = false;
        }
        else if (ratioShield >= 1) {
            this._shieldLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.18, 0, 1).applyToMesh(this._shieldLeftMesh);
        }
        else {
            this._shieldLeftMesh.isVisible = true;
            SpaceMeshBuilder.CreateHPBar(0.33, 0.18, 0, ratioShield).applyToMesh(this._shieldLeftMesh);
        }
    }

    public updateTurnStatus(status: number): void {
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
    
    public select(): void {
        this._selectionMesh.isVisible = true;
    }
    
    public unselect(): void {
        this._selectionMesh.isVisible = false;
    }

    public showUI(): void {
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
                }
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
                }
                AlphaFighterSelector.Instance.overloadPointerUpCallback = (fighter) => {
                    AlphaClient.Instance.game.requestAttack(this.id, fighter.id);
                }
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

    public hideUI(): void {
        if (AlphaFighter.ActionPanel) {
            AlphaFighter.ActionPanel.dispose();
            delete AlphaFighter.ActionPanel;
        }
    }

    public updateUI(): void {
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

    public onAfterFighterMoved(): void {
        this.hideReachableTiles();
        AlphaFighter.ActionPanel.moveButton.style.display = "";
        AlphaFighter.ActionPanel.attackButton.style.display = "";
        AlphaFighter.ActionPanel.holdButton.style.display = "";
        AlphaFighter.ActionPanel.passButton.style.display = "";
        AlphaFighter.ActionPanel.backButton.style.display = "none";
        this.updateUI();
    }

    public onAfterFighterAttacked(): void {
        AlphaFighterSelector.Instance.overloadPointerUpCallback = undefined;
        AlphaFighter.ActionPanel.moveButton.style.display = "";
        AlphaFighter.ActionPanel.attackButton.style.display = "";
        AlphaFighter.ActionPanel.holdButton.style.display = "";
        AlphaFighter.ActionPanel.passButton.style.display = "";
        AlphaFighter.ActionPanel.backButton.style.display = "none";
        this.updateUI();
    }

    public showReachableTiles(): void {
        this.hideReachableTiles();
        for (let i = - 5; i <= 4; i++) {
            for (let j = - 6; j <= 7; j++) {
                if (HexagonMath.Distance(0, 0, i, j) <= 3) {
                    let tileI = this._tile.i + i;
                    let tileJ = this._tile.j + j;
                    let tile = AlphaClient.Instance.alphaBoard.getTileByIJ(tileI, tileJ);
                    if (tile) {
                        if (!tile.getFighter()) {
                            let mesh = BABYLON.MeshBuilder.CreateCylinder(
                                "reachable-tile",
                                {
                                    height: 0.1,
                                    diameter: 0.8,
                                    tessellation: 6
                                },
                                Main.Scene
                            );
                            mesh.position.x = 0.75 * tileI;
                            mesh.position.z = (tileI * 0.5 + tileJ) * COS30;
                            mesh.material = Main.greenMaterial;
                            this._reacheableTilesMeshes.push(
                                {
                                    mesh: mesh,
                                    pointerUpCallback: () => {
                                        AlphaClient.Instance.game.requestMove(this.id, tileI, tileJ);
                                    }
                                }
                            );
                        }
                    }
                }
            }
        }
        this._pointerObserver = Main.Scene.onPointerObservable.add(
            (eventData) => {
                if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                    let reachableTileMesh = this._reacheableTilesMeshes.find(a => { return a.mesh === eventData.pickInfo.pickedMesh; });
                    if (reachableTileMesh) {
                        reachableTileMesh.pointerUpCallback();
                    }
                }
            }
        )
    }

    public hideReachableTiles(): void {
        Main.Scene.onPointerObservable.remove(this._pointerObserver);
        while (this._reacheableTilesMeshes.length > 0) {
            this._reacheableTilesMeshes.pop().mesh.dispose();
        }
    }
}