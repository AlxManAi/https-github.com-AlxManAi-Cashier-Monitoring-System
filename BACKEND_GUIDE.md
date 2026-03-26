# Техническое задание: Backend-модуль мониторинга и управления (Task 4.2)

Этот документ предназначен для ИИ-ассистента, который будет реализовывать серверную часть системы.

## 1. Стек и окружение
- **Язык**: Python (рекомендуется) или Node.js.
- **ОС**: Linux (Ubuntu 22.04+) с установленными драйверами NVIDIA.
- **Инструменты**: `nvidia-smi`, `opencv-python` (для RTSP), `psutil` (для системных метрик).

## 2. Модуль мониторинга GPU (Hardware Stats)
Необходимо реализовать периодический опрос состояния видеокарты.

**Логика**:
- Использовать библиотеку `pynvml` (Python) или парсить вывод `nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits`.
- **Метрики**:
    - `gpu_load`: % загрузки ядра.
    - `gpu_temp`: температура в градусах Цельсия.
    - `vram_used`: объем занятой памяти в ГБ.
    - `vram_total`: общий объем памяти.

## 3. Модуль управления RTSP-потоками
Реализовать CRUD (создание, чтение, обновление, удаление) для конфигурации камер.

**Логика**:
- Хранение списка камер в `config.json`.
- Каждая камера имеет: `id`, `name`, `url` (rtsp), `status` (active/offline).
- При изменении URL в конфиге, соответствующий процесс захвата (OpenCV/FFmpeg) должен быть перезапущен.
- Проверка доступности: раз в 30 секунд пытаться открыть поток `cv2.VideoCapture(url)`. Если `isOpened()` — статус `active`.

## 4. Расчет FPS и Latency
- **FPS**: Считать количество успешно обработанных кадров в секунду в основном цикле детекции.
- **Latency**: Измерять время от момента захвата кадра (`T1`) до момента получения результата детекции (`T2`). `Latency = T2 - T1`.

## 5. Система логирования (Retention & Export)
Необходимо реализовать структурированное хранение системных логов с глубиной архива 7 дней.

**Логика хранения**:
- **База данных**: SQLite (рекомендуется для быстрой фильтрации).
- **Таблица `logs`**: `id`, `timestamp` (DATETIME), `level` (INFO/ERROR/LIVE), `module` (GPU/Camera/AI), `message` (TEXT).
- **Авто-очистка (Rotation)**: Раз в сутки запускать скрипт `DELETE FROM logs WHERE timestamp < datetime('now', '-7 days')`.

**API для работы с логами**:
- `GET /api/logs?date=YYYY-MM-DD&hour=HH`: Возвращает список логов за указанный период.
- `GET /api/logs/export?start=...&end=...`: Генерирует и отдает CSV-файл с логами за выбранный период.

## 6. Передача данных (API / WebSocket)
Реализовать WebSocket-сервер для трансляции метрик на фронтенд (частота 1 Гц).

**Структура сообщения**:
```json
{
  "system_stats": {
    "gpu": {
      "load": 42,
      "temp": 64,
      "vram_used": 8.4,
      "vram_total": 24.0,
      "fps": 28.4
    },
    "network": {
      "bandwidth_mbps": 84,
      "drop_rate": 0.02
    },
    "storage": {
      "used_tb": 7.2,
      "total_tb": 10.0,
      "retention_days": 30
    },
    "cameras": [
      {"id": "01", "name": "Касса №4", "status": "active", "url": "rtsp://..."},
      {"id": "02", "name": "Касса №2", "status": "offline", "url": "rtsp://..."}
    ]
  }
}
```

## 9. WebSocket и Real-time Интеграция (Task 4.3)
Система поддерживает трансляцию инцидентов в реальном времени.

### Архитектура:
1.  **Python Notebook** → Отправляет POST запрос на `/api/incidents/report`.
2.  **WebSocket Server (FastAPI)** → Принимает запрос и делает Broadcast всем подключенным UI клиентам.
3.  **React UI** → Подключается к `/ws` и мгновенно отображает новый инцидент.

### Формат сообщения (JSON):
```json
{
  "type": "NEW_INCIDENT",
  "data": {
    "id": "INC-20260326-0001",
    "timestamp": "2026-03-26 12:45:30",
    "cashier": "Касса №4",
    "operator": "AI System",
    "type": "Выдача до проверки",
    "level": "Critical",
    "status": "Новое"
  }
}
```

### Инструкции для ДЕМО (Google Colab):
1.  Запустите сервер в Colab (см. раздел 8).
2.  Используйте `ngrok` для получения публичного URL (например, `https://abc.ngrok-free.app`).
3.  Во фронтенде в `.env` укажите:
    `VITE_WS_URL=wss://abc.ngrok-free.app/ws` (обязательно `wss` для HTTPS).

### Инструкции для ЛОКАЛЬНОГО режима (Банк):
1.  Запустите сервер: `uvicorn server:app --host 0.0.0.0 --port 8000`.
2.  Во фронтенде в `.env` укажите:
    `VITE_WS_URL=ws://localhost:8000/ws`.
3.  Для безопасности:
    -   Используйте SSL сертификаты для `wss://`.
    -   Включите проверку Bearer токена в `websocket_endpoint`.
