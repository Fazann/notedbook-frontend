import { useMediaQuery } from './use-media-query';

const MOBILE_BREAKPOINT = 768;

/** Used by the shadcn Sidebar: below `md` it renders as a Sheet. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
