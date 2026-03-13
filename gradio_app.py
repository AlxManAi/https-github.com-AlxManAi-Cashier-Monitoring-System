import gradio as gr
import pandas as pd
import numpy as np
from datetime import datetime

# --- Mock Data ---
def get_incidents():
    data = {
        "ID": range(1, 11),
        "Timestamp": [f"2026-03-06 12:{i:02d}:00" for i in range(10, 20)],
        "Cashier": [f"Касса №{np.random.randint(1, 5)}" for _ in range(10)],
        "Type": ["Выдача до проверки", "Нет проверки подлинности", "Подозрительная активность"] * 3 + ["Отмена чека"],
        "Level": ["Critical", "High", "Medium", "High", "Medium", "Critical", "Medium", "High", "Critical", "Medium"],
        "Status": ["Новое", "В работе", "Закрыто", "Ложное", "Новое", "В работе", "Закрыто", "Новое", "В работе", "Закрыто"]
    }
    return pd.DataFrame(data)

def get_system_stats():
    return {
        "Active Cameras": "1",
        "Mode": "Demo / Air-Gap",
        "Latency": "145ms",
        "GPU Temp": "64°C",
        "Storage": "72%"
    }

# --- UI Logic ---
with gr.Blocks(theme=gr.themes.Soft(primary_hue="blue", secondary_hue="zinc"), title="Cashier Watch Gradio") as demo:
    gr.Markdown("# 🛡️ CASHIER WATCH v2.4 (Gradio Edition)")
    
    mode_radio = gr.Radio(["DEMO", "REALTIME"], value="DEMO", label="Режим работы", interactive=True)
    
    with gr.Tabs():
        # --- Monitoring Tab ---
        with gr.Tab("Мониторинг"):
            with gr.Row():
                with gr.Column(scale=2):
                    status_label = gr.Markdown("### 🎥 Видеопоток: Касса №4 (Archive)")
                    
                    # Video Container
                    video_html = gr.HTML(value=f'<iframe src="https://drive.google.com/file/d/1fMF-zUDpuX9aWu1lwX7ki4Gx-r5NWR52/preview" width="100%" height="450" allow="autoplay"></iframe>')
                    
                    demo_slider = gr.Slider(0, 540, value=120, label="Таймкод демо (сек)", visible=True)
                
                with gr.Column(scale=1):
                    gr.Markdown("### ⚠️ Активные алерты")
                    gr.HighlightedText(
                        value=[("Выдача до проверки", "CRITICAL"), ("Нет проверки подлинности", "HIGH"), ("Подозрительная активность", "MEDIUM")],
                        label="Последние события"
                    )
                    gr.Button("Перейти к журналу")

    # Mode switching logic
    def update_mode(mode):
        if mode == "REALTIME":
            return {
                status_label: gr.Markdown("### 🎥 Видеопоток: Касса №4 (LIVE)"),
                video_html: gr.HTML('<div style="background-color: #0e1117; height: 450px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #ef4444; border-radius: 10px;"><h1 style="color: #ef4444; margin: 0;">LIVE</h1><p style="color: #6b7280;">Ожидание RTSP потока...</p></div>'),
                demo_slider: gr.Slider(visible=False)
            }
        else:
            return {
                status_label: gr.Markdown("### 🎥 Видеопоток: Касса №4 (Archive)"),
                video_html: gr.HTML('<iframe src="https://drive.google.com/file/d/1fMF-zUDpuX9aWu1lwX7ki4Gx-r5NWR52/preview" width="100%" height="450" allow="autoplay"></iframe>'),
                demo_slider: gr.Slider(visible=True)
            }

    mode_radio.change(update_mode, inputs=[mode_radio], outputs=[status_label, video_html, demo_slider])

    with gr.Tabs():
        # --- Incidents Tab ---
        with gr.Tab("Журнал инцидентов"):
            gr.Markdown("### 📋 Список зафиксированных нарушений")
            with gr.Row():
                level_drop = gr.Dropdown(["Все", "Critical", "High", "Medium"], value="Все", label="Фильтр: Уровень")
                status_drop = gr.Dropdown(["Все", "Новое", "В работе", "Закрыто"], value="Все", label="Фильтр: Статус")
            
            incident_table = gr.Dataframe(value=get_incidents(), interactive=False)
            
            with gr.Accordion("Детали выбранного инцидента", open=False):
                gr.Markdown("Выберите строку в таблице выше для просмотра деталей (в MVP Gradio реализовано статично)")
                gr.JSON(value={"id": 1, "comment": "Требуется ручная проверка менеджером", "ai_confidence": "94%"})

        # --- Tech Tab ---
        with gr.Tab("Тех.панель"):
            gr.Markdown("### 🏗️ Инфраструктура и Состояние")
            with gr.Row():
                gr.Label("1", label="Активных камер")
                gr.Label("RTX 4090", label="GPU")
                gr.Label("72%", label="Storage")
            
            with gr.Row():
                with gr.Column():
                    gr.Markdown("#### 📝 Системные логи")
                    log_output = gr.Code(
                        value="INFO 2026-03-06 12:00:01 Detector: init success\nINFO 2026-03-06 12:00:05 Streamer: connected to cam_04",
                        language="shell"
                    )
                with gr.Column():
                    gr.Markdown("#### 🤖 Активные модели")
                    gr.Dataframe(value=pd.DataFrame({
                        "Model": ["Detector", "OCR"],
                        "Version": ["v2.4", "v1.0"],
                        "Status": ["Active", "Active"]
                    }))

    gr.Markdown("---")
    gr.Markdown("© 2026 Security Systems AI • On-Premise Solution")

if __name__ == "__main__":
    demo.launch()
