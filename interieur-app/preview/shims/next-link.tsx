import type { AnchorHTMLAttributes } from "react";
import { navigate } from "./router";

export default function Link({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={`#${href}`}
      onClick={(event) => {
        onClick?.(event);
        if (event.metaKey || event.ctrlKey || event.button !== 0) return;
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    />
  );
}
