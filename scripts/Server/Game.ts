class Game {

    protected _fighters: Fighter[] = [];
    protected _fighterOrder: number[] = [];
    private _board: Board;

    private _clients: IClient[] = [];

    private _log: GameLog;

    constructor() {
        this._log = new GameLog();
    }

    public connectClient(client: IClient): void {
        this._clients.push(client);
    }

    public initialize(): void {
        this._log.log("initialize");
        this._board = new Board();
        this._board.initialize(10);
        let boardData = this._board.serialize();
        this._clients.forEach(
            c => {
                c.initializeBoard(boardData);
            }
        )

        for (let i = 0; i < 3; i++) {
            let team0Fighter = new Fighter(0);
            team0Fighter.initialize();
            let tile = this._board.getTileByIJ(-3, - 1 + 2 * i);
            tile.setFighter(team0Fighter);
            this._fighters.push(team0Fighter);
        }
        for (let i = 0; i < 3; i++) {
            let team1Fighter = new Fighter(1);
            team1Fighter.initialize();
            let tile = this._board.getTileByIJ(3, - 1 + 2 * i);
            tile.setFighter(team1Fighter);
            this._fighters.push(team1Fighter);
        }

        let fighterDatas: IFighterData[] = [];
        for (let i = 0; i < this._fighters.length; i++) {
            fighterDatas.push(this._fighters[i].serialize());
        }
        this._clients.forEach(
            c => {
                c.addFighters(fighterDatas);
            }
        )
    }

    public initializeTurn(): void {
        this._log.log("initializeTurn");
        let sortedFighters = this._fighters.sort((a, b) => {
            return b.speed - a.speed;
        });
        this._fighterOrder = [];
        for (let i = 0; i < sortedFighters.length; i++) {
            this._fighterOrder[i] = sortedFighters[i].id;
        }

        this._fighters.forEach(
            f => {
                f.hasMoved = false;
                f.hasAttacked = false;
                f.shield = Math.min(f.shieldCapacity, f.shield + f.shieldSpeed);
            }
        )

        // Trigger event.
        this._clients.forEach(
            c => {
                c.updateFightersOrder(this._fighterOrder);
            }
        )

        this._clients.forEach(
            c => {
                c.initializeTurn();
            }
        ) 

        this._clients.forEach(
            c => {
                c.initializePhase();
            }
        ) 
    }

    public getFighterByID(id: number): Fighter {
        return this._fighters.find(f => { return f.id === id; });
    }

    public getActiveFighter(): Fighter {
        let activeFighterId = this._fighterOrder[0];
        if (isFinite(activeFighterId)) {
            let activeFighter = this.getFighterByID(activeFighterId);
            return activeFighter;
        }
    }

    public check(): void {
        if (this._fighterOrder.length === 0) {
            this.initializeTurn();
        }
        else {
            this._clients.forEach(
                c => {
                    c.initializePhase();
                }
            ) 
        }
    }

    public requestMove(fighterId: number, tileI: number, tileJ: number): boolean {
        this._log.log("requestMove " + fighterId + " " + tileI + " " + tileJ);
        let fighter = this.getFighterByID(fighterId);
        if (fighter === this.getActiveFighter()) {
            if (!fighter.hasMoved) {
                let tile = this._board.getTileByIJ(tileI, tileJ);
                if (tile) {
                    if (tile.setFighter(fighter)) {
                        fighter.hasMoved = true;
                        // Trigger event.
                        this._clients.forEach(
                            c => {
                                c.moveFighter(fighterId, tileI, tileJ);
                            }
                        )
                        this._log.log("requestMove success");
                        return true;
                    }
                }
            }
        }
        this._log.log("requestMove failure");
        return false;
    }

    public requestAttack(fighterId: number, targetId: number): boolean {
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
                            }
                        }

                        // Trigger event.
                        this._clients.forEach(
                            c => {
                                c.attackFighter(fighterId, targetId, result);
                            }
                        )

                        this._clients.forEach(
                            c => {
                                c.updateFighterHPShield(targetId, target.hp, target.shield);
                            }
                        )
                        
                        this._log.log("requestAttack success");
                        return true;
                    }
                }
            }
        }
        this._log.log("requestAttack failure");
        return false;
    }

    public requestDelay(fighterId: number): boolean {
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
                        this._clients.forEach(
                            c => {
                                c.delayFighterPhase(fighterId);
                            }
                        )

                        this._clients.forEach(
                            c => {
                                c.updateFightersOrder(this._fighterOrder);
                            }
                        )

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

    public requestEndTurn(fighterId: number): boolean {
        this._log.log("requestEndTurn " + fighterId);
        let fighter = this.getFighterByID(fighterId);
        if (fighter === this.getActiveFighter()) {
            this._fighterOrder.splice(0, 1);
            
            // Trigger event.
            this._clients.forEach(
                c => {
                    c.endFighterPhase(fighterId);
                }
            )

            this._clients.forEach(
                c => {
                    c.updateFightersOrder(this._fighterOrder);
                }
            )
            this.check();
            this._log.log("requestEndTurn success");
            return true;
        }
        this._log.log("requestEndTurn failure");
        return false;
    }
}