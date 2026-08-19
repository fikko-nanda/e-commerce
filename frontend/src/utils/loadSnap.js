export const loadSnapScript = () => {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });
};

export const payWithMidtrans = async (snapToken, onSuccess, onError) => {
  await loadSnapScript();

  if (window.snap && snapToken) {
    window.snap.pay(snapToken, {
      onSuccess: (result) => onSuccess(result),
      onPending: (result) => alert('Menunggu pembayaran...'),
      onError: (result) => onError(result),
      onClose: () => alert('Pop-up pembayaran ditutup sebelum selesai.'),
    });
  } else {
    alert('Snap token tidak ditemukan atau script gagal dimuat.');
  }
};