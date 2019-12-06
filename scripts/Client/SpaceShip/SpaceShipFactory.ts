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

	public static async LoadSpaceshipPart(
		spaceshipName: string,
		partName: string,
		baseColor: string,
		detailColor: string
	): Promise<BABYLON.Mesh> {
		let data = await SpaceshipVertexDataLoader.instance.getSpaceshipPartVertexData(spaceshipName, partName, baseColor, detailColor, "#ff0000", "#00ff00", "#0000ff");
		let m = new BABYLON.Mesh(spaceshipName + " " + partName, Main.Scene);
		m.layerMask = 1;
		data.applyToMesh(m);
		m.material = SpaceShipFactory.cellShadingMaterial;
		return m;
	}
}
