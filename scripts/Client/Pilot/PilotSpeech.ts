enum SpeechSituation {
    Ready,
    Selected,
    Move,
    Attack,
    AttackSuccess,
    AttackMiss,
    AttackCritical,
    AttackKill,
    WoundLight,
    WoundMedium,
    WoundHeavy,
    Hold,
    Pass
}

class PilotSpeech {

    private static _Texts = new Map<PilotNature, Map<SpeechSituation, string[]>>();

    public static GetText(nature: PilotNature, situation: SpeechSituation): string {
        let speeches = PilotSpeech._Texts.get(nature).get(situation);
        return speeches[Math.floor(Math.random() * speeches.length)];
    }

    public static LoadProfessionalSpeeches(): void {
        if (PilotSpeech._Texts.get(PilotNature.Professional)) {
            return;
        }
        let speeches = new Map<SpeechSituation, string[]>();
        PilotSpeech._Texts.set(PilotNature.Professional, speeches);
        speeches.set(
            SpeechSituation.Ready,
            [
                "Ready.",
                "Waiting for order."
            ]
        );
        speeches.set(
            SpeechSituation.Selected,
            [
                "Situation : Ok.",
                "Status : Ready."
            ]
        );
        speeches.set(
            SpeechSituation.Move,
            [
                "Copy that.",
                "Here I go."
            ]
        );
        speeches.set(
            SpeechSituation.Attack,
            [
                "Target acquired.",
                "Aiming at target.",
                "Threat is in line of sight."
            ]
        );
        speeches.set(
            SpeechSituation.AttackSuccess,
            [
                "Target hit. Pending damage evaluation...",
                "Target hit. Asserting damages..."
            ]
        );
        speeches.set(
            SpeechSituation.AttackMiss,
            [
                "Target missed. I repeat : Target missed.",
                "Negative. Threat is still operational."
            ]
        );
        speeches.set(
            SpeechSituation.AttackCritical,
            [
                "Target hit for substantial damages."
            ]
        );
        speeches.set(
            SpeechSituation.AttackKill,
            [
                "Target neutralized.",
                "Threat status : Eradicated."
            ]
        );
        speeches.set(
            SpeechSituation.Hold,
            [
                "Holding position, over.",
                "Stand by."
            ]
        );
        speeches.set(
            SpeechSituation.Pass,
            [
                "Over."
            ]
        );
    }
}