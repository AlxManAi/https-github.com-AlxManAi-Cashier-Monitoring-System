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
