'use client';

import { useEffect, useState } from 'react';

import { APP_TIME_ZONE, nowMinutesInTz, todayInTz } from '@/lib/time';

const read = () => ({ today: todayInTz(APP_TIME_ZONE), nowMinutes: nowMinutesInTz(APP_TIME_ZONE) });

/** Today (`YYYY-MM-DD`) and minutes since midnight in Asia/Phnom_Penh, updated every minute. */
export function useNow() {
  const [now, setNow] = useState(read);
  useEffect(() => {
    // Tick right after each minute boundary, so the now line and "starts in" texts stay exact.
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setNow(read());
          schedule();
        },
        60_000 - (Date.now() % 60_000) + 50
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return now;
}
