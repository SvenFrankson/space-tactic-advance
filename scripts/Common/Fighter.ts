class IFighterData {
    i?: number;
    j?: number;
    id: number;
    team: number;
    speed: number;
}

class Fighter {

    private static ID: number = 0;

    public id: number;
    public team: number;

    public speed: number = 10;
    public range: number = 3;
    public stamina: number = 10;
    public power: number = 3;

    public hp: number = 10;

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

    public hasMoved: boolean = false;
    public hasAttacked: boolean = false;

    constructor(team?: number) {
        this.id = Fighter.ID;
        Fighter.ID += 1;
        this.team = team;
    }

    public initialize(): void {
        this.speed = Math.floor(Math.random() * 100);
        this.range = Math.floor(Math.random() * 3 + 2);
        this.stamina = Math.floor(Math.random() *  3) * 5 + 10;
        this.power = Math.floor(Math.random() * 5 + 2);
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
            speed: this.speed
        };
        if (this._tile) {
            data.i = this._tile.i;
            data.j = this._tile.j;
        }
        return data;
    }

    public static deserialize(data: IFighterData, fighter: Fighter): Fighter {
        fighter.team = data.team;
        fighter.id = data.id;
        fighter.speed = data.speed;
        return fighter;
    }
}