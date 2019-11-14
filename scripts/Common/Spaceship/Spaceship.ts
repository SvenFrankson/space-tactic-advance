interface ISpaceshipData {
    body: ISpaceshipPartData;
    wingL: ISpaceshipPartData;
    wingR: ISpaceshipPartData;
    canon?: ISpaceshipPartData;
    engine: ISpaceshipPartData;
}

class Spaceship {

    public body: SpaceshipPart;
    public wingL: SpaceshipPart;
    public wingR: SpaceshipPart;
    public canon: SpaceshipPart;
    public engine: SpaceshipPart;

    public allParts: SpaceshipPart[] = [];

    constructor(public fighter: Fighter) {
        
    }

    public initialize(): void {
        for (let i = 0; i < this.allParts.length; i++) {
            let spaceshipPart = this.allParts[i];
            this.fighter.speed += spaceshipPart.speed;
            this.fighter.stamina += spaceshipPart.stamina;
            this.fighter.shieldCapacity += spaceshipPart.shieldCapacity;
            this.fighter.shieldSpeed += spaceshipPart.shieldSpeed;
            this.fighter.armor += spaceshipPart.armor;
            this.fighter.moveRange += spaceshipPart.moveRange;
            this.fighter.attackRange += spaceshipPart.attackRange;
            this.fighter.attackPower += spaceshipPart.attackPower;
            this.fighter.accuracy += spaceshipPart.accuracy;
            this.fighter.staticAttack = this.fighter.staticAttack || spaceshipPart.staticAttack;
            this.fighter.criticalRate += spaceshipPart.attackRange;
            this.fighter.dodgeRate += spaceshipPart.dodgeRate;
        }
    }

    public serialize(): ISpaceshipData {
        let data: ISpaceshipData = {
            body: { reference: this.body.reference },
            wingL: { reference: this.wingL.reference },
            wingR: { reference: this.wingR.reference },
            engine: { reference: this.engine.reference }
        };
        if (this.canon) {
            data.canon = { reference: this.canon.reference };
        }
        return data;
    }

    public static Deserialize(data: ISpaceshipData, spaceship?: Spaceship): Spaceship {
        /*
        if (!spaceship) {
            spaceship = new Spaceship();
        }
        */
        if (data.body) {
            spaceship.body = SpaceshipPart.Deserialize(data.body);
            spaceship.allParts.push(spaceship.body);
        }
        if (data.wingL) {
            spaceship.wingL = SpaceshipPart.Deserialize(data.wingL);
            spaceship.allParts.push(spaceship.wingL);
        }
        if (data.wingR) {
            spaceship.wingR = SpaceshipPart.Deserialize(data.wingR);
            spaceship.allParts.push(spaceship.wingR);
        }
        if (data.canon) {
            spaceship.canon = SpaceshipPart.Deserialize(data.canon);
            spaceship.allParts.push(spaceship.canon);
        }
        if (data.engine) {
            spaceship.engine = SpaceshipPart.Deserialize(data.engine);
            spaceship.allParts.push(spaceship.engine);
        }

        return spaceship;
    }

    public static RandomData(): ISpaceshipData {
        let wingData = SpaceshipPart.RandomWingData();
        return {
            body: SpaceshipPart.RandomBodyData(),
            wingL: wingData,
            wingR: wingData,
            engine: { reference: "engine-1" },
            canon: { reference: "canon-1" }
        };
    }
}