import  { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Users, DollarSign, TrendingUp, Loader2, AlertTriangle,
  ArrowUpRight, Landmark, Clock, CalendarRange, RefreshCw, Eye
} from 'lucide-react';
import api from '../api/axios';

// Helper: format relative time
const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Counter animation hook
const useCounter = (targetValue, duration = 800) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = targetValue / (duration / 16);
    const interval = setInterval(() => {
      start += step;
      if (start >= targetValue) {
        setCount(targetValue);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [targetValue, duration]);
  return count;
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    orderCount: 0,
    staffCount: 0,
    averageTicketValue: "0.00"
  });
  const [combinedStream, setCombinedStream] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [graphInterval, setGraphInterval] = useState('month');
  const [graphData, setGraphData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Animated counters
  const animatedSales = useCounter(parseFloat(metrics.totalSales), 600);
  const animatedOrders = useCounter(metrics.orderCount, 400);
  const animatedStaff = useCounter(metrics.staffCount, 400);
  const animatedAvg = useCounter(parseFloat(metrics.averageTicketValue), 600);

  const fetchAnalyticsMatrix = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const [ordersRes, usersRes, paymentsRes] = await Promise.all([
        api.get('/orders', config).catch(() => ({ data: [] })),
        api.get('/users', config).catch(() => ({ data: [] })),
        api.get('/payments', config).catch(() => ({ data: [] }))
      ]);

      const ordersList = ordersRes.data?.list || ordersRes.data || [];
      const usersList = usersRes.data?.list || usersRes.data || [];
      const paymentsList = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data?.list || []);

      const settledPayments = paymentsList.filter(p => p.amount && parseFloat(p.amount) > 0);
      const totalSalesSum = settledPayments.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const completedOrdersCount = ordersList.filter(o => o.payment_status === 'paid' || o.status === 'Completed').length;
      let averageCalc = "0.00";
      if (completedOrdersCount > 0) {
        const rawAvg = totalSalesSum / completedOrdersCount;
        averageCalc = rawAvg < 0.01 && rawAvg > 0 ? rawAvg.toFixed(4) : rawAvg.toFixed(2);
      }

      setMetrics({
        totalSales: totalSalesSum.toFixed(2),
        orderCount: completedOrdersCount,
        staffCount: usersList.length,
        averageTicketValue: averageCalc
      });
      setRawPayments(settledPayments);
      setLastUpdated(new Date());

      // Build unified stream
      const builtStream = [];
      ordersList.forEach(order => {
        const isPaid = order.payment_status === 'paid' || order.status === 'Completed';
        if (!isPaid && order.status !== 'Cancelled') {
          builtStream.push({
            id: `order-${order.order_id}`,
            order_id: order.order_id,
            type: 'PENDING',
            payment_method: order.payment_method || 'KHQR',
            amount: order.total_amount || order.total_price || 0,
            timestamp: order.timestamp || order.createdAt || new Date().toISOString()
          });
        }
      });
      paymentsList.forEach(payment => {
        builtStream.push({
          id: `pay-${payment.payment_id}`,
          order_id: payment.order_id,
          type: 'PAID',
          payment_method: payment.payment_method || 'KHQR',
          amount: payment.amount,
          timestamp: payment.timestamp || payment.createdAt || payment.timstamp || new Date().toISOString()
        });
      });
      builtStream.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setCombinedStream(builtStream.slice(0, 6));
    } catch (err) {
      setErrorMessage('Failed to compile analytical summaries.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsMatrix();
  }, [fetchAnalyticsMatrix]);

  // Graph aggregation
  useEffect(() => {
    if (rawPayments.length === 0) {
      setGraphData([]);
      return;
    }
    const groups = {};
    rawPayments.forEach(pay => {
      const amt = parseFloat(pay.amount || 0);
      const dateObj = new Date(pay.timestamp || pay.createdAt || pay.timstamp || Date.now());
      let key = '';
      if (graphInterval === 'year') {
        key = `${dateObj.getFullYear()}`;
      } else if (graphInterval === 'month') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      } else {
        key = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      groups[key] = (groups[key] || 0) + amt;
    });
    const formatted = Object.entries(groups).map(([label, revenue]) => ({ label, revenue }));
    const maxVal = Math.max(...formatted.map(d => d.revenue), 1);
    const finalData = formatted.map(item => ({
      ...item,
      percentage: Math.min(100, Math.max(5, (item.revenue / maxVal) * 100))
    }));
    setGraphData(finalData.reverse().slice(0, 7).reverse());
  }, [rawPayments, graphInterval]);

  const getBadgeClass = (item) => {
    if (item.type === 'PENDING') {
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    }
    switch (item.payment_method) {
      case 'KHQR': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      case 'ABA': case 'BAKONG': return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const handleBarHover = (e, dataPoint, index) => {
    setHoveredBar(index);
    setTooltipPos({ x: e.clientX, y: e.clientY - 40 });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header with refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Analytics Overview
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Real-time store performance & transaction stream
          </p>
        </div>
        <button
          onClick={fetchAnalyticsMatrix}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading skeletons or content */}
      {isLoading && !metrics.totalSales ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Gross Sales"
              value={`$${animatedSales.toFixed(2)}`}
              icon={DollarSign}
              iconBg="bg-emerald-100 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              trend="+12.3%"
            />
            <MetricCard
              title="Paid Receipts"
              value={Math.floor(animatedOrders)}
              icon={ShoppingBag}
              iconBg="bg-amber-100 dark:bg-amber-950/40"
              iconColor="text-amber-600 dark:text-amber-400"
            />
            <MetricCard
              title="Ticket Average"
              value={`$${animatedAvg.toFixed(2)}`}
              icon={TrendingUp}
              iconBg="bg-purple-100 dark:bg-purple-950/40"
              iconColor="text-purple-600 dark:text-purple-400"
            />
            <MetricCard
              title="Active Operators"
              value={Math.floor(animatedStaff)}
              icon={Users}
              iconBg="bg-blue-100 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-400"
            />
          </div>

          {/* Revenue Graph */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CalendarRange size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  Revenue Trend
                </h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {['day', 'month', 'year'].map(interval => (
                  <button
                    key={interval}
                    onClick={() => setGraphInterval(interval)}
                    className={`px-4 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all ${
                      graphInterval === interval
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    By {interval}
                  </button>
                ))}
              </div>
            </div>

            {graphData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
                <TrendingUp size={32} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">No transaction data available</p>
              </div>
            ) : (
              <div className="relative pt-4">
                <div className="h-64 flex items-end gap-3 sm:gap-5 border-l-2 border-b-2 border-slate-300 dark:border-slate-600 pl-4 pb-2">
                  {graphData.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative"
                      onMouseEnter={(e) => handleBarHover(e, point, idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500 transition-all duration-700 ease-out hover:opacity-90 cursor-pointer shadow-sm"
                        style={{ height: `${point.percentage}%`, minHeight: '8px' }}
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 whitespace-nowrap">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
                {hoveredBar !== null && graphData[hoveredBar] && (
                  <div
                    className="fixed z-50 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none"
                    style={{ top: tooltipPos.y, left: tooltipPos.x, transform: 'translateX(-50%)' }}
                  >
                    ${graphData[hoveredBar].revenue.toFixed(2)}
                  </div>
                )}
              </div>
            )}
            {lastUpdated && (
              <div className="text-right text-[10px] text-slate-400 mt-4">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Live Stream + Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Live Transaction Stream
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-80 overflow-y-auto">
                {combinedStream.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    No active transactions at the moment.
                  </div>
                ) : (
                  combinedStream.map(item => (
                    <div key={item.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'PENDING'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.type === 'PENDING' ? <Clock size={16} /> : <Landmark size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-700 dark:text-slate-200">
                            {item.type === 'PENDING' ? 'Unpaid Order' : 'Settled Payment'}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">#{item.order_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getBadgeClass(item)}`}>
                          {item.type === 'PENDING' ? 'Pending' : item.payment_method}
                        </span>
                        <span className={`font-mono font-bold text-sm ${
                          item.type === 'PENDING' ? 'text-amber-600' : 'text-emerald-600'
                        } dark:text-amber-400 dark:text-emerald-400`}>
                          {item.type === 'PENDING' ? '⏳' : '+'}${parseFloat(item.amount || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {getRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick actions card */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Terminal Hub</span>
                  <h4 className="font-black text-sm uppercase text-slate-800 dark:text-slate-100 mt-1">Quick Actions</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Manage daily revenue, process new orders, and access detailed reports from the POS interface.
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <a
                  href="/orders"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 group shadow-md"
                >
                  Launch POS Screen
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <button
                  onClick={() => window.location.href = '/reports'}
                  className="w-full py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={14} />
                  View Full Reports
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Metric Card subcomponent
const MetricCard = ({ title, value, icon: Icon, iconBg, iconColor, trend }) => (
  <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
        <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        {trend && (
          <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
            <TrendingUp size={10} /> {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg} ${iconColor} transition-all group-hover:scale-105`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);