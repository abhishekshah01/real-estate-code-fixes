import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const { processSessionId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from hash
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      // Get the redirect URL from localStorage or default to home
      const redirectUrl = localStorage.getItem('auth_redirect') || '/';
      localStorage.removeItem('auth_redirect'); // Clean up
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          await processSessionId(sessionId);
          // Navigate to the original page or home page after successful login
          navigate(redirectUrl, { replace: true });
        } catch (error) {
          console.error('Auth callback error:', error);
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, [location, navigate, processSessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-[#EA580C] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
