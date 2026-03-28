**Old Ver. Not actuai!!!!**

# Техническое Задание: Интеграция Colab -> CashierWatch UI

**Версия:** 1.0  
**Статус:** Draft  
**Для кого:** Алена Гречко (Координация групп Обучения, Ядра и Валидации)

## 1. Контекст
Для отображения живой аналитики в интерфейсе CashierWatch, Python-скрипты в Colab должны передавать данные на API-сервер. Сервер работает на FastAPI и транслирует данные в UI через WebSockets.

## 2. Параметры подключения
- **Протокол:** HTTP POST
- **Формат данных:** JSON
- **Базовый URL:** Будет предоставлен после запуска сервера (ngrok/tunnel).

## 3. Эндпоинты и структуры данных

### 3.1. Регистрация Инцидента
**URL:** `/api/incidents/report`  
**Когда вызывать:** При обнаружении нарушения регламента или подозрительного действия.

```json
{
  "id": "string",              // Уникальный ID (например, INC-TIMESTAMP)
  "timestamp": "string",       // Формат: YYYY-MM-DD HH:MM:SS
  "cashier": "string",         // Имя кассира из БД или номер точки
  "operator": "string",        // Название модуля (например, "Compliance_Engine")
  "type": "string",            // Тип нарушения
  "level": "string",           // "Critical" | "High" | "Medium" | "Low"
  "status": "string",          // "Новое"
  "description": "string",     // Подробное описание нарушения
  "detectedObjects": ["string"] // Список объектов в кадре (опционально)
}
```

### 3.2. Системная Телеметрия
**URL:** `/api/metrics/system`  
**Когда вызывать:** Циклически (раз в 2-5 сек) из фонового потока мониторинга.

```json
{
  "gpu": { 
    "load": number,       // %
    "temp": number,       // °C
    "vram_used": number,  // GB
    "vram_total": number  // GB
  },
  "network": { 
    "in_mbps": number, 
    "out_mbps": number 
  },
  "storage": { 
    "used_gb": number, 
    "total_gb": number 
  }
}
```

### 3.3. Метрики Моделей
**URL:** `/api/metrics/performance`  
**Когда вызывать:** Раз в секунду из основного цикла инференса.

```json
{
  "model_id": "string",
  "current_fps": number,
  "inference_time": number, // мс
  "vram_usage_mb": number   // MB
}
```

## 4. Пример кода для интеграции (Python)

```python
import requests

def report_to_ui(path, payload):
    url = f"http://SERVER_ADDRESS:8000{path}"
    try:
        requests.post(url, json=payload, timeout=1)
    except Exception as e:
        print(f"UI Sync Error: {e}")
```

## 5. Ожидаемый результат
После интеграции, на вкладках "Техподдержка" и "Модели" в UI должны появиться живые графики и обновляемые значения без перезагрузки страницы.
