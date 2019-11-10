class Client implements IClient {
    
    public game: Game;

    protected _fighters: Fighter[] = [];
    protected _fighterOrder: number[] = [];
    protected _board: Board;

    constructor(
        protected _team: number
    ) {

    }

    public connectGame(game: Game): void {
        this.game = game;
    }

    protected getFighterByID(id: number): Fighter {
        return this._fighters.find(f => { return f.id === id; });
    }

    protected getActiveFighter(): Fighter {
        let activeFighterId = this._fighterOrder[0];
        if (isFinite(activeFighterId)) {
            let activeFighter = this.getFighterByID(activeFighterId);
            return activeFighter;
        }
    }

    public initializeBoard(boardData: IBoardData) {
        if (!this._board) {
            this._board = new Board();
        }
        Board.deserialize(boardData, this._board);
        this.onBoardInitialized();
    }
    protected onBoardInitialized(): void {}

    protected createFighter(data: IFighterData): Fighter {
        let fighter = new Fighter();
        Fighter.deserialize(data, fighter);
        return fighter;
    }

    public addFighters(fighterDatas: IFighterData[]) {
        let fightersAdded: Fighter[] = [];
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
    protected onFightersAdded(fightersAdded: Fighter[]): void {}

    public updateFightersOrder(fightersOrder: number[]) {
        this._fighterOrder = [];
        for (let i = 0; i < fightersOrder.length; i++) {
            this._fighterOrder[i] = fightersOrder[i];
        }
        console.log(this._fighterOrder);
        this.onFighterOrderUpdated();
    }
    protected onFighterOrderUpdated(): void {}

    public initializeTurn(): void {
        for (let i = 0; i < this._fighters.length; i++) {
            let fighter = this._fighters[i];
            fighter.hasMoved = false;
            fighter.hasAttacked = false;
            fighter.shield = Math.min(fighter.shieldCapacity, fighter.shield + fighter.shieldSpeed);
        }
        this.onTurnInitialized();
    }
    protected onTurnInitialized(): void {};

    public initializePhase(): void {
        this.onPhaseInitialized();
    }
    protected onPhaseInitialized(): void {};

    public moveFighter(fighterId: number, tileI: number, tileJ: number) {
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
    protected onBeforeFighterMoved(fighter: Fighter, tileI: number, tileJ: number): void {}
    protected onFighterMoved(fighter: Fighter): void {}

    public attackFighter(fighterId: number, targetId: number, result: number): void {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            fighter.hasAttacked = true;
            let target = this.getFighterByID(targetId);
            if (target) {
                this.onFighterHasAttacked(fighter, target, result);
            }
        }
    }
    protected onFighterHasAttacked(fighter: Fighter, target: Fighter, result: number) {};

    public updateFighterHPShield(fighterId: number, hp: number, shield: number): void {
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
    protected onFighterHPShieldUpdated(fighter: Fighter) {};

    public killFighter(fighterId: number): void {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            this.onFighterKilled(fighter);
        }
    }
    protected onFighterKilled(fighter: Fighter) {};

    public delayFighterPhase(fighterId: number): void {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            this.onFighterPhaseDelayed(fighter);
        }
    }
    protected onFighterPhaseDelayed(fighter: Fighter): void {}

    public endFighterPhase(fighterId: number): void {
        let fighter = this.getFighterByID(fighterId);
        if (fighter) {
            this.onFighterPhaseEnded(fighter);
        }
    }
    protected onFighterPhaseEnded(fighter: Fighter): void {}

    public endTurn(): void {
        this.onTurnEnded();
    }
    protected onTurnEnded(): void {};

    public endGame(winner: number): void {}
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