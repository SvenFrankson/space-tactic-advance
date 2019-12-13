class AlphaInspector {

    private static _Instance: AlphaInspector;
    public static get Instance(): AlphaInspector {
        if (!AlphaInspector._Instance) {
            AlphaInspector._Instance = new AlphaInspector();
        }
        return AlphaInspector._Instance;
    }

    constructor() {
        AlphaInspector._Instance = this;
    }

    private _updateInspector(inspectorElement: HTMLElement, fighter: AlphaFighter): void {
        inspectorElement.querySelector(".space-title-1").textContent = fighter.pilot.name.toLocaleUpperCase();
        inspectorElement.querySelector(".space-title-1-shadow").textContent = fighter.pilot.name.toLocaleUpperCase();
        inspectorElement.querySelector(".speed-value").textContent = fighter.speed.toFixed(0);            
        inspectorElement.querySelector(".move-range-value").textContent = fighter.moveRange.toFixed(0);        
        inspectorElement.querySelector(".attack-power-value").textContent = fighter.attackPower.toFixed(0);            
        inspectorElement.querySelector(".attack-range-value").textContent = fighter.attackRange.toFixed(0);        
        inspectorElement.querySelector(".critical-rate-value").textContent = fighter.criticalRate.toFixed(0) + " %";            
        inspectorElement.querySelector(".accuracy-value").textContent = fighter.accuracy.toFixed(0) + " %";
        inspectorElement.querySelector(".armor-value").textContent = fighter.armor.toFixed(0);
        inspectorElement.querySelector(".dodge-value").textContent = fighter.dodgeRate.toFixed(0) + " %";
        inspectorElement.querySelector(".shield-speed-value").textContent = fighter.shieldSpeed.toFixed(0);
    }

    public updateActive(fighter: AlphaFighter): void {
        this._updateInspector(document.querySelector(".inspector-left"), fighter);
    }

    public updateSelected(fighter: AlphaFighter): void {
        this._updateInspector(document.querySelector(".inspector-right"), fighter);
    }
}