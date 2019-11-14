class SpaceShip extends BABYLON.Mesh {

	public mesh: BABYLON.Mesh;
	private _localX: BABYLON.Vector3;
	public get localX(): BABYLON.Vector3 {
		return this._localX;
	}
	private _localY: BABYLON.Vector3;
	public get localY(): BABYLON.Vector3 {
		return this._localY;
	}
	private _localZ: BABYLON.Vector3;
	public get localZ(): BABYLON.Vector3 {
		return this._localZ;
	}
	private _colliders: Array<BABYLON.BoundingSphere> = [];
	public shield: Shield;
	public impactParticle: BABYLON.ParticleSystem;
	public shootFlashParticle: FlashParticle;
	public wingTipRight: BABYLON.Mesh;
	public wingTipLeft: BABYLON.Mesh;
	public trailMeshes: TrailMesh[] = [];

	public canons: BABYLON.Vector3[] = [];
	public shootSpeed: number = 0.1;
	public shootCoolDown: number = 0.3;
	public _shootCool: number = 0;

	constructor(data?: ISpaceshipData, scene?: BABYLON.Scene) {
		super("spaceship", scene);
		
		this._localX = new BABYLON.Vector3(1, 0, 0);
		this._localY = new BABYLON.Vector3(0, 1, 0);
		this._localZ = new BABYLON.Vector3(0, 0, 1);
		this.rotation.copyFromFloats(0, 0, 0);

		//this.shield = new Shield(this);
		//this.shield.initialize();
		//this.shield.parent = this;
		this.impactParticle = new BABYLON.ParticleSystem("particles", 2000, scene);
		this.impactParticle.particleTexture = new BABYLON.Texture("./datas/textures/impact.png", scene);
		this.impactParticle.emitter = this.position;
		this.impactParticle.direction1.copyFromFloats(50, 50, 50);
		this.impactParticle.direction2.copyFromFloats(-50, -50, -50);
		this.impactParticle.emitRate = 800;
		this.impactParticle.minLifeTime = 0.02;
		this.impactParticle.maxLifeTime = 0.05;
		this.impactParticle.manualEmitCount = 100;
		this.impactParticle.minSize = 0.05;
		this.impactParticle.maxSize = 0.3;
		this.shootFlashParticle = new FlashParticle("bang-red", scene, 0.8, 0.15);

		this.wingTipLeft = new BABYLON.Mesh("WingTipLeft", scene);
		this.wingTipLeft.parent = this;
		this.wingTipLeft.position.copyFromFloats(-2.91, 0, -1.24);
		this.wingTipRight = new BABYLON.Mesh("WingTipRight", scene);
		this.wingTipRight.parent = this;
		this.wingTipRight.position.copyFromFloats(2.91, 0, -1.24);
		this.trailMeshes = [
			new TrailMesh("Test", this.wingTipLeft, Main.Scene, 0.07, 60),
			new TrailMesh("Test", this.wingTipRight, Main.Scene, 0.07, 60)
		];
	}

	public onDestroyObservable: BABYLON.Observable<void> = new BABYLON.Observable<void>();

	public destroy(): void {
		this.dispose();
		for (let i = 0; i < this.trailMeshes.length; i++) {
			this.trailMeshes[i].destroy();
		}
		this.shootFlashParticle.destroy();
		this.onDestroyObservable.notifyObservers(undefined);
	}

	public async initialize(
		model: SpaceShipElement,
		baseColor: string,
		detailColor: string
	): Promise<BABYLON.Mesh> {
		let meshes: BABYLON.Mesh[] = [];
		await SpaceShip._InitializeRecursively(model, baseColor, detailColor, this, meshes);
		let invWorldMatrix = this.computeWorldMatrix(true).clone().invert();
		for (let i = 0; i < meshes.length; i++) {
			meshes[i].computeWorldMatrix(true);
		}
		for (let i = 0; i < this._canonNodes.length; i++) {
			let canonPoint = BABYLON.Vector3.Zero();
			this._canonNodes[i].computeWorldMatrix(true);
			BABYLON.Vector3.TransformCoordinatesToRef(this._canonNodes[i].absolutePosition, invWorldMatrix, canonPoint);
			this.canons.push(canonPoint);
		}
		this.mesh = BABYLON.Mesh.MergeMeshes(meshes, true);
		this.mesh.layerMask = 1;
		this.mesh.parent = this;
		this.wingTipLeft.parent = this.mesh;
		this.wingTipRight.parent = this.mesh;
		//this.shield.parent = this.mesh;
		return this.mesh;
	}

	private _canonNodes: BABYLON.TransformNode[] = [];
	private static async _InitializeRecursively(
		elementData: SpaceShipElement,
		baseColor: string,
		detailColor: string,
		spaceship: SpaceShip,
		meshes?: BABYLON.Mesh[]
	): Promise<BABYLON.TransformNode> {
		let e = await SpaceShipFactory.LoadSpaceshipPart(elementData.name, Main.Scene, baseColor, detailColor);
		if (meshes) {
			meshes.push(e);
		}
		if (elementData.children) {
			for (let i = 0; i < elementData.children.length; i++) {
				let childData = elementData.children[i];
				let slot = SpaceShipSlots.getSlot(elementData.name, childData.type);
				if (slot) {
					if (childData.type === "drone") {
						if (childData.name === "repair-drone") {
							let drone = new RepairDrone(spaceship);
							drone.basePosition = slot.pos;
							drone.initialize(baseColor, detailColor);
							return drone;
						}
					}
					else {
						let child = await SpaceShip._InitializeRecursively(childData, baseColor, detailColor, spaceship, meshes);
						child.parent = e;
						child.position = slot.pos;
						child.rotation = slot.rot;
						if (slot.mirror) {
							child.scaling.x = -1;
						}
						if (child instanceof BABYLON.Mesh) {
							if (childData.type === "weapon") {
								let canonTip = MeshUtils.getZMaxVertex(child);
								let canonTipNode = new BABYLON.TransformNode("_tmpCanonTipNode", spaceship.getScene());
								canonTipNode.parent = child;
								canonTipNode.position.copyFrom(canonTip);
								canonTipNode.computeWorldMatrix(true);
								spaceship._canonNodes.push(canonTipNode);
							}
							if (childData.type.startsWith("wing")) {
								let wingTip = MeshUtils.getXMinVertex(child);
								BABYLON.Vector3.TransformCoordinatesToRef(wingTip, child.computeWorldMatrix(true), wingTip);
								if (childData.type === "wingL") {
									spaceship.wingTipLeft.position.copyFrom(wingTip);
								}
								else if (childData.type === "wingR") {
									spaceship.wingTipRight.position.copyFrom(wingTip);
								}
							}
						}
					}
				}
			}
		}
		return e;
	}

	private _lastCanonIndex = 0;
	public shoot(direction: BABYLON.Vector3): void {
		if (this._shootCool > 0) {
			return;
		}
		this._shootCool = this.shootCoolDown;
		let bullet = new Projectile(direction, this);
		this._lastCanonIndex = (this._lastCanonIndex + 1) % this.canons.length;
		let canon = this.canons[this._lastCanonIndex];
		console.log(canon);
		console.log(this.getWorldMatrix());
		this.shootFlashParticle.parent = this.mesh;
		this.shootFlashParticle.flash(canon);
		let canonWorld = BABYLON.Vector3.TransformCoordinates(canon.scale(0.15), this.getWorldMatrix());
		bullet.position.copyFrom(canonWorld);
		bullet.instantiate();
	}

    public projectileDurationTo(target: BABYLON.Mesh): number {
        let dist = BABYLON.Vector3.Distance(this.position, target.position);
        return dist / this.shootSpeed;
    }
}
