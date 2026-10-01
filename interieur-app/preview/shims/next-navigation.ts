import { navigate, paramsFor, usePath } from "./router";

export function usePathname() {
  return usePath();
}

export function useParams<T>() {
  return paramsFor(usePath()) as T;
}

export function useRouter() {
  return { push: navigate, replace: navigate, back: () => history.back() };
}
