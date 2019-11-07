class IFighterData {
    i?: number;
    j?: number;
    id: number;
    team: number;
    speed: number;

    stamina: number;
    shieldCapacity: number;
    shieldSpeed: number;
    armor: number;
    
    moveRange: number;
    attackRange: number;
    attackPower: number;

    accuracy: number;
    staticAttack: boolean;
    criticalRate: number;
    dodgeRate: number;
}

class Fighter {

    private static ID: number = 0;

    public id: number;
    public team: number;

    public speed: number = 10;

    public stamina: number = 10;
    public shieldCapacity: number = 6;
    public shieldSpeed: number = 2;
    public armor: number = 1;
    
    public moveRange: number = 3;
    public attackRange: number = 3;
    public attackPower: number = 3;

    public accuracy: number = 95;
    public staticAttack: boolean = false;
    public criticalRate: number = 5;
    public dodgeRate: number = 10;

    public hp: number = 10;
    public shield: number = 6;

    public hasMoved: boolean = false;
    public hasAttacked: boolean = false;

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
        this.speed = Math.floor(Math.random() * 100);
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

            speed: this.speed,
            stamina: this.stamina,
            shieldCapacity: this.shieldCapacity,
            shieldSpeed: this.shieldSpeed,
            armor: this.armor,
            
            moveRange: this.moveRange,
            attackRange: this.attackRange,
            attackPower: this.attackPower,

            accuracy: this.accuracy,
            staticAttack: this.staticAttack,
            criticalRate: this.criticalRate,
            dodgeRate: this.dodgeRate
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

        fighter.speed = data.speed;
        fighter.stamina = data.stamina;
        fighter.shieldCapacity = data.shieldCapacity;
        fighter.shieldSpeed = data.shieldSpeed;
        fighter.armor = data.armor;
        
        fighter.moveRange = data.moveRange;
        fighter.attackRange = data.attackRange;
        fighter.attackPower = data.attackPower;
        
        fighter.accuracy = data.accuracy;
        fighter.staticAttack = data.staticAttack;
        fighter.criticalRate = data.criticalRate;
        fighter.dodgeRate = data.dodgeRate;

        return fighter;
    }
}