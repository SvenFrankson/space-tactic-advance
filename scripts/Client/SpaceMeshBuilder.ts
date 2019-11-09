class SpaceMeshBuilder {

    public static CreateHPBar(r: number, h: number, from: number, to: number): BABYLON.VertexData {
        let data = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let normals: number[] = [];

        let p0 = new BABYLON.Vector3(
            r * Math.cos(4 * Math.PI / 3),
            0,
            r * Math.sin(4 * Math.PI / 3)
        );
        let p1 = new BABYLON.Vector3(
            r * Math.cos(5 * Math.PI / 3),
            0,
            r * Math.sin(5 * Math.PI / 3)
        );
        let p2 = p0.clone();
        p2.x -= h * Math.cos(Math.PI / 3);
        p2.z += h * Math.sin(Math.PI / 3);
        let p3 = p1.clone();
        p3.x += h * Math.cos(Math.PI / 3);
        p3.z += h * Math.sin(Math.PI / 3);

        positions.push(
            ...BABYLON.Vector3.Lerp(p0, p1, from).asArray()
        );
        positions.push(
            ...BABYLON.Vector3.Lerp(p0, p1, to).asArray()
        );
        positions.push(
            ...BABYLON.Vector3.Lerp(p2, p3, to).asArray()
        );
        positions.push(
            ...BABYLON.Vector3.Lerp(p2, p3, from).asArray()
        );

        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

        indices.push(0, 1, 2);
        indices.push(0, 2, 3);

        data.positions = positions;
        data.indices = indices;
        data.normals = normals;

        return data;
    }

    public static CreateHPVertexData(min: number, max: number): BABYLON.VertexData {
        let data = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let normals: number[] = [];

        let a0 = 10 * Math.PI / 12;
        let a1 = 3 * Math.PI / 2;
        let aMin = a0 * (1 - min) + a1 * min;
        let aMax = a0 * (1 - max) + a1 * max;
        let r0 = 0.285;
        let r1 = 0.22;
        let rMin = r0 * (1 - min) + r1 * min;
        let rMax = r0 * (1 - max) + r1 * max;

        for (let i = 0; i <= 12; i++) {
            let f = i / 12;
            let a = aMin * (1 - f) + aMax * f;
            let r = rMin * (1 - f) + rMax * f;
            let p = new BABYLON.Vector3(
                Math.cos(a),
                0.05,
                Math.sin(a)
            );
            positions.push(p.x * r, - 0.001, p.z * r, p.x * 0.335, - 0.001, p.z * 0.335);
            normals.push(0, 1, 0, 0, 1, 0);
        }

        for (let i = 0; i < 12; i++) {
            indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
            indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
        }

        data.positions = positions;
        data.indices = indices;
        data.normals = normals;

        return data;
    }

    public static CreateHexagonVertexData(rMin: number, rMax: number): BABYLON.VertexData {
        let data = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let normals: number[] = [];

        for (let i = 0; i < 6; i++) {
            let p = new BABYLON.Vector3(
                Math.cos(i * Math.PI / 3),
                0,
                Math.sin(i * Math.PI / 3)
            );
            positions.push(p.x * rMin, 0, p.z * rMin, p.x * rMax, 0, p.z * rMax);
            normals.push(0, 1, 0, 0, 1, 0);
        }

        for (let i = 0; i < 5; i++) {
            indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
            indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
        }
        indices.push(10, 11, 1);
        indices.push(10, 1, 0);

        data.positions = positions;
        data.indices = indices;
        data.normals = normals;

        return data;
    }
}