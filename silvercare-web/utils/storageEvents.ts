"use client";

export const STORAGE_EVENT_NAME =
  "silvercare-storage-changed";

export function notifyStorageChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT_NAME)
  );
}

export function addStorageChangedListener(
  callback: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(
    STORAGE_EVENT_NAME,
    callback
  );

  return () => {
    window.removeEventListener(
      STORAGE_EVENT_NAME,
      callback
    );
  };
}