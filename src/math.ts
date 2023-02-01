import { max, min } from "mathjs";

export function clamp(value: number, minimum: number, maximum: number) {
    return max(min(value, maximum), minimum);
  }