# Pencatat Keuangan Rumah Tangga

Aplikasi web sederhana untuk mencatat dan mengelola keuangan rumah tangga Anda. Dibangun dengan HTML, CSS, dan JavaScript murni.

## Fitur

✅ **Tambah Transaksi** - Catat pengeluaran dan pemasukan dengan mudah
✅ **Kategori** - Organisir transaksi dengan 9 kategori berbeda
✅ **Ringkasan Real-time** - Lihat total pemasukan, pengeluaran, dan saldo
✅ **Visualisasi Grafik** - Pie chart pengeluaran per kategori
✅ **Search & Filter** - Cari transaksi dan filter per bulan
✅ **Export CSV** - Backup data ke Google Sheets atau Excel
✅ **Local Storage** - Data tersimpan aman di browser Anda
✅ **Responsive Design** - Berfungsi di desktop, tablet, dan mobile

## Instalasi & Penggunaan

### Opsi 1: Langsung Buka (Tercepat)
1. Download atau clone repository ini
2. Buka file `index.html` di browser favorit Anda
3. Mulai gunakan aplikasi

### Opsi 2: GitHub Pages (Untuk Shared Access)
1. Push repository ke GitHub
2. Di Settings > Pages, pilih branch `main` sebagai source
3. Akses aplikasi via `https://username.github.io/household-finance-tracker`

## Cara Menggunakan

### Tambah Transaksi
1. Isi kolom "Keterangan" (contoh: Belanja Sayur)
2. Masukkan "Jumlah" (dalam Rupiah)
3. Pilih "Kategori" dari dropdown
4. Pilih "Tipe" (Pengeluaran atau Pemasukan)
5. Tentukan "Tanggal" transaksi
6. Klik tombol "Simpan Transaksi"

### Filter & Cari
- Gunakan kotak "Cari transaksi..." untuk mencari berdasarkan keterangan atau kategori
- Gunakan dropdown "Semua Bulan" untuk filter per bulan
- Grafik dan summary otomatis update sesuai filter

### Export ke Google Sheets
1. Klik tombol "📥 Export CSV"
2. File CSV akan download otomatis
3. Buka Google Sheets
4. Klik File → Import → Upload file CSV → Pilih file yang sudah di-download
5. Data siap di-review dan di-share

### Backup Data
Karena data tersimpan di localStorage browser:
- Jangan hapus data browser (cache clearing akan menghapus data)
- Rutin export CSV untuk backup
- Gunakan browser yang sama untuk akses konsisten

## Upgrade ke Google Sheets (Opsional)

Untuk sync otomatis dengan Google Sheets:

1. Buka [Google Apps Script](https://script.google.com)
2. Create new project
3. Paste kode ini:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID');
  const ws = sheet.getSheetByName('Transaksi');
  
  const data = JSON.parse(e.postData.contents);
  ws.appendRow([data.date, data.description, data.category, data.type, data.amount]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}));
}
```

4. Deploy as web app (Execute as: Me, Who has access: Anyone)
5. Copy deployment URL
6. Update `script.js` bagian `addTransaction()` dengan fetch ke Apps Script URL
7. Done! Transaksi otomatis tersimpan ke Google Sheets

## Struktur File

```
household-finance-tracker/
├── index.html        # HTML utama
├── style.css         # Styling
├── script.js         # Logic aplikasi
├── README.md         # File ini
└── .gitignore        # Git ignore file
```

## Teknologi

- HTML5
- CSS3 (Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Chart.js (untuk visualisasi)
- localStorage (untuk persistensi data)

## Browser Support

- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Tips & Trik

1. **Akses dari Mobile** - Bookmark aplikasi di home screen untuk akses cepat
2. **Kategori Custom** - Edit file HTML untuk tambah kategori baru di `<select id="category">`
3. **Dark Mode** - Bisa implementasi dengan toggle di CSS
4. **Pembayaran Utang** - Gunakan kategori "Lainnya" atau tambah kategori baru

## Troubleshooting

**Data hilang?**
- Check localStorage di DevTools (F12 → Application → Local Storage)
- Atau restore dari file CSV backup

**Grafik tidak muncul?**
- Refresh halaman atau clear browser cache
- Pastikan ada transaksi dengan tipe "Pengeluaran"

**Performa lambat?**
- Aplikasi ringan, biasanya bukan masalah
- Coba clear localStorage jika sudah 10000+ transaksi

## Kontribusi & Development

Untuk extend atau customize:

1. Edit `style.css` untuk ubah tema/warna
2. Edit `index.html` untuk tambah/ubah form fields
3. Edit `script.js` untuk tambah fitur baru
4. Test di browser sebelum push

## License

MIT - Bebas digunakan untuk keperluan pribadi dan komersial

## Roadmap (Ide Masa Depan)

- 📱 PWA support untuk offline mode
- 📊 Budget planner & goal setting
- 💳 Import dari bank statements
- 📧 Email summary bulanan
- 🔐 Password protection untuk data
- ☁️ Cloud sync dengan Google Drive
- 📈 Laporan detail & analytics

---

**Dibuat dengan ❤️ untuk memudahkan tracking keuangan rumah tangga Anda**
