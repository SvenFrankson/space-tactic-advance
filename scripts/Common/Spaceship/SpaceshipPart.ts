interface ISpaceshipPartData {
    reference: string;
}

class SpaceshipPart {

    public reference: string = "undefined";
    public name: string = "Unnamed";
    public meshName: string = "";

    public speed: number = 0;
    public stamina: number = 0;
    public shieldCapacity: number = 0;
    public shieldSpeed: number = 0;
    public armor: number = 0;
    public moveRange: number = 0;
    public attackRange: number = 0;
    public attackPower: number = 0;
    public accuracy: number = 0;
    public staticAttack: boolean = false;
    public criticalRate: number = 0;
    public dodgeRate: number = 0;

    constructor() {

    }

    public setReference(reference: string): void {
        this.reference = reference;
        if (this.reference === "arrow-body") {
            this.speed += 10;
            this.name = "Arrow";
            this.meshName = "body-1";
        }
        if (this.reference === "hubble-body") {
            this.accuracy += 5;
            this.name = "Hubble";
            this.meshName = "body-2";
        }
        if (this.reference === "moon-body") {
            this.shieldCapacity += 2;
            this.shieldSpeed += 1;
            this.name = "Moon";
            this.meshName = "body-3";
        }

        if (this.reference === "scout-wing") {
            this.moveRange += 1;
            this.name = "Scout";
            this.meshName = "wing-1";
        }
        if (this.reference === "arrow-wing") {
            this.speed += 5;
            this.name = "Arrow";
            this.meshName = "wing-2";
        }
        if (this.reference === "shield-wing") {
            this.armor += 1;
            this.name = "Shield";
            this.meshName = "wing-3";
        }
        if (this.reference === "claw-wing") {
            this.attackPower += 1;
            this.name = "Claw";
            this.meshName = "wing-4";
        }
    }

    public serialize(): ISpaceshipPartData {
        return {
            reference: this.reference
        };
    }

    public static Deserialize(data: ISpaceshipPartData, spaceshipPart?: SpaceshipPart): SpaceshipPart {
        if (!spaceshipPart) {
            spaceshipPart = new SpaceshipPart();
        }
        spaceshipPart.setReference(data.reference);

        return spaceshipPart;
    }

    private static _BodyReferences: string[] = [
        "arrow-body",
        "hubble-body",
        "moon-body"
    ];
    public static RandomBodyData(): ISpaceshipPartData {
        return {
            reference: SpaceshipPart._BodyReferences[Math.floor(Math.random() * SpaceshipPart._BodyReferences.length)]
        };
    }

    private static _WingReferences: string[] = [
        "scout-wing",
        "arrow-wing",
        "shield-wing",
        "claw-wing",
    ];
    public static RandomWingData(): ISpaceshipPartData {
        return {
            reference: SpaceshipPart._WingReferences[Math.floor(Math.random() * SpaceshipPart._WingReferences.length)]
        };
    }
}