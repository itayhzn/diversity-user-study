/**
 * Google Apps Script for receiving study responses and writing to a Google Sheet.
 *
 * Setup:
 * 1. Create a new Google Sheet
 * 2. Open Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the web app URL into config.json's googleAppsScriptUrl field
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Build lookup map: expId__promptId__metricId -> winner, expId__promptId__time_seconds -> seconds
    var responseLookup = {};
    var responses = data.responses || [];
    for (var i = 0; i < responses.length; i++) {
      var resp = responses[i];
      var expId = resp.experiment_id || '';
      var promptId = resp.prompt_id || '';
      var ratings = resp.ratings || {};
      var metricKeys = Object.keys(ratings);
      for (var j = 0; j < metricKeys.length; j++) {
        var metricId = metricKeys[j];
        responseLookup[expId + '__' + promptId + '__' + metricId] = ratings[metricId].winner || '';
      }
      responseLookup[expId + '__' + promptId + '__time_seconds'] = resp.time_spent_seconds || 0;
    }

    // Build row using column_order for consistent schema
    var columnOrder = data.column_order || [];
    var metaValues = [
      new Date().toISOString(),
      data.session_id || '',
      data.user_email || '',
      data.start_time || '',
      data.end_time || '',
      data.randomization_seed || '',
    ];
    var dataValues = columnOrder.map(function(col) {
      return col in responseLookup ? responseLookup[col] : '';
    });
    var row = metaValues.concat(dataValues);

    // Serialize access to avoid race conditions on header creation
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      // Create headers on first submission using column_order for complete schema
      if (sheet.getLastRow() === 0) {
        var headers = ['timestamp', 'session_id', 'user_email', 'start_time', 'end_time', 'randomization_seed'];
        headers = headers.concat(columnOrder);
        sheet.appendRow(headers);
      }

      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Study response endpoint is active.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
