import { useEffect, useRef } from 'react';

const GSI_URL = 'https://accounts.google.com/gsi/client';

export default function GoogleLoginButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const cbRef = useRef({ onSuccess, onError });
  cbRef.current = { onSuccess, onError };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const renderButton = () => {
      if (!window.google?.accounts || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            cbRef.current.onSuccess(response.credential);
          } else {
            cbRef.current.onError('Tidak ada credential dari Google');
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      });
    };

    if (window.google?.accounts) {
      renderButton();
    } else {
      const script = document.createElement('script');
      script.src = GSI_URL;
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      script.onerror = () => cbRef.current.onError('Gagal memuat Google Identity Services');
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }

    return () => window.google?.accounts?.id?.cancel();
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="w-full bg-gray-100 border-2 border-black p-3 text-center text-[10px] font-black uppercase">
        VITE_GOOGLE_CLIENT_ID belum diset di frontend/.env
      </div>
    );
  }

  return <div ref={buttonRef} className="w-full overflow-hidden" />;
}