class Building extends BABYLON.Mesh {

    private _wallColumnMaterial: BABYLON.StandardMaterial;
    private _wallBorderMaterial: BABYLON.StandardMaterial;
    private _windowGlassMaterial: BABYLON.StandardMaterial;
    private _windowForgeMaterial: BABYLON.StandardMaterial;

    constructor(
        public width: number = 8,
        public depth: number = 8,
        public floors: number = 2
    ) {
        super("building");
        
        this._wallColumnMaterial = new BABYLON.StandardMaterial("wall-column-material", Main.Scene);
        this._wallColumnMaterial.diffuseColor.copyFromFloats(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
        this._wallColumnMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
        
        this._wallBorderMaterial = new BABYLON.StandardMaterial("wall-border-material", Main.Scene);
        let r = Math.random() * 0.25 + 0.25;
        this._wallBorderMaterial.diffuseColor.copyFromFloats(r, r, r);
        this._wallBorderMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

        this._windowGlassMaterial = new BABYLON.StandardMaterial("window-glass-material", Main.Scene);
        this._windowGlassMaterial.diffuseColor.copyFromFloats(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1);
        this._windowGlassMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
        
        this._windowForgeMaterial = new BABYLON.StandardMaterial("window-forge-material", Main.Scene);
        r = Math.random() * 0.25;
        this._windowForgeMaterial.diffuseColor.copyFromFloats(r, r, r);
        this._windowForgeMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
    }

    public async instantiate(): Promise<void> {
        let datas = await VertexDataLoader.instance.get("building_toon_test");
        let wallMainData = datas.get("wall-main");
        if (wallMainData) {
            wallMainData = BuildingVertexData.WidthDepth(wallMainData, this.width, this.depth);
            let wallMainMaterial = new BABYLON.StandardMaterial("wall-main-material", Main.Scene);
            wallMainMaterial.diffuseColor.copyFromFloats(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5);
            wallMainMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            for (let i = 0; i < this.floors; i++) {
                let wallMain = new BABYLON.Mesh("wall-main");
                wallMainData.applyToMesh(wallMain);
                wallMain.position.y = 3 * i;
                wallMain.material = wallMainMaterial;

                let x0 = - 1.2 - (this.width / 2 - 1);
                let l = Math.abs(2 * x0);
                let n = Math.floor(l / 2.5);
                let d = l / (2 * n);
                if (n > 0) {
                    let windowData = datas.get("window");
                    if (windowData) {
                        for (let j = 0; j < n; j++) {
                            let window = new BABYLON.Mesh("window");
                            windowData.applyToMesh(window);
                            window.position.x = x0 + d + 2 * d * j;
                            window.position.y = 3 * i + 1.8;
                            window.position.z = 1.35 + (this.depth / 2 - 1);
                            window.material = this._wallColumnMaterial;
                        }
                    }
                    let windowGlassData = datas.get("window-glass");
                    if (windowGlassData) {
                        for (let j = 0; j < n; j++) {
                            let windowGlass = new BABYLON.Mesh("window-glass");
                            windowGlassData.applyToMesh(windowGlass);
                            windowGlass.position.x = x0 + d + 2 * d * j;
                            windowGlass.position.y = 3 * i + 1.8;
                            windowGlass.position.z = 1.35 + (this.depth / 2 - 1);
                            windowGlass.material = this._windowGlassMaterial;
                        }
                    }
                    let windowForgeData = datas.get("window-forge");
                    if (windowForgeData) {
                        for (let j = 0; j < n; j++) {
                            let windowForge = new BABYLON.Mesh("window-forge");
                            windowForgeData.applyToMesh(windowForge);
                            windowForge.position.x = x0 + d + 2 * d * j;
                            windowForge.position.y = 3 * i + 1.8;
                            windowForge.position.z = 1.35 + (this.depth / 2 - 1);
                            windowForge.material = this._windowForgeMaterial;
                        }
                    }
                }
            }
        }
        let wallMainShadowData = datas.get("wall-main-shadow");
        if (wallMainShadowData) {
            wallMainShadowData = BuildingVertexData.WidthDepth(wallMainShadowData, this.width, this.depth);
            let wallMainShadowMaterial = new BABYLON.StandardMaterial("wall-main-shadow-material", Main.Scene);
            wallMainShadowMaterial.diffuseTexture = new BABYLON.Texture("datas/textures/square_frame_shadow.png", Main.Scene);
            wallMainShadowMaterial.diffuseTexture.hasAlpha = true;
            wallMainShadowMaterial.useAlphaFromDiffuseTexture = true;
            wallMainShadowMaterial.specularColor.copyFromFloats(0, 0, 0);
            for (let i = 0; i < this.floors; i++) {
                let wallMainShadow = new BABYLON.Mesh("wall-main-shadow");
                wallMainShadowData.applyToMesh(wallMainShadow);
                wallMainShadow.position.y = 3 * i;
                wallMainShadow.material = wallMainShadowMaterial;
                wallMainShadow.visibility = 0.5;
            }
        }
        let wallBorderData = datas.get("wall-border");
        if (wallBorderData) {
            wallBorderData = BuildingVertexData.WidthDepth(wallBorderData, this.width, this.depth);
            for (let i = 0; i < this.floors; i++) {
                let wallBorder = new BABYLON.Mesh("wall-border");
                wallBorderData.applyToMesh(wallBorder);
                wallBorder.position.y = 3 * i;
                wallBorder.material = this._wallBorderMaterial;
            }
        }
        let wallColumnData = datas.get("wall-column");
        if (wallColumnData) {
            wallColumnData = BuildingVertexData.WidthDepth(wallColumnData, this.width, this.depth);
            for (let i = 0; i < this.floors; i++) {
                let wallColumn = new BABYLON.Mesh("wall-column");
                wallColumnData.applyToMesh(wallColumn);
                wallColumn.position.y = 3 * i;
                wallColumn.material = this._wallColumnMaterial;
            }
        }
        let roofTopData = datas.get("roof-top");
        if (roofTopData) {
            roofTopData = BuildingVertexData.WidthDepth(roofTopData, this.width, this.depth);
            let roofTop = new BABYLON.Mesh("roof-top");
            roofTopData.applyToMesh(roofTop);
            roofTop.position.y = 3 * this.floors;
        }
        let roofBorderData = datas.get("roof-border");
        if (roofBorderData) {
            roofBorderData = BuildingVertexData.WidthDepth(roofBorderData, this.width, this.depth);
            let roofBorder = new BABYLON.Mesh("roof-border");
            roofBorderData.applyToMesh(roofBorder);
            roofBorder.position.y = 3 * this.floors;
            roofBorder.material = this._wallBorderMaterial;
        }
    }
}