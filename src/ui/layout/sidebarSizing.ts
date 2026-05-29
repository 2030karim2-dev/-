interface SidebarWidthOptions {
  breakpoint: string;
  isIPad: boolean;
  isTabletLandscape: boolean;
}

interface MainLayoutOffsetOptions extends SidebarWidthOptions {
  dir: 'rtl' | 'ltr';
  isCollapsed: boolean;
}

const isWideDesktop = (breakpoint: string): boolean =>
  breakpoint === '3xl' || breakpoint === '4xl' || breakpoint === '5xl';

/**
 * هل يجب أن تكون القائمة الجانبية موسعة بشكل دائم؟
 * على الشاشات الكبيرة (1920px+)، القائمة تكون موسعة افتراضياً.
 */
export const shouldPersistExpandedSidebar = (breakpoint: string): boolean => {
  return isWideDesktop(breakpoint);
};

export const getCollapsedSidebarWidth = ({
  breakpoint,
  isIPad,
  isTabletLandscape,
}: SidebarWidthOptions): 'w-40' | 'w-36' | 'w-32' | 'w-28' | 'w-24' | 'w-20' => {
  if (breakpoint === '5xl') return 'w-40';
  if (breakpoint === '4xl') return 'w-36';
  if (breakpoint === '3xl') return 'w-32';
  if (breakpoint === '2xl') return 'w-28';
  if (isIPad && isTabletLandscape) return 'w-24';
  return 'w-20';
};

export const getExpandedSidebarWidth = ({
  breakpoint,
  isIPad: _isIPad,
  isTabletLandscape: _isTabletLandscape,
}: SidebarWidthOptions): 'w-80' | 'w-72' | 'w-64' => {
  if (breakpoint === '5xl' || breakpoint === '4xl') return 'w-80';
  if (breakpoint === '3xl') return 'w-72';
  return 'w-64';
};

export const getMainLayoutOffsetClasses = ({
  breakpoint,
  dir,
  isCollapsed,
  isIPad,
  isTabletLandscape,
}: MainLayoutOffsetOptions): string => {
  const sharedOptions = { breakpoint, isIPad, isTabletLandscape };
  const width = isCollapsed
    ? getCollapsedSidebarWidth(sharedOptions)
    : getExpandedSidebarWidth(sharedOptions);

  if (dir === 'rtl') {
    return `md:mr-${width.split('-')[1]}`;
  }
  return `md:ml-${width.split('-')[1]}`;
};
