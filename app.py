import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import time

# --- Настройка страницы ---
st.set_page_config(
    page_title="Cashier Monitoring System",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Стилизация (Темная тема) ---
st.markdown("""
    <style>
    .main {
        background-color: #0e1117;
        color: #fafafa;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: #161b22;
        border-radius: 4px 4px 0px 0px;
        gap: 1px;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1f2937;
        border-bottom: 2px solid #3b82f6;
    }
    .incident-card {
        background-color: #161b22;
        padding: 15px;
        border-radius: 8px;
        border-left: 5px solid #ef4444;
        margin-bottom: 10px;
    }
    .level-critical { border-left-color: #ef4444; }
    .level-high { border-left-color: #f59e0b; }
    .level-medium { border-left-color: #3b82f6; }
    </style>
    """, unsafe_allow_stdio=True)

# --- Sidebar ---
with st.sidebar:
    st.title("🛡️ Управление")
    mode = st.radio("Режим работы", ["DEMO", "REALTIME"], horizontal=True)
    st.divider()
    st.info(f"Текущий статус: {'LIVE' if mode == 'REALTIME' else 'SIMULATION'}")

# --- Функции отрисовки вкладок ---

def render_monitoring_tab(mode):
    st.header("Мониторинг кассы")
    
    col1, col2 = st.columns([7, 3])
    
    with col1:
        st.subheader("Видеопоток")
        
        if mode == "REALTIME":
            st.markdown("""
                <div style="background-color: #0e1117; height: 450px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #ef4444; border-radius: 10px;">
                    <h1 style="color: #ef4444; margin: 0;">LIVE</h1>
                    <p style="color: #6b7280;">Ожидание RTSP потока...</p>
                </div>
            """, unsafe_allow_html=True)
        else:
            # ID видео из вашей ссылки
            video_id = "1fMF-zUDpuX9aWu1lwX7ki4Gx-r5NWR52"
            preview_url = f"https://drive.google.com/file/d/{video_id}/preview"
            
            # Используем iframe для стабильного отображения с Google Drive
            st.markdown(f"""
                <iframe src="{preview_url}" width="100%" height="450" allow="autoplay"></iframe>
                <p style="font-size: 0.8em; color: gray; margin-top: 5px;">
                    ⚠️ Примечание: Google Drive может ограничивать автозапуск. Нажмите 'Play' в центре плеера.
                </p>
            """, unsafe_allow_html=True)
            
            st.write("---")
            demo_time = st.slider("Текущее время демо (сек)", 0, 540, 120)
            st.info(f"Таймкод: {time.strftime('%M:%S', time.gmtime(demo_time))}")

    with col2:
        st.subheader("Активные алерты")
        
        alerts = [
            {"level": "Critical", "type": "Выдача до проверки", "cashier": "Касса №4", "time": "12:45:12"},
            {"level": "High", "type": "Нет проверки подлинности", "cashier": "Касса №4", "time": "12:44:05"},
            {"level": "Medium", "type": "Подозрительная активность", "cashier": "Касса №1", "time": "12:40:30"},
            {"level": "Critical", "type": "Отмена операции без менеджера", "cashier": "Касса №4", "time": "12:38:15"},
        ]
        
        for alert in alerts:
            level_class = f"level-{alert['level'].lower()}"
            st.markdown(f"""
                <div class="incident-card {level_class}">
                    <strong>{alert['level']}</strong> | {alert['time']}<br>
                    <span style="font-size: 1.1em;">{alert['type']}</span><br>
                    <small>{alert['cashier']}</small>
                </div>
                """, unsafe_allow_html=True)
        
        if st.button("Показать все инциденты", use_container_width=True):
            st.info("Переход в журнал инцидентов (заглушка)")

def render_incidents_tab():
    st.header("Журнал инцидентов")
    
    # Генерация фиктивных данных
    data = {
        "Дата/время": [f"2026-03-06 12:{i:02d}:00" for i in range(10, 20)],
        "Касса": [f"Касса №{np.random.randint(1, 5)}" for _ in range(10)],
        "Оператор": ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Кузнецов А.А.", "Смирнов В.В."] * 2,
        "Тип нарушения": [
            "Выдача до проверки", "Нет проверки подлинности", "Подозрительная активность", 
            "Отмена операции", "Лишняя купюра", "Недосдача", "Ошибка ввода данных",
            "Выдача до проверки", "Нет проверки подлинности", "Подозрительная активность"
        ],
        "Уровень": ["Critical", "High", "Medium", "High", "Medium", "Critical", "Medium", "High", "Critical", "Medium"],
        "Статус": ["Новое", "В работе", "Закрыто", "Ложное", "Новое", "В работе", "Закрыто", "Новое", "В работе", "Закрыто"]
    }
    df = pd.DataFrame(data)
    
    # Фильтры
    col1, col2 = st.columns(2)
    with col1:
        level_filter = st.selectbox("Фильтр по уровню", ["Все", "Critical", "High", "Medium"])
    with col2:
        status_filter = st.selectbox("Фильтр по статусу", ["Все", "Новое", "В работе", "Ложное", "Закрыто"])
    
    filtered_df = df.copy()
    if level_filter != "Все":
        filtered_df = filtered_df[filtered_df["Уровень"] == level_filter]
    if status_filter != "Все":
        filtered_df = filtered_df[filtered_df["Статус"] == status_filter]
    
    st.dataframe(filtered_df, use_container_width=True)
    
    st.divider()
    
    # Выбор инцидента для деталей
    st.subheader("Детали инцидента")
    selected_idx = st.selectbox("Выбрать инцидент (ID)", filtered_df.index)
    
    if selected_idx is not None:
        row = df.loc[selected_idx]
        st.markdown(f"""
        ### Инцидент #{selected_idx}
        - **Время:** {row['Дата/время']}
        - **Объект:** {row['Касса']}
        - **Сотрудник:** {row['Оператор']}
        - **Нарушение:** `{row['Тип нарушения']}`
        - **Текущий статус:** {row['Статус']}
        
        **Описание:** Система зафиксировала отклонение от стандартного протокола обслуживания. 
        Требуется проверка видеозаписи за указанный период.
        """)

def render_tech_tab(mode):
    st.header("Техническая панель")
    
    st.subheader("🏗️ Инфраструктура локального сервера")
    col_inf1, col_inf2, col_inf3 = st.columns(3)
    
    with col_inf1:
        st.markdown(f"""
            <div style="background-color: #161b22; padding: 15px; border-radius: 8px; border: 1px solid #30363d;">
                <h4 style="margin-top:0;">Хранилище архива</h4>
                <p style="font-size: 0.8em; color: gray;">Заполнено: 7.2 TB / 10 TB</p>
                <div style="background-color: #30363d; height: 8px; border-radius: 4px;">
                    <div style="background-color: #3b82f6; width: 72%; height: 100%; border-radius: 4px;"></div>
                </div>
                <p style="font-size: 0.7em; margin-top: 10px;">Глубина архива: 30 дней</p>
            </div>
        """, unsafe_allow_html=True)

    with col_inf2:
        st.markdown(f"""
            <div style="background-color: #161b22; padding: 15px; border-radius: 8px; border: 1px solid #30363d;">
                <h4 style="margin-top:0;">NVIDIA RTX 4090</h4>
                <p style="font-size: 0.8em; color: gray;">Load: 42% | Temp: 64°C</p>
                <p style="font-size: 0.7em;">VRAM: 8.4 GB / 24 GB</p>
                <p style="font-size: 0.7em; color: #10b981;">Driver: 535.129.03</p>
            </div>
        """, unsafe_allow_html=True)

    with col_inf3:
        st.markdown(f"""
            <div style="background-color: #161b22; padding: 15px; border-radius: 8px; border: 1px solid #30363d;">
                <h4 style="margin-top:0;">Локальная сеть</h4>
                <p style="font-size: 0.8em; color: gray;">IP Камеры: 12 / 12 Online</p>
                <p style="font-size: 0.7em;">Входящий трафик: 84 Mbps</p>
                <p style="font-size: 0.7em; color: #3b82f6;">Subnet: 192.168.10.x</p>
            </div>
        """, unsafe_allow_html=True)

    st.success(f"🛡️ Режим '{'Production' if mode == 'REALTIME' else 'Air-Gap'}' Активен | Local SQLite Mode")
    st.divider()

    with st.expander("🌐 Состояние системы", expanded=True):
        col1, col2, col3 = st.columns(3)
        col1.metric("Активных камер", "1", "Online")
        col2.metric("Режим", "Production" if mode == "REALTIME" else "Demo")
        col3.metric("Задержка обработки", "145 мс", "-12 мс")
        
    with st.expander("🤖 Модели"):
        models_data = {
            "Модель": ["CashierActionDetector", "DocumentOCR"],
            "Версия": ["v2.4.1", "v1.0.5"],
            "mAP": [0.89, 0.94],
            "Статус": ["Active", "Active"]
        }
        st.table(pd.DataFrame(models_data))
        
    with st.expander("📝 Логи"):
        prefix = "LIVE" if mode == "REALTIME" else "INFO"
        logs = [
            f"{prefix} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} Detector: processed frame {1000 + i}"
            for i in range(10)
        ]
        st.code("\n".join(logs))

# --- Main ---
def main():
    tabs = st.tabs(["Мониторинг СБ", "Журнал инцидентов", "Тех.панель"])
    
    with tabs[0]:
        render_monitoring_tab(mode)
        
    with tabs[1]:
        render_incidents_tab()
        
    with tabs[2]:
        render_tech_tab(mode)

if __name__ == "__main__":
    main()
