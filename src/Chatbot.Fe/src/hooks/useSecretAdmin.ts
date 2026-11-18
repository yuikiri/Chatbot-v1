import { useRef } from "react";

/**
 * Hook nhận diện thao tác chạm/click liên tiếp bí mật (Secret Multi-Tap Gesture)
 * Mặc định: Nhấp 3 lần trong vòng 1.5 giây để kích hoạt callback
 */
export function useSecretAdmin(onTrigger?: () => void, targetTaps = 3, timeoutMs = 1500) {
  const tapCountRef = useRef(0);
  const timerRef = useRef<any>(null);

  const handleTap = () => {
    if (!onTrigger) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    tapCountRef.current += 1;

    if (tapCountRef.current >= targetTaps) {
      tapCountRef.current = 0;
      onTrigger();
    } else {
      timerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, timeoutMs);
    }
  };

  return handleTap;
}
