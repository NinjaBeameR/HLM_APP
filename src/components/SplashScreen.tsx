import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => { onFinish(); },
    });
    tl.fromTo(
      logoRef.current,
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
    ).to(
      logoRef.current,
      { opacity: 0, scale: 1.03, duration: 0.2, delay: 0.4, ease: 'power2.in' }
    );
  }, [onFinish]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div ref={logoRef} className="text-blue-700 text-2xl font-bold">HLM</div>
    </div>
  );
};