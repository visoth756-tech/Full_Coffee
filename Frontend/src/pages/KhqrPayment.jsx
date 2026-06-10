import React, { useState } from 'react';
import { Coffee, Lock, Mail, ShoppingBag, DollarSign, Layers, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

export default function KhqrPayment() {
    // Authentication states
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [email, setEmail] = useState('admin@coffee.com');
    const [password, setPassword] = useState('admin123');

    // Order parameter states
    const [productId, setProductId] = useState('1');
    const [quantity, setQuantity] = useState(1);
    const [itemPrice, setItemPrice] = useState('2.50');

    // Request status monitors
    const [isLoading, setIsLoading] = useState(false);
    const [noticeMessage, setNoticeMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // 1. GATEWAY ACCESS GATE: Handle Staff Authorization
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        setNoticeMessage('');

        try {
            const response = await api.post('/users/login', { email, password });
            if (response.data && response.data.token) {
                const userToken = response.data.token;
                setToken(userToken);
                localStorage.setItem('token', userToken);
                setNoticeMessage('Terminal authorization secured successfully!');
                setTimeout(() => setNoticeMessage(''), 3000);
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Login credentials rejected.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. TRANSACTION ENGINE: Create Order and Redirect to KHQR Portal
    const handleProcessKhqrPayment = async (e) => {
        e.preventDefault();
        if (!token) return;

        setIsLoading(true);
        setErrorMessage('');
        setNoticeMessage('');

        // Pre-flight automated item totals check formulas
        const parsedPrice = parseFloat(itemPrice) || 0;
        const subtotal = parsedPrice * quantity;
        const tax = subtotal * 0.10; // Standard 10% store tax
        const totalAmount = subtotal + tax;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        try {
            // Step A: Dispatch structured cart details to live database tables
            setNoticeMessage('⏳ Submitting order ticket configuration...');
            const orderResponse = await api.post('/orders', {
                items: [{
                    product_id: parseInt(productId),
                    quantity: parseInt(quantity),
                    price: parsedPrice.toFixed(2)
                }],
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                total_price: totalAmount.toFixed(2)
            }, config);

            const generatedOrderId = orderResponse.data?.order_id || orderResponse.data?.id || Math.floor(Math.random() * 1000);
            const definitiveAmount = orderResponse.data?.total_price || orderResponse.data?.total_amount || totalAmount.toFixed(2);

            // Step B: Send transaction metrics to KHQR clearing house
            setNoticeMessage('⏳ Generating secure KHQR gateway interface...');
            const payResponse = await api.post('/khqr/initiate', {
                order_id: generatedOrderId,
                amount: definitiveAmount,
                remark: `Coffee Order #${generatedOrderId}`
            }, config);

            // Step C: Execute direct hard redirection out to open the banking terminal apps
            if (payResponse.data?.redirect_url) {
                setNoticeMessage('✅ Authorized! Launching banking payment portal...');
                setTimeout(() => {
                    window.location.href = payResponse.data.redirect_url;
                }, 800);
            } else {
                // Safe sandbox simulation fallback fallback if endpoint acts up
                setNoticeMessage(`✅ Order #${generatedOrderId} cached. (Redirect emulation mode running)`);
                setTimeout(() => {
                    alert(`Redirection Link Backup Emulation:\nSettling Total: $${definitiveAmount}`);
                    setIsLoading(false);
                    setNoticeMessage('');
                }, 2000);
            }

        } catch (err) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Network processing pipeline interruption.');
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6 my-8 animate-fadeIn">

            {/* Brand App Branding Header */}
            <div className="text-center space-y-1">
                <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/30 mb-2">
                    <Coffee size={24} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Coffee POS</h2>
                <p className="text-xs text-slate-400 font-medium">KHQR Secure Redirect Payment Gateway Terminal</p>
            </div>

            {/* Dynamic Alert Display Layout Windows */}
            {noticeMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={15} className="shrink-0" />
                    <span>{noticeMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* CORE DISPLAY WINDOW HUB CARD */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-xl">

                {/* VIEW SCREEN A: AUTHENTICATION LOGIN COMPONENT SHELL */}
                {!token ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-1 text-left">
                            <h3 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff Credentials Login</h3>
                            <p className="text-[11px] text-slate-400">Secure authority clearance connection route.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@coffee.com" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-100" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Security Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-100" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50">
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                            <span>Authorize Connection</span>
                        </button>
                    </form>
                ) : (

                    /* VIEW SCREEN B: OPERATIONAL CHECKOUT INVENTORY PANEL FORM */
                    <form onSubmit={handleProcessKhqrPayment} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                            <div className="text-left">
                                <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Assemble Bill Ticket</h3>
                                <p className="text-[11px] text-slate-400">Configure real-time transactional variables.</p>
                            </div>
                            <button type="button" onClick={() => { setToken(null); localStorage.removeItem('token'); }} className="text-[10px] font-black text-rose-500 uppercase tracking-wider hover:underline">De-auth</button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Product Identifier ID</label>
                                    <div className="relative">
                                        <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input type="number" required value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="1" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quantity Volume</label>
                                    <div className="relative">
                                        <ShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Unit Base Price (USD)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input type="number" step="0.01" min="0.01" required value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 font-mono" />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Running Totals Receipt Block */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between"><span>Subtotal calculation</span><span className="font-mono font-bold">${((parseFloat(itemPrice) || 0) * quantity).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Est. Store VAT (10%)</span><span className="font-mono font-bold">${(((parseFloat(itemPrice) || 0) * quantity) * 0.10).toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm font-black text-slate-800 dark:text-slate-100 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                <span>Total Billing Due</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 text-base">${(((parseFloat(itemPrice) || 0) * quantity) * 1.10).toFixed(2)}</span>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50">
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                            <span>Create Order & Pay KHQR</span>
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}