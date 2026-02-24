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

    // Build flat row from response data
    var row = [
      new Date().toISOString(),
      data.session_id || '',
      data.user_email || '',
      data.start_time || '',
      data.end_time || '',
      data.randomization_seed || '',
    ];

    // Add one column per prompt+metric combination
    var responses = data.responses || [];
    for (var i = 0; i < responses.length; i++) {
      var resp = responses[i];
      var ratings = resp.ratings || {};
      var metricKeys = Object.keys(ratings).sort();
      for (var j = 0; j < metricKeys.length; j++) {
        var key = metricKeys[j];
        row.push(ratings[key].winner || '');
      }
      // Also add time spent
      row.push(resp.time_spent_seconds || 0);
    }

    // Serialize access to avoid race conditions on header creation
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      // Create headers on first data row
      if (sheet.getLastRow() === 0) {
        var headers = ['timestamp', 'session_id', 'user_email', 'start_time', 'end_time', 'randomization_seed'];
        for (var i = 0; i < responses.length; i++) {
          var resp = responses[i];
          var ratings = resp.ratings || {};
          var metricKeys = Object.keys(ratings).sort();
          for (var j = 0; j < metricKeys.length; j++) {
            headers.push(resp.prompt_id + '_' + metricKeys[j]);
          }
          headers.push(resp.prompt_id + '_time_seconds');
        }
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
