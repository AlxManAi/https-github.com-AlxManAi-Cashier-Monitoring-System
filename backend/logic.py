import json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any

# --- БЛОК АРХИТЕКТУРЫ (ИНТЕГРАЦИЯ СХЕМЫ РОМАНА) ---

@dataclass
class Incident:
    """
    Модель инцидента, согласованная с Романом. 
    Именно в таком формате данные будут уходить Алексею для отображения в UI.
    Каждое поле соответствует техническому заданию нашей системы контроля.
    """
    id: str
    timestamp: str
    cashier: str
    operator: str
    type: str
    level: str  # 'Critical' | 'High' | 'Medium'
    status: str # 'Новое' | 'В работе' | 'Ложное' | 'Закрыто'
    description: str
    videoUrl: Optional[str] = None
    screenshotUrl: Optional[str] = None
    detectedObjects: Optional[List[str]] = None
    suggested_action: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Превращаем объект в словарь для корректной записи в JSON-отчет"""
        return asdict(self)

# --- ОСНОВНОЙ МОДУЛЬ (COMPLIANCE ENGINE) ---

class WorkflowEngine:
    """
    Ядро системы контроля (Compliance Engine). 
    Сверяет действия кассира (из нейронки Макса) с бизнес-процессом (из конфига).
    """

    def __init__(self, config_path):
        """
        Инициализация: загружаем расширенный конфиг. 
        Конфиг собран на основе файла 'cashier_workflow_FINAL_самый актуальный.xlsx'.
        """
        with open(config_path, 'r', encoding='utf-8') as f:
            # Загружаем весь JSON целиком
            self.full_config = json.load(f)
        
        # Достаем рабочую конфигурацию процессов
        self.workflow_config = self.full_config.get('workflow_config', {})
        
        # Устанавливаем начальное состояние из конфига (по умолчанию IDLE)
        self.current_state = self.workflow_config.get('initial_state', "IDLE")
        
        # Списки для хранения истории сессии и найденных нарушений
        self.history = []
        self.incidents = []

    def handle_event(self, action_id, cashier_name="Кассир #1"):
        """
        Основная точка входа. Принимает action_id (например, 'CHECK_CASH_DETECTOR').
        Решает: разрешен ли такой шаг в текущем состоянии или это инцидент.
        """
        print(f"--- Анализ действия: {action_id} ---")
        print(f"Текущий статус системы: {self.current_state}")
        
        # Вытягиваем список разрешенных переходов из секции transitions
        transitions = self.workflow_config.get('transitions', [])
        
        # Ищем переход, который соответствует текущему состоянию и входящему действию
        valid_transition = next(
            (t for t in transitions if t['from_state'] == self.current_state 
             and action_id in t['allowed_actions']), 
            None
        )

        if valid_transition:
            # Если действие легальное — фиксируем переход в новое состояние
            old_state = self.current_state
            self.current_state = valid_transition['to_state']
            self.history.append(action_id)
            print(f"Результат: Переход {old_state} -> {self.current_state} подтвержден.")
            return None
        else:
            # Если действие нарушает логику процесса — создаем инцидент
            print(f"ВНИМАНИЕ: Обнаружено отклонение от регламента!")
            return self.generate_incident(action_id, cashier_name)

    def generate_incident(self, action_id, cashier_name):
        """
        Метод генерации технического отчета об ошибке.
        Формирует объект Incident с детальным описанием нарушения для Алексея.
        """
        # Генерируем уникальный номер инцидента с текущей датой
        inc_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{len(self.incidents) + 1:03d}"
        
        # Собираем объект инцидента (нарушение последовательности шагов)
        new_incident = Incident(
            id=inc_id,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            cashier=cashier_name,
            operator="AI System",
            type="Нарушение регламента",
            level="High",
            status="Новое",
            description=(
                f"Кассир выполнил операцию '{action_id}', находясь в состоянии '{self.current_state}'. "
                f"Согласно регламенту, это действие сейчас недопустимо."
            ),
            suggested_action="Вернуться к обязательным этапам (пересчет/проверка) или заблокировать операцию.",
            detectedObjects=["Person", "Cashier", "Cash"]
        )
        
        # Добавляем в общий список и вызываем сохранение в файл
        incident_dict = new_incident.to_dict()
        self.incidents.append(incident_dict)
        self.save_reports()
        return incident_dict

    def save_reports(self):
        """
        Сохраняем зафиксированные нарушения в файл detected_incidents.json. 
        Этот файл является 'входным билетом' для фронтенда Алексея.
        """
        try:
            with open('detected_incidents.json', 'w', encoding='utf-8') as f:
                # Сохраняем с отступами и поддержкой кириллицы
                json.dump(self.incidents, f, ensure_ascii=False, indent=2)
            print(f"Отчет об инцидентах обновлен: detected_incidents.json")
        except Exception as e:
            print(f"Критическая ошибка при сохранении отчета: {e}")
