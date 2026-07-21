import Image from "next/image";
import { DESTINATION_IMAGE_BLUR, isLocalPublicImage } from "@/lib/destination-assets";

type Props = {
  src: string;
  alt: string;
};

export function SeoHeroBackground({ src, alt }: Props) {
  const local = isLocalPublicImage(src);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      className="object-cover"
      sizes="100vw"
      unoptimized={local}
      {...(local
        ? {}
        : {
            placeholder: "blur" as const,
            blurDataURL: DESTINATION_IMAGE_BLUR,
          })}
    />
  );
}
