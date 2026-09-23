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
  useImageOnly?: boolean;
}

export function Logo({
  className,
  size = 'md',
  showSponsored = false,
  showTagline = true,
  variant = 'light',
  asLink = false,
  useImageOnly = false,
}: LogoProps) {
  const isDark = variant === 'dark';

  const dimensions = {
    sm: {
      markClass: 'h-5 w-auto mb-0.5',
      titleClass: 'text-[11px] font-black tracking-tight',
      taglineClass: 'text-[7.5px] tracking-[0.2em] font-bold mt-0.5',
      imageClass: 'h-7 w-auto',
    },
    md: {
      markClass: 'h-6 sm:h-7 w-auto mb-0.5',
      titleClass: 'text-[13px] sm:text-[14px] font-black tracking-tight',
      taglineClass: 'text-[8.5px] sm:text-[9px] tracking-[0.22em] font-extrabold mt-0.5',
      imageClass: 'h-9 sm:h-10 w-auto',
    },
    lg: {
      markClass: 'h-9 sm:h-10 w-auto mb-1',
      titleClass: 'text-base sm:text-lg font-black tracking-tight',
      taglineClass: 'text-[10px] tracking-[0.25em] font-extrabold mt-0.5',
      imageClass: 'h-12 sm:h-13 w-auto',
    },
    xl: {
      markClass: 'h-12 sm:h-14 w-auto mb-1',
      titleClass: 'text-xl sm:text-2xl font-black tracking-tight',
      taglineClass: 'text-[12px] tracking-[0.3em] font-extrabold mt-1',
      imageClass: 'h-15 sm:h-16 w-auto',
    },
  };

  const selectedDim = dimensions[size];

  const VectorLogoContent = (
    <div className={cn('flex flex-col items-center justify-center text-center select-none group', className)}>
      <img
        src="/images/coralswift_mark.png"
        alt="CoralSwift Icon"
        decoding="async"
        loading="eager"
        className={cn(
          'object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-sm',
          selectedDim.markClass
        )}
      />
      <div className="flex flex-col items-center justify-center leading-none">
        <div className={cn('flex items-center leading-none', selectedDim.titleClass)}>
          <span className={isDark ? 'text-white' : 'text-slate-950'}>Coral</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-500 via-coral-600 to-amber-500">
            Swift
          </span>
        </div>
        {showTagline && (
          <div
            className={cn(
              'font-mono uppercase select-none leading-none tracking-widest antialiased',
              selectedDim.taglineClass,
              isDark ? 'text-coral-400' : 'text-slate-500'
            )}
          >
            TECHNOLOGIES
          </div>
        )}
        {showSponsored && (
          <span className="text-[9px] font-sans tracking-normal text-slate-500 font-medium mt-1 flex items-center gap-1">
            <span>Partnered by</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
              VPD
            </span>
          </span>
        )}
      </div>
    </div>
  );

  const ImageLogoContent = (
    <div className={cn('flex flex-col items-center justify-center text-center select-none group', className)}>
      <div className="flex items-center justify-center">
        <img
          src="/images/coralswift_logo_crisp.png"
          alt="CoralSwift Technologies"
          decoding="async"
          loading="eager"
          className={cn(
            'object-contain max-w-full transition-transform duration-300 group-hover:scale-[1.02] [image-rendering:-webkit-optimize-contrast]',
            selectedDim.imageClass
          )}
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      {showTagline && (
        <div
          className={cn(
            'font-mono uppercase select-none leading-tight flex items-center justify-center tracking-widest antialiased',
            selectedDim.taglineClass
          )}
          style={{
            color: isDark ? '#FF6B50' : '#0B1426',
            letterSpacing: '0.25em',
          }}
        >
          <span>TECHNOLOGIES</span>
        </div>
      )}
      {showSponsored && (
        <span className="text-[10px] font-sans tracking-normal text-slate-600 font-medium mt-1 flex items-center justify-center gap-1">
          <span className="text-slate-600 font-semibold">Partnered by</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            VPD
          </span>
        </span>
      )}
    </div>
  );

  const LogoContent = useImageOnly ? ImageLogoContent : VectorLogoContent;

  if (asLink) {
    return (
      <Link href="/" className="inline-block">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
