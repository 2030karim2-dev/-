import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type BreakpointKey = keyof typeof BREAKPOINTS;

export const useBreakpoint = (breakpoint: BreakpointKey): boolean => {
  const [isAbove, setIsAbove] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsAbove(window.innerWidth >= BREAKPOINTS[breakpoint]);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isAbove;
};
