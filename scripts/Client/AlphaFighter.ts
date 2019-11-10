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
                        let fighter = AlphaClient.Instance.findFighter(f => { return f.transformMesh === pickedMesh || f.transformMesh === pickedMesh.parent });
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
    public fighterMesh: BABYLON.Mesh;
    private _turnStatusMesh: BABYLON.Mesh;
    private _teamIndicatorMesh: BABYLON.Mesh;
    private _hpLeftMesh: BABYLON.Mesh;
    private _hpLostMesh: BABYLON.Mesh;
    private _shieldLeftMesh: BABYLON.Mesh;
    private _shieldLostMesh: BABYLON.Mesh;
    private _selectionMesh: BABYLON.Mesh;

    public speechBubble: SpeechBubble;

    private _reacheableTilesMeshes: { mesh: BABYLON.Mesh, pointerUpCallback: () => void }[] = [];
    private _pointerObserver: BABYLON.Observer<BABYLON.PointerInfo>;

    constructor(team?: number) {
        super(team);
        PilotSpeech.LoadProfessionalSpeeches();
        setInterval(
            () => {
                this.updateHitPointMesh();
            },
            1000
        );
    }

    public updateMesh(scene: BABYLON.Scene): void {
        if (!this.transformMesh) {
            this.transformMesh = new BABYLON.Mesh("fighter-" + this.id);
        }
        if (!this.fighterMesh) {
            let spaceship = new SpaceShip();
            spaceship.name = "Demo";
            spaceship.initialize({
                type: "root",
                name: "body-1",
                children: [
                    {
                        type: "wingL",
                        name: "wing-1",
                        children: [
                            {
                                type: "weapon",
                                name: "canon-1"
                            }
                        ]
                    },
                    {
                        type: "wingR",
                        name: "wing-1",
                        children: [
                            {
                                type: "weapon",
                                name: "canon-1"
                            }
                        ]
                    }
                ]
            },
                "#ffdddd",
                "#ddbbbb"
            );
            this.fighterMesh = spaceship;
            this.fighterMesh.scaling.copyFromFloats(0.15, 0.15, 0.15);
            this.fighterMesh.parent = this.transformMesh;
            this.fighterMesh.position.y = 0.25;
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
            let lines: BABYLON.Vector3[][] = [[], []];
            for (let i = 0; i <= 32; i++) {
                let p = new BABYLON.Vector3(
                    Math.cos(i / 24 * Math.PI * 2),
                    0,
                    Math.sin(i / 24 * Math.PI * 2)
                );
                lines[0].push(p.scale(0.37));
                lines[1].push(p.scale(0.24).addInPlaceFromFloats(0, 0, 0.05));
            }
            this._selectionMesh = BABYLON.MeshBuilder.CreateLineSystem(
                "selection-mesh-" + this.id,
                {
                    lines: lines
                },
                Main.Scene
            );
            this._selectionMesh.parent = this._teamIndicatorMesh;
            this._selectionMesh.isVisible = false;
        }
        this.transformMesh.position.x = 0.75 * this._tile.i;
        this.transformMesh.position.z = (this._tile.i * 0.5 + this._tile.j) * COS30;
        this.updateHitPointMesh();
    }

    public rotateHPShieldMesh(r: number): void {
        this._teamIndicatorMesh.rotation.y = r;
    }

    public updateHitPointMesh(): void {
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
        this.showText(PilotSpeech.GetText(PilotNature.Professional, SpeechSituation.Selected));
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
        for (let i = - this.moveRange; i <= this.moveRange; i++) {
            for (let j = - this.moveRange; j <= this.moveRange; j++) {
                if (HexagonMath.Distance(0, 0, i, j) <= this.moveRange) {
                    let tileI = this._tile.i + i;
                    let tileJ = this._tile.j + j;
                    let tile = AlphaClient.Instance.alphaBoard.getTileByIJ(tileI, tileJ);
                    if (tile) {
                        if (!tile.getFighter()) {
                            let mesh = BABYLON.MeshBuilder.CreateCylinder(
                                "reachable-tile",
                                {
                                    height: 0.01,
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

    public clearSpeechBubbleTimeout: number = -1;
    public showText(text: string): void {
        clearTimeout(this.clearSpeechBubbleTimeout);
        if (this.speechBubble) {
            this.speechBubble.dispose();
        }
        this.speechBubble = SpeechBubble.CreateSpeechBubble(this.transformMesh, text);

        this.speechBubble.setTarget(this.transformMesh);

        this.clearSpeechBubbleTimeout = setTimeout(
            () => {
                this.speechBubble.dispose();
                this.speechBubble = undefined;
            },
            3000
        );
    }
}