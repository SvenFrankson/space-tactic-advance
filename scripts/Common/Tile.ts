class ITileData {
    i: number;
    j: number;
}

class Tile {

    private _fighter: Fighter;

    constructor(
        public i: number,
        public j: number
    ) {

    }

    public getFighter(): Fighter {
        return this._fighter;
    }

    public setFighter(f: Fighter): boolean {
        if (!this._fighter) {
            this._fighter = f;
            this._fighter.setTile(this);
            return true;
        }
        return false;
    }

    public removeFighter(f: Fighter): boolean {
        if (this._fighter === f) {
            this._fighter = undefined;
            return true;
        }
        return false;
    }

    public serialize(): ITileData {
        return {
            i: this.i,
            j: this.j
        }
    }

    public static deserialize(data: ITileData): Tile {
        return new Tile(data.i, data.j);
    }
}