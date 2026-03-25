import { twMerge } from "tailwind-merge";

// You can use this function whenever you need to conditionally join Tailwind classes
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(" "));
}