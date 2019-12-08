class ActionPanel extends HTMLElement {

    private _initialized: boolean = false;
    
    public moveButton: HTMLInputElement;
    public attackButton: HTMLInputElement;
    public holdButton: HTMLInputElement;
    public passButton: HTMLInputElement;
    public backButton: HTMLInputElement;

    public static CreateActionPanel(): ActionPanel {
        let panel = document.createElement("action-panel") as ActionPanel;
        document.body.appendChild(panel);
        return panel;
    }

    constructor() {
        super();
    }

    public connectedCallback(): void {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        this.moveButton = this.addButton("MOVE");
        this.attackButton = this.addButton("ATTACK");
        this.holdButton = this.addButton("HOLD");
        this.passButton = this.addButton("PASS");
        this.backButton = this.addButton("BACK");
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
        n.scaleInPlace(- 0.5);
        let p = this._target.position.add(n);
        let screenPos = BABYLON.Vector3.Project(
            p,
            BABYLON.Matrix.Identity(),
            this._target.getScene().getTransformMatrix(),
            Main.Camera.viewport.toGlobal(1, 1)
        );
        this.style.left = (screenPos.x * Main.Canvas.width) + "px";
        this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height - this.clientHeight * 0.5) + "px";
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

window.customElements.define("action-panel", ActionPanel);

class SpacePanel extends HTMLElement {

    private _initialized: boolean = false;
    private _innerBorder: HTMLDivElement;
    private _htmlLines: HTMLElement[] = [];
    private _toggleVisibilityInput: HTMLButtonElement;
    private _isVisible: boolean = true;
    private _foldable: boolean;

    public static CreateSpacePanel(foldable: boolean = true): SpacePanel {
        let panel = document.createElement("space-panel") as SpacePanel;
        panel._foldable = foldable;
        document.body.appendChild(panel);
        return panel;
    }

    constructor() {
        super();
    }

    public connectedCallback(): void {
        if (this._initialized) {
            return;
        }
        this._innerBorder = document.createElement("div");
        this._innerBorder.classList.add("space-panel-inner-border");
        this.appendChild(this._innerBorder);

        if (this._foldable) {
            this._toggleVisibilityInput = document.createElement("button");
            this._toggleVisibilityInput.classList.add("space-panel-toggle-visibility");
            this._toggleVisibilityInput.textContent = "^";
            this._toggleVisibilityInput.addEventListener("click", () => {
                if (this._isVisible) {
                    this.hide();
                }
                else {
                    this.show();
                }
            });
            this._innerBorder.appendChild(this._toggleVisibilityInput);
        }
        
        this._initialized = true;
    }

    public dispose(): void {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        document.body.removeChild(this);
    }

    public show(): void {
        this._toggleVisibilityInput.textContent = "^";
        this._isVisible = true;
        this._htmlLines.forEach(
            (l) => {
                l.style.display = "block";
            }
        )
    }

    public hide(): void {
        this._toggleVisibilityInput.textContent = "v";
        this._isVisible = false;
        this._htmlLines.forEach(
            (l) => {
                l.style.display = "none";
            }
        )
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
        n.scaleInPlace(- 0.5);
        let p = this._target.position.add(n);
        let screenPos = BABYLON.Vector3.Project(
            p,
            BABYLON.Matrix.Identity(),
            this._target.getScene().getTransformMatrix(),
            Main.Camera.viewport.toGlobal(1, 1)
        );
        this.style.left = (screenPos.x * Main.Canvas.width) + "px";
        this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height - this.clientHeight * 0.5) + "px";
    }

    public addTitle1(title: string): void {
        let titleLine = document.createElement("div");
        titleLine.classList.add("space-title-1-line");
        let e = document.createElement("h1");
        e.classList.add("space-title-1");
        e.textContent = title;
        titleLine.appendChild(e);
        let eShadow = document.createElement("span");
        eShadow.classList.add("space-title-1-shadow");
        eShadow.textContent = title;
        titleLine.appendChild(eShadow);
        this._innerBorder.appendChild(titleLine);
    }

    public addTitle2(title: string): void {
        let e = document.createElement("h2");
        e.classList.add("space-title-2");
        e.textContent = title;
        this._innerBorder.appendChild(e);
        this._htmlLines.push(e);
    }

    public addNumberInput(label: string, value: number, onInputCallback?: (v: number) => void, precision: number = 1): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-number");
        inputElement.setAttribute("type", "number");
        inputElement.value = value.toFixed(precision);
        let step = 1 / (Math.pow(2, Math.round(precision)));
        inputElement.setAttribute("step", step.toString());
        inputElement.addEventListener(
            "input",
            (ev) => {
                if (ev.srcElement instanceof HTMLInputElement) {
                    let v = parseFloat(ev.srcElement.value);
                    if (isFinite(v)) {
                        if (onInputCallback) {
                            onInputCallback(v);
                        }
                    }
                }
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }

    public addTextInput(label: string, text: string, onInputCallback?: (t: string) => void): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-text");
        inputElement.setAttribute("type", "text");
        inputElement.value = text;
        inputElement.addEventListener(
            "input",
            (ev) => {
                if (ev.srcElement instanceof HTMLInputElement) {
                    if (onInputCallback) {
                        onInputCallback(ev.srcElement.value);
                    }
                }
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }

    public addLargeButton(value: string, onClickCallback: () => void): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-lg");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        inputElement.addEventListener(
            "click",
            () => {
                onClickCallback();
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }

    public addConditionalButton(label: string, value: () => string, onClickCallback: () => void): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-inline");
        inputElement.setAttribute("type", "button");
        inputElement.value = value();
        inputElement.addEventListener(
            "click",
            () => {
                onClickCallback();
                inputElement.value = value();
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }

    public addMediumButtons(value1: string, onClickCallback1: () => void, value2?: string, onClickCallback2?: () => void): HTMLInputElement[] {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement1 = document.createElement("input");
        inputElement1.classList.add("space-button");
        inputElement1.setAttribute("type", "button");
        inputElement1.value = value1;
        inputElement1.addEventListener(
            "click",
            () => {
                onClickCallback1();
            }
        );
        lineElement.appendChild(inputElement1);
        let inputs = [inputElement1];
        if (value2 && onClickCallback2) {
            let inputElement2 = document.createElement("input");
            inputElement2.classList.add("space-button");
            inputElement2.setAttribute("type", "button");
            inputElement2.value = value2;
            inputElement2.addEventListener(
                "click",
                () => {
                    onClickCallback2();
                }
            );
            lineElement.appendChild(inputElement2);
            inputs.push(inputElement2);
        }
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputs;
    }

    public addIconButtons(imageUrl1: string, onClickCallback1: () => void, imageUrl2?: string, onClickCallback2?: () => void): HTMLInputElement[] {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement1 = document.createElement("input");
        inputElement1.classList.add("space-button-icon");
        inputElement1.setAttribute("type", "button");
        inputElement1.style.backgroundImage = "url(\"" + imageUrl1 + "\")";
        inputElement1.addEventListener(
            "click",
            () => {
                onClickCallback1();
            }
        );
        lineElement.appendChild(inputElement1);
        let inputs = [inputElement1];
        if (imageUrl2 && onClickCallback2) {
            let inputElement2 = document.createElement("input");
            inputElement2.classList.add("space-button-icon");
            inputElement2.setAttribute("type", "button");
            inputElement2.style.backgroundImage = "url(\"" + imageUrl2 + "\")";
            inputElement2.addEventListener(
                "click",
                () => {
                    onClickCallback2();
                }
            );
            lineElement.appendChild(inputElement2);
            inputs.push(inputElement2);
        }
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputs;
    }

    public addCheckBox(label: string, value: boolean, onToggleCallback: (v: boolean) => void): HTMLInputElement {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-toggle");
        inputElement.setAttribute("type", "checkbox");
        inputElement.addEventListener(
            "input",
            (ev) => {
                if (ev.srcElement instanceof HTMLInputElement) {
                    onToggleCallback(ev.srcElement.checked);
                }
            }
        );
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
}

window.customElements.define("space-panel", SpacePanel);

class SpacePanelLabel extends HTMLElement {

    constructor() {
        super();
    }
}

window.customElements.define("space-panel-label", SpacePanelLabel);