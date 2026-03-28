"use client";
import { ReactNode } from "react";

interface BorderRotateProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function BorderRotate({ children, active = false, className = "" }: BorderRotateProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative p-[2px] rounded-[26px] card-border-spinning ${className}`}
    >
      <div className="relative rounded-[24px] bg-white w-full h-full">
        {children}
      </div>
    </div>
  );
}
