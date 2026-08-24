import { useEffect, useState } from 'react';

export default function GoogleTranslate() {
  const [lang, setLang] = useState('id');

  useEffect(() => {
    // 1. Cek cookie bawaan Google Translate untuk mengetahui status bahasa saat ini
    const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
    if (match) {
      const val = decodeURIComponent(match[1]);
      if (val.endsWith('/en')) {
        setLang('en');
      } else {
        setLang('id');
      }
    }

    // 2. Inisialisasi script Google Translate di latar belakang
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'id',
            includedLanguages: 'en,id',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      };
    }
  }, []);

  // 3. Pemicu Switch Bahasa menggunakan Cookie + Clean Refresh
  const toggleLanguage = () => {
    const nextLang = lang === 'id' ? 'en' : 'id';
    const cookieVal = `/id/${nextLang}`;

    // Set cookie 'googtrans' agar Google Translate langsung membaca bahasa sasaran dari awal load
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;

    setLang(nextLang);

    // Refresh cepat halaman agar React Virtual DOM di-reset secara bersih tanpa glitch
    window.location.reload();
  };

  return (
    <div className="flex items-center">
      {/* Element asli Google Translate disembunyikan */}
      <div id="google_translate_element" className="hidden" />

      {/* Tombol Kustom Neo-Brutalist */}
      <button
        type="button"
        onClick={toggleLanguage}
        className="font-black text-xs uppercase bg-cyan-300 border-2 border-black px-3 py-2 shadow-brutal hover:bg-black hover:text-white transition cursor-pointer flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
      >
        🌐 {lang === 'id' ? 'ID 🇮🇩' : 'EN 🇬🇧'}
      </button>
    </div>
  );
}