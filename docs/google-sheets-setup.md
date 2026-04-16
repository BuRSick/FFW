# Google Sheets Setup

Работаем с таблицей:

- [Google Sheet](https://docs.google.com/spreadsheets/d/1Qcg1lUG1Sh8MQgsXM80bXgqZduAbpn97DcK-u6aEjv4/edit?gid=1102006311#gid=1102006311)

## Что сделать прямо сейчас

1. Откройте `Apps Script`.
2. Полностью удалите текущий код из `Code.gs`.
3. Вставьте новый код из файла:
   - [google-apps-script.gs](C:/Users/RPUser/Desktop/wedding-race-3d/FFW/docs/google-apps-script.gs)
4. Сохраните файл.
5. Нажмите:
   - `Deploy`
   - `Manage deployments`
   - откройте текущий `Web app`
   - `Edit`
   - `Deploy`

Проверьте:

- `Execute as`: `Me`
- `Who has access`: `Anyone`

## Самый важный тест

В редакторе Apps Script:

1. В верхнем списке функций выберите `testWriteRow`
2. Нажмите `Run`
3. Если Google попросит разрешения, подтвердите доступ
4. Откройте таблицу и обновите ее

Если после `testWriteRow` строка появилась:

- сам Apps Script и доступ к таблице настроены правильно
- тогда проблема была в способе отправки с сайта, и новый сайт после деплоя должен уже писать

Если после `testWriteRow` строка не появилась:

- значит проблема внутри Apps Script/deploy/доступов, а не в сайте

## Что делает новый вариант

- сайт теперь отправляет данные в Apps Script через `GET`
- Apps Script умеет принимать данные и через `doGet`, и через `doPost`
- это надежнее для GitHub Pages и кросс-доменных запросов

## Какие данные должны попасть в таблицу

1. `Имя`
2. `Придет/Не придет`
3. `Предпочтения по напиткам`
4. `Предпочтение по еде`
5. `Дата ответа`
