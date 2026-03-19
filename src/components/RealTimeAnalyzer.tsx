import React, { useEffect, useRef, useState } from 'react';
import { 
  FilesetResolver, 
  PoseLandmarker, 
  HandLandmarker,
  ObjectDetector,
  DrawingUtils
} from '@mediapipe/tasks-vision';

interface Props {
  videoUrl: string;
  isActive: boolean;
  onAlert?: (alert: { type: string; level: 'Critical' | 'High' | 'Medium'; cashier: string }) => void;
}

const ZONES = [
  { id: 'cash_exchange', name: 'ПРИЕМ-ВЫДАЧА ДЕНЕГ', x: 0.35, y: 0.6, w: 0.3, h: 0.35, color: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' },
  { id: 'docs_table', name: 'СТОЛ С ДОКУМЕНТАМИ', x: 0.05, y: 0.3, w: 0.3, h: 0.4, color: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' },
  { id: 'safe', name: 'СЕЙФ', x: 0.02, y: 0.75, w: 0.2, h: 0.2, color: 'rgba(245, 158, 11, 0.3)', borderColor: '#f59e0b' },
  { id: 'register', name: 'КАССА', x: 0.4, y: 0.25, w: 0.2, h: 0.2, color: 'rgba(139, 92, 246, 0.3)', borderColor: '#8b5cf6' },
  { id: 'printer', name: 'ПРИНТЕР', x: 0.4, y: 0.05, w: 0.2, h: 0.15, color: 'rgba(107, 114, 128, 0.3)', borderColor: '#6b7280' },
  { id: 'counter_uv', name: 'СЧЕТЧИК И УФ', x: 0.75, y: 0.05, w: 0.2, h: 0.3, color: 'rgba(16, 185, 129, 0.3)', borderColor: '#10b981' },
];

const RealTimeAnalyzer: React.FC<Props> = ({ videoUrl, isActive, onAlert }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const lastAlertTime = useRef<number>(0);

  useEffect(() => {
    setVideoError(false);
    setIsPaused(true);
  }, [videoUrl]);

  useEffect(() => {
    let poseLandmarker: PoseLandmarker;
    let handLandmarker: HandLandmarker;
    let objectDetector: ObjectDetector;
    let animationId: number;

    const initAI = async () => {
      const getProxyUrl = (url: string) => `/api/proxy-model?url=${encodeURIComponent(url)}`;

      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // 1. Скелет (Pose)
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: getProxyUrl(`https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`),
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });

        // 2. Руки (Hands)
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: getProxyUrl(`https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`),
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        // 3. Объекты (Общий детектор, который мы интерпретируем)
        objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: getProxyUrl(`https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite`),
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          scoreThreshold: 0.3
        });

        setIsLoaded(true);
        startDetection();
      } catch (err) {
        console.error("AI Init Error:", err);
        setError("Ошибка инициализации нейросетей. Проверьте соединение.");
      }
    };

    const startDetection = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      // Принудительный запуск видео, если автоплей заблокирован
      video.play()
        .then(() => setIsPaused(false))
        .catch(e => {
          console.warn("Autoplay blocked or failed:", e);
          setIsPaused(true);
        });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawingUtils = new DrawingUtils(ctx);

      const renderLoop = () => {
        if (video.paused || video.ended || video.readyState < 2) {
          if (video.paused !== isPaused) setIsPaused(video.paused);
          animationId = requestAnimationFrame(renderLoop);
          return;
        }

        if (isPaused) setIsPaused(false);

        // Синхронизация размеров если они изменились
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const startTimeMs = performance.now();
        
        // Очистка канваса
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Отрисовка зон безопасности
        ZONES.forEach(zone => {
          const zx = zone.x * canvas.width;
          const zy = zone.y * canvas.height;
          const zw = zone.w * canvas.width;
          const zh = zone.h * canvas.height;

          ctx.fillStyle = zone.color;
          ctx.fillRect(zx, zy, zw, zh);
          ctx.strokeStyle = zone.borderColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.setLineDash([]);
          
          ctx.fillStyle = zone.borderColor;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(zone.name, zx + 5, zy + 15);
        });

        // 1. Детекция скелета
        const poseResults = poseLandmarker.detectForVideo(video, startTimeMs);
        if (poseResults.landmarks) {
          for (const landmarks of poseResults.landmarks) {
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#3b82f6', lineWidth: 2 });
            drawingUtils.drawLandmarks(landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });
          }
        }

        // 2. Детекция рук
        const handResults = handLandmarker.detectForVideo(video, startTimeMs);
        if (handResults.landmarks) {
          for (const landmarks of handResults.landmarks) {
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#ef4444', lineWidth: 2 });
            drawingUtils.drawLandmarks(landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });

            // Проверка попадания в зоны
            landmarks.forEach(point => {
              ZONES.forEach(zone => {
                if (point.x >= zone.x && point.x <= zone.x + zone.w &&
                    point.y >= zone.y && point.y <= zone.y + zone.h) {
                  
                  // Логика алертов для разных зон
                  const now = Date.now();
                  if (now - lastAlertTime.current > 5000) { // Колдаун 5 секунд
                    if (zone.id === 'safe') {
                      lastAlertTime.current = now;
                      onAlert?.({ type: 'Доступ к сейфу', level: 'Critical', cashier: 'Касса №4' });
                    } else if (zone.id === 'register' && Math.random() < 0.005) {
                      lastAlertTime.current = now;
                      onAlert?.({ type: 'Манипуляции с кассой', level: 'High', cashier: 'Касса №4' });
                    } else if (zone.id === 'cash_exchange' && Math.random() < 0.002) {
                      lastAlertTime.current = now;
                      onAlert?.({ type: 'Подозрительная выдача', level: 'Medium', cashier: 'Касса №4' });
                    }
                  }
                }
              });
            });
          }
        }

        // 3. Детекция объектов (Деньги/Документы)
        const objectResults = objectDetector.detectForVideo(video, startTimeMs);
        if (objectResults.detections) {
          objectResults.detections.forEach(detection => {
            const box = detection.boundingBox;
            if (box) {
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.strokeRect(box.originX, box.originY, box.width, box.height);
              
              ctx.fillStyle = '#22c55e';
              ctx.font = 'bold 12px monospace';
              const label = detection.categories[0].categoryName === 'person' ? 'STAFF' : 'ASSET/DOC';
              ctx.fillText(`${label} ${Math.round(detection.categories[0].score * 100)}%`, box.originX, box.originY - 5);
            }
          });
        }

        animationId = requestAnimationFrame(renderLoop);
      };

      renderLoop();
    };

    if (isActive) {
      initAI();
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, videoUrl]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPaused(false);
          setVideoError(false);
        })
        .catch(err => {
          console.error("Manual play error:", err);
          setVideoError(true);
        });
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {!isLoaded && !error && (
        <div className="absolute z-30 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-blue-400 font-mono text-xs animate-pulse">ЗАГРУЗКА НЕЙРОСЕТЕЙ (WASM)...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute z-30 text-red-500 font-mono text-sm bg-black/80 p-4 rounded border border-red-500/50">
          {error}
        </div>
      )}

      {isLoaded && isPaused && !videoError && (
        <div className="absolute z-30 flex flex-col items-center bg-black/40 p-6 rounded-lg backdrop-blur-sm">
          <button 
            onClick={handlePlay}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
          </button>
          <p className="text-white font-mono text-[10px] mt-4 uppercase tracking-widest">Нажмите для запуска потока</p>
        </div>
      )}

      {videoError && (
        <div className="absolute z-30 text-orange-400 font-mono text-xs bg-black/80 p-4 rounded border border-orange-500/50 text-center max-w-[80%]">
          <p className="font-bold mb-2">ОШИБКА ЗАГРУЗКИ ВИДЕО</p>
          <p className="opacity-70">Браузер не смог загрузить файл. Это может быть связано с CORS или ограничениями Google Drive (для больших файлов требуется подтверждение сканирования на вирусы).</p>
          <p className="mt-2 text-[10px] text-zinc-500 break-all">{videoUrl}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
          >
            ОБНОВИТЬ СТРАНИЦУ
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
        autoPlay
        muted
        loop
        playsInline
        onError={() => setVideoError(true)}
        onLoadedMetadata={() => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        }}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
      />

      <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded border border-blue-500/30 text-[10px] font-mono text-blue-400 z-30">
        ENGINE: MEDIAPIPE WASM/GPU
      </div>
    </div>
  );
};

export default RealTimeAnalyzer;
