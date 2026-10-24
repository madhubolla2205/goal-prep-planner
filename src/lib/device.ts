// What the app can do with the browser it runs in: install to the home
// screen, work offline, and keep its data from being cleared.

import { Capacitor } from '@capacitor/core';

/** True inside the Android app, where the app is already installed and offline. */
export const isNativeApp = () => Capacitor.isNativePlatform();

/** Chrome's install prompt event; not in the DOM typings yet. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/**
 * Starts listening for the install prompt and registers the service worker.
 * Called once at startup, because the browser offers the prompt only once,
 * before any screen that shows the button has rendered.
 */
export function setUpDevice(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    notify();
  });
  // The service worker exists only in the build; in dev it would cache stale modules.
  // The Android app ships every file inside it, so it needs none.
  if (import.meta.env.PROD && !isNativeApp() && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
        // Without it the app still works, just not offline.
      });
    });
  }
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether the browser can show its own install dialog right now. */
export const canInstall = () => installPrompt !== null;

export async function install(): Promise<boolean> {
  if (!installPrompt) return false;
  const prompt = installPrompt;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  installPrompt = null;
  notify();
  return outcome === 'accepted';
}

/** True when the app is running from the home screen rather than a browser tab. */
export function isInstalled(): boolean {
  return isNativeApp() || matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** iPhone and iPad have no install prompt; people add the app from the Share menu. */
export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

/**
 * Asks the browser not to clear the app's data when space runs low. Chrome
 * and Edge decide on their own (installed apps qualify), Firefox asks the
 * person, and Safari keeps data of home-screen apps. Resolves to whether the
 * data is protected.
 */
export async function protectStorage(): Promise<boolean> {
  // The Android app's data stays until the app is uninstalled or its data cleared.
  if (isNativeApp()) return true;
  if (!navigator.storage?.persist) return false;
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}
