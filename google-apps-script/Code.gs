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

    var HEADERS = ['timestamp','session_id','user_email','start_time','end_time',
                   'randomization_seed','experiment_name','prompt_id','metric','winner'];

    var timestamp = new Date().toISOString();
    var sessionId = data.session_id || '';
    var userEmail = data.user_email || '';
    var startTime = data.start_time || '';
    var endTime   = data.end_time || '';
    var seed      = data.randomization_seed || '';
    var responses = data.responses || [];

    // Build one row per metric rating
    var rows = [];
    for (var i = 0; i < responses.length; i++) {
      var resp     = responses[i];
      var expId    = resp.experiment_id || '';
      var promptId = resp.prompt_id || '';
      var ratings  = resp.ratings || {};
      var metrics  = Object.keys(ratings);
      for (var j = 0; j < metrics.length; j++) {
        var metricId = metrics[j];
        var winner   = ratings[metricId].winner || '';
        rows.push([timestamp, sessionId, userEmail, startTime, endTime,
                   seed, expId, promptId, metricId, winner]);
      }
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
      }
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length)
             .setValues(rows);
      }
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
