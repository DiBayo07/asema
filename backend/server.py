from flask import Flask, request, jsonify, render_template, session, redirect, send_from_directory
from flask_cors import CORS
from functools import wraps
from datetime import datetime
from config import ADMIN_LOGIN, ADMIN_PASSWORD, SECRET_KEY, FRONTEND_DIR
from database import init_db, create_application, get_all_applications, update_application_status, delete_application, get_all_trainers, create_trainer, delete_trainer, get_all_schedule, create_schedule, delete_schedule, record_failed_attempt, reset_ip_block, is_ip_blocked, get_block_remaining_minutes
from services import send_telegram_notification

app = Flask(__name__, template_folder='templates')
app.secret_key = SECRET_KEY
CORS(app, origins=['*'])

if not ADMIN_LOGIN or not ADMIN_PASSWORD:
    print('⚠ ВНИМАНИЕ: ADMIN_LOGIN и ADMIN_PASSWORD не заданы в переменных окружения!')
    print('  Установите их перед запуском:')
    print('  $env:ADMIN_LOGIN="admin"; $env:ADMIN_PASSWORD="securepass"')

init_db()


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin'):
            return redirect('/admin/login')
        return f(*args, **kwargs)
    return decorated


def validate_apply_data(data):
    errors = []
    if not data:
        return {'name': '', 'phone': '', 'sport': '', 'age': '', 'comment': ''}, ['Пустое тело запроса']
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    sport = (data.get('sport') or '').strip()

    if not name:
        errors.append('Укажите имя')
    if not phone:
        errors.append('Укажите телефон')
    if not sport:
        errors.append('Выберите вид спорта')

    return {
        'name': name,
        'phone': phone,
        'sport': sport,
        'age': (data.get('age') or '').strip(),
        'comment': (data.get('comment') or '').strip()
    }, errors


@app.route('/api/login', methods=['POST'])
def api_login():
    ip = request.remote_addr or 'unknown'
    if is_ip_blocked(ip):
        return jsonify({'ok': False, 'error': 'blocked', 'minutes': get_block_remaining_minutes(ip)}), 403

    data = request.get_json()
    login = (data.get('login') or '').strip()
    password = data.get('password', '')

    if login == ADMIN_LOGIN and password == ADMIN_PASSWORD:
        reset_ip_block(ip)
        return jsonify({'ok': True})

    record_failed_attempt(ip)
    if is_ip_blocked(ip):
        return jsonify({'ok': False, 'error': 'blocked', 'minutes': get_block_remaining_minutes(ip)}), 403
    return jsonify({'ok': False, 'error': 'invalid'}), 401


@app.route('/api/apply', methods=['POST'])
def apply():
    data, errors = validate_apply_data(request.get_json())
    if errors:
        return jsonify({'ok': False, 'error': '. '.join(errors)}), 400

    created = datetime.now().strftime('%d.%m.%Y %H:%M')
    app_id = create_application(
        data['name'], data['phone'], data['sport'],
        data['age'], data['comment'], created
    )

    send_telegram_notification(
        app_id, data['name'], data['phone'], data['sport'],
        data['age'], data['comment'], created
    )

    return jsonify({'ok': True, 'id': app_id})


@app.route('/api/applications', methods=['GET'])
def get_applications_route():
    if not session.get('admin'):
        return jsonify({'ok': False, 'error': 'Unauthorized'}), 401
    rows = get_all_applications()
    return jsonify([dict(r) for r in rows])


@app.route('/api/application/<int:app_id>/status', methods=['PATCH'])
def update_status_route(app_id):
    if not session.get('admin'):
        return jsonify({'ok': False}), 401
    status = request.get_json().get('status', 'done')
    update_application_status(app_id, status)
    return jsonify({'ok': True})


@app.route('/api/application/<int:app_id>', methods=['DELETE'])
def delete_application_route(app_id):
    if not session.get('admin'):
        return jsonify({'ok': False}), 401
    delete_application(app_id)
    return jsonify({'ok': True})


@app.route('/api/trainers', methods=['GET'])
def get_trainers_route():
    if not session.get('admin'):
        return jsonify({'ok': False, 'error': 'Unauthorized'}), 401
    rows = get_all_trainers()
    return jsonify([dict(r) for r in rows])


@app.route('/api/trainers', methods=['POST'])
def add_trainer_route():
    if not session.get('admin'):
        return jsonify({'ok': False}), 401
    data = request.get_json()
    trainer_id = create_trainer(
        data.get('name', '').strip(),
        data.get('sport', '').strip(),
        data.get('title', '').strip(),
        data.get('achieve', '').strip(),
        data.get('photo', '').strip()
    )
    return jsonify({'ok': True, 'id': trainer_id})


@app.route('/api/trainers/<int:trainer_id>', methods=['DELETE'])
def delete_trainer_route(trainer_id):
    if not session.get('admin'):
        return jsonify({'ok': False}), 401
    delete_trainer(trainer_id)
    return jsonify({'ok': True})


@app.route('/api/schedule', methods=['GET'])
def get_schedule_route():
    if not session.get('admin'):
        return jsonify({'ok': False, 'error': 'Unauthorized'}), 401
    rows = get_all_schedule()
    return jsonify([dict(r) for r in rows])


@app.route('/api/schedule', methods=['POST'])
def add_schedule_route():
    if not session.get('admin'):
        return jsonify({'ok': False}), 401
    data = request.get_json()
    slot_id = create_schedule(
        data.get('day', '').strip(),
        data.get('time', '').strip(),
        data.get('sport', '').strip(),
        data.get('trainer', '').strip()
    )
    return jsonify({'ok': True, 'id': slot_id})


@app.route('/api/schedule/<int:slot_id>', methods=['DELETE'])
def delete_schedule_route(slot_id):
    if not session.get('admin'):
        return jsonify({'ok': False}), 401
    delete_schedule(slot_id)
    return jsonify({'ok': True})


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    ip = request.remote_addr or 'unknown'

    if request.method == 'POST':
        if is_ip_blocked(ip):
            minutes = get_block_remaining_minutes(ip)
            return render_template('login.html', blocked=minutes)

        login = request.form.get('login', '').strip()
        password = request.form.get('password', '')

        if login == ADMIN_LOGIN and password == ADMIN_PASSWORD:
            reset_ip_block(ip)
            session['admin'] = True
            return redirect('/admin')

        record_failed_attempt(ip)
        if is_ip_blocked(ip):
            minutes = get_block_remaining_minutes(ip)
            return render_template('login.html', blocked=minutes)
        return render_template('login.html', error=True)

    return render_template('login.html')


@app.route('/admin/logout')
def admin_logout():
    session.pop('admin', None)
    return redirect('/admin/login')


@app.route('/admin')
@login_required
def admin_panel():
    return render_template('admin.html')


@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
