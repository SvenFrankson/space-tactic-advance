class SpaceshipVertexDataLoader {

    public static instance: SpaceshipVertexDataLoader;

    public scene: BABYLON.Scene;
    private _vertexDatas: Map<string, Map<string, Map<string, BABYLON.VertexData>>>;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this._vertexDatas = new Map<string, Map<string, Map<string, BABYLON.VertexData>>>();
        SpaceshipVertexDataLoader.instance = this;
    }

    public async getSpaceshipPartVertexData(
        spaceshipName: string,
        partName: string,
        baseColor?: string | BABYLON.Color3,
        frameColor?: string | BABYLON.Color3,
        color1?: string | BABYLON.Color3,
        color2?: string | BABYLON.Color3,
        color3?: string | BABYLON.Color3
    ): Promise<BABYLON.VertexData> {
        let vertexDatas = await this._getSpaceshipPartVertexDatas(spaceshipName, partName);

        let positions: number[] = [];
        let indices: number[] = [];
        let normals: number[] = [];
        let colors: number[] = [];

        if (!vertexDatas) {
            console.log(this._vertexDatas);
            debugger;
        }
        vertexDatas.forEach(
            (colorVertexData, colorName) => {
                let r = 1;
                let g = 1;
                let b = 1;
                let checkColor = (checkedColorName: string, associatedColor: string | BABYLON.Color3) => {
                    if (colorName === checkedColorName) {
                        if (associatedColor instanceof BABYLON.Color3) {
                            r = associatedColor.r;
                            g = associatedColor.g;
                            b = associatedColor.b;
                        }
                        else if (typeof(associatedColor) === "string") {
                            let color = BABYLON.Color3.FromHexString(associatedColor);
                            r = color.r;
                            g = color.g;
                            b = color.b;
                        }
                    }
                }
                checkColor("base", baseColor);
                checkColor("base-dark", baseColor);
                checkColor("frame", frameColor);
                checkColor("color-1", color1);
                checkColor("color-2", color2);
                checkColor("color-3", color3);

                let l = positions.length / 3;
                positions.push(...colorVertexData.positions);
                normals.push(...colorVertexData.normals);
                for (let i = 0; i < colorVertexData.positions.length / 3; i++) {
                    colors.push(r, g, b, 1);
                }
                for (let i = 0; i < colorVertexData.indices.length; i++) {
                    indices.push(colorVertexData.indices[i] + l);
                }
            }
        )

        let vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.indices = indices;
        vertexData.colors = colors;

        return vertexData;
    }

    private async _getSpaceshipPartVertexDatas(spaceshipName: string, partName: string): Promise<Map<string, BABYLON.VertexData>> {
        let spaceshipParts = await this._getSpaceshipParts(spaceshipName);
        if (spaceshipParts) {
            return spaceshipParts.get(partName);
        }
    }

    private async _getSpaceshipParts(spaceshipName: string): Promise<Map<string, Map<string, BABYLON.VertexData>>> {
        let spaceshipParts = this._vertexDatas.get(spaceshipName);
        if (spaceshipParts) {
            return spaceshipParts;
        }
        spaceshipParts = new Map<string, Map<string, BABYLON.VertexData>>();
        let loadedFile = await BABYLON.SceneLoader.ImportMeshAsync("", "./datas/meshes/" + spaceshipName + ".babylon", "", Main.Scene);
        loadedFile.meshes = loadedFile.meshes.sort(
            (m1, m2) => {
                if (m1.name < m2.name) {
                    return -1;
                }
                else if (m1.name > m2.name) {
                    return 1;
                }
                return 0;
            }
        )
        for (let i = 0; i < loadedFile.meshes.length; i++) {
            let loadedMesh = loadedFile.meshes[i];
            if (loadedMesh instanceof BABYLON.Mesh) {
                let partName = loadedMesh.name.split("-")[0];
                let colorName = loadedMesh.name.substr(partName.length + 1);
                let partVertexDatas = spaceshipParts.get(partName);
                if (!partVertexDatas) {
                    partVertexDatas = new Map<string, BABYLON.VertexData>();
                    spaceshipParts.set(partName, partVertexDatas);
                }
                let vertexData =  BABYLON.VertexData.ExtractFromMesh(loadedMesh);
                partVertexDatas.set(colorName, vertexData);
                loadedMesh.dispose();
            }
        }
        this._vertexDatas.set(spaceshipName, spaceshipParts);
        return spaceshipParts;
    }
}