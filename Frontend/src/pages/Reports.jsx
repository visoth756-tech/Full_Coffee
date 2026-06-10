import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileText, DollarSign, CreditCard, Calendar, Loader2, AlertTriangle,
    Printer, Eye, X, Filter, RefreshCw, Clock, XCircle, CheckCircle,
    TrendingUp, PieChart, Download, Search, ChevronLeft, ChevronRight,
    Receipt, Tag, CalendarRange, Wallet, Landmark, QrCode
} from 'lucide-react';
import api from '../api/axios';

export default function Reports() {
    const [allPayments, setAllPayments] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Date range filter
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [quickRange, setQuickRange] = useState('');

    // Search & pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Financial summaries
    const [summary, setSummary] = useState({
        grossRevenue: 0,
        netRevenue: 0,
        taxCollected: 0,
        digitalSettled: 0,
        cardSettled: 0,
        averageTicket: 0,
        invoiceCount: 0,
        totalDiscounts: 0
    });

    // Payment method breakdown
    const [paymentBreakdown, setPaymentBreakdown] = useState({});

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [paymentsRes, ordersRes] = await Promise.all([
                api.get('/payments', config),
                api.get('/orders', config)
            ]);

            const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.list || []);
            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.list || []);

            setAllPayments(payments);
            setAllOrders(orders);
            setFilteredPayments(payments);
            applyFilters(payments, orders, startDate, endDate);
        } catch (err) {
            setErrorMessage('Failed to load financial data. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const applyFilters = (payments, orders, sDate, eDate) => {
        let filtered = [...payments];

        // Date filter
        if (sDate || eDate) {
            filtered = filtered.filter(payment => {
                const dateStr = payment.timestamp || payment.createdAt || payment.timstamp;
                if (!dateStr) return true;
                const paymentDate = new Date(dateStr);
                const start = sDate ? new Date(sDate) : null;
                const end = eDate ? new Date(eDate) : null;
                if (start && paymentDate < start) return false;
                if (end) {
                    const endOfDay = new Date(end);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (paymentDate > endOfDay) return false;
                }
                return true;
            });
        }

        // Search query (order_id or payment_id)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.payment_id?.toString().includes(q) ||
                p.order_id?.toString().includes(q) ||
                p.payment_method?.toLowerCase().includes(q)
            );
        }

        setFilteredPayments(filtered);
        calculateFinancials(filtered, orders);
        calculatePaymentBreakdown(filtered);
        setCurrentPage(1);
    };

    const calculateFinancials = (payments, orders) => {
        let gross = 0;
        let digital = 0;
        let card = 0;
        let taxSum = 0;
        let discountSum = 0;
        let completedCount = 0;

        payments.forEach(payment => {
            const status = String(payment.status || payment.payment_status || '').toLowerCase();
            if (['cancelled', 'failed', 'pending'].includes(status)) return;

            const amt = parseFloat(payment.amount || 0);
            gross += amt;
            completedCount++;

            // Find associated order to get tax and discount
            const order = orders.find(o => o.order_id === payment.order_id);
            if (order) {
                taxSum += parseFloat(order.tax || order.tax_amount || 0);
                discountSum += parseFloat(order.discount || order.discount_amount || 0);
            }

            if (payment.payment_method === 'Credit Card') {
                card += amt;
            } else {
                digital += amt;
            }
        });

        setSummary({
            grossRevenue: gross.toFixed(2),
            netRevenue: (gross - taxSum - discountSum).toFixed(2),
            taxCollected: taxSum.toFixed(2),
            digitalSettled: digital.toFixed(2),
            cardSettled: card.toFixed(2),
            averageTicket: completedCount > 0 ? (gross / completedCount).toFixed(2) : '0.00',
            invoiceCount: completedCount,
            totalDiscounts: discountSum.toFixed(2)
        });
    };

    const calculatePaymentBreakdown = (payments) => {
        const breakdown = {};
        payments.forEach(payment => {
            const method = payment.payment_method || 'Unknown';
            const amount = parseFloat(payment.amount || 0);
            breakdown[method] = (breakdown[method] || 0) + amount;
        });
        setPaymentBreakdown(breakdown);
    };

    // Quick date presets
    const setQuickDateRange = (range) => {
        setQuickRange(range);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (range) {
            case 'today':
                start = today;
                end = today;
                break;
            case 'week':
                start = new Date(today.setDate(today.getDate() - 7));
                end = new Date();
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date();
                break;
            case 'quarter':
                start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                end = new Date();
                break;
            default:
                setStartDate('');
                setEndDate('');
                applyFilters(allPayments, allOrders, '', '');
                return;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
        applyFilters(allPayments, allOrders, start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    };

    const handleApplyDateFilter = (e) => {
        e.preventDefault();
        applyFilters(allPayments, allOrders, startDate, endDate);
    };

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setQuickRange('');
        setSearchQuery('');
        applyFilters(allPayments, allOrders, '', '');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters(allPayments, allOrders, startDate, endDate);
    };

    // Pagination
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const fetchOrderDetails = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedOrderDetails(response.data);
        } catch (err) {
            setSelectedOrderDetails(null);
        }
    };

    const openDetailModal = async (payment) => {
        setSelectedInvoice(payment);
        await fetchOrderDetails(payment.order_id);
        setIsDetailModalOpen(true);
    };

    const handlePrintReceipt = (invoice) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head><title>Receipt #${invoice.payment_id}</title></head>
        <body style="font-family: monospace; padding: 20px;">
          <h2>☕ Samurai Coffee</h2>
          <p>Receipt: #INV-${invoice.payment_id}</p>
          <p>Order: #ORD-${invoice.order_id}</p>
          <p>Date: ${new Date(invoice.timestamp || invoice.createdAt).toLocaleString()}</p>
          <p>Amount: $${parseFloat(invoice.amount).toFixed(2)}</p>
          <p>Method: ${invoice.payment_method}</p>
          <hr />
          <p>Thank you for your purchase!</p>
        </body>
      </html>
    `);
        printWindow.print();
        printWindow.close();
    };

    const exportToCSV = () => {
        const headers = ['Payment ID', 'Order ID', 'Amount', 'Method', 'Date', 'Status'];
        const rows = filteredPayments.map(p => [
            p.payment_id,
            p.order_id,
            parseFloat(p.amount).toFixed(2),
            p.payment_method,
            new Date(p.timestamp || p.createdAt).toLocaleString(),
            p.status || p.payment_status || 'Completed'
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusBadge = (status, paymentStatus, method) => {
        const s = String(status || '').toLowerCase();
        const p = String(paymentStatus || '').toLowerCase();

        if (s === 'cancelled' || p === 'failed') {
            return { classes: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800', icon: XCircle, label: 'Cancelled' };
        }
        if (s === 'pending' || p === 'pending') {
            return { classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800', icon: Clock, label: 'Pending' };
        }
        return {
            classes: method === 'Credit Card'
                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
            icon: CheckCircle,
            label: method || 'Settled'
        };
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'Credit Card': return <CreditCard size={14} />;
            case 'KHQR': return <QrCode size={14} />;
            default: return <Landmark size={14} />;
        }
    };

    const maxBreakdown = Math.max(...Object.values(paymentBreakdown), 1);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                        Financial Reports
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Comprehensive audit of all transactions and settlements
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        disabled={filteredPayments.length === 0}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition-all disabled:opacity-40"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
                {['today', 'week', 'month', 'quarter'].map(range => (
                    <button
                        key={range}
                        onClick={() => setQuickDateRange(range)}
                        className={`px-3 py-1.5 text-[11px] font-black uppercase rounded-full transition-all ${quickRange === range
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                    >
                        {range}
                    </button>
                ))}
                <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 text-[11px] font-black uppercase rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200"
                >
                    Clear all
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
                <form onSubmit={handleApplyDateFilter} className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                placeholder="Start date"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                placeholder="End date"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center gap-1">
                            <Filter size={14} /> Apply
                        </button>
                    </div>
                </form>
                <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search by payment ID, order ID, or method..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    />
                </div>
            </div>

            {errorMessage && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 rounded-xl text-rose-700 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {errorMessage}
                </div>
            )}

            {isLoading ? (
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-28"></div>
                        ))}
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl h-96"></div>
                </div>
            ) : (
                <>
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard title="Gross Revenue" value={`$${summary.grossRevenue}`} icon={DollarSign} color="emerald" />
                        <SummaryCard title="Net Revenue" value={`$${summary.netRevenue}`} icon={TrendingUp} color="amber" />
                        <SummaryCard title="Tax Collected" value={`$${summary.taxCollected}`} icon={Receipt} color="purple" />
                        <SummaryCard title="Avg. Ticket" value={`$${summary.averageTicket}`} icon={Wallet} color="blue" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Additional summaries */}
                        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 space-y-4">
                            <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                                <PieChart size={14} className="text-amber-500" />
                                Payment Methods
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(paymentBreakdown).map(([method, amount]) => {
                                    const percentage = (amount / maxBreakdown) * 100;
                                    return (
                                        <div key={method}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="flex items-center gap-1">{getPaymentIcon(method)} {method}</span>
                                                <span className="font-mono font-bold">${amount.toFixed(2)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 space-y-4">
                            <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={14} className="text-cyan-500" />
                                Settlement Split
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Digital Wallets</span>
                                    <span className="font-mono font-bold">${summary.digitalSettled}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Card Terminal</span>
                                    <span className="font-mono font-bold">${summary.cardSettled}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t">
                                    <span className="font-bold">Total Invoices</span>
                                    <span className="font-mono font-bold">{summary.invoiceCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Discounts Applied</span>
                                    <span className="font-mono font-bold text-rose-500">-${summary.totalDiscounts}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transactions count card */}
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase opacity-80">Total Transactions</span>
                                <FileText size={20} />
                            </div>
                            <p className="text-4xl font-black mt-4">{summary.invoiceCount}</p>
                            <p className="text-xs font-medium mt-2 opacity-90">Settled payments in selected period</p>
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-slate-400">Transaction Ledger</span>
                            <span className="text-[10px] text-slate-400">{filteredPayments.length} records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[11px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-3">Payment ID</th>
                                        <th className="px-6 py-3">Order ID</th>
                                        <th className="px-6 py-3">Method</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                                    {paginatedPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">
                                                No transactions found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPayments.map(payment => {
                                            const badge = getStatusBadge(payment.status, payment.payment_status, payment.payment_method);
                                            const BadgeIcon = badge.icon;
                                            return (
                                                <tr key={payment.payment_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        #INV-{payment.payment_id}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        #ORD-{payment.order_id}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-1.5 text-xs font-medium">
                                                            {getPaymentIcon(payment.payment_method)}
                                                            {payment.payment_method || 'KHQR'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                        ${parseFloat(payment.amount || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">
                                                        {new Date(payment.timestamp || payment.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${badge.classes}`}>
                                                            <BadgeIcon size={10} />
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => openDetailModal(payment)}
                                                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 transition-all"
                                                                title="View details"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrintReceipt(payment)}
                                                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-all"
                                                                title="Print receipt"
                                                            >
                                                                <Printer size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-medium">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Detailed Invoice Modal */}
            {isDetailModalOpen && selectedInvoice && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-amber-50/30 dark:bg-amber-950/20">
                            <div className="flex items-center gap-2">
                                <Receipt size={18} className="text-amber-500" />
                                <h3 className="font-black text-sm uppercase tracking-wide">Invoice Details</h3>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Payment info */}
                            <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Payment ID</span><p className="font-mono font-bold">#INV-{selectedInvoice.payment_id}</p></div>
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Order ID</span><p className="font-mono font-bold">#ORD-{selectedInvoice.order_id}</p></div>
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Method</span><p className="flex items-center gap-1">{getPaymentIcon(selectedInvoice.payment_method)} {selectedInvoice.payment_method || 'KHQR'}</p></div>
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Date</span><p>{new Date(selectedInvoice.timestamp || selectedInvoice.createdAt).toLocaleString()}</p></div>
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Amount</span><p className="text-xl font-mono font-black text-amber-600">${parseFloat(selectedInvoice.amount).toFixed(2)}</p></div>
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Status</span><p className="capitalize">{selectedInvoice.status || 'Completed'}</p></div>
                            </div>

                            {/* Order Items if available */}
                            {selectedOrderDetails && (
                                <div>
                                    <h4 className="font-black text-xs uppercase mb-3 flex items-center gap-2"><Tag size={12} /> Items</h4>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-2">
                                        {(selectedOrderDetails.items || []).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{item.name || `Product ${item.product_id}`} x{item.quantity}</span>
                                                <span className="font-mono">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t pt-2 mt-2 space-y-1 text-xs">
                                            <div className="flex justify-between"><span>Subtotal</span><span>${selectedOrderDetails.subtotal}</span></div>
                                            <div className="flex justify-between"><span>Tax (10%)</span><span>${selectedOrderDetails.tax}</span></div>
                                            <div className="flex justify-between font-bold"><span>Total</span><span className="text-amber-600">${selectedOrderDetails.total_price}</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3">
                            <button onClick={() => handlePrintReceipt(selectedInvoice)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                <Printer size={14} /> Print
                            </button>
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const SummaryCard = ({ title, value, icon: Icon, color }) => {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
        purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400',
        blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400'
    };
    return (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
                <Icon size={18} />
            </div>
        </div>
    );
};