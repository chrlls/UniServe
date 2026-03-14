import { createAvatar } from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer";
import * as bottts from "@dicebear/bottts";
import * as funEmoji from "@dicebear/fun-emoji";
import * as lorelei from "@dicebear/lorelei";
import * as loreleiNeutral from "@dicebear/lorelei-neutral";
import * as personas from "@dicebear/personas";

const DICEBEAR_STYLE_MAP = {
  lorelei,
  "lorelei-neutral": loreleiNeutral,
  personas,
  "fun-emoji": funEmoji,
  adventurer,
  bottts,
};

export const DICEBEAR_STYLE_OPTIONS = [
  { value: "lorelei", label: "Lorelei" },
  { value: "lorelei-neutral", label: "Lorelei Neutral" },
  { value: "personas", label: "Personas" },
  { value: "fun-emoji", label: "Fun Emoji" },
  { value: "adventurer", label: "Adventurer" },
  { value: "bottts", label: "Bottts" },
];

const DEFAULT_STYLE = "lorelei";

function normalizeSeedPart(value) {
  return String(value ?? "").trim();
}

export function getInitials(name = "Account") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getDefaultAvatarSeed({ id, name, email, role } = {}) {
  return (
    [
      normalizeSeedPart(id),
      normalizeSeedPart(name),
      normalizeSeedPart(email),
      normalizeSeedPart(role),
    ]
      .filter(Boolean)
      .join("-") || "user"
  );
}

export function getDiceBearAvatarUrl({
  id,
  name,
  email,
  role,
  avatar_style,
  avatar_seed,
} = {}) {
  const seed = normalizeSeedPart(avatar_seed) || getDefaultAvatarSeed({ id, name, email, role });
  const styleKey = DICEBEAR_STYLE_MAP[avatar_style] ? avatar_style : DEFAULT_STYLE;
  const style = DICEBEAR_STYLE_MAP[styleKey];

  return createAvatar(style, {
    seed,
    radius: 50,
    size: 128,
    backgroundColor: ["1d4ed8", "0f766e", "7c3aed", "0f766e"],
  }).toDataUri();
}

export function getUserAvatarSrc(user) {
  return getDiceBearAvatarUrl(user);
}
