'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useConsultation } from '@/components/ui/ConsultationContext';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openConsultation } = useConsultation();
  const pathname = usePathname();

  // Do not show public navbar in admin dashboard
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAdmin) return null;

  const navLinks: { name: string; href: string; badge?: string }[] = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 py-3 shadow-md'
          : 'bg-white border-b border-slate-200/60 py-4 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" showSponsored={false} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 py-1 ${
                    isActive
                      ? 'text-coral-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-coral-500/10 text-coral-600 border border-coral-500/20 font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={() => openConsultation()}>
              <span>Book Consultation</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="primary" size="sm" className="text-xs px-3" onClick={() => openConsultation()}>
              Consult
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-white border-b border-slate-200 backdrop-blur-2xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-base font-medium text-slate-800 hover:text-brand-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
              >
                <span>{link.name}</span>
                {link.badge ? (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-coral-500/15 text-coral-600 font-bold">
                    {link.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-slate-200 flex flex-col gap-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openConsultation();
                }}
              >
                Book Architecture Consultation
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
