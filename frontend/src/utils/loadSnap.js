let snapScriptLoaded = false;

export const loadSnapScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.snap !== 'undefined' && snapScriptLoaded) {
      resolve(true);
      return;
    }

    // Check if already adding
    if (document.getElementById('midtrans-snap-script')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    
    script.onload = () => {
      snapScriptLoaded = true;
      resolve(true);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Snap JS script'));
    };
    
    document.body.appendChild(script);
  });
};

export const payWithMidtrans = async (snapToken, onSuccess, onError) => {
  try {
    await loadSnapScript();
    
    if (!window.snap) {
      throw new Error('Snap.js failed to initialize');
    }
    
    if (!snapToken) {
      console.warn('Snap token is missing');
      alert('Pembayaran gagal: Token pembayaran tidak ditemukan');
      return;
    }
    
    window.snap.pay(snapToken, {
      onSuccess: (result) => {
        console.log('Payment success:', result);
        onSuccess(result);
      },
      onPending: (result) => {
        console.log('Payment pending:', result);
        alert('Menunggu pembayaran...');
      },
      onError: (result) => {
        console.error('Payment error:', result);
        onError(result);
      },
      onClose: () => {
        console.log('Payment popup closed');
        alert('Pop-up pembayaran ditutup sebelum selesai.');
      },
    });
  } catch (error) {
    console.error('Pay with Midtrans error:', error);
    alert('Terjadi kesalahan saat memproses pembayaran: ' + error.message);
    onError(error);
  }
};