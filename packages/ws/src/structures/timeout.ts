export class ConnectTimeout {
  promises: { promise: Promise<boolean>; resolve: (x: boolean) => any }[] = [];
  interval?: NodeJS.Timeout = undefined;
  // biome-ignore lint/nursery/noEmptyBlockStatements: <explanation>
  constructor(readonly intervalTime = 5000) {}

  wait() {
    let resolve = (_x: boolean) => {
      //
    };
    const promise = new Promise<boolean>((r) => (resolve = r));
    if (!this.promises.length) {
      this.interval = setInterval(() => {
        this.shift();
      }, this.intervalTime);
    }
    this.promises.push({ resolve, promise });
    return promise;
  }

  shift() {
    this.promises.shift()?.resolve(true);
    if (!this.promises.length) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
