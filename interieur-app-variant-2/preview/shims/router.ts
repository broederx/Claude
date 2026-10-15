import { useSyncExternalStore } from "react";

// Router in het geheugen: de losse preview draait zonder server en zonder
// echte URL's, dus de "pagina" is gewoon een stukje state.
let path = "/";
const listeners = new Set<() => void>();

export function navigate(href: string) {
  path = href.split("#")[0] || "/";
  listeners.forEach((l) => l());
  window.scrollTo(0, 0);
}

export function usePath() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => path,
    () => path,
  );
}

export function paramsFor(): Record<string, string> {
  return {};
}
