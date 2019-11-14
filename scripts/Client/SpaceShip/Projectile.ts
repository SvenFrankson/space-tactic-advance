class Projectile extends BABYLON.Mesh {

    private _direction: BABYLON.Vector3;
    public shooter: SpaceShip;
    public shotSpeed: number = 150;
    private _lifeSpan: number = 3;
    private _displacementRay: BABYLON.Ray;

    constructor(direction: BABYLON.Vector3, shooter: SpaceShip) {
        super("projectile", shooter.getScene());
        this._direction = direction;
        this.shooter = shooter;
        this.shotSpeed = this.shooter.shootSpeed;
        this.position.copyFrom(shooter.absolutePosition);
        this.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(shooter.rotation);
        this.scaling.copyFromFloats(0.15, 0.15, 0.15);
        this._displacementRay = new BABYLON.Ray(this.absolutePosition, this._direction.clone());
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("blaster-trail");
        console.log(vertexData);
        if (vertexData && !this.isDisposed()) {
            vertexData.applyToMesh(this);
        }
        Main.Camera.currentTarget = this;
    }

    public destroy(): void {
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
        this.dispose();
    }

    private _update = () => {
        let dt = this.getEngine().getDeltaTime() / 1000;
        this._lifeSpan -= dt;
        if (this._lifeSpan < 0) {
            console.log("Destroy projectile (negative lifespan)");
            return this.destroy();
        }
        let hitSpaceship = Math.random() < 0.01;
        if (hitSpaceship) {
            console.log("Destroy projectile (hit spaceship");
            return this.destroy();
        }
        this.position.addInPlace(this._direction.scale(this.shotSpeed * dt));
        let zAxis = this._direction;
        let yAxis: BABYLON.Vector3;
        if (Main.Scene.activeCameras && Main.Scene.activeCameras[0]) {
            yAxis = Main.Scene.activeCameras[0].position.subtract(this.position);
        }
        else {
            yAxis = Main.Scene.activeCamera.position.subtract(this.position);
        }
        let xAxis = BABYLON.Vector3.Cross(yAxis, zAxis).normalize();
        BABYLON.Vector3.CrossToRef(zAxis, xAxis, yAxis);
        BABYLON.Quaternion.RotationQuaternionFromAxisToRef(xAxis, yAxis, zAxis, this.rotationQuaternion);
    }
}