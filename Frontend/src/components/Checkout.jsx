import  { useState } from 'react';
import axios from 'axios';
import { QrCode, CheckCircle2, Loader2, X, AlertTriangle, CreditCard, Wallet } from 'lucide-react';

export default function Checkout({ cartTotal, orderItems, onSuccess }) {
    const [khqrImage, setKhqrImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const API_URL = "https://node-api-pos-coffee-sys-3.onrender.com/api/khqr";

    const handleGenerateKHQR = async () => {
        if (orderItems.length === 0) return;

        setIsLoading(true);
        setShowModal(true);
        setErrorMessage('');

        try {
            const response = await axios.post(`${API_URL}/generate`, {
                amount: cartTotal,
                items: orderItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                currency: 'USD'
            });

            // Handle different response structures
            const qrData = response.data.qrCodeUrl || response.data.qrString || response.data.data?.qrCode || response.data.qrImage;
            if (qrData) {
                setKhqrImage(qrData);
            } else {
                throw new Error('No QR code data received');
            }
        } catch (err) {
            console.error("KHQR Generation failed", err);
            setErrorMessage(err.response?.data?.error || 'Failed to generate QR code. Please try again.');
            setShowModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyPayment = async () => {
        // Simulate verification – you can integrate a real check endpoint here
        setPaymentVerified(true);
        setTimeout(() => {
            setShowModal(false);
            setKhqrImage(null);
            setPaymentVerified(false);
            if (onSuccess) onSuccess(); // Clear cart or redirect
        }, 1500);
    };

    const closeModal = () => {
        if (!isLoading && !paymentVerified) {
            setShowModal(false);
            setKhqrImage(null);
            setErrorMessage('');
        }
    };

    const subtotal = cartTotal;
    const tax = 0; // Adjust if your backend provides tax
    const total = subtotal + tax;

    return (
        <div className="w-full space-y-4">
            {/* Order Summary Card */}
            <div className="bg-linear-to-brrom-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Tax (0%)</span>
                        <span className="font-mono">$0.00</span>
                    </div>
                    <div className="pt-2 mt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center font-black text-base">
                            <span className="text-slate-700 dark:text-slate-200">Total</span>
                            <span className="text-amber-600 dark:text-amber-400 text-xl font-mono">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Button */}
            <button
                onClick={handleGenerateKHQR}
                disabled={orderItems.length === 0 || isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-sm font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Wallet size={18} />
                )}
                <span>{isLoading ? 'Preparing QR...' : 'Pay with KHQR'}</span>
            </button>

            {/* KHQR Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scaleIn">

                        {/* Modal Header */}
                        <div className="relative px-6 pt-6 pb-2">
                            <button
                                onClick={closeModal}
                                disabled={isLoading || paymentVerified}
                                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-3">
                                    <QrCode size={24} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Scan to Pay</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Use your banking app or Bakong wallet</p>
                            </div>
                        </div>

                        {/* QR Code Area */}
                        <div className="px-6 py-4 flex justify-center">
                            <div className="w-56 h-56 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 size={32} className="animate-spin text-amber-500" />
                                        <span className="text-[10px] font-bold text-slate-400">Generating...</span>
                                    </div>
                                ) : khqrImage ? (
                                    <img
                                        src={khqrImage}
                                        alt="KHQR Payment Code"
                                        className="w-full h-full object-contain"
                                    />
                                ) : errorMessage ? (
                                    <div className="text-center p-3">
                                        <AlertTriangle size={24} className="text-rose-500 mx-auto mb-1" />
                                        <p className="text-[10px] text-rose-500">{errorMessage}</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <CreditCard size={32} className="text-slate-300 mx-auto" />
                                        <p className="text-[10px] text-slate-400 mt-1">No QR available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount Display */}
                        <div className="px-6 pb-2 text-center">
                            <div className="inline-block px-4 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-full">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Amount</span>
                                <span className="ml-2 font-mono font-black text-amber-600 dark:text-amber-400 text-base">
                                    ${total.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Verify Button */}
                        {!isLoading && khqrImage && (
                            <div className="px-6 pb-6 pt-2">
                                <button
                                    onClick={handleVerifyPayment}
                                    disabled={paymentVerified}
                                    className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${paymentVerified
                                            ? 'bg-emerald-600 text-white cursor-default'
                                            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-md'
                                        }`}
                                >
                                    {paymentVerified ? (
                                        <>
                                            <CheckCircle2 size={16} className="animate-bounce" />
                                            Payment Confirmed
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            Mark as Paid
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center text-slate-400 mt-2">
                                    After scanning, confirm payment manually
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}