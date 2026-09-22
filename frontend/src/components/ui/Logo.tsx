import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSponsored?: boolean;
  showTagline?: boolean;
  variant?: 'light' | 'dark';
  asLink?: boolean;
}

export function Logo({
  className,
  size = 'md',
  showSponsored = false,
  showTagline = false,
  variant = 'light',
  asLink = false,
}: LogoProps) {
  const dimensions = {
    sm: {
      imageClass: 'h-8 sm:h-9 w-auto',
      taglineClass: 'text-[11px] tracking-[0.28em] mt-0.5 font-bold',
    },
    md: {
      imageClass: 'h-10 sm:h-11 w-auto',
      taglineClass: 'text-[12px] sm:text-[13px] tracking-[0.3em] mt-1 font-extrabold',
    },
    lg: {
      imageClass: 'h-13 sm:h-14 w-auto',
      taglineClass: 'text-[14px] tracking-[0.32em] mt-1 font-extrabold',
    },
    xl: {
      imageClass: 'h-16 sm:h-18 w-auto',
      taglineClass: 'text-[16px] tracking-[0.35em] mt-1.5 font-extrabold',
    },
  };

  const selectedDim = dimensions[size];
  const isDark = variant === 'dark';

  const LogoContent = (
    <div className={cn('flex flex-col select-none group', className)}>
      <div className="flex items-center">
        <img
          src="/images/coralswift_logo_2.png"
          alt="CoralSwift Technologies"
          className={cn('object-contain max-w-full transition-transform duration-300 group-hover:scale-[1.02]', selectedDim.imageClass)}
        />
      </div>
      {showTagline && (
        <div
          className={cn(
            'font-mono uppercase select-none leading-tight flex items-center tracking-widest antialiased',
            selectedDim.taglineClass
          )}
          style={{
            color: isDark ? '#FF6B50' : '#0B1426',
            letterSpacing: '0.3em',
          }}
          aria-label="TECHNOLOGIES"
        >
          <span>TECHNOLOGIES</span>
        </div>
      )}
      {showSponsored && (
        <span className="text-[11px] font-sans tracking-normal text-slate-600 font-medium mt-1.5 flex items-center gap-1.5">
          <span className="text-slate-600 font-semibold">Officially Partnered by</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
