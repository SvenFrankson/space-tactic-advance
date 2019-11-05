/// <reference path="../Common/Board.ts"/>

class AlphaBoard extends Board {

    private _boardMesh: BABYLON.LinesMesh;

    private _hexagon: BABYLON.Vector3[] = []

    constructor() {
        super();
        for (let i = 0; i < 6; i++) {
            this._hexagon.push(new BABYLON.Vector3(
                0.47 * Math.cos(i * Math.PI / 3),
                0,
                0.47 * Math.sin(i * Math.PI / 3)
            ));
        }
        this._hexagon.push(this._hexagon[0]);
    }

    public updateMesh(scene: BABYLON.Scene): void {
        if (this._boardMesh) {
            this._boardMesh.dispose();
        }
        let lines: BABYLON.Vector3[][] = [];
        for (let i = 0; i < this._tiles.length; i++) {
            let tile = this._tiles[i];
            let line: BABYLON.Vector3[] = [];
            this._hexagon.forEach(p => {
                let pp = p.clone();
                pp.x += 0.75 * tile.i;
                pp.z += (tile.i * 0.5 + tile.j) * COS30;
                line.push(pp);
            });
            lines.push(line);
        }
        this._boardMesh = BABYLON.MeshBuilder.CreateLineSystem(
            "board",
            {
                lines: lines
            },
            scene
        )
    }
}