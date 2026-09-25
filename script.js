class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.chart = null;
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
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
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
        this.resetForm();
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

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: [
                        '#ef4444',
                        '#f97316',
                        '#eab308',
                        '#22c55e',
                        '#06b6d4',
                        '#3b82f6',
                        '#8b5cf6',
                        '#ec4899',
                        '#64748b'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    renderTransactionsList() {
        const tbody = document.getElementById('transactionsList');
        const emptyState = document.getElementById('emptyState');
        const filtered = this.getFilteredTransactions();

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            document.getElementById('transactionsTable').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.getElementById('transactionsTable').style.display = 'table';

        filtered.forEach(t => {
            const row = document.createElement('tr');
            const typeClass = t.type === 'income' ? 'type-income' : 'type-expense';
            const typeLabel = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            const amountDisplay = t.type === 'income' ? '+' : '-';

            row.innerHTML = `
                <td>${this.formatDate(t.date)}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td class="${typeClass}">${typeLabel}</td>
                <td class="amount-cell">${amountDisplay}${this.formatCurrency(t.amount)}</td>
                <td>
                    <button class="btn-danger" onclick="tracker.deleteTransaction(${t.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
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
