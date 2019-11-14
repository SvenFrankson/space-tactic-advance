class IFighterData {
    i?: number;
    j?: number;
    id: number;
    team: number;

    pilot: IPilotData;
    spaceship: ISpaceshipData;
}

class Fighter {

    private static ID: number = 0;

    public spaceship: Spaceship;
    public pilot: Pilot;

    public id: number;
    public team: number;

    public speed: number = 50;

    public stamina: number = 10;
    public shieldCapacity: number = 5;
    public shieldSpeed: number = 1;
    public armor: number = 0;
    
    public moveRange: number = 3;
    public attackRange: number = 1;
    public attackPower: number = 5;

    public accuracy: number = 95;
    public staticAttack: boolean = false;
    public criticalRate: number = 5;
    public dodgeRate: number = 5;

    public hp: number = 10;
    public shield: number = 5;

    public hasMoved: boolean = false;
    public hasAttacked: boolean = false;

    public isAlive: boolean = true;

    protected _tile: Tile;
    public get tileI(): number {
        if (this._tile) {
            return this._tile.i;
        }
    }
    public get tileJ(): number {
        if (this._tile) {
            return this._tile.j;
        }
    }

    constructor(team?: number) {
        this.id = Fighter.ID;
        Fighter.ID += 1;
        this.team = team;
    }

    public initialize(): void {
        this.spaceship.initialize();
        this.pilot.initialize();
    }

    public kill(): void {
        this.isAlive = false;
        if (this._tile) {
            this._tile.removeFighter(this);
        }
    }

    public setTile(t: Tile): void {
        if (this._tile) {
            this._tile.removeFighter(this);
        }
        if (t !== this._tile) {
            this._tile = t;
            this._tile.setFighter(this);
        }
    }

    public serialize(): IFighterData {
        let data: IFighterData = {
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

    public static deserialize(data: IFighterData, fighter: Fighter): Fighter {
        fighter.id = data.id;
        fighter.team = data.team;

        fighter.pilot = new Pilot(fighter);
        Pilot.Deserialize(data.pilot, fighter.pilot);

        fighter.spaceship = new Spaceship(fighter);
        Spaceship.Deserialize(data.spaceship, fighter.spaceship);

        return fighter;
    }

    public static CreateRandom(team: number): Fighter {
        let fighter = new Fighter(team);
        fighter.pilot = new Pilot(fighter);
        Pilot.Deserialize(Pilot.RandomData(), fighter.pilot);
        fighter.spaceship = new Spaceship(fighter);
        Spaceship.Deserialize(Spaceship.RandomData(), fighter.spaceship);
        return fighter;
    }
}