interface IClient {

    initializeBoard(board: IBoardData): void;
    addFighters(fighterDatas: IFighterData[]): void;
    updateFightersOrder(fightersOrder: number[]): void;
    initializeTurn(): void;
    initializePhase(): void;
    moveFighter(fightersId: number, i: number, j: number): void;
    attackFighter(fightersId: number, targetId: number, result: number): void;
    updateFighterHPShield(fighterId: number, hp: number, shield: number): void;
    killFighter(fightersId: number): void;
    delayFighterPhase(fightersId: number): void;
    endFighterPhase(fighterId: number): void;
    endTurn(): void;
    endGame(winner: number): void;
}