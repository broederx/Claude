import Image from "next/image";

export default function Logo({ size = 36 }: { size?: number }) {
  return <Image src="/logo.png" alt="mim" width={size} height={size} className="rounded-md" priority />;
}
