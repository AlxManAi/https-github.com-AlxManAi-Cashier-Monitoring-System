from logic import WorkflowEngine

def run_test():
    # Инициализируем движок
    engine = WorkflowEngine('workflow_config.json')

    print("--- ТЕСТ 1: ИДЕАЛЬНЫЙ СЦЕНАРИЙ ---")
    # Правильная последовательность по файлу Полины
    test_actions = [
        "RECEIVE_CASH", 
        "COUNT_CASH_MACHINE", 
        "CHECK_CASH_DETECTOR", 
        "INPUT_CLIENT_DATA", 
        "PREPARE_CASH_OUT", 
        "COMPLETE"
    ]

    for action in test_actions:
        engine.handle_event(action)

    print("\n--- ТЕСТ 2: НАРУШЕНИЕ (ПРОПУСК ПРОВЕРКИ) ---")
    # Сбрасываем состояние для нового теста
    engine.current_state = "IDLE" 
    
    # Кассир получил деньги и сразу пошел в систему, пропустив пересчет и детектор
    bad_actions = ["RECEIVE_CASH", "INPUT_CLIENT_DATA"]
    
    for action in bad_actions:
        engine.handle_event(action)

if __name__ == "__main__":
    run_test()
