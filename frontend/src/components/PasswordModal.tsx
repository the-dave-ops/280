import { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  message?: string;
}

export function PasswordModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = 'מחיקת מרשם',
  message = 'האם אתה בטוח שברצונך למחוק מרשם זה? פעולה זו אינה ניתנת לביטול.'
}: PasswordModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (password.trim()) {
      onConfirm(password);
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-right mb-6 leading-relaxed">
          {message}
        </p>

        {/* Password Label */}
        <label className="block text-right text-gray-700 font-medium mb-2">
          סיסמת מנהל
        </label>

        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-500 bg-blue-50/30 text-right mb-6"
          placeholder="••••••••"
          autoFocus
          dir="rtl"
        />

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            disabled={!password.trim()}
            className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}
