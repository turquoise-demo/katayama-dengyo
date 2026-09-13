/**
 * 片山電業 人工見積り電卓 受信スクリプト
 * - type:'ninku' → シート「案件」に1行追記（割付はJSONで保持）
 *
 * 使い方:
 * 1. 新しいスプレッドシートを作成し、そのIDを SPREADSHEET_ID に貼る
 * 2. 拡張機能 > Apps Script にこのコードを貼り付け
 * 3. デプロイ > 新しいデプロイ > ウェブアプリ / 実行ユーザー: 自分 / アクセス: 全員
 * 4. 発行された /exec URL を tools/index.html の GAS_URL に貼ってpush
 */
var SPREADSHEET_ID = 'ここにスプレッドシートIDを貼る';
var SHEET_NAME = '案件';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.type !== 'ninku') return out_({ ok: false, error: 'unknown type' });
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(['受信日時','案件名','受注額','工期(日)','出張(泊)','目標粗利率(%)',
                    '人工原価','出張加算','合計人工','割付合計(円)','割付明細(JSON)']);
      sh.setFrozenRows(1);
    }
    var tNinku = 0, tCost = 0;
    (d.rows || []).forEach(function(r){
      var nk = (r.people||0) * (r.days||0);
      tNinku += nk;
      tCost += nk * ((r.rate || d.baseCost || 30000) + (r.trip ? (d.tripAdd||9000) : 0));
    });
    sh.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
      d.name||'', d.amount||0, d.days||0, d.tripNights||0, d.margin||0,
      d.baseCost||30000, d.tripAdd||9000, tNinku, tCost,
      JSON.stringify(d.rows||[])
    ]);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  return out_({ ok: true, service: 'katayama-ninku' });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
