export const loadSnapScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.getElementById('midtrans-snap-script');
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    // Gunakan URL Sandbox Midtrans
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.id = 'midtrans-snap-script';
    // Ganti dengan Client Key Midtrans Sandbox milik Anda dari Dashboard Midtrans
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-PLACEHOLDER');

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export const payWithMidtrans = async (snapToken, onSuccess, onError) => {
  const isLoaded = await loadSnapScript();
  
  if (!isLoaded || !window.snap) {
    alert('Gagal memuat modul pembayaran Midtrans.');
    return;
  }

  window.snap.pay(snapToken, {
    onSuccess: function () {
      if (onSuccess) onSuccess();
    },
    onPending: function () {
      alert('Pembayaran tertunda. Silakan selesaikan transaksi Anda.');
    },
    onError: function () {
      if (onError) onError();
    },
    onClose: function () {
      alert('Anda menutup halaman pembayaran sebelum selesai.');
    },
  });
};