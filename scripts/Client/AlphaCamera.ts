enum AlphaCameraMode {
    Free,
    ToFocus,
    Focus,
    ToWide,
    Wide
}

class AlphaCamera extends BABYLON.ArcRotateCamera {


    private _activeTarget: any;
    public get activeTarget(): any {
        return this._activeTarget;
    }
    public set activeTarget(t: any) {
        this._activeTarget = t;
        if (this.currentMode === AlphaCameraMode.Focus) {
            this.currentMode = AlphaCameraMode.ToFocus;
        }
        if (this.currentMode === AlphaCameraMode.Wide) {
            this.currentMode = AlphaCameraMode.ToWide;
        }
    }
    public currentRadius: number = 4;
    public currentMode: AlphaCameraMode = AlphaCameraMode.ToFocus;
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
        
        Main.Scene.onPointerObservable.add((eventData) => {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                if (eventData.event.button === 2) {
                    this.currentMode = AlphaCameraMode.Free;
                }
            }
        });
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
                this.currentMode = AlphaCameraMode.ToFocus;
            },
            "work/inkscape/camera-wide.svg",
            () => {
                this.currentMode = AlphaCameraMode.ToWide;
            }
        );
    }

    private _update = () => {
        if (this.currentMode === AlphaCameraMode.ToFocus) {
            let currentAlpha = 0;
            this.alpha = this.alpha * 0.9 + currentAlpha * 0.1;

            let currentBeta = Math.PI / 4;
            this.beta = this.beta * 0.9 + currentBeta * 0.1;

            this.currentRadius = 4;
            this.radius = this.radius * 0.9 + this.currentRadius * 0.1;
            if (this.activeTarget instanceof BABYLON.Vector3) {
                this._currentTargetPos.copyFrom(this.activeTarget);
            }
            else if (this.activeTarget instanceof BABYLON.AbstractMesh) {
                this._currentTargetPos.copyFrom(this.activeTarget.position);
            }
            BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
            if (Math.abs(this.alpha - currentAlpha) < Math.PI / 360) {
                if (Math.abs(this.beta - currentBeta) < Math.PI / 360) {
                    if (Math.abs(this.radius - this.currentRadius) < 0.005) {
                        if (BABYLON.Vector3.DistanceSquared(this.target, this._currentTargetPos) < 0.005) {
                            this.currentMode = AlphaCameraMode.Focus;
                            this.alpha = currentAlpha;
                            this.beta = currentBeta;
                            this.radius = this.currentRadius;
                        }
                    }
                }
            }
        }

        if (this.currentMode === AlphaCameraMode.Focus) {
            if (this.activeTarget instanceof BABYLON.Vector3) {
                this._currentTargetPos.copyFrom(this.activeTarget);
            }
            else if (this.activeTarget instanceof BABYLON.AbstractMesh) {
                this._currentTargetPos.copyFrom(this.activeTarget.position);
            }
            BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
        }

        if (this.currentMode === AlphaCameraMode.ToWide) {
            let currentAlpha = 0;
            this.alpha = this.alpha * 0.9 + currentAlpha * 0.1;

            let currentBeta = Math.PI / 16;
            this.beta = this.beta * 0.9 + currentBeta * 0.1;

            this.currentRadius = 10;
            this.radius = this.radius * 0.9 + this.currentRadius * 0.1;
            if (this.activeTarget instanceof BABYLON.Vector3) {
                this._currentTargetPos.copyFrom(this.activeTarget);
            }
            else if (this.activeTarget instanceof BABYLON.AbstractMesh) {
                this._currentTargetPos.copyFrom(this.activeTarget.position);
            }
            BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
            if (Math.abs(this.alpha - currentAlpha) < Math.PI / 360) {
                if (Math.abs(this.beta - currentBeta) < Math.PI / 360) {
                    if (Math.abs(this.radius - this.currentRadius) < 0.005) {
                        if (BABYLON.Vector3.DistanceSquared(this.target, this._currentTargetPos) < 0.005) {
                            this.currentMode = AlphaCameraMode.Wide;
                            this.alpha = currentAlpha;
                            this.beta = currentBeta;
                            this.radius = this.currentRadius;
                        }
                    }
                }
            }
        }

        if (this.currentMode === AlphaCameraMode.Wide) {
            if (this.activeTarget instanceof BABYLON.Vector3) {
                this._currentTargetPos.copyFrom(this.activeTarget);
            }
            else if (this.activeTarget instanceof BABYLON.AbstractMesh) {
                this._currentTargetPos.copyFrom(this.activeTarget.position);
            }
            BABYLON.Vector3.LerpToRef(this.target, this._currentTargetPos, 0.05, this.target);
        }

        this.target.y = 0;

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