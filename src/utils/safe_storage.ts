class SafeLocalStorage {
  private memoryStorage: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("localStorage.getItem blocked/failed, using fallback:", e);
    }
    return this.memoryStorage[key] !== undefined ? this.memoryStorage[key] : null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn("localStorage.setItem blocked/failed, using fallback:", e);
    }
    this.memoryStorage[key] = value;
  }

  removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn("localStorage.removeItem blocked/failed, using fallback:", e);
    }
    delete this.memoryStorage[key];
  }

  clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (e) {
      console.warn("localStorage.clear blocked/failed");
    }
    this.memoryStorage = {};
  }
}

export const safeLocalStorage = new SafeLocalStorage();
