import React from "react";
import Image from "next/image";

export function HeroSection() {
  return (
    <section id="home" className="hero-gradient relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-electric/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            {/* Status pill */}
            <div className="status-pill status-pill-active mb-8 w-fit">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              LIVE PROTECTION ACTIVE
            </div>

            {/* Headline */}
            <h1 className="text-hero-sm md:text-hero text-white mb-6">
              Protect Your{" "}
              <br />
              Income.{" "}
              <br className="hidden md:block" />
              <span className="text-electric">Every Shift.</span>
              <br />
              <span className="text-electric">Every Day.</span>
            </h1>

            {/* Subtext */}
            <p className="text-white/60 text-base md:text-lg max-w-md mb-10 leading-relaxed">
              Our system automatically compensates income loss during disruptions. Focus on the road, we&apos;ll handle the risk.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <a href="#protection" className="btn-primary" id="cta-get-protected">
                Get Protected Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#how-it-works" className="btn-secondary" id="cta-learn-more">
                Learn How It Works
              </a>
            </div>
          </div>

          {/* Right — Rider Illustration */}
          <div className="hidden lg:flex justify-center animate-slide-in-right">
            <div className="relative animate-float">
              <Image
                src="/images/delivery-rider.png"
                alt="Delivery partner on a scooter"
                width={440}
                height={440}
                className="object-contain drop-shadow-2xl"
                priority
              />
              {/* Decorative ring */}
              <div className="absolute -inset-8 border border-white/5 rounded-full" />
              <div className="absolute -inset-16 border border-white/[0.03] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
