import { useLayoutEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.05, // Opacity awal (hampir transparan)
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  rotationEnd = "bottom bottom",
  wordAnimationEnd = "bottom bottom"
}) => {
  const containerRef = useRef(null);

  // Logika pemecah kata yang lebih aman
  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      // Jika spasi, biarkan sebagai spasi biasa
      if (word.match(/^\s+$/)) return " "; 
      // Jika kata, bungkus dengan span untuk animasi
      return (
        <span className="scroll-reveal-word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Bersihkan animasi lama jika ada (cleanup)
    let ctx = gsap.context(() => {
      const scroller =
        scrollContainerRef && scrollContainerRef.current
          ? scrollContainerRef.current
          : window;

      // 1. Animasi Container (Rotasi halus)
      gsap.fromTo(
        el,
        { rotate: baseRotation, transformOrigin: '0% 50%' },
        {
          rotate: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom', 
            end: rotationEnd,
            scrub: 1, // Smooth scrubbing
          },
        }
      );

      // 2. Animasi Kata (Muncul & Fokus)
      const words = el.querySelectorAll('.scroll-reveal-word');
      
      gsap.fromTo(
        words,
        { 
          opacity: baseOpacity, 
          filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
          y: 20 // Sedikit efek naik dari bawah
        },
        {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          duration: 1,
          stagger: 0.1, // Jeda antar kata
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top 85%', // Mulai saat elemen masuk 15% dari bawah layar
            end: wordAnimationEnd,
            scrub: 1,
          },
        }
      );
    }, containerRef); // Scope selector ke ref ini saja

    return () => ctx.revert(); // Hapus animasi saat unmount
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    // Menggunakan DIV agar tidak merusak ukuran font bawaan browser (seperti h2/h1)
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      <div className={`${textClassName} inline-block leading-tight`}>
        {typeof children === 'string' ? splitText : children}
      </div>
    </div>
  );
};

export default ScrollReveal;