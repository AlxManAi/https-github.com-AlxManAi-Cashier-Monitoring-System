/**
 * Типы данных для моделей компьютерного зрения
 */

export type ModelType = "detector" | "tracker" | "process_engine" | "action";

export type ModelStatus = "active" | "candidate" | "deprecated" | "testing";

export interface ModelMetrics {
  [key: string]: number;
}

export interface Model {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  trainedAt: string;
  metrics: ModelMetrics;
  status: ModelStatus;
  notes: string;
}

export interface SystemMetrics {
  gpu: {
    load: number;
    temp: number;
    vram_used: number;
    vram_total: number;
  };
  network: {
    in_mbps: number;
    out_mbps: number;
  };
  storage: {
    used_gb: number;
    total_gb: number;
  };
}

export interface ModelPerformance {
  model_id: string;
  current_fps: number;
  inference_time: number;
  vram_usage_mb: number;
}
