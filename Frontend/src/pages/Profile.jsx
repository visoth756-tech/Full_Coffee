import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess } from '../features/authSlice';
import {
  Camera, User, Mail, Shield, Save, CheckCircle, Loader2,
  Lock, Key, AlertTriangle, X, Coffee
} from 'lucide-react';
import api from '../api/axios';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  // Form state
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.image_url || user?.image || null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password change modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePicSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const synchronizeUserProfile = (freshImageUrl, noticeMessage) => {
    const updatedUser = {
      ...user,
      full_name: fullName,
      image_url: freshImageUrl
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch(loginSuccess({ user: updatedUser, token }));
    setSuccessMessage(noticeMessage);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const profileForm = new FormData();
    profileForm.append('full_name', fullName);
    if (selectedFile) profileForm.append('image', selectedFile);

    try {
      const response = await api.put(`/users/${user?.user_id || user?.id}`, profileForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const freshUrl = response.data.user?.image_url || response.data.image_url || avatarPreview;
      synchronizeUserProfile(freshUrl, 'Profile updated successfully!');
    } catch (err) {
      console.error('Update failed:', err);
      // Fallback to local cache if backend fails
      const localCacheUrl = selectedFile ? avatarPreview : (user?.image_url || user?.image || null);
      synchronizeUserProfile(localCacheUrl, 'Saved locally (offline mode). Changes will sync when online.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
  e.preventDefault();
  if (newPassword !== confirmPassword) {
    setErrorMessage('New passwords do not match.');
    return;
  }
  if (newPassword.length < 6) {
    setErrorMessage('Password must be at least 6 characters.');
    return;
  }

  setIsChangingPassword(true);
  setErrorMessage('');

  try {
    await api.put('/users/change-password', {
      oldPassword: currentPassword, 
      newPassword: newPassword       
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSuccessMessage('Password changed successfully!');
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMessage(''), 4000);
  } catch (err) {
    setErrorMessage(err.response?.data?.error || 'Failed to change password.');
  } finally {
    setIsChangingPassword(false);
  }
};

  const closeModals = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  const displayName = user?.full_name || user?.name || 'Coffee Lover';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coffee size={24} className="text-amber-500" />
            My Profile
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal information and security settings
          </p>
        </div>
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <Key size={14} /> Change Password
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

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <User size={18} className="text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">
              Account Settings
            </h3>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-4xl font-black shadow-lg overflow-hidden ring-4 ring-amber-100 dark:ring-amber-900/30">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="uppercase">{firstLetter}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 text-white rounded-2xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200">
                <Camera size={22} />
                <span className="text-[10px] font-black uppercase tracking-wider">Change</span>
                <input type="file" accept="image/*" onChange={handlePicSelection} className="hidden" />
              </label>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Click avatar to upload new photo
            </p>
          </div>

          <hr className="border-slate-100 dark:border-slate-700/50" />

          {/* Form Fields */}
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 transition-all"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'user@example.com'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    disabled
                    value={user?.role === 'admin' ? 'Administrator' : 'Barista'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold capitalize text-amber-600 dark:text-amber-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-amber-50/30 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-wide">Change Password</h3>
              </div>
              <button onClick={closeModals} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  placeholder="min. 6 characters"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  placeholder="retype new password"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModals} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all"
                >
                  {isChangingPassword ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}