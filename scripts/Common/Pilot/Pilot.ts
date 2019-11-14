enum Gender {
    Male,
    Female
}

enum PilotNature {
    Professional,
    Angry,
    Calm,
    Rookie,
    Cool
}

interface IPilotData {
    name: string;
    gender: Gender;
    nature: PilotNature;
}

class Pilot {

    public name: string;
    public gender: Gender;
    public nature: PilotNature;

    constructor(public fighter: Fighter) {

    }

    public initialize(): void {
        if (this.nature === PilotNature.Professional) {
            this.fighter.accuracy += 5;
            this.fighter.criticalRate -= 5;
        }
        if (this.nature === PilotNature.Cool) {
            this.fighter.speed -= 5;
            this.fighter.criticalRate += 5;
        }
        if (this.nature === PilotNature.Angry) {
            this.fighter.attackPower += 5;
            this.fighter.dodgeRate -= 5;
        }
        if (this.nature === PilotNature.Rookie) {
            this.fighter.dodgeRate +=5;
            this.fighter.stamina -= 2;
        }
    }

    public serialize(): IPilotData {
        return {
            name: this.name,
            gender: this.gender,
            nature: this.nature,
        };
    }

    public static Deserialize(data: IPilotData, pilot?: Pilot): Pilot {
        /*
        if (!pilot) {
            pilot = new Pilot();
        }
        */
        pilot.name = data.name;
        pilot.gender = data.gender;
        pilot.nature = data.nature;

        return pilot;
    }

    private static _MaleNames: string[] = [
        "Abraham",
        "Bob",
        "Charly",
        "Denver",
        "Eliott",
        "Frank",
        "Grant",
        "Hobarth",
        "Indiana",
        "Jack",
        "Karl",
        "Leon",
        "Muhammad",
        "Neron",
        "Oscar",
        "Preston",
        "Quill",
        "Rex",
        "Sven",
        "Titus",
        "Ulyss",
        "Victor",
        "Walter",
        "Xavier",
        "Yan",
        "Zu"
    ];
    private static _FemaleNames: string[] = [
        "Alicia",
        "Beatrix",
        "Chandra",
        "Dulcia",
        "Eliane",
        "Frida",
        "Gerda",
        "Horthense",
        "Ida",
        "Julie",
        "Kat",
        "Loana",
        "Marcia",
        "Nicoletta",
        "Oualie",
        "Paulita",
        "Quinta",
        "Rose",
        "Soumeia",
        "Tatiana",
        "Ursula",
        "Vero",
        "Wachita",
        "Xendra",
        "Yaelle",
        "Zoe"
    ];
    public static RandomData(): IPilotData {
        let gender = Gender.Male;
        if (Math.random() > 0.5) {
            gender = Gender.Female;
        }
        let name = "";
        if (gender === Gender.Male) {
            name = Pilot._MaleNames[Math.floor(Math.random() * Pilot._MaleNames.length)];
        }
        else {
            name = Pilot._FemaleNames[Math.floor(Math.random() * Pilot._FemaleNames.length)];
        }
        let nature: PilotNature;
        let r = Math.random();
        if (r < 0.5) {
            nature = PilotNature.Professional;
        }
        else {
            nature = PilotNature.Cool;
        }
        return {
            name: name,
            gender: gender,
            nature: nature
        };
    }
}