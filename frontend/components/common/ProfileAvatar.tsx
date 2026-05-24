"use client";

interface ProfileAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

export default function ProfileAvatar({
  name,
  imageUrl,
  size = 64,
}: ProfileAvatarProps) {
  const initials = (name || "U")
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const resolvedImageUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${BACKEND_BASE}${imageUrl}`
    : null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full bg-blue-600 text-white font-semibold shadow-sm"
      style={{ width: size, height: size, minWidth: size }}
    >
      {resolvedImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedImageUrl}
          alt={name || "Profile picture"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-lg">{initials}</span>
      )}
    </div>
  );
}