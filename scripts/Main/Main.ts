/// <reference path="../../lib/babylon.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public static Canvas: HTMLCanvasElement;
    public static Engine: BABYLON.Engine;
    public static Scene: BABYLON.Scene;
	public static Light: BABYLON.Light;
	public static Camera: AlphaCamera;
	public static Skybox: BABYLON.Mesh;

    private static _cellShadingMaterial: ToonMaterial;
	public static get cellShadingMaterial(): ToonMaterial {
		if (!Main._cellShadingMaterial) {
			Main._cellShadingMaterial = new ToonMaterial("CellMaterial", BABYLON.Color3.White(), Main.Scene);
		}
		return Main._cellShadingMaterial;
	}

    private static _terrainCellShadingMaterial: TerrainToonMaterial;
	public static get terrainCellShadingMaterial(): TerrainToonMaterial {
		if (!Main._terrainCellShadingMaterial) {
			Main._terrainCellShadingMaterial = new TerrainToonMaterial("CellMaterial", BABYLON.Color3.White(), Main.Scene);
		}
		return Main._terrainCellShadingMaterial;
	}

	public static whiteMaterial: BABYLON.StandardMaterial;
	public static redMaterial: BABYLON.StandardMaterial;
	public static greenMaterial: BABYLON.StandardMaterial;
	public static blueMaterial: BABYLON.StandardMaterial;
	public static greyMaterial: BABYLON.StandardMaterial;
	public static yellowMaterial: BABYLON.StandardMaterial;
	public static cyanMaterial: BABYLON.StandardMaterial;

    constructor(canvasElement: string) {
        Main.Canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        Main.Engine = new BABYLON.Engine(Main.Canvas, true, { preserveDrawingBuffer: true, stencil: true });
	}

	public initializeCamera(): void {
		Main.Camera = new AlphaCamera();
	}
	
	public async initialize(): Promise<void> {
		await this.initializeScene();
	}

    public async initializeScene(): Promise<void> {
		Main.Scene = new BABYLON.Scene(Main.Engine);

		Main.whiteMaterial = new BABYLON.StandardMaterial("white-material", Main.Scene);
		Main.whiteMaterial.diffuseColor.copyFromFloats(1, 1, 1);
		Main.whiteMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
		Main.redMaterial = new BABYLON.StandardMaterial("red-material", Main.Scene);
		Main.redMaterial.diffuseColor.copyFromFloats(1, 0, 0);
		Main.redMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
		Main.greenMaterial = new BABYLON.StandardMaterial("green-material", Main.Scene);
		Main.greenMaterial.diffuseColor.copyFromFloats(0, 1, 0);
		Main.greenMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
		Main.blueMaterial = new BABYLON.StandardMaterial("blue-material", Main.Scene);
		Main.blueMaterial.diffuseColor.copyFromFloats(0, 0, 1);
		Main.blueMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
		Main.greyMaterial = new BABYLON.StandardMaterial("grey-material", Main.Scene);
		Main.greyMaterial.diffuseColor.copyFromFloats(0.5, 0.5, 0.5);
		Main.greyMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
		Main.yellowMaterial = new BABYLON.StandardMaterial("yellow-material", Main.Scene);
		Main.yellowMaterial.diffuseColor.copyFromFloats(1, 1, 0);
		Main.yellowMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);
		Main.cyanMaterial = new BABYLON.StandardMaterial("cyan-material", Main.Scene);
		Main.cyanMaterial.diffuseColor.copyFromFloats(0, 1, 1);
		Main.cyanMaterial.specularColor.copyFromFloats(0.3, 0.3, 0.3);

		this.initializeCamera();
		Main.Camera.minZ = 0.2;
		Main.Camera.maxZ = 2000;

        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);

        BABYLON.Effect.ShadersStore["EdgeFragmentShader"] = `
			#ifdef GL_ES
			precision highp float;
			#endif
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform sampler2D depthSampler;
			uniform float 		width;
			uniform float 		height;
			void make_kernel_color(inout vec4 n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h));
				n[1] = texture2D(tex, coord + vec2(0.0, -h));
				n[2] = texture2D(tex, coord + vec2(  w, -h));
				n[3] = texture2D(tex, coord + vec2( -w, 0.0));
				n[4] = texture2D(tex, coord);
				n[5] = texture2D(tex, coord + vec2(  w, 0.0));
				n[6] = texture2D(tex, coord + vec2( -w, h));
				n[7] = texture2D(tex, coord + vec2(0.0, h));
				n[8] = texture2D(tex, coord + vec2(  w, h));
			}
			void make_kernel_depth(inout float n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h)).r;
				n[1] = texture2D(tex, coord + vec2(0.0, -h)).r;
				n[2] = texture2D(tex, coord + vec2(  w, -h)).r;
				n[3] = texture2D(tex, coord + vec2( -w, 0.0)).r;
				n[4] = texture2D(tex, coord).r;
				n[5] = texture2D(tex, coord + vec2(  w, 0.0)).r;
				n[6] = texture2D(tex, coord + vec2( -w, h)).r;
				n[7] = texture2D(tex, coord + vec2(0.0, h)).r;
				n[8] = texture2D(tex, coord + vec2(  w, h)).r;
			}
			void main(void) 
			{
				vec4 d = texture2D(depthSampler, vUV);
				float depth = d.r * (2000.0 - 0.2) + 0.2;
				
				float nD[9];
				make_kernel_depth( nD, depthSampler, vUV );
				float sobel_depth_edge_h = nD[2] + (2.0*nD[5]) + nD[8] - (nD[0] + (2.0*nD[3]) + nD[6]);
				float sobel_depth_edge_v = nD[0] + (2.0*nD[1]) + nD[2] - (nD[6] + (2.0*nD[7]) + nD[8]);
				float sobel_depth = sqrt((sobel_depth_edge_h * sobel_depth_edge_h) + (sobel_depth_edge_v * sobel_depth_edge_v));
				float thresholdDepth = 0.002;

				vec4 n[9];
				make_kernel_color( n, textureSampler, vUV );
				vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
				vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
				vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
				float threshold = 0.4 + max((depth - 20.) / 30., 0.);
				
				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
				if (sobel_depth < thresholdDepth || depth > 1000.) {
					if (max(sobel.r, max(sobel.g, sobel.b)) < threshold) {
						gl_FragColor = n[4];
					}
				} 
			}
        `;
		BABYLON.Engine.ShadersRepository = "./shaders/";
        
		let depthMap = Main.Scene.enableDepthRenderer(Main.Camera).getDepthMap();
		
		/*
		let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, Main.Camera);
		postProcess.onApply = (effect) => {
			effect.setTexture("depthSampler", depthMap);
			effect.setFloat("width", Main.Engine.getRenderWidth());
			effect.setFloat("height", Main.Engine.getRenderHeight());
		};
		*/
		
		let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), Main.Scene);
		noPostProcessCamera.parent = Main.Camera;
		noPostProcessCamera.layerMask = 0x10000000;
		
		Main.Scene.activeCameras.push(Main.Camera, noPostProcessCamera);

		// Skybox seed : 1vt3h8rxhb28
		Main.Skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", { diameter: 3000.0 }, Main.Scene);
		Main.Skybox.layerMask = 1;
		Main.Skybox.infiniteDistance = true;
		let skyboxMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("skyBox", Main.Scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.emissiveTexture = new BABYLON.Texture(
			"./datas/textures/sky.png",
			Main.Scene
		);
		skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		Main.Skybox.material = skyboxMaterial;

		new VertexDataLoader(Main.Scene);

		let game = new Game();
		let player0 = new AlphaClient(0);
		let player1 = new StupidClient(1);
		game.connectClient(player0);
		game.connectClient(player1);
		player0.connectGame(game);
		player1.connectGame(game);
		game.initialize();
		game.check();
		
		console.log("Main scene Initialized.");
    }

    public animate(): void {
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
        });

        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}

window.addEventListener("load", async () => {
	let main: Main = new Main("render-canvas");
	await main.initialize();
	main.animate();
})