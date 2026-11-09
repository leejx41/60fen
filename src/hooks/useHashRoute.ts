import { useEffect, useState } from "react";

export type Route =
  | { name: "today" }
  | { name: "pool" }
  | { name: "settings" }
  | { name: "onboarding"; replay: boolean }
  | { name: "intercept"; id: string }
  | { name: "branch"; id: string; branch: "A" | "B" | "C" | "D" }
  | { name: "acted"; id: string }
  | { name: "night"; id: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [head, second, third] = clean.split("/");
  if (head === "pool") return { name: "pool" };
  if (head === "settings") return { name: "settings" };
  if (head === "onboarding") {
    return { name: "onboarding", replay: second === "replay" };
  }
  if (head === "intercept" && second) return { name: "intercept", id: second };
  if (head === "branch" && second && (third === "A" || third === "B" || third === "C" || third === "D")) {
    return { name: "branch", id: second, branch: third };
  }
  if (head === "acted" && second) return { name: "acted", id: second };
  if (head === "night" && second) return { name: "night", id: second };
  return { name: "today" };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "today":
      return "#/today";
    case "pool":
      return "#/pool";
    case "settings":
      return "#/settings";
    case "onboarding":
      return route.replay ? "#/onboarding/replay" : "#/onboarding";
    case "intercept":
      return `#/intercept/${route.id}`;
    case "branch":
      return `#/branch/${route.id}/${route.branch}`;
    case "acted":
      return `#/acted/${route.id}`;
    case "night":
      return `#/night/${route.id}`;
  }
}

export function navigate(route: Route): void {
  const hash = routeToHash(route);
  if (window.location.hash !== hash) window.location.hash = hash;
  else window.dispatchEvent(new Event("hashchange"));
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = (): void => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
