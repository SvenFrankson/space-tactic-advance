enum AlphaCameraMode {
    Free,
    Focus,
    Wide
}

class AlphaCamera extends BABYLON.ArcRotateCamera {


    public currentTarget: any;
    public currentRadius: number = 4;
    public currentMode: AlphaCameraMode = AlphaCameraMode.Focus;
    private _currentTargetPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _lastDir: number;

    private _panel: SpacePanel;

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

    public createPanel() {
        this._panel = SpacePanel.CreateSpacePanel(false);
        this._panel.addTitle1("CAMERA");
        this._panel.style.width = "180px";
        let l = Main.Canvas.width / 2 - 90;
        this._panel.style.left = l.toFixed(0) + "px";
        this._panel.style.bottom = "150px";
        this._panel.addIconButtons(
            "work/inkscape/camera-focus.svg",
            () => {
                this.currentMode = AlphaCameraMode.Focus;
                this.beta = Math.PI / 4;
            },
            "work/inkscape/camera-wide.svg",
            () => {
                this.currentMode = AlphaCameraMode.Wide;
                this._currentTargetPos.copyFromFloats(0, 0, 0);
            }
        );
    }

    private _update = () => {
        if (this.currentMode === AlphaCameraMode.Focus) {
            this.currentRadius = 4;
            if (this.currentTarget instanceof BABYLON.Vector3) {
                this._currentTargetPos.copyFrom(this.currentTarget);
            }
            else if (this.currentTarget instanceof BABYLON.AbstractMesh) {
                this._currentTargetPos.copyFrom(this.currentTarget.position);
            }
        }
        else if (this.currentMode === AlphaCameraMode.Wide) {
            this.currentRadius = 10;
            this.alpha = 0;
            this.beta = Math.PI / 16;
        }

        if (this.currentMode != AlphaCameraMode.Free) {
            BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
            this.radius = this.radius * 0.95 + this.currentRadius * 0.05;
        }

        let dir = 3 * Math.PI / 2 - this.alpha;
        if (dir !== this._lastDir) {
            this._lastDir = dir;
            AlphaClient.Instance.forEachFighter(
                (f) => {
                    f.rotateHPShieldMesh(dir);
                }
            )
        }
    }
}