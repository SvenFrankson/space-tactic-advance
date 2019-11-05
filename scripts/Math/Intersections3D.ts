class RayIntersection {

    constructor(
        public point: BABYLON.Vector3,
        public normal: BABYLON.Vector3
    ) {

    }
}

class SphereIntersection {

    constructor(
        public point: BABYLON.Vector3
    ) {

    }
}

class Intersections3D {

    public static SphereCube(center: BABYLON.Vector3, radius: number, min: BABYLON.Vector3, max: BABYLON.Vector3): SphereIntersection {
        let closest = center.clone();
        if (closest.x < min.x) {
            closest.x = min.x;
        }
        else if (closest.x > max.x) {
            closest.x = max.x;
        }
        if (closest.y < min.y) {
            closest.y = min.y;
        }
        else if (closest.y > max.y) {
            closest.y = max.y;
        }
        if (closest.z < min.z) {
            closest.z = min.z;
        }
        else if (closest.z > max.z) {
            closest.z = max.z;
        }
        if (BABYLON.Vector3.DistanceSquared(center, closest) < radius * radius) {
            return new SphereIntersection(closest);
        }
        return undefined;
    }
}