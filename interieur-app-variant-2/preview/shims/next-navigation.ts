import { navigate, paramsFor, usePath } from "./router";

export function usePathname() {
  return usePath();
}

export function useParams<T>() {
  usePath();
  return paramsFor() as T;
}

export function useRouter() {
  return { push: navigate, replace: navigate, back: () => history.back() };
}
