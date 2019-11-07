enum ISquadRole {
	Leader,
	WingMan,
	Default
}

interface ISpaceshipInstanceData {
	name: string;
	url: string;
	x?: number;
	y?: number;
	z?: number;
	rx?: number;
	ry?: number;
	rz?: number;
	rw?: number;
	team: number;
	role: ISquadRole;
}

class SpaceShipFactory {

	public static _cellShadingMaterial: BABYLON.CellMaterial;
	public static get cellShadingMaterial(): BABYLON.CellMaterial {
		if (!SpaceShipFactory._cellShadingMaterial) {
			SpaceShipFactory._cellShadingMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
			SpaceShipFactory._cellShadingMaterial.computeHighLevel = true;
		}
		return SpaceShipFactory._cellShadingMaterial;
	}

	public static baseColorFromTeam(team: number): string {
		return "#ffffff";
	}

	public static detailColorFromTeam(team: number): string {
		if (team === 0) {
			return "#0000ff";
		}
		if (team === 1) {
			return "#ff0000";
		}
		return "#00ff00";
	}

	public static async AddSpaceShipToScene(
		data: ISpaceshipInstanceData,
		scene: BABYLON.Scene
	): Promise<SpaceShip> {
		let spaceshipData = await SpaceshipLoader.instance.get(data.url);
		let spaceShip: SpaceShip = new SpaceShip(spaceshipData, Main.Scene);
		spaceShip.name = data.name;
		await spaceShip.initialize(
			spaceshipData.model,
			SpaceShipFactory.baseColorFromTeam(data.team),
			SpaceShipFactory.detailColorFromTeam(data.team)
		);
		if (isFinite(data.x) && isFinite(data.y) && isFinite(data.z)) {
			spaceShip.position.copyFromFloats(data.x, data.y, data.z);
		}
		if (isFinite(data.rx) && isFinite(data.ry) && isFinite(data.rz) && isFinite(data.rw)) {
			spaceShip.rotationQuaternion.copyFromFloats(data.rx, data.ry, data.rz, data.rw);
		}
		RuntimeUtils.NextFrame(
			Main.Scene,
			() => {
				spaceShip.trailMeshes.forEach(
					(t) => {
						t.foldToGenerator();
					}
				)
			}
		);
		return spaceShip;
	}

	public static async LoadSpaceshipPart(
		part: string,
		scene: BABYLON.Scene,
		baseColor: string,
		detailColor: string
	): Promise<BABYLON.Mesh> {
		let data = await VertexDataLoader.instance.getColorized(part, baseColor, detailColor);
		let m = new BABYLON.Mesh(part, Main.Scene);
		m.layerMask = 1;
		data.applyToMesh(m);
		m.material = SpaceShipFactory.cellShadingMaterial;
		return m;
	}
}
