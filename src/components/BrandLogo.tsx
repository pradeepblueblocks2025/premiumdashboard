import Image from "next/image";

type BrandLogoProps = {
  size: number;
  className?: string;
  priority?: boolean;
};

const HOME_URL = "https://fortunenft.world/";

export default function BrandLogo({
  size,
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <a
      href={HOME_URL}
      className={`inline-flex shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${className}`.trim()}
      aria-label="Fortune NFT home"
    >
      <Image
        src="/logo.png"
        alt="Fortune NFT"
        width={size}
        height={size}
        className="rounded-lg"
        priority={priority}
      />
    </a>
  );
}
