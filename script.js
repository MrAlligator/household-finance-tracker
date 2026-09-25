class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.chart = null;
        this.sheetSyncEnabled = localStorage.getItem('sheetSyncEnabled') === 'true';
        this.SHEET_ID = "1yon-k-XQ5F9G0FvaWnk3eBSzSkgNjK7a_lHnhP99PM0";
        this.APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7r4soJ5D6cdiThLK8RY7cZFDsypWV-aUiLbDaD7AY4MRUG8NPJMQBRIWD8yD5tG_3gQ/exec";
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
        fetch(this.APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(transaction)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Data synced ke Google Sheets:', transaction.description);
            } else {
                console.warn('⚠️ Sync error:', data.error);
            }
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
