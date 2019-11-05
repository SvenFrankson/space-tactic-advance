class HexagonMath {

    public static Distance(i1: number, j1: number, i2: number, j2: number): number {
        let dI = i2 - i1;
        let dJ = j2 - j1;
        if (dI * dJ >= 0) {
            return Math.abs(dI) + Math.abs(dJ);
        }
        else {
            return Math.max(Math.abs(dI), Math.abs(dJ));
        }
    }
}