import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, '.env'))

DB_PATH = os.path.join(BASE_DIR, 'alga.db')
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
ADMIN_LOGIN = os.environ.get('ADMIN_LOGIN')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
SECRET_KEY = os.environ.get('SECRET_KEY', 'alga-sport-secret-2024')
TG_TOKEN = os.environ.get('TG_TOKEN', '')
TG_CHAT_ID = os.environ.get('TG_CHAT_ID', '')

SPORT_LABELS = {
    'sambo': 'Самбо',
    'karate': 'Карате',
    'boxing': 'Бокс',
}

STATUS_LABELS = {
    'new': 'Новая',
    'done': 'Готово',
    'called': 'Звонили',
}
