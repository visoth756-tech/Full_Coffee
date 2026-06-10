import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Coffee, ShoppingCart, Plus, Minus, Trash2, Loader2, AlertTriangle,
    Layers, X, CreditCard, Landmark, QrCode, ExternalLink, Clock,
    History, CheckCircle, XCircle, Sparkles, Receipt, Wallet
} from 'lucide-react';
import api from '../api/axios';

export default function Orders() {
    const { token } = useSelector((state) => state.auth);

    // Inventory tracking
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');

    // Cart state
    const [cart, setCart] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Modal & feedback
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [redirectingNotice, setRedirectingNotice] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('KHQR');

    const fetchPOSData = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories')
            ]);
            setProducts(prodRes.data?.list || prodRes.data || []);
            setCategories(catRes.data?.list || catRes.data || []);
            fetchUserHistoryRecords();
        } catch (err) {
            setErrorMessage('Failed to load menu. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserHistoryRecords = async () => {
        setIsHistoryLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            };
            const historyRes = await api.get('/orders', config);
            const listData = historyRes.data?.list || historyRes.data || [];
            setOrderHistory(listData.slice(0, 5));
        } catch (err) {
            setOrderHistory([]);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchPOSData();
    }, []);

    const displayedProducts = activeCategory === 'all'
        ? products
        : products.filter(p => Number(p.category_id) === Number(activeCategory));

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex(item => item.product_id === product.product_id);
            if (existingIndex > -1) {
                const updatedCart = [...prevCart];
                updatedCart[existingIndex].quantity += 1;
                return updatedCart;
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, amount) => {
        setCart((prevCart) =>
            prevCart.map(item => {
                if (item.product_id === productId) {
                    const newQty = item.quantity + amount;
                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            }).filter(item => item.quantity > 0)
        );
    };

    const clearCart = () => setCart([]);

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const tax = subtotal * 0.10;
    const grandTotal = subtotal + tax;

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        setIsProcessingOrder(true);
        setErrorMessage('');
        setRedirectingNotice('');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token || localStorage.getItem('token')}`
            }
        };

        const orderPayload = {
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: parseFloat(item.price).toFixed(2)
            })),
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total_price: grandTotal.toFixed(2),
            payment_method: paymentMethod
        };

        try {
            const orderRes = await api.post('/orders', orderPayload, config);
            const orderId = orderRes.data?.order_id || orderRes.data?.id || Math.floor(Math.random() * 1000);

            if (['KHQR', 'ABA', 'WING', 'ACELEDA', 'BAKONG'].includes(paymentMethod)) {
                setRedirectingNotice(`⏳ Order #${orderId} locked. Opening secure payment gateway...`);

                const payRes = await api.post('/khqr/initiate', {
                    order_id: orderId,
                    amount: grandTotal.toFixed(2),
                    remark: `POS Order #${orderId}`
                }, config);

                if (payRes.data?.redirect_url) {
                    window.location.href = payRes.data.redirect_url;
                    return;
                } else {
                    throw new Error('Gateway redirect missing.');
                }
            } else {
                alert(`Order #${orderId} recorded via ${paymentMethod}!`);
                clearCart();
                setIsCheckoutModalOpen(false);
                fetchUserHistoryRecords();
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || err.message || 'Transaction failed.');
            setRedirectingNotice('');
        } finally {
            setIsProcessingOrder(false);
        }
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'Credit Card': return <CreditCard size={14} className="text-blue-500" />;
            case 'ABA': case 'ACELEDA': case 'WING': case 'BAKONG': return <Landmark size={14} className="text-cyan-500" />;
            default: return <QrCode size={14} className="text-amber-500" />;
        }
    };

    const getStatusBadgeStyle = (status, paymentStatus) => {
        const normalizedStatus = String(status || '').toLowerCase();
        const normalizedPayment = String(paymentStatus || '').toLowerCase();

        if (normalizedPayment === 'paid' || normalizedStatus === 'completed') {
            return {
                classes: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
                icon: <CheckCircle size={10} />,
                label: 'Paid'
            };
        }
        if (normalizedStatus === 'cancelled' || normalizedPayment === 'failed') {
            return {
                classes: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
                icon: <XCircle size={10} />,
                label: 'Cancelled'
            };
        }
        return {
            classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
            icon: <Clock size={10} />,
            label: 'Pending'
        };
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fadeIn pb-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Coffee size={24} className="text-amber-500" />
                        Coffee POS
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Craft orders & process payments</p>
                </div>
                {cart.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-all"
                    >
                        <Trash2 size={14} /> Clear cart
                    </button>
                )}
            </div>

            {/* Main POS Grid */}
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[450px]">
                {/* LEFT: Product Menu */}
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden h-full">
                    {/* Category tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-thin">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeCategory === 'all'
                                    ? 'bg-amber-600 text-white shadow-md'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            All Brews
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.category_id}
                                onClick={() => setActiveCategory(cat.category_id)}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeCategory === cat.category_id
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                {cat.category_name}
                            </button>
                        ))}
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                            <AlertTriangle size={14} /> {errorMessage}
                        </div>
                    )}

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                                        <div className="h-28 bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="p-3 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                                                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayedProducts.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                No coffee in this category yet. ☕
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                                {displayedProducts.map(product => (
                                    <div
                                        key={product.product_id}
                                        onClick={() => addToCart(product)}
                                        className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Coffee size={32} className="text-amber-300 dark:text-amber-600" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 capitalize truncate">
                                                {product.name}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 capitalize truncate mt-0.5">
                                                {product.Category?.category_name || 'Coffee'}
                                            </p>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                                                    ${parseFloat(product.price).toFixed(2)}
                                                </span>
                                                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                    <Plus size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Cart */}
                <div className="w-full lg:w-96 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-lg flex flex-col overflow-hidden h-full">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-amber-50/30 dark:bg-amber-950/10">
                        <div className="flex items-center gap-2">
                            <Receipt size={18} className="text-amber-500" />
                            <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                Current Order
                            </h3>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40 px-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                <ShoppingCart size={48} className="mb-3 opacity-30" />
                                <p className="text-xs font-medium">Your cart is empty</p>
                                <p className="text-[10px] mt-1">Tap on any coffee to start ordering</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product_id} className="py-3 flex items-center justify-between gap-2 animate-fadeIn">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate capitalize">
                                            {item.name}
                                        </p>
                                        <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                                        <button
                                            onClick={() => updateQuantity(item.product_id, -1)}
                                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-all"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="font-mono text-xs font-bold min-w-[24px] text-center text-slate-800 dark:text-slate-100">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product_id, 1)}
                                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 transition-all"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20 space-y-3">
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Tax (10%)</span>
                                <span className="font-mono font-bold">${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-800 dark:text-slate-100">
                                <span>Total</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 text-base">
                                    ${grandTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setRedirectingNotice('');
                                setIsCheckoutModalOpen(true);
                            }}
                            disabled={cart.length === 0}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                            <Wallet size={16} />
                            Checkout
                        </button>
                    </div>
                </div>
            </div>

            {/* Order History */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                    <History size={16} className="text-amber-500" />
                    <h3 className="font-black text-xs uppercase text-slate-700 dark:text-slate-300 tracking-wide">
                        Recent Orders
                    </h3>
                    <Sparkles size={12} className="text-amber-400 ml-auto" />
                </div>

                {isHistoryLoading ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 size={24} className="animate-spin text-amber-500" />
                    </div>
                ) : orderHistory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                        No coffee orders yet. Start brewing!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {orderHistory.map(order => {
                            const badge = getStatusBadgeStyle(order.status, order.payment_status);
                            return (
                                <div
                                    key={order.order_id}
                                    className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-[11px] font-black text-slate-700 dark:text-slate-300">
                                            #{order.order_id}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 border ${badge.classes}`}>
                                            {badge.icon}
                                            {badge.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            {getPaymentIcon(order.payment_method)}
                                            <span className="text-[10px] font-bold uppercase truncate max-w-[70px]">
                                                {order.payment_method || 'KHQR'}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                                            ${parseFloat(order.total_price || order.total_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Checkout Modal */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-2">
                                <Layers size={18} className="text-amber-500" />
                                <h3 className="font-black text-sm uppercase tracking-wide">Complete Payment</h3>
                            </div>
                            <button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                disabled={isProcessingOrder}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {redirectingNotice ? (
                            <div className="p-8 text-center space-y-3">
                                <Loader2 size={40} className="animate-spin text-amber-500 mx-auto" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{redirectingNotice}</p>
                                <p className="text-[10px] text-slate-400 animate-pulse">Redirecting to payment gateway...</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['KHQR', 'ABA', 'WING', 'ACELEDA', 'BAKONG', 'Credit Card'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-bold ${paymentMethod === method
                                                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {getPaymentIcon(method)}
                                                <span>{method}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">Total Amount</span>
                                        <span className="font-mono font-black text-xl text-amber-600 dark:text-amber-400">
                                            ${grandTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsCheckoutModalOpen(false)}
                                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCheckoutSubmit}
                                        disabled={isProcessingOrder}
                                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all"
                                    >
                                        {isProcessingOrder ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <ExternalLink size={14} />
                                        )}
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}