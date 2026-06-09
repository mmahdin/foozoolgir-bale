import { useState } from "react";
import { getUserPhotoUrl } from "../api";

interface AvatarProps {
  userId: number;
  firstName: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

const colors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-red-500",
  "bg-yellow-500",
];

export default function Avatar({ userId, firstName, size = "md" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const colorIndex = userId % colors.length;
  const initial = firstName ? firstName.charAt(0).toUpperCase() : "?";

  if (!imgError) {
    return (
      <img
        src={getUserPhotoUrl(userId)}
        alt={firstName}
        className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}
