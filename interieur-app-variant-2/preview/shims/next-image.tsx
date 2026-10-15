import logo from "../../public/logo.png";

export default function Image({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  // eslint-disable-next-line @next/next/no-img-element -- preview zonder Next-server
  return <img src={src === "/logo.png" ? logo : src} alt={alt} width={width} height={height} className={className} />;
}
