import requests
from config import TG_TOKEN, TG_CHAT_ID

SPORT_LABELS = {'sambo': 'Самбо', 'karate': 'Карате', 'boxing': 'Бокс'}


def send_telegram_notification(app_id, name, phone, sport, age, comment, created):
    if not TG_TOKEN or not TG_CHAT_ID:
        return
    text = (
        f'Новая заявка #{app_id}\n'
        f'Имя: {name}\n'
        f'Телефон: {phone}\n'
        f'Секция: {SPORT_LABELS.get(sport, sport)}\n'
        f'Возраст: {age or "-"}\n'
        f'Комментарий: {comment or "-"}\n'
        f'Время: {created}'
    )
    try:
        requests.post(
            f'https://api.telegram.org/bot{TG_TOKEN}/sendMessage',
            json={'chat_id': TG_CHAT_ID, 'text': text},
            timeout=5
        )
    except Exception as e:
        print(f'Telegram error: {e}')
