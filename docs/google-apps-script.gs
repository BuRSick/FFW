function doPost(e) {
  try {
    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const payload = JSON.parse(e.postData.contents || '{}');
    const row = [
      normalizeText_(payload.name),
      normalizeAttendance_(payload.answer),
      normalizeDrinks_(payload.drinkPreferences),
      normalizeText_(payload.foodPreference),
      new Date()
    ];

    sheet.appendRow(row);

    return jsonResponse_({
      ok: true
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error)
    });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'Wedding RSVP endpoint is running'
  });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'RSVP';
  const existingSheet = spreadsheet.getSheetByName(sheetName);

  if (existingSheet) return existingSheet;
  return spreadsheet.insertSheet(sheetName);
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

function normalizeDrinks_(value) {
  if (!Array.isArray(value)) return '';
  return value
    .map((item) => normalizeText_(item))
    .filter(Boolean)
    .join(', ');
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
