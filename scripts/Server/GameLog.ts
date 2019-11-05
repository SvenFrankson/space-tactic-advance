class GameLog {

    public lines: string[] = [];

    public log(obj: any): void {
        let t = new Date();
        let l = t.getTime() + " " + obj;
        this.lines.push(l);
        console.log(l);
    }
}