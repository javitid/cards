type StorageKind = 'localStorage' | 'sessionStorage';

function getStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === 'undefined' || !(kind in window)) {
      return null;
    }

    return window[kind];
  } catch {
    return null;
  }
}

function read(storage: Storage | null, key: string): string | null {
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(storage: Storage | null, key: string, value: string): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function remove(storage: Storage | null, key: string): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getSessionItem(key: string): string | null {
  return read(getStorage('sessionStorage'), key);
}

export function setSessionItem(key: string, value: string): boolean {
  return write(getStorage('sessionStorage'), key, value);
}

export function removeSessionItem(key: string): boolean {
  return remove(getStorage('sessionStorage'), key);
}

export function getLocalItem(key: string): string | null {
  return read(getStorage('localStorage'), key);
}

export function setLocalItem(key: string, value: string): boolean {
  return write(getStorage('localStorage'), key, value);
}
