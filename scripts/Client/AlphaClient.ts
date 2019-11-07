/// <reference path="Client.ts"/>

class AlphaClient extends Client {

    public static Instance: AlphaClient;

    public get alphaBoard(): AlphaBoard {
        if (this._board instanceof AlphaBoard) {
            return this._board;
        }
    }
    
    constructor(team: number) {
        super(team);
        AlphaClient.Instance = this;

        this._board = new AlphaBoard();
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

        for (let i = 0; i <this._fighters.length; i++) {
            let fighter = this._fighters[i] as AlphaFighter;
            fighter.updateTurnStatus(-1);
        }

        for (let i = 0; i < this._fighterOrder.length; i++) {
            let fighterId = this._fighterOrder[i];
            let fighter = this.getFighterByID(fighterId) as AlphaFighter;
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

    protected onTurnInitialized(): void {
        for (let i = 0; i <this._fighters.length; i++) {
            let fighter = this._fighters[i] as AlphaFighter;
            fighter.updateHitPointMesh();
        }
    };

    protected onPhaseInitialized(): void {
        let activeFighter = this.getActiveFighter() as AlphaFighter;
        if (activeFighter) {
            if (activeFighter.team === this._team) {
                activeFighter.showUI();
            }
        }
    };

    protected onFighterMoved(fighter: Fighter): void {
        if (fighter instanceof AlphaFighter) {
            fighter.updateMesh(Main.Scene);
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterMoved();
            }
        }
    }


    protected onFighterHasAttacked(fighter: Fighter, target: Fighter, result: number): void {
        if (fighter instanceof AlphaFighter) {
            fighter.updateMesh(Main.Scene);
            if (fighter === this.getActiveFighter()) {
                fighter.onAfterFighterAttacked();
            }
        }
    }

    protected onFighterHPShieldUpdated(fighter: Fighter) {
        if (fighter instanceof AlphaFighter) {
            fighter.updateHitPointMesh();
        }
    };

    protected onFighterKilled(fighter: Fighter) {};

    protected onFighterPhaseDelayed(fighter: Fighter): void {
        if (fighter instanceof AlphaFighter) {
            fighter.hideReachableTiles();
        }
    }
    
    protected onFighterPhaseEnded(fighter: Fighter): void {
        if (fighter instanceof AlphaFighter) {
            fighter.hideUI();
            fighter.hideReachableTiles();
        }
    }
}