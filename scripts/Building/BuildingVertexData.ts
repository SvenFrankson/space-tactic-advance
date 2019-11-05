class BuildingVertexData {

    public static WidthDepth(vertexData: BABYLON.VertexData, w: number, d: number): BABYLON.VertexData {
        let newData = VertexDataLoader.clone(vertexData);

        let newPositions = [...newData.positions];
        let l = newPositions.length / 3;
        let xOffset = w / 2 - 1;
        let zOffset = d / 2 - 1;
        for (let i = 0; i < l; i++) {
            if (newPositions[3 * i] < 0) {
                newPositions[3 * i] -= xOffset;
            }
            else if (newPositions[3 * i] > 0) {
                newPositions[3 * i] += xOffset;
            }
            if (newPositions[3 * i + 2] < 0) {
                newPositions[3 * i + 2] -= zOffset;
            }
            else if (newPositions[3 * i + 2] > 0) {
                newPositions[3 * i + 2] += zOffset;
            }
        }
        newData.positions = newPositions;

        return newData;
    }
}