import { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';

export function LoginButton() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-slate-600">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
        <span className="text-sm">טוען...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div className="text-right">
            <div className="text-sm font-medium text-slate-800">{user.name}</div>
            <div className="text-xs text-slate-500">
              {user.role === 'admin' ? 'מנהל' : user.role === 'manager' ? 'מנהל סניף' : 'עובד'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          title="התנתק"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsLoginModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-medium"
      >
        <LogIn className="w-5 h-5" />
        <span>התחבר</span>
      </button>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}

