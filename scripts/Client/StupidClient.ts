class StupidClient extends Client {

    protected onPhaseInitialized(): void {
        let activeFighter = this.getActiveFighter();
        if (activeFighter) {
            if (activeFighter.team === this._team) {
                setTimeout(
                    () => {
                        if (Math.random() < 0.5) {
                            if (this.game.requestDelay(activeFighter.id)) {
                                return;
                            }
                        }
                        this.game.requestEndTurn(activeFighter.id);
                    },
                    Math.random() * 500 + 500
                )
            }
        }
    }
}