# WhatsApp Broadcaster

Telegram-бот для управления WhatsApp рассылками.

## Деплой на Railway

1. Создай репозиторий на GitHub
2. Загрузи все файлы (см. структуру ниже)
3. Зайди на https://railway.app
4. New Project → Deploy from GitHub
5. Добавь PostgreSQL: New → Database → PostgreSQL
6. Добавь переменные:
   - `TELEGRAM_BOT_TOKEN` - токен от @BotFather
   - `ADMIN_TELEGRAM_IDS` - твой Telegram ID
   - `DATABASE_URL` - скопируй из PostgreSQL
   - `PUPPETEER_EXECUTABLE_PATH` = /usr/bin/chromium

## Команды бота

- `/start` - Главное меню
- `/accounts` - Управление аккаунтами
- `/groups` - Просмотр групп
- `/broadcast` - Создать рассылку
- `/status` - Статус рассылок

## Как пользоваться

1. Добавь WhatsApp аккаунт
2. Отсканируй QR-код
3. Синхронизируй архивные группы
4. Создай рассылку (видео + текст)
5. Запусти!