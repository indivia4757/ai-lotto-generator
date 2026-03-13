"use client";

import { cn } from "@/lib/utils";

function getBallColor(num: number): string {
  if (num <= 10) return "bg-yellow-400 text-yellow-900";
  if (num <= 20) return "bg-blue-500 text-white";
  if (num <= 30) return "bg-red-500 text-white";
  if (num <= 40) return "bg-gray-600 text-white";
  return "bg-green-500 text-white";
}

interface LottoBallProps {
  number: number;
  size?: "sm" | "md" | "lg";
  bonus?: boolean;
  highlight?: boolean;
}

export function LottoBall({ number, size = "md", bonus, highlight }: LottoBallProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold shadow-md",
        sizeClasses[size],
        getBallColor(number),
        bonus && "ring-2 ring-offset-2 ring-purple-500",
        highlight && "ring-2 ring-offset-2 ring-yellow-400 animate-pulse"
      )}
    >
      {number}
    </div>
  );
}

interface LottoBallSetProps {
  numbers: number[];
  bonusNumber?: number;
  size?: "sm" | "md" | "lg";
  highlightNumbers?: number[];
}

export function LottoBallSet({ numbers, bonusNumber, size = "md", highlightNumbers = [] }: LottoBallSetProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {numbers.map((num, i) => (
        <LottoBall
          key={i}
          number={num}
          size={size}
          highlight={highlightNumbers.includes(num)}
        />
      ))}
      {bonusNumber !== undefined && (
        <>
          <span className="text-muted-foreground mx-1">+</span>
          <LottoBall number={bonusNumber} size={size} bonus />
        </>
      )}
    </div>
  );
}
