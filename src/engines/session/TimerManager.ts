export class TimerManager {
  private durationSeconds: number = 0; // 0 = infinite stopwatch mode
  private remainingSeconds: number = 0;
  private elapsedSeconds: number = 0;
  private timerIntervalId: number | null = null;
  private isRunning: boolean = false;

  private onTickCallbacks: ((remaining: number, elapsed: number) => void)[] = [];
  private onCompleteCallbacks: (() => void)[] = [];

  constructor() {}

  public onTick(cb: (remaining: number, elapsed: number) => void): void {
    this.onTickCallbacks.push(cb);
  }

  public onComplete(cb: () => void): void {
    this.onCompleteCallbacks.push(cb);
  }

  public start(durationMinutes: number = 0): void {
    this.stop();
    this.durationSeconds = durationMinutes * 60;
    this.remainingSeconds = this.durationSeconds;
    this.elapsedSeconds = 0;
    this.isRunning = true;

    this.timerIntervalId = window.setInterval(() => {
      this.elapsedSeconds++;

      if (this.durationSeconds > 0) {
        this.remainingSeconds--;
        if (this.remainingSeconds <= 0) {
          this.remainingSeconds = 0;
          this.stop();
          this.onCompleteCallbacks.forEach(cb => cb());
        }
      }

      this.onTickCallbacks.forEach(cb => cb(this.remainingSeconds, this.elapsedSeconds));
    }, 1000);
  }

  public stop(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.isRunning = false;
  }

  public formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public destroy(): void {
    this.stop();
  }
}
