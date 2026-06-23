import sqlite3
from contextlib import contextmanager
from datetime import datetime
from config import DB_PATH


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as db:
        db.execute('''
            CREATE TABLE IF NOT EXISTS applications (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                name      TEXT NOT NULL,
                phone     TEXT NOT NULL,
                sport     TEXT NOT NULL,
                age       TEXT,
                comment   TEXT,
                status    TEXT DEFAULT "new",
                created   TEXT
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS trainers (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                name    TEXT NOT NULL,
                sport   TEXT NOT NULL,
                title   TEXT DEFAULT '',
                achieve TEXT DEFAULT '',
                photo   TEXT DEFAULT ''
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS schedule (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                day     TEXT NOT NULL,
                time    TEXT NOT NULL,
                sport   TEXT NOT NULL,
                trainer TEXT DEFAULT ''
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS ip_blocks (
                ip              TEXT PRIMARY KEY,
                fail_count      INTEGER DEFAULT 0,
                block_level     INTEGER DEFAULT 0,
                blocked_until   TEXT
            )
        ''')

    migrate_db()
    seed_trainers()


def migrate_db():
    with get_db() as db:
        cols = [c[1] for c in db.execute('PRAGMA table_info(trainers)').fetchall()]
        if 'photo' not in cols:
            db.execute('ALTER TABLE trainers ADD COLUMN photo TEXT DEFAULT ""')
            db.executemany(
                'UPDATE trainers SET photo=? WHERE name=?',
                [
                    ('/images/sambo.jpeg', 'Кулунбек'),
                    ('/images/samb.jpeg', 'Кундуз'),
                    ('/images/g3.jpeg', 'Асылбек'),
                    ('/images/g2.jpeg', 'Тилекмат'),
                    ('/images/karat.jpeg', 'Аксыбек'),
                ]
            )


def seed_trainers():
    with get_db() as db:
        count = db.execute('SELECT COUNT(*) FROM trainers').fetchone()[0]
        if count > 0:
            return
        initial = [
            ('Кулунбек', 'Самбо',  'Главный тренер', 'Мастер спорта. Подготовил более 50 призёров соревнований КР. Тренерский стаж — 15 лет.', '/images/sambo.jpeg'),
            ('Кундуз',   'Самбо',  'Тренер',         'Мастер спорта. Специализация — женское самбо и группы дети 6–12 лет.', '/images/samb.jpeg'),
            ('Асылбек',  'Бокс',   'Старший тренер', 'Чемпион Кыргызстана 2018, 2020. Призёр чемпионата Центральной Азии. Тренерский стаж — 10 лет.', '/images/g3.jpeg'),
            ('Тилекмат',  'Бокс',   'Тренер',         'Призёр городских и республиканских турниров. Специализация — юниорский и любительский бокс.', '/images/g2.jpeg'),
            ('Аксыбек',   'Карате', 'Тренер',         'Обладатель чёрного пояса, 2 дан. Призёр чемпионата Кыргызстана по WKF. Стаж 8 лет.', '/images/karat.jpeg'),
        ]
        db.executemany(
            'INSERT INTO trainers (name, sport, title, achieve, photo) VALUES (?,?,?,?,?)',
            initial
        )


def create_application(name, phone, sport, age, comment, created):
    with get_db() as db:
        cursor = db.execute(
            'INSERT INTO applications (name, phone, sport, age, comment, created) VALUES (?,?,?,?,?,?)',
            (name, phone, sport, age, comment, created)
        )
        return cursor.lastrowid


def get_all_applications():
    with get_db() as db:
        return db.execute('SELECT * FROM applications ORDER BY id DESC').fetchall()


def update_application_status(app_id, status):
    with get_db() as db:
        db.execute('UPDATE applications SET status=? WHERE id=?', (status, app_id))


def delete_application(app_id):
    with get_db() as db:
        db.execute('DELETE FROM applications WHERE id=?', (app_id,))


def get_all_trainers():
    with get_db() as db:
        return db.execute('SELECT * FROM trainers ORDER BY id').fetchall()


def create_trainer(name, sport, title, achieve, photo=''):
    with get_db() as db:
        cursor = db.execute(
            'INSERT INTO trainers (name, sport, title, achieve, photo) VALUES (?,?,?,?,?)',
            (name, sport, title, achieve, photo)
        )
        return cursor.lastrowid


def delete_trainer(trainer_id):
    with get_db() as db:
        db.execute('DELETE FROM trainers WHERE id=?', (trainer_id,))


def get_all_schedule():
    with get_db() as db:
        return db.execute('SELECT * FROM schedule ORDER BY id').fetchall()


def create_schedule(day, time, sport, trainer):
    with get_db() as db:
        cursor = db.execute(
            'INSERT INTO schedule (day, time, sport, trainer) VALUES (?,?,?,?)',
            (day, time, sport, trainer)
        )
        return cursor.lastrowid


def delete_schedule(slot_id):
    with get_db() as db:
        db.execute('DELETE FROM schedule WHERE id=?', (slot_id,))


BLOCK_DURATIONS = [5, 15, 60, 180, 1440]  # minutes: 5min, 15min, 1h, 3h, 1day


def get_ip_block(ip):
    with get_db() as db:
        row = db.execute('SELECT * FROM ip_blocks WHERE ip=?', (ip,)).fetchone()
        return dict(row) if row else None


def record_failed_attempt(ip):
    with get_db() as db:
        row = db.execute('SELECT * FROM ip_blocks WHERE ip=?', (ip,)).fetchone()
        if row:
            new_count = row['fail_count'] + 1
            if new_count >= 5:
                level = row['block_level'] + 1
                duration = BLOCK_DURATIONS[min(level - 1, len(BLOCK_DURATIONS) - 1)]
                until = datetime.now().timestamp() + duration * 60
                db.execute(
                    'UPDATE ip_blocks SET fail_count=0, block_level=?, blocked_until=? WHERE ip=?',
                    (level, until, ip)
                )
            else:
                db.execute('UPDATE ip_blocks SET fail_count=? WHERE ip=?', (new_count, ip))
        else:
            db.execute(
                'INSERT INTO ip_blocks (ip, fail_count, block_level, blocked_until) VALUES (?, 1, 0, NULL)',
                (ip,)
            )


def reset_ip_block(ip):
    with get_db() as db:
        db.execute('DELETE FROM ip_blocks WHERE ip=?', (ip,))


def is_ip_blocked(ip):
    row = get_ip_block(ip)
    if not row or not row.get('blocked_until'):
        return False
    try:
        until = float(row['blocked_until'])
    except (ValueError, TypeError):
        return False
    if datetime.now().timestamp() < until:
        return True
    with get_db() as db:
        db.execute('UPDATE ip_blocks SET fail_count=0 WHERE ip=?', (ip,))
    return False


def get_block_remaining_minutes(ip):
    row = get_ip_block(ip)
    if not row or not row.get('blocked_until'):
        return 0
    try:
        until = float(row['blocked_until'])
    except (ValueError, TypeError):
        return 0
    remaining = until - datetime.now().timestamp()
    if remaining <= 0:
        with get_db() as db:
            db.execute('UPDATE ip_blocks SET fail_count=0 WHERE ip=?', (ip,))
        return 0
    return int(remaining / 60) + 1
