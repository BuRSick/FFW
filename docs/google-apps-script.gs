const SPREADSHEET_ID = '1Qcg1lUG1Sh8MQgsXM80bXgqZduAbpn97DcK-u6aEjv4';
const SHEET_NAME = 'RSVP';

function doPost(e) {
  return saveResponse_(getPayload_(e));
}

function doGet(e) {
  const payload = getPayload_(e);

  if (payload.name || payload.answer || payload.drinkPreferences || payload.foodPreference) {
    return saveResponse_(payload);
  }

  return jsonResponse_({
    ok: true,
    message: 'Wedding RSVP endpoint is running'
  });
}

function saveResponse_(payload) {
  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const row = [
      normalizeText_(payload.name),
      normalizeAttendance_(payload.answer),
      normalizeText_(payload.drinkPreferences),
      normalizeText_(payload.foodPreference),
      new Date()
    ];

    sheet.appendRow(row);

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error)
    });
  }
}

function getPayload_(e) {
  const params = (e && e.parameter) || {};
  const rawBody = e && e.postData && e.postData.contents;

  if (rawBody && rawBody.trim().startsWith('{')) {
    return JSON.parse(rawBody);
  }

  return {
    name: params.name || '',
    answer: params.answer || '',
    drinkPreferences: params.drinkPreferences || '',
    foodPreference: params.foodPreference || '',
    createdAt: params.createdAt || ''
  };
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const existingSheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (existingSheet) return existingSheet;
  return spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  const headers = ['Имя', 'Придет/Не придет', 'Предпочтения по напиткам', 'Предпочтение по еде', 'Дата ответа'];
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];

  const matches = headers.every((header, index) => currentHeaders[index] === header);
  if (matches) return;

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function normalizeText_(value) {
  return String(value || '').trim();
}

function normalizeAttendance_(value) {
  if (value === 'yes') return 'Придет';
  if (value === 'no') return 'Не придет';
  return normalizeText_(value);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function testWriteRow() {
  saveResponse_({
    name: 'Тестовый гость',
    answer: 'yes',
    drinkPreferences: 'Шампанское | Вино белое',
    foodPreference: 'Томленые говяжьи щечки с картофельным пюре'
  });
}
