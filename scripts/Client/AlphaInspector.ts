class AlphaInspector {

    constructor() {

    }

    public updateActive(fighter: AlphaFighter): void {
        let name = fighter.pilot.name.toLocaleUpperCase();
        document.querySelector("#inspector-left-name").textContent = name;
        document.querySelector("#inspector-left-name").parentElement.querySelector("span").textContent = name;
    }
}