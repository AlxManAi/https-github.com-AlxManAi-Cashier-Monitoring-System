import requests
import json
import time
from datetime import datetime

# URL вашего WebSocket сервера (FastAPI)
# Для Colab это будет URL от ngrok, например: https://abc-123.ngrok-free.app
SERVER_URL = "http://localhost:8000" 

def send_incident(cashier_name, incident_type, level="High"):
    """
    Отправляет инцидент на сервер для последующей трансляции через WebSocket
    """
    incident_data = {
        "id": f"INC-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "cashier": cashier_name,
        "operator": "AI System (Notebook)",
        "type": incident_type,
        "level": level,
        "status": "Новое"
    }
    
    try:
        response = requests.post(f"{SERVER_URL}/api/incidents/report", json=incident_data)
        if response.status_code == 200:
            print(f"✅ Инцидент {incident_data['id']} успешно отправлен!")
        else:
            print(f"❌ Ошибка при отправке: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Не удалось подключиться к серверу: {e}")

# Пример использования:
if __name__ == "__main__":
    print("🚀 Запуск симуляции инцидентов из ноутбука...")
    send_incident("Касса №4", "Выдача до проверки", "Critical")
    time.sleep(2)
    send_incident("Касса №2", "Подозрительная активность", "Medium")
