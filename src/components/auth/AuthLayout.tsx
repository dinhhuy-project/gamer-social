"use client";

import { useState } from "react";

import Image from "next/image";

import Link from "next/link";

import { ReactNode } from "react";

import { useAuthActions } from "@/hooks/auth/useAuthActions";

interface AuthLayoutProps {
  title: ReactNode;

  subtitle: string;

  children: ReactNode;

  footerText: string;

  footerLinkText: string;

  footerLinkTo: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  const { signInWithGoogle, isLoading } = useAuthActions();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-orange-600 via-orange-950 to-black p-4">
      <div className="w-full max-w-5xl bg-[#1e2128] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left Side */}
        <div className="hidden md:block w-1/2 relative bg-black">
          <Image
            src="/images/fiery_magma_dragon.png"
            alt="Fiery Magma Dragon"
            fill
            priority
            className="object-cover opacity-90"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1e2128]/80 pointer-events-none" />
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm space-y-6 md:space-y-8">
            {/* Header */}
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
                {title}
              </h1>

              <p className="text-gray-400 text-sm">
                {subtitle}
              </p>
            </div>

            {/* Form Content */}
            {children}

            {/* Divider */}
            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1e2128] px-3 text-gray-400 font-medium">
                  Or
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isLoading}
                className="w-full bg-[#2b2f3a] hover:bg-[#363b47] disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors p-3 rounded-xl
                     inline-flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-white" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />

                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />

                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />

                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-gray-200 font-medium">
                  {isLoading ? "Đang chuyển hướng..." : "Continue with Google"}
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <span className="text-gray-400 text-sm">
                {footerText}{" "}
              </span>

              <Link
                href={footerLinkTo}
                className="text-[#f46d1b] text-sm hover:underline font-medium"
              >
                {footerLinkText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}