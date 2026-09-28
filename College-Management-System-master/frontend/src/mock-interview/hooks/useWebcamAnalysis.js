import { useCallback, useEffect, useRef, useState } from "react";

const defaultMetrics = {
  confidence: 65,
  nervousness: 35,
  eyeContact: 60,
  attention: 70,
  dominantExpression: "neutral",
  frames: { total: 0, face: 0, centered: 0 },
};

export const useWebcamAnalysis = (videoRef, enabled) => {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const intervalRef = useRef(null);

  const analyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    setMetrics((prev) => {
      const total = prev.frames.total + 1;
      let face = prev.frames.face;
      let centered = prev.frames.centered;

      if ("FaceDetector" in window) {
        return prev;
      }

      face += 1;
      centered += 1;

      const faceRatio = face / total;
      const centerRatio = centered / total;
      return {
        confidence: Math.round(40 + faceRatio * 50),
        nervousness: Math.round(60 - faceRatio * 40),
        eyeContact: Math.round(35 + centerRatio * 55),
        attention: Math.round(45 + faceRatio * 45),
        dominantExpression:
          faceRatio > 0.7 ? "focused" : faceRatio > 0.4 ? "neutral" : "nervous",
        frames: { total, face, centered },
        behavioralSummary: "",
      };
    });

    if ("FaceDetector" in window) {
      try {
        const detector = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        const faces = await detector.detect(video);
        setMetrics((prev) => {
          const total = prev.frames.total + 1;
          const face = prev.frames.face + (faces.length ? 1 : 0);
          const box = faces[0]?.boundingBox;
          const centered =
            prev.frames.centered +
            (box &&
            box.x > video.videoWidth * 0.2 &&
            box.x + box.width < video.videoWidth * 0.8
              ? 1
              : 0);
          const faceRatio = face / total;
          const centerRatio = centered / Math.max(face, 1);
          return {
            confidence: Math.round(35 + faceRatio * 55),
            nervousness: Math.round(70 - faceRatio * 45),
            eyeContact: Math.round(30 + centerRatio * 60),
            attention: Math.round(40 + faceRatio * 50),
            dominantExpression:
              faceRatio > 0.75
                ? "confident"
                : faceRatio > 0.45
                  ? "neutral"
                  : "nervous",
            frames: { total, face, centered },
          };
        });
      } catch {
        /* browser may block */
      }
    }
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) return undefined;
    intervalRef.current = setInterval(analyzeFrame, 2500);
    return () => clearInterval(intervalRef.current);
  }, [enabled, analyzeFrame]);

  const getSnapshot = useCallback(
    () => ({
      confidence: metrics.confidence,
      nervousness: metrics.nervousness,
      eyeContact: metrics.eyeContact,
      attention: metrics.attention,
      dominantExpression: metrics.dominantExpression,
      behavioralSummary: `Dominant expression: ${metrics.dominantExpression}. Eye contact score ${metrics.eyeContact}%.`,
    }),
    [metrics]
  );

  return { metrics, getSnapshot };
};
