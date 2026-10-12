import { useState, useEffect } from 'react';
import { verifyAccessCode, grantAccess, recordFailedAttempt, getLockoutTimeRemaining } from '../utils/accessControl';
import { APP_NAME, WRONG_CODE_MESSAGE, MAX_ATTEMPTS } from '../config/accessConfig';

interface AccessGateProps {
  onAccessGranted: () => void;
}

export default function AccessGate({ onAccessGranted }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Check if already locked out
    const remaining = getLockoutTimeRemaining();
    if (remaining > 0) {
      setIsLocked(true);
      setLockoutTime(remaining);
    }
  }, []);

  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        const remaining = getLockoutTimeRemaining();
        if (remaining <= 0) {
          setIsLocked(false);
          setLockoutTime(0);
          setAttempts(0);
          setError('');
          clearInterval(timer);
        } else {
          setLockoutTime(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    if (verifyAccessCode(code)) {
      grantAccess();
      onAccessGranted();
    } else {
      const result = recordFailedAttempt();
      setAttempts(result.attempts);
      
      if (result.lockedOut) {
        setIsLocked(true);
        setLockoutTime(Math.ceil((result.lockoutEnd! - Date.now()) / 1000));
        setError(`Too many failed attempts. Locked for 15 minutes.`);
      } else {
        const remaining = MAX_ATTEMPTS - result.attempts;
        setError(`${WRONG_CODE_MESSAGE} ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }
      
      setCode('');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {APP_NAME}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter access code to continue
        </p>

        {/* Lockout Message */}
        {isLocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Access Temporarily Locked</p>
                <p className="text-sm text-red-600">
                  Try again in {formatTime(lockoutTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code
            </label>
            <input
              id="access-code"
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              disabled={isLocked}
              placeholder="Enter your access code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-center text-lg tracking-wider"
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocked || !code.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {isLocked ? 'Locked' : 'Access Application'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Protected by secure access control
          </p>
          {attempts > 0 && !isLocked && (
            <p className="text-xs text-center text-gray-400 mt-2">
              Failed attempts: {attempts} / {MAX_ATTEMPTS}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
