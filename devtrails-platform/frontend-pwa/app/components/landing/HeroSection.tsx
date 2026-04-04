import React from "react";
import Image from "next/image";

const platforms = [
  { name: "Swiggy", color: "#FC8019" },
  { name: "Zomato", color: "#E23744" },
  { name: "ONDC", color: "#14B8A6" },
  { name: "Dunzo", color: "#2563EB" },
  { name: "Blinkit", color: "#F59E0B" },
];

export function HeroSection() {
  return (
    <section
      id="home"
      className="hero-gradient relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28"
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Subtle glow spots */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-electric/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-[11px] font-semibold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              Live Protection Active
            </div>

            <h1 className="text-[2.6rem] md:text-[3.5rem] font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              Protect Your
              <br />
              Income.
              <br />
              <span className="text-electric">Every Shift.</span>
              <br />
              <span className="text-electric">Every Day.</span>
            </h1>

            <p className="text-white/50 text-base md:text-lg max-w-[400px] mb-10 leading-relaxed">
              Automatic income protection for delivery partners. When
              disruptions happen, we compensate your lost earnings instantly.
            </p>

            <div className="flex flex-wrap gap-3 mb-14">
              <a
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-electric hover:bg-electric-600 text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors"
                id="cta-get-protected"
              >
                Protect My Income
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors"
                id="cta-learn-more"
              >
                Learn How It Works
              </a>
            </div>

            {/* Platform logos — realistic wordmarks */}
            <div>
              <p className="text-white/25 text-[11px] uppercase tracking-widest font-medium mb-4">
                Verified on platforms
              </p>
              <div className="flex items-center gap-7 flex-wrap">
                {platforms.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center group opacity-50 hover:opacity-100 transition-opacity drop-shadow-md"
                  >
                    <svg
                      height="24"
                      width="auto"
                      viewBox={`0 0 ${p.name.length * 14} 24`}
                      className="h-5 md:h-6 w-auto"
                      style={{ fill: p.color }}
                    >
                      <text
                        x="0"
                        y="18"
                        fontFamily="Arial, Helvetica, sans-serif"
                        fontWeight="900"
                        fontStyle={p.name === "Zomato" ? "italic" : "normal"}
                        fontSize="18"
                        letterSpacing={p.name === "ONDC" ? "1" : "-0.5"}
                      >
                        {p.name === "Swiggy"
                          ? "SWIGGY"
                          : p.name === "ONDC"
                            ? "ONDC"
                            : p.name.toLowerCase()}
                      </text>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Rider Illustration */}
          <div className="hidden lg:flex relative justify-center items-center w-full h-[600px]">
            {/* Soft backdrop glow to make image pop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-electric/20 rounded-full blur-[100px] pointer-events-none" />

            <div
              className="relative z-10 w-full h-full flex justify-center items-center"
              style={{
                maskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 80%)",
              }}
            >
              <Image
                src="/images/delivery-rider.png"
                alt="Delivery partner on a scooter"
                width={550}
                height={550}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
