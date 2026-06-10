import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Settings as SettingsIcon, Store, Percent, ShieldCheck, Printer, Moon, Sun,
  Save, CheckCircle, AlertTriangle, Loader2, QrCode, Wifi, RefreshCw,
  Globe, DollarSign, CreditCard, Receipt, Zap, Shield, RotateCcw
} from 'lucide-react';
import { toggleTheme } from '../features/themeSlice';

export default function Settings() {
  const dispatch = useDispatch();
  const { darkMode: reduxDarkMode } = useSelector((state) => state.theme);

  // Store profile
  const [storeName, setStoreName] = useState('Samurai Coffee');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState('10');

  // Hardware
  const [printerIp, setPrinterIp] = useState('192.168.1.250');
  const [autoPrintReceipts, setAutoPrintReceipts] = useState(true);
  const [printerEnabled, setPrinterEnabled] = useState(true);

  // Payment defaults
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('KHQR');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for your visit! ☕');

  // UI
  const [localDarkMode, setLocalDarkMode] = useState(reduxDarkMode);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync local dark mode with Redux
  useEffect(() => {
    setLocalDarkMode(reduxDarkMode);
  }, [reduxDarkMode]);

  const handleThemeToggle = () => {
    setLocalDarkMode(!localDarkMode);
    dispatch(toggleTheme());
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Save to localStorage
      localStorage.setItem('sys_store_name', storeName);
      localStorage.setItem('sys_currency', currency);
      localStorage.setItem('sys_vat_rate', taxRate);
      localStorage.setItem('sys_printer_ip', printerIp);
      localStorage.setItem('sys_auto_print', autoPrintReceipts);
      localStorage.setItem('sys_printer_enabled', printerEnabled);
      localStorage.setItem('sys_default_payment', defaultPaymentMethod);
      localStorage.setItem('sys_receipt_footer', receiptFooter);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      setSuccessMessage('System configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setStoreName('Samurai Coffee');
    setCurrency('USD');
    setTaxRate('10');
    setPrinterIp('192.168.1.250');
    setAutoPrintReceipts(true);
    setPrinterEnabled(true);
    setDefaultPaymentMethod('KHQR');
    setReceiptFooter('Thank you for your visit! ☕');
    setSuccessMessage('Settings reset to factory defaults.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <SettingsIcon size={24} className="text-amber-500" />
            System Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage store preferences, hardware, and environment settings
          </p>
        </div>
        <button
          onClick={resetToDefaults}
          type="button"
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl flex items-center gap-2 transition-all"
        >
          <RotateCcw size={14} /> Reset to Defaults
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 columns: System & Hardware */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Store Information Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Store Identity</h3>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="USD">USD – US Dollar ($)</option>
                      <option value="KHR">KHR – Cambodian Riel (៛)</option>
                      <option value="EUR">EUR – Euro (€)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tax Rate (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hardware & Printer Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Receipt Printer</h3>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Printer IP Address</label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="192.168.1.250"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${printerEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Enable Network Printer</p>
                    <p className="text-[10px] text-slate-400">Allow system to send print jobs automatically</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printerEnabled}
                    onChange={(e) => setPrinterEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:bg-amber-500 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Auto‑print after payment</p>
                  <p className="text-[10px] text-slate-400">Immediately spool receipt after successful checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrintReceipts}
                    onChange={(e) => setAutoPrintReceipts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:bg-amber-500 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Receipt Footer Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Receipt Customization</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Footer Message</label>
                <textarea
                  rows="2"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Thank you for your visit!"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
                <p className="text-[10px] text-slate-400">Appears at the bottom of every printed receipt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Appearance & Payment defaults */}
        <div className="space-y-6">
          
          {/* Theme Toggle Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                {localDarkMode ? <Moon size={18} className="text-amber-400" /> : <Sun size={18} className="text-amber-500" />}
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Appearance</h3>
              </div>
            </div>
            <div className="p-6">
              <button
                type="button"
                onClick={handleThemeToggle}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-between px-4 text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  {localDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                  {localDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${localDarkMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Default Payment Method Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Default Payment</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preferred Gateway</label>
                <select
                  value={defaultPaymentMethod}
                  onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="KHQR">KHQR – National Bank of Cambodia</option>
                  <option value="ABA">ABA Bank</option>
                  <option value="WING">Wing Money</option>
                  <option value="ACELEDA">ACLEDA Bank</option>
                  <option value="BAKONG">Bakong Wallet</option>
                  <option value="Credit Card">Credit Card (Terminal)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                <Shield size={12} />
                <span>PCI compliant – all transactions are encrypted</span>
              </div>
            </div>
          </div>

          {/* Security & Info Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Security & Backup</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Data Encryption</span>
                <span className="font-mono font-bold text-emerald-600">AES‑256</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Session Timeout</span>
                <span className="font-mono font-bold">30 minutes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Last Backup</span>
                <span className="font-mono">Auto (daily)</span>
              </div>
              <button
                type="button"
                className="w-full mt-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <RefreshCw size={12} /> Force Sync
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}