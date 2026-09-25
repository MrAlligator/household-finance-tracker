// GOOGLE SHEETS INTEGRATION GUIDE
// Ikuti langkah-langkah di bawah untuk integrate dengan Google Sheets

/*
LANGKAH 1: Setup Google Apps Script
=====================================
1. Buka https://script.google.com
2. Buat project baru
3. Ganti kode di editor dengan kode di bawah bagian "GOOGLE APPS SCRIPT CODE"
4. Ganti YOUR_SHEET_ID dengan Sheet ID Anda (dari URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/...)
5. Deploy sebagai Web App:
   - Klik "Deploy" → "New Deployment"
   - Type: "Web app"
   - Execute as: [Your account]
   - Who has access: "Anyone"
   - Copy URL deployment dan simpan

LANGKAH 2: Setup di index.html
==============================
1. Di script.js, uncomment kode OPTIONAL_GOOGLE_SHEETS_SYNC di bawah
2. Ganti GOOGLE_APPS_SCRIPT_URL dengan URL dari step 1
3. Save dan test

LANGKAH 3: Setup Google Sheets
==============================
1. Buat spreadsheet baru di Google Sheets
2. Buat sheet bernama "Transaksi"
3. Header: Tanggal | Keterangan | Kategori | Tipe | Jumlah
4. Copy SHEET_ID dari URL
*/

// ============================================
// GOOGLE APPS SCRIPT CODE (Copy ke script.google.com)
// ============================================
/*
function doPost(e) {
  try {
    const SHEET_ID = "YOUR_SHEET_ID"; // Ganti dengan Sheet ID Anda
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const ws = sheet.getSheetByName("Transaksi");
    
    const data = JSON.parse(e.postData.contents);
    
    // Append row ke sheet
    ws.appendRow([
      data.date,
      data.description,
      data.category,
      data.type,
      data.amount,
      new Date().toLocaleString('id-ID')
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: "Data tersimpan"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (jalankan dari Apps Script editor untuk debug)
function testPost() {
  const testData = {
    date: new Date().toISOString().split('T')[0],
    description: "Test transaksi",
    category: "Makanan",
    type: "expense",
    amount: 50000
  };
  
  const response = doPost({
    postData: {
      contents: JSON.stringify(testData)
    }
  });
  
  Logger.log(response.getContent());
}
*/

// ============================================
// OPTIONAL_GOOGLE_SHEETS_SYNC (Uncomment di script.js)
// ============================================
/*
// Tambahkan ini di class FinanceTracker, dalam method addTransaction()
// Setelah this.saveTransactions(); tambahkan:

syncToGoogleSheets(transaction) {
    const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/userweb"; // Ganti URL ini
    
    fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(transaction)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Data tersimpan ke Google Sheets');
        } else {
            console.warn('⚠️ Gagal sync ke Google Sheets:', data.error);
        }
    })
    .catch(error => {
        console.warn('⚠️ Koneksi Google Sheets error (data tetap tersimpan lokal):', error);
    });
}

// Panggil di addTransaction() setelah this.render():
// this.syncToGoogleSheets(transaction);
*/

// ============================================
// IMPORT DATA DARI CSV
// ============================================
/*
Untuk import CSV ke localStorage:

1. Export CSV dari Excel/Google Sheets dengan format:
   Tanggal,Keterangan,Kategori,Tipe,Jumlah
   2026-01-01,Belanja Sayur,Makanan,expense,50000

2. Paste kode di bawah di browser console (F12 → Console)

const importCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const header = lines[0].split(',');
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === 5) {
            transactions.push({
                id: Date.now() + i,
                date: values[0],
                description: values[1],
                category: values[2],
                type: values[3],
                amount: parseInt(values[4])
            });
        }
    }
    
    // Merge dengan data existing
    const existing = JSON.parse(localStorage.getItem('transactions') || '[]');
    const merged = [...transactions, ...existing];
    localStorage.setItem('transactions', JSON.stringify(merged));
    
    console.log(`✅ ${transactions.length} transaksi berhasil di-import`);
    location.reload();
};

// Copy CSV text dan jalankan:
// importCSV(`Tanggal,Keterangan,Kategori,Tipe,Jumlah
// 2026-01-01,Belanja Sayur,Makanan,expense,50000`);
*/

// ============================================
// BACKUP & RESTORE
// ============================================
/*
Backup data (jalankan di console):
console.log(localStorage.getItem('transactions'));
// Copy output dan simpan ke file .json

Restore data (jalankan di console):
localStorage.setItem('transactions', '[paste JSON di sini]');
location.reload();
*/

console.log('📚 Lihat file ini untuk panduan integrasi Google Sheets dan import/export');
