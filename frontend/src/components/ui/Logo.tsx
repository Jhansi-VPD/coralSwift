import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSponsored?: boolean;
  asLink?: boolean;
}

export function Logo({
  className,
  size = 'md',
  showSponsored = false,
  asLink = false,
}: LogoProps) {
  const dimensions = {
    sm: { width: 140, height: 48, className: 'h-9 w-auto' },
    md: { width: 180, height: 60, className: 'h-11 w-auto' },
    lg: { width: 220, height: 74, className: 'h-14 w-auto' },
    xl: { width: 280, height: 94, className: 'h-20 w-auto' },
  };

  const selectedDim = dimensions[size];

  const LogoContent = (
    <div className={cn('flex flex-col select-none group', className)}>
      <div className="flex items-center">
        <img
          src="/logo.jpg"
          alt="CoralSwift Technologies"
          className={cn('object-contain max-w-full transition-transform duration-300 group-hover:scale-[1.02]', selectedDim.className)}
        />
      </div>
      {showSponsored && (
        <span className="text-[10px] sm:text-[11px] font-sans tracking-normal text-slate-500 font-medium mt-1 flex items-center gap-1.5">
          <span className="text-slate-500">Officially Partnered by</span>
          <span className="font-semibold text-slate-900 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200">
            VPD Technologies
          </span>
        </span>
      )}
    </div>
  );

  if (asLink) {
    return <Link href="/" className="inline-block">{LogoContent}</Link>;
  }

  return LogoContent;
}
