/// <reference path="../Common/Fighter.ts"/>
/// <reference path="./SpacePanel.ts"/>

class AlphaFighter extends Fighter {

    private static ActionPanel: ActionPanel;

    private _fighterMesh: BABYLON.Mesh;
    private _turnStatusMesh: BABYLON.Mesh;

    private _reacheableTilesMeshes: { mesh: BABYLON.Mesh, pointerUpCallback: () => void }[] = [];
    private _pointerObserver: BABYLON.Observer<BABYLON.PointerInfo>;

    public updateMesh(scene: BABYLON.Scene): void {
        if (!this._fighterMesh) {
            this._fighterMesh = BABYLON.MeshBuilder.CreateBox(
                "fighter-" + this.id,
                {
                    size: 0.5
                },
                scene
            );
            if (this.team === 0) {
                this._fighterMesh.material = Main.blueMaterial;
            }
            else if (this.team === 1) {
                this._fighterMesh.material = Main.redMaterial;
            }
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
        this._fighterMesh.position.x = 0.75 * this._tile.i;
        this._fighterMesh.position.y = 0.25;
        this._fighterMesh.position.z = (this._tile.i * 0.5 + this._tile.j) * COS30;
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
            
        };
        AlphaFighter.ActionPanel.holdButton.onclick = () => {
            AlphaClient.Instance.game.requestDelay(this.id);
        };
        AlphaFighter.ActionPanel.passButton.onclick = () => {
            AlphaClient.Instance.game.requestEndTurn(this.id);
        };
        AlphaFighter.ActionPanel.setTarget(this._fighterMesh);
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
        if (this.hasMoved) {
            AlphaFighter.ActionPanel.moveButton.style.display = "none";
        }
        else {
            AlphaFighter.ActionPanel.moveButton.style.display = "";
        }
        if (this.hasAttacked) {
            AlphaFighter.ActionPanel.attackButton.style.display = "none";
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