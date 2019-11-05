class IBoardData {
    tiles: ITileData[];
}

class Board {

    protected _tiles: Tile[] = [];

    public initialize(r: number): void {
        for (let i = - r; i <= r; i++) {
            for (let j = - r; j <= r; j++) {
                if (i * j < 0 || Math.abs(i) + Math.abs(j) <= r) {
                    this._tiles.push(new Tile(i, j));
                }
            }
        }
    }

    public getTileByIJ(i: number, j: number): Tile {
        return this._tiles.find(t => { return t.i === i && t.j === j; });
    }

    public serialize(): IBoardData {
        let data: IBoardData = {
            tiles: []
        };
        for (let i = 0; i < this._tiles.length; i++) {
            data.tiles.push(this._tiles[i]);
        }
        return data;
    }

    public static deserialize(data: IBoardData, board: Board): Board {
        for (let i = 0; i < data.tiles.length; i++) {
            board._tiles.push(Tile.deserialize(data.tiles[i]));
        }
        return board;
    }
}