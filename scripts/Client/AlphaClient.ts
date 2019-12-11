/// <reference path="Client.ts"/>

class AlphaClient extends Client {

    public static Instance: AlphaClient;

    private _inspector: AlphaInspector;

    public get alphaBoard(): AlphaBoard {
        if (this._board instanceof AlphaBoard) {
            return this._board;
        }
    }
    
    constructor(team: number) {
        super(team);
        AlphaClient.Instance = this;

        this._board = new AlphaBoard();
        this._inspector = new AlphaInspector();
        new AlphaFighterSelector();
    }

    public findFighter(filter: (f: AlphaFighter) => boolean): AlphaFighter {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            if (fighter instanceof AlphaFighter) {
                if (filter(fighter)) {
                    return fighter;
                }
            }
        }
    }

    public forEachFighter(callback: (f: AlphaFighter) => void): void {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            if (fighter instanceof AlphaFighter) {
                callback(fighter);
            }
        }
    }

    protected onBoardInitialized(): void {
        this.alphaBoard.updateMesh(Main.Scene);
    }

    protected createFighter(data: IFighterData): Fighter {
        let fighter = new AlphaFighter();
        Fighter.deserialize(data, fighter);
        return fighter;
    }

    protected onFightersAdded(fightersAdded: Fighter[]): void {
        for (let i = 0; i < fightersAdded.length; i++) {
            let fighter = fightersAdded[i] as AlphaFighter;
            fighter.updateMesh(Main.Scene);
        }
    }

    protected onFighterOrderUpdated(): void {
        let container = document.getElementById("fighters-order");
        container.innerHTML = "";

        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i] as AlphaFighter;
            fighter.updateTurnStatus(-1);
        }

        for (let i = 0; i < this._fighterOrder.length; i++) {
            let fighterId = this._fighterOrder[i];
            let fighter = this.getFighterByID(fighterId) as AlphaFighter;
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

    protected onTurnInitialized(): void {
        for (let i = 0; i <this._fighters.length; i++) {
            let fighter = this._fighters[i] as AlphaFighter;
            fighter.updateHitPointMesh();
        }
    };

    protected onPhaseInitialized(): void {
        let activeFighter = this.getActiveFighter() as AlphaFighter;
        if (activeFighter) {
            this._inspector.updateActive(activeFighter);
            Main.Camera.currentTarget = activeFighter.transformMesh;
            Main.Camera.currentRadius = 5;
            if (activeFighter.team === this._team) {
                activeFighter.showText(SpeechSituation.Ready);
                activeFighter.showUI();
            }
        }
    };

    protected onBeforeFighterMoved(fighter: Fighter, tileI: number, tileJ: number): void {
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
            }
            moveAnimation();
        }
    }

    protected onFighterMoved(fighter: Fighter): void {
        if (fighter instanceof AlphaFighter) {
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterMoved();
            }
        }
    }


    protected onFighterHasAttacked(fighter: Fighter, target: Fighter, result: number): void {
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
            }
            aimAnimation();
            setTimeout(
                () => {
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
                },
                3000
            )
            fighter.updateMesh(Main.Scene);
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterAttacked();
            }
        }
    }

    protected onFighterHPShieldUpdated(fighter: Fighter) {
        if (fighter instanceof AlphaFighter) {
            if (fighter.hp <= 0) {
                fighter.transformMesh.dispose();
            }
            else {
                fighter.updateHitPointMesh();
            }
        }
    };

    protected onFighterKilled(fighter: Fighter) {};

    protected onFighterPhaseDelayed(fighter: Fighter): void {
        if (fighter instanceof AlphaFighter) {
            if (fighter.team === this._team) {
                fighter.showText(SpeechSituation.Hold);
            }
            fighter.hideReachableTiles();
        }
    }
    
    protected onFighterPhaseEnded(fighter: Fighter): void {
        if (fighter instanceof AlphaFighter) {
            if (fighter.team === this._team) {
                fighter.showText(SpeechSituation.Pass);
            }
            fighter.hideUI();
            fighter.hideReachableTiles();
        }
    }
}