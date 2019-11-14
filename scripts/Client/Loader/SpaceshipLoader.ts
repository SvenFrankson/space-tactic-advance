class SpaceshipLoader {

    public static instance: SpaceshipLoader;

    public scene: BABYLON.Scene;
    private _spaceshipDatas: Map<string, ISpaceshipData>;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this._spaceshipDatas = new Map<string, ISpaceshipData>();
        SpaceshipLoader.instance = this;
    }

    public async get(name: string): Promise<ISpaceshipData> {
        if (this._spaceshipDatas.get(name)) {
            return this._spaceshipDatas.get(name);
        }
        return new Promise<ISpaceshipData> (
            (resolve) => {
                /*
                $.getJSON(
                    "./datas/spaceships/" + name + ".json",
                    (data: ISpaceshipData) => {
                        this._spaceshipDatas.set(name, data);
                        resolve(this._spaceshipDatas.get(name));
                    }
                )
                */
               resolve(undefined);
            }
        )
    }
}