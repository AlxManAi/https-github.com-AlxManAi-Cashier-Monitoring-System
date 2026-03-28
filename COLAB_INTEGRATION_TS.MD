# Интеграция ML-пайплайна с UI (Инструкция для Алены)

Этот документ описывает, как отправлять данные о нарушениях и метрики системы из Python/Colab в панель мониторинга.

## 1. Базовый URL
Все запросы должны отправляться на адрес вашего приложения. 
**Важно**: Если вы используете ngrok для проброса локального сервера, укажите полученный URL в интерфейсе **CASHIER WATCH** (вкладка «Система» -> «Интеграция с Compliance Engine»).

Базовый путь для API:
`https://<ВАШ_APP_URL>/api`

---

## 2. Отправка инцидента (Нарушение регламента)
Используйте этот метод, когда модель зафиксировала отклонение от процесса (например, выдача денег без проверки на детекторе).

**Endpoint**: `/events/handle`
**Метод**: `POST`

### Пример на Python:
```python
import requests

def report_incident(action_id, cashier_name="Касса №4"):
    url = "https://<ВАШ_APP_URL>/api/events/handle"
    payload = {
        "action_id": action_id,      # ID действия из workflow_config.json (напр. "CHECK_CASH_DETECTOR")
        "cashier_name": cashier_name,
        "screenshotUrl": "https://link-to-storage.com/frame_123.jpg", # Опционально
        "description": "Пропущен этап проверки подлинности купюры"    # Опционально
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Пример вызова:
# report_incident("CHECK_CASH_DETECTOR")
```

---

## 3. Отправка метрик системы (GPU/FPS)
Чтобы на дашборде обновлялись графики нагрузки, отправляйте эти данные раз в 2-5 секунд.

**Endpoint**: `/metrics/system`
**Метод**: `POST`

### Пример на Python:
```python
def send_metrics(gpu_load, fps):
    url = "https://<ВАШ_APP_URL>/api/metrics/system"
    payload = {
        "gpu_load": gpu_load,    # int: 0-100
        "gpu_temp": 65,          # int: градусы
        "vram_used": 8.4,        # float: ГБ
        "vram_total": 24.0,      # float: ГБ
        "net_in": 12.5           # float: Mbps
    }
    requests.post(url, json=payload)
    
    # Также можно слать FPS модели отдельно:
    requests.post("https://<ВАШ_APP_URL>/api/metrics/performance", json={"fps": fps})
```

---

## 4. Справочник действий (Action IDs)
Для корректной работы Workflow Engine используйте следующие ID из `workflow_config.json`:
- `RECEIVE_CASH` — Прием наличных
- `COUNT_CASH_MACHINE` — Пересчет на машинке
- `CHECK_CASH_DETECTOR` — Проверка на детекторе
- `INPUT_CLIENT_DATA` — Ввод данных в ПО
- `PREPARE_CASH_OUT` — Выдача
