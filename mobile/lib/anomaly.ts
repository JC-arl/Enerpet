// src/lib/anomaly.ts
export function detectAnomaly(heartRate: number, steps: number) {
  // 간단한 규칙 기반 (MVP용)
  if (heartRate > 120 && steps < 10) {
    return { isAnomaly: true, type: "심박수 급등" };
  } else if (heartRate < 45 && steps === 0) {
    return { isAnomaly: true, type: "심박수 저하" };
  } else if (steps === 0 && heartRate < 60) {
    return { isAnomaly: true, type: "움직임 없음" };
  } else {
    return { isAnomaly: false };
  }
}
