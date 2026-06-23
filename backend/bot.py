"""
Telegram-бот АЛГА — уведомления и управление заявками
Запуск: python bot.py
"""

import os
import sqlite3
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, filters, ContextTypes
)

logging.basicConfig(level=logging.INFO)

# ── Конфигурация ───────────────────────────────────────────────────────────────
TG_TOKEN       = os.environ.get('TG_TOKEN', '')
ADMIN_CHAT_ID  = os.environ.get('ADMIN_CHAT_ID', '')
DB_PATH        = os.path.join(os.path.dirname(__file__), 'alga.db')

SPORT_LABELS = {'sambo': 'Самбо 🥋', 'karate': 'Карате 🥷', 'boxing': 'Бокс 🥊'}

# ── База данных ────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ── Проверка админа ───────────────────────────────────────────────────────────
def is_admin(update: Update) -> bool:
    uid = update.effective_user.id
    if ADMIN_CHAT_ID and uid != ADMIN_CHAT_ID:
        return False
    return True

# ── Команды ───────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    await update.message.reply_text(
        f'👋 Привет! Я бот спортивного комплекса <b>АЛГА</b>.\n\n'
        f'Твой Chat ID: <code>{uid}</code>\n\n'
        '📌 Команды:\n'
        '/new — новые заявки\n'
        '/all — все заявки\n'
        '/stats — статистика',
        parse_mode='HTML'
    )

async def cmd_new(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update):
        return
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM applications WHERE status='new' ORDER BY id DESC LIMIT 10"
        ).fetchall()
    if not rows:
        await update.message.reply_text('✅ Новых заявок нет!')
        return
    for r in rows:
        await send_application_card(update, r)

async def cmd_all(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update):
        return
    with get_db() as db:
        rows = db.execute('SELECT * FROM applications ORDER BY id DESC LIMIT 15').fetchall()
    if not rows:
        await update.message.reply_text('📭 Заявок пока нет.')
        return
    for r in rows:
        await send_application_card(update, r)

async def cmd_stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update):
        return
    with get_db() as db:
        total  = db.execute('SELECT COUNT(*) FROM applications').fetchone()[0]
        new    = db.execute("SELECT COUNT(*) FROM applications WHERE status='new'").fetchone()[0]
        done   = db.execute("SELECT COUNT(*) FROM applications WHERE status='done'").fetchone()[0]
        sambo  = db.execute("SELECT COUNT(*) FROM applications WHERE sport='sambo'").fetchone()[0]
        karate = db.execute("SELECT COUNT(*) FROM applications WHERE sport='karate'").fetchone()[0]
        boxing = db.execute("SELECT COUNT(*) FROM applications WHERE sport='boxing'").fetchone()[0]

    await update.message.reply_text(
        f'📊 <b>Статистика АЛГА</b>\n\n'
        f'Заявок всего: <b>{total}</b>\n'
        f'🟡 Новых: <b>{new}</b>\n'
        f'🟢 Обработано: <b>{done}</b>\n\n'
        f'🥋 Самбо: {sambo}\n'
        f'🥷 Карате: {karate}\n'
        f'🥊 Бокс: {boxing}',
        parse_mode='HTML'
    )

async def send_application_card(update: Update, r):
    status_icon = {'new': '🟡', 'done': '🟢', 'called': '🔵'}.get(r['status'], '⚪')
    text = (
        f'{status_icon} <b>Заявка #{r["id"]}</b>\n\n'
        f'👤 {r["name"]}\n'
        f'📞 {r["phone"]}\n'
        f'🏋️ {SPORT_LABELS.get(r["sport"], r["sport"])}\n'
        f'🎂 Возраст: {r["age"] or "—"}\n'
        f'💬 {r["comment"] or "—"}\n'
        f'📅 {r["created"]}\n'
        f'Статус: {r["status"]}'
    )
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton('✅ Готово',      callback_data=f'done:{r["id"]}'),
            InlineKeyboardButton('📞 Позвонили',   callback_data=f'called:{r["id"]}'),
        ],
        [InlineKeyboardButton('🗑 Удалить',        callback_data=f'delete:{r["id"]}')]
    ])
    await update.message.reply_text(text, parse_mode='HTML', reply_markup=keyboard)

# ── Кнопки ────────────────────────────────────────────────────────────────────

async def callback_handler(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    action, app_id = query.data.split(':')
    app_id = int(app_id)

    with get_db() as db:
        if action == 'delete':
            db.execute('DELETE FROM applications WHERE id=?', (app_id,))
            db.commit()
            await query.edit_message_text(f'🗑 Заявка #{app_id} удалена.')
        else:
            db.execute('UPDATE applications SET status=? WHERE id=?', (action, app_id))
            db.commit()
            label = {'done': '✅ Обработана', 'called': '📞 Позвонили'}.get(action, action)
            await query.edit_message_text(f'Заявка #{app_id}: {label}')

# ── Запуск ─────────────────────────────────────────────────────────────────────

def main():
    app = Application.builder().token(TG_TOKEN).build()
    app.add_handler(CommandHandler('start', cmd_start))
    app.add_handler(CommandHandler('new',   cmd_new))
    app.add_handler(CommandHandler('all',   cmd_all))
    app.add_handler(CommandHandler('stats', cmd_stats))
    app.add_handler(CallbackQueryHandler(callback_handler))
    print('🤖 Бот АЛГА запущен...')
    app.run_polling()

if __name__ == '__main__':
    main()
