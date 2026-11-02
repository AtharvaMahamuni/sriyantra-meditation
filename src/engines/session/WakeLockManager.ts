export class WakeLockManager {
  private sentinel: any = null;
  private isRequested: boolean = true; // Default ON for meditation sessions
  private isSupported: boolean = false;
  private onChangeCallbacks: ((active: boolean) => void)[] = [];

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    this.handleVisibility = this.handleVisibility.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility);
    }
  }

  public onChange(callback: (active: boolean) => void): void {
    this.onChangeCallbacks.push(callback);
  }

  private notify(): void {
    const active = this.isActive();
    this.onChangeCallbacks.forEach(cb => cb(active));
  }

  public isActive(): boolean {
    return this.sentinel !== null && !this.sentinel.released;
  }

  public async request(): Promise<boolean> {
    this.isRequested = true;
    if (!this.isSupported) {
      this.notify();
      return false;
    }

    try {
      if (this.isActive()) return true;
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.notify();
      });
      this.notify();
      return true;
    } catch (err) {
      console.warn('[SriYantra] WakeLock request error:', err);
      this.sentinel = null;
      this.notify();
      return false;
    }
  }

  public async release(): Promise<void> {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (e) {
        // Ignored
      }
      this.sentinel = null;
    }
    this.notify();
  }

  public async toggle(): Promise<boolean> {
    if (this.isActive()) {
      await this.release();
      return false;
    } else {
      return await this.request();
    }
  }

  private async handleVisibility(): Promise<void> {
    if (this.isRequested && document.visibilityState === 'visible') {
      await this.request();
    }
  }

  public destroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility);
    }
    this.release();
  }
}
