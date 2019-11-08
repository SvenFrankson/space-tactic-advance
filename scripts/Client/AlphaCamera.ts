class AlphaCamera extends BABYLON.ArcRotateCamera {

    public currentTarget: any;
    private _currentTargetPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _lastDir: number;

    constructor() {
        super("alpha-camera", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), Main.Scene);
        this.setPosition(new BABYLON.Vector3(- 0, 5, -10));
		this.attachControl(Main.Canvas, true);
		this.lowerRadiusLimit = 1;
		this.upperRadiusLimit = 40;
		this.wheelPrecision *= 8;
        Main.Camera = this;
        
        Main.Scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        if (this.currentTarget instanceof BABYLON.Vector3) {
            this._currentTargetPos.copyFrom(this.currentTarget);
        }
        else if (this.currentTarget instanceof BABYLON.AbstractMesh) {
            this._currentTargetPos.copyFrom(this.currentTarget.position);
        }
        else {
            return;
        }
        BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
        let dir = 3 * Math.PI / 2 - this.alpha;
        dir = Math.round(dir / (Math.PI / 3));
        if (dir !== this._lastDir) {
            this._lastDir = dir;
            let r = dir * Math.PI / 3;
            AlphaClient.Instance.forEachFighter(
                (f) => {
                    f.rotateHPShieldMesh(r);
                }
            )
        }
    }
}