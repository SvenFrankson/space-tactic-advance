class SpeechBubble extends HTMLElement {

    private _initialized: boolean = false;
    
    public static CreateSpeechBubble(target: BABYLON.Mesh, text: string): SpeechBubble {
        
        let bubble = document.createElement("speech-bubble") as SpeechBubble;
        document.body.appendChild(bubble);

        bubble.textContent = text.toLocaleUpperCase();

        return bubble;
    }

    constructor() {
        super();
    }

    public connectedCallback(): void {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
    }

    public dispose(): void {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        document.body.removeChild(this);
    }

    private _target: BABYLON.Mesh;
    public setTarget(mesh: BABYLON.Mesh): void {
        this.style.position = "fixed";
        this._target = mesh;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        if (!this._target) {
            return;
        }
        let dView = this._target.position.subtract(Main.Camera.position);
        let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
        n.normalize();
        n.scaleInPlace(0.2);
        let p = this._target.position.add(n);
        p.y += 0.4;
        let screenPos = BABYLON.Vector3.Project(
            p,
            BABYLON.Matrix.Identity(),
            this._target.getScene().getTransformMatrix(),
            Main.Camera.viewport.toGlobal(1, 1)
        );
        this.style.right = ((1 - screenPos.x) * Main.Canvas.width) + "px";
        this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height) + "px";
    }

    public addButton(value: string, onClickCallback?: () => void): HTMLInputElement {
        let inputElement = document.createElement("input");
        inputElement.classList.add("action-button");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        if (onClickCallback) {
            inputElement.onclick = onClickCallback;
        }
        this.appendChild(inputElement);
        return inputElement;
    }
}

window.customElements.define("speech-bubble", SpeechBubble);
