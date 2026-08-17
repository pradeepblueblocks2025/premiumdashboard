import Image from "next/image";

type BrandLogoProps = {
  size: number;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  size,
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Fortune NFT"
      width={size}
      height={size}
      className={`rounded-lg ${className}`.trim()}
      priority={priority}
    />
  );
}
