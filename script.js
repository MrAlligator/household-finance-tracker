class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.chart = null;
        this.sheetSyncEnabled = localStorage.getItem('sheetSyncEnabled') === 'true';
        this.FORM_ID = "1DBPIzvydeN59-9705Xk7ldboHLO9tFB1U8FsxHER6MU";
        this.FORM_URL = `https://docs.google.com/forms/d/${this.FORM_ID}/formResponse`;
        this.init();
    }

    init() {
        this.loadTransactions();
        this.setupEventListeners();
        this.setDefaultDate();
        this.populateMonthFilter();
        this.render();
        this.preventZoom();
    }

    preventZoom() {
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
    }

    setupEventListeners() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        document.getElementById('searchInput').addEventListener('input', () => this.render());
        document.getElementById('monthFilter').addEventListener('change', () => this.render());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importCSV(e));
        document.getElementById('fetchSheetsBtn').addEventListener('click', () => this.fetchFromSheets());
        document.getElementById('syncSheetBtn').addEventListener('click', () => this.toggleSheetSync());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('clearCacheBtn').addEventListener('click', () => this.clearCache());
        document.getElementById('clearCacheBtn').addEventListener('click', () => this.clearCache());

        // Modal handlers
        document.getElementById('fabBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('formModal').addEventListener('click', (e) => {
            if (e.target.id === 'formModal') this.closeModal();
        });
    }

    openModal() {
        document.getElementById('formModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('formModal').classList.remove('active');
        document.body.style.overflow = '';
        this.resetForm();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseInt(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || !category || !type || !date) {
            alert('Mohon isi semua field');
            return;
        }

        const transaction = {
            id: Date.now(),
            description,
            amount,
            category,
            type,
            date,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        
        if (this.sheetSyncEnabled) {
            this.syncToGoogleSheets(transaction);
        }
        
        this.closeModal();
        this.render();
    }

    resetForm() {
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();
    }

    deleteTransaction(id) {
        if (confirm('Hapus transaksi ini?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.render();
        }
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    loadTransactions() {
        const data = localStorage.getItem('transactions');
        this.transactions = data ? JSON.parse(data) : [];
    }

    getFilteredTransactions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const monthFilter = document.getElementById('monthFilter').value;

        return this.transactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm) ||
                                t.category.toLowerCase().includes(searchTerm);
            
            if (!monthFilter) return matchesSearch;

            const [filterYear, filterMonth] = monthFilter.split('-');
            const [txYear, txMonth] = t.date.split('-');
            
            return matchesSearch && txYear === filterYear && txMonth === filterMonth;
        });
    }

    calculateSummary() {
        const filtered = this.getFilteredTransactions();
        let income = 0, expense = 0;

        filtered.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
            } else {
                expense += t.amount;
            }
        });

        return { income, expense, balance: income - expense };
    }

    calculateCategoryExpense() {
        const filtered = this.getFilteredTransactions();
        const categoryMap = {};

        filtered.forEach(t => {
            if (t.type === 'expense') {
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            }
        });

        return categoryMap;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    updateSummary() {
        const { income, expense, balance } = this.calculateSummary();
        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalExpense').textContent = this.formatCurrency(expense);
        document.getElementById('totalBalance').textContent = this.formatCurrency(balance);

        const balanceEl = document.getElementById('totalBalance');
        balanceEl.parentElement.classList.remove('positive', 'negative');
        if (balance >= 0) {
            balanceEl.parentElement.classList.add('positive');
        } else {
            balanceEl.parentElement.classList.add('negative');
        }
    }

    updateChart() {
        const categoryData = this.calculateCategoryExpense();
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        const ctx = document.getElementById('categoryChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        const colors = [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
            '#64748b'
        ];

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: window.innerWidth < 768 ? 'bottom' : 'right',
                        labels: {
                            padding: 15,
                            font: { 
                                size: window.innerWidth < 480 ? 11 : 12,
                                weight: '500'
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        padding: 12,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        displayColors: true,
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                return ' Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: false,
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    renderTransactionsList() {
        const listContainer = document.getElementById('transactionsList');
        const filtered = this.getFilteredTransactions();

        listContainer.innerHTML = '';

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="empty-state"><p>Belum ada transaksi. Mulai tambah transaksi baru.</p></div>';
            return;
        }

        filtered.forEach(t => {
            const card = document.createElement('div');
            card.className = `transaction-card ${t.type}`;
            
            const typeLabel = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            const amountDisplay = t.type === 'income' ? '+' : '-';
            const formattedDate = this.formatDate(t.date);
            
            card.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-meta">
                        <span>${formattedDate}</span>
                        <span>${t.category}</span>
                        <span>${typeLabel}</span>
                    </div>
                </div>
                <div class="transaction-amount ${t.type}">
                    <div class="transaction-amount-value">${amountDisplay}${this.formatCurrency(t.amount)}</div>
                </div>
                <div class="transaction-actions">
                    <button class="transaction-delete" onclick="tracker.deleteTransaction(${t.id})">Hapus</button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    populateMonthFilter() {
        const monthSet = new Set();
        this.transactions.forEach(t => {
            monthSet.add(t.date.substring(0, 7));
        });

        const monthFilter = document.getElementById('monthFilter');
        const months = Array.from(monthSet).sort().reverse();

        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            option.textContent = monthName;
            monthFilter.appendChild(option);
        });
    }

    exportCSV() {
        if (this.transactions.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }

        let csv = 'Tanggal,Keterangan,Kategori,Tipe,Jumlah\n';
        this.transactions.forEach(t => {
            csv += `"${t.date}","${t.description}","${t.category}","${t.type}",${t.amount}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `keuangan_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.trim().split('\n');
                const header = lines[0].split(',');
                const imported = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
                    if (values.length === 5) {
                        imported.push({
                            id: Date.now() + i,
                            date: values[0],
                            description: values[1],
                            category: values[2],
                            type: values[3],
                            amount: parseInt(values[4]),
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                if (imported.length === 0) {
                    alert('CSV tidak valid atau kosong');
                    return;
                }

                // Merge dengan data existing
                this.transactions = [...imported, ...this.transactions];
                this.saveTransactions();
                this.populateMonthFilter();
                this.render();

                alert(`✅ Berhasil import ${imported.length} transaksi!`);
                
                // Reset file input
                document.getElementById('importFile').value = '';
            } catch (error) {
                alert('❌ Error parsing CSV: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    fetchFromSheets() {
        const SHEET_ID = "1yon-k-XQ5F9G0FvaWnk3eBSzSkgNjK7a_lHnhP99PM0";
        const SHEET_GID = 0; // Default sheet
        const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

        // Use CORS proxy untuk fetch
        const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
        
        alert('🔄 Fetching data dari Google Sheets...');

        fetch(CSV_URL)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.trim().split('\n');
                const header = lines[0];
                const imported = [];

                // Skip header, parse data
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
                    if (values.length >= 5) {
                        imported.push({
                            id: Date.now() + i,
                            date: values[0],
                            description: values[1],
                            category: values[2],
                            type: values[3],
                            amount: parseInt(values[4]),
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                if (imported.length === 0) {
                    alert('⚠️ Data dari Sheets kosong atau format tidak sesuai');
                    return;
                }

                // Merge dengan existing data (Sheets data di depan)
                this.transactions = [...imported, ...this.transactions];
                this.saveTransactions();
                this.populateMonthFilter();
                this.render();

                alert(`✅ Berhasil fetch ${imported.length} transaksi dari Sheets!`);
            })
            .catch(error => {
                console.error('Error fetching from Sheets:', error);
                alert('❌ Gagal fetch dari Sheets. Pastikan:\n1. Sheet sudah di-share (public)\n2. Format sesuai: Tanggal, Keterangan, Kategori, Tipe, Jumlah');
            });
    }

    clearAll() {
        if (confirm('Hapus SEMUA transaksi? Ini tidak bisa dibatalkan!')) {
            this.transactions = [];
            this.saveTransactions();
            this.render();
        }
    }

    clearCache() {
        if (confirm('Clear semua cache & data? Ini tidak bisa dibatalkan!')) {
            localStorage.clear();
            sessionStorage.clear();
            
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            
            alert('✅ Cache cleared! Page akan reload...');
            setTimeout(() => window.location.reload(), 500);
        }
    }

    syncToGoogleSheets(transaction) {
        const date = new Date(transaction.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const formData = new FormData();
        
        formData.append('entry.1833836517_year', year);
        formData.append('entry.1833836517_month', month);
        formData.append('entry.1833836517_day', day);
        formData.append('entry.1404772862', transaction.description);
        formData.append('entry.1750772740', transaction.amount);
        formData.append('entry.365073415', transaction.category);
        formData.append('entry.1873797266', transaction.type === 'expense' ? 'Pengeluaran' : 'Pemasukan');
        
        fetch(this.FORM_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        })
        .then(() => {
            console.log('✅ Data synced ke Google Sheets:', transaction.description);
        })
        .catch(error => {
            console.warn('⚠️ Network error saat sync:', error);
        });
    }

    toggleSheetSync() {
        this.sheetSyncEnabled = !this.sheetSyncEnabled;
        localStorage.setItem('sheetSyncEnabled', this.sheetSyncEnabled);
        
        const status = this.sheetSyncEnabled ? 'ON ✅' : 'OFF ⭕';
        alert(`Google Sheets Sync: ${status}`);
        this.render();
    }

    render() {
        this.updateSummary();
        this.updateChart();
        this.renderTransactionsList();
    }
}

const tracker = new FinanceTracker();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch((error) => {
                console.warn('⚠️ Service Worker registration failed:', error);
            });
    });
}

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
