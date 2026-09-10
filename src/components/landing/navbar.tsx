"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Kas<span className="text-emerald-600 dark:text-emerald-400">Toko</span>
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hidden sm:inline-flex">
                  POS Ritel SaaS
                </Badge>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1 hidden sm:block">
                Platform Kasir & Stok UMKM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#fitur" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Fitur Toko
            </a>
            <a href="#keunggulan" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Keunggulan
            </a>
            <a href="#ai-assistant" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Chat AI</span>
            </a>
            <a href="#harga" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Paket Harga
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Quick Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Button asChild variant="ghost" className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600">
              <Link href="/login">Masuk Toko</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 text-sm font-semibold rounded-lg">
              <Link href="/register?plan=trial">
                Coba Gratis 7 Hari
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2 text-base font-medium text-slate-700 dark:text-slate-200">
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Fitur Toko
            </a>
            <a
              href="#keunggulan"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Keunggulan
            </a>
            <a
              href="#ai-assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Chat AI Analis
            </a>
            <a
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Paket Harga
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link href="/login">Masuk Toko</Link>
            </Button>
            <Button asChild className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/register?plan=trial">Coba Gratis 7 Hari</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
