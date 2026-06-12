"use client";

import { useEffect } from "react";

// 퍼블리셔 ID(ca-pub-…)와 슬롯 ID가 모두 설정돼 있을 때만 광고를 렌더한다.
// AdSense 승인 전에는 env 미설정 → 아무것도 표시되지 않음(에러 없음).
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

type AdSlotProps = {
  slot?: string;
  className?: string;
  format?: string;
  responsive?: boolean;
};

export function AdSlot({
  slot,
  className,
  format = "auto",
  responsive = true,
}: AdSlotProps) {
  const enabled = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    if (!enabled) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch (error) {
      console.error("AdSense push failed:", error);
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
