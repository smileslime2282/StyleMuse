
"use client";

import { useEffect, useRef, useState } from "react";

type Hairstyle = "waves" | "bob" | "curls";

export default function LiveMirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<Hairstyle>("waves");
  const [error, setError] = useState("");

  function drawHair(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) {
    const top = landmarks[10];
    const left = landmarks[127];
    const right = landmarks[356];
    const chin = landmarks[152];

    if (!top || !left || !right || !chin) return;

    const x = (left.x + right.x) * width / 2;
    const y = top.y * height;
    const faceWidth = Math.abs(right.x - left.x) * width;
    const faceHeight = Math.abs(chin.y - top.y) * height;

    const headWidth = faceWidth * 1.55;
    const headHeight = faceHeight * 1.35;

    ctx.save();
    ctx.fillStyle = "#30201d";
    ctx.strokeStyle = "#1c1110";
    ctx.lineWidth = 3;

    ctx.beginPath();

    if (style === "bob") {
      ctx.ellipse(
        x,
        y + headHeight * 0.63,
        headWidth * 0.55,
        headHeight * 0.72,
        0,
        Math.PI,
        Math.PI * 2
      );
      ctx.lineTo(x + headWidth * 0.55, y + headHeight * 1.65);
      ctx.quadraticCurveTo(
        x,
        y + headHeight * 1.85,
        x - headWidth * 0.55,
        y + headHeight * 1.65
      );
    } else {
      ctx.ellipse(
        x,
        y + headHeight * 0.65,
        headWidth * 0.62,
        headHeight * 0.78,
        0,
        Math.PI,
        Math.PI * 2
      );
      ctx.lineTo(
        x + headWidth * 0.62,
        y + headHeight * (style === "curls" ? 2.1 : 2.3)
      );

      if (style === "curls") {
        for (let i = 0; i < 12; i++) {
          const side = i < 6 ? 1 : -1;
          const offset = (i % 6) / 6;
          const px = x + side * headWidth * (0.5 + offset * 0.12);
          const py = y + headHeight * (0.9 + offset * 1.1);
          ctx.quadraticCurveTo(
            px + side * 18,
            py + 12,
            px,
            py + 30
          );
        }
      }

      ctx.lineTo(x - headWidth * 0.62, y + headHeight * 2.3);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hairline and top volume
    ctx.beginPath();
    ctx.ellipse(
      x,
      y + headHeight * 0.52,
      headWidth * 0.53,
      headHeight * 0.42,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.fillStyle = "#402824";
    ctx.fill();

    if (style === "waves") {
      ctx.strokeStyle = "#765047";
      ctx.lineWidth = 4;

      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * headWidth * 0.13, y + headHeight * 0.3);
        ctx.bezierCurveTo(
          x + i * headWidth * 0.2,
          y + headHeight,
          x + i * headWidth * 0.1,
          y + headHeight * 1.5,
          x + i * headWidth * 0.22,
          y + headHeight * 2.1
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  async function startCamera() {
    setError("");
    setLoading(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        throw new Error("Camera elements are not ready.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const vision = await import("@mediapipe/tasks-vision");

      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
      );

      let landmarker;

      try {
        landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          }
        );
      } catch {
        landmarker = await vision.FaceLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numFaces: 1
          }
        );
      }

      landmarkerRef.current = landmarker;
      setActive(true);
      setLoading(false);

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported.");

      const render = () => {
        if (!video || !canvas || !landmarkerRef.current) return;

        if (video.readyState >= 2) {
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          ctx.clearRect(0, 0, width, height);

          const result = landmarkerRef.current.detectForVideo(
            video,
            performance.now()
          );

          if (result.faceLandmarks?.length) {
            drawHair(ctx, result.faceLandmarks[0], width, height);
          }
        }

        frameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (err: any) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setActive(false);
      setLoading(false);
      setError(
        err?.message || "Camera could not be started. Check camera permission."
      );
    }
  }

  function stopCamera() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setActive(false);
  }

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      landmarkerRef.current?.close?.();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <section className="my-8 rounded-2xl border border-gray-200 p-4">
      <h2 className="mb-2 text-2xl font-bold">StyleMuse Live Mirror</h2>
      <p className="mb-4 text-sm text-gray-500">
        See an illustrative hairstyle overlay that follows your face.
      </p>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        />

        {!active && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Camera preview
          </div>
        )}
      </div>

      <div className="my-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStyle("waves")}
          className={`rounded-full px-4 py-2 ${style === "waves" ? "bg-black text-white" : "bg-gray-100 text-black"}`}
        >
          Long waves
        </button>
        <button
          onClick={() => setStyle("bob")}
          className={`rounded-full px-4 py-2 ${style === "bob" ? "bg-black text-white" : "bg-gray-100 text-black"}`}
        >
          Bob
        </button>
        <button
          onClick={() => setStyle("curls")}
          className={`rounded-full px-4 py-2 ${style === "curls" ? "bg-black text-white" : "bg-gray-100 text-black"}`}
        >
          Curls
        </button>
      </div>

      {!active ? (
        <button
          onClick={startCamera}
          disabled={loading}
          className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Starting camera..." : "Start Live Mirror"}
        </button>
      ) : (
        <button
          onClick={stopCamera}
          className="w-full rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
        >
          Stop camera
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        This is an illustrative 2D overlay, not a photorealistic hairstyle simulation.
        Camera access requires your permission.
      </p>
    </section>
  );
}
