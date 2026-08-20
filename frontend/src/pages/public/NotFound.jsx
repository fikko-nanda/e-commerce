import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-yellow-300 border-4 border-black p-8 md:p-12 shadow-brutal-lg max-w-md w-full">
        <h1 className="text-8xl font-black tracking-tighter mb-2">404</h1>
        <div className="bg-black text-white text-xs font-black px-3 py-1 uppercase tracking-widest inline-block mb-4">
          Halaman Tidak Ditemukan
        </div>
        <p className="text-xs font-bold text-black/80 mb-6 leading-relaxed">
          Situs yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-white text-black font-black text-xs px-6 py-3 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition active:translate-x-0.5 active:translate-y-0.5"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}