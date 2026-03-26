# Спецификация логирования (Task 4.4)

## 1. Общие требования
*   **Формат**: JSON Lines (`.jsonl`). Каждая строка является валидным JSON-объектом.
*   **Кодировка**: UTF-8.
*   **Ротация**: Ежедневная ротация с хранением архива за последние **30 дней**.
*   **Путь хранения**: `/var/log/cashier-watch/*.jsonl` (или аналогичный в зависимости от ОС).

## 2. Уровни логирования

### Уровень 1: Инциденты СБ (Security Incidents)
Логируются события, классифицированные AI-моделью как потенциальные нарушения.
*   **Файл**: `security_incidents.jsonl`
*   **Поля**:
    ```json
    {
      "timestamp": "ISO8601",
      "event_id": "UUID",
      "type": "string (e.g., 'no_id_check')",
      "severity": "Critical | High | Medium",
      "cashier_id": "string",
      "detected_objects": ["string"],
      "confidence": "float (0-1)",
      "media_refs": {
        "screenshot": "path/to/img",
        "video_clip": "path/to/vid"
      }
    }
    ```

### Уровень 2: Действия контролёров (Operator Actions)
Логируются все действия пользователей в интерфейсе системы.
*   **Файл**: `operator_actions.jsonl`
*   **Поля**:
    ```json
    {
      "timestamp": "ISO8601",
      "operator_id": "string",
      "action": "view_incident | update_status | export_report | login",
      "target_id": "string (incident_id or system_component)",
      "changes": {
        "from": "string",
        "to": "string"
      },
      "ip_address": "string"
    }
    ```

### Уровень 3: Технические логи (System/Technical)
Логируются показатели производительности оборудования и ошибки ПО.
*   **Файл**: `technical_system.jsonl`
*   **Поля**:
    ```json
    {
      "timestamp": "ISO8601",
      "component": "GPU | Camera | WebSocket | Database",
      "level": "INFO | WARNING | ERROR",
      "message": "string",
      "metrics": {
        "gpu_load": "int (%)",
        "gpu_temp": "int (C)",
        "fps": "float",
        "latency_ms": "int"
      },
      "stack_trace": "string (optional)"
    }
    ```

## 3. Политика ротации и очистки
1.  **Скрипт очистки**: Запускается ежедневно в 03:00 через `cron`.
2.  **Условие**: Удаление файлов, дата создания которых превышает 30 дней.
3.  **Архивация**: Перед удалением логи могут быть сжаты в `.gz` для экономии места (опционально).
