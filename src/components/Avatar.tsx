import { useState } from "react";

type AvatarProps = {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
};

/** Profile picture with a letter fallback (used when there is no photo or it fails to load). */
export function Avatar({ image, name, email, className = "h-10 w-10 text-sm" }: AvatarProps) {
  const [broken, setBroken] = useState<string | null>(null);
  const letter = name?.trim()?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "?";
  const show = image && broken !== image;
  return show ? (
    <img
      src={image}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(image)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  ) : (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800 ${className}`}>{letter}</span>
  );
}
