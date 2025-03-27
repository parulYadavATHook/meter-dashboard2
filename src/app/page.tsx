// import Image from "next/image";
// import Chart from "../../components/chart";
// import IndiaMapVisualization from "../../components/d3-india-map";

// export default function Home() {
//   return (
//     <>
//       <Chart />
//       <IndiaMapVisualization />
//     </>
//   );
// }

"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import Link from "next/link";

export default function Home() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 1 } });
  //   // Animate heading from above with fade-in
  //   tl.from(headingRef.current, { y: -50, opacity: 0 })
  //     // Animate button container from below with fade-in
  //     .from(buttonContainerRef.current, { y: 30, opacity: 0 }, "-=0.5")
  //     // Animate image element scaling and fade-in
  //     .from(
  //       imageRef.current,
  //       { scale: 0.8, opacity: 0, duration: 1.5 },
  //       "-=0.5"
  //     );

  //   // Subtle 3D rotation on the heading (continuous)
  //   gsap.to(headingRef.current, {
  //     scale: 1.05,
  //     yoyo: true,
  //     repeat: -1,
  //     duration: 2,
  //     ease: "power1.inOut",
  //   });
    
  // }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200 p-4">
      <header className="text-center">
        <h1
          ref={headingRef}
          className="text-5xl md:text-7xl font-extrabold text-gray-800 mb-8"
        >
          Visualize Meter Data With
        </h1>
      </header>
      <div
        ref={buttonContainerRef}
        className="flex flex-col md:flex-row gap-6 items-center"
      >

        <Link
          href="/maps"
          className="px-12 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-blue-100 hover:text-black transition duration-300 tracking-[2]"
        >
          Maps
        </Link>
        <Link
          href="/charts"
          className="px-12 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-100 hover:text-black transition duration-300 tracking-[2]"
        >
          Charts
        </Link>
      </div>
      <div ref={imageRef} className="mt-24">
        {/* 3D-inspired element: a pseudo-3D rotating block */}
        <div className="w-60 h-60 relative perspective-1000">
          <div className="absolute inset-0 transform rotate-x-12 rotate-y-12 bg-gradient-to-r from-blue-200 to-blue-400 shadow-2xl rounded-lg"></div>
        </div>
      </div>
      <footer className="absolute bottom-4 right-4 text-sm text-gray-600">
        Made with{" "}
        <span role="img" aria-label="heart">
          ❤️
        </span>{" "}
        by Parul Yadav
      </footer>
    </div>
  );
}
