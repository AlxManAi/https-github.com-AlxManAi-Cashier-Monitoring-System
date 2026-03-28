/**
 * Сервис для взаимодействия с бэкендом системы (Task 4.2)
 * По умолчанию использует mock-данные, если URL не задан.
 */

export interface GpuStats {
  load: number;
  temp: number;
  vram_used: number;
  vram_total: number;
  fps: number;
}

export interface CameraConfig {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'offline';
}

class SystemService {
  private baseUrl: string = (import.meta as any).env.VITE_API_URL || window.location.origin;
  private wsUrl: string = (import.meta as any).env.VITE_WS_URL || 
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  private socket: WebSocket | null = null;

  /**
   * Обновление конфигурации камеры
   */
  async updateCamera(config: Partial<CameraConfig>): Promise<boolean> {
    if (!this.baseUrl) {
      console.warn('API URL не задан. Имитация сохранения...');
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/config/camera/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return response.ok;
    } catch (error) {
      console.error('Ошибка при обновлении камеры:', error);
      return false;
    }
  }

  /**
   * Экспорт логов в CSV
   */
  async exportLogs(startDate: string, endDate: string): Promise<void> {
    if (!this.baseUrl) {
      alert('Функция экспорта доступна только при подключенном бэкенде.');
      return;
    }
    window.open(`${this.baseUrl}/api/logs/export?start=${startDate}&end=${endDate}`);
  }

  /**
   * Подключение к WebSocket для получения живых метрик
   */
  connectStats(onMessage: (stats: any) => void) {
    if (!this.wsUrl) return;

    this.socket = new WebSocket(this.wsUrl);
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.socket.onclose = () => {
      console.log('WS Connection closed. Retrying in 5s...');
      setTimeout(() => this.connectStats(onMessage), 5000);
    };
  }
}

export const systemService = new SystemService();
