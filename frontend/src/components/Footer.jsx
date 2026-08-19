import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t-4 border-black mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <Link to="/" className="text-3xl font-black tracking-tighter">
            WAR<span className="bg-yellow-300 px-1 border-2 border-black shadow-brutal">MART</span>
          </Link>
          <p className="text-xs font-bold text-gray-700 max-w-sm leading-relaxed">
            Platform e-commerce independen untuk brand lokal & fashion jalanan. Dibuat dengan gaya Neobrutalism modern.
          </p>
        </div>

        <div>
          <h4 className="font-black text-xs uppercase mb-3 bg-black text-white px-2 py-1 inline-block">Navigasi</h4>
          <ul className="space-y-2 text-xs font-bold uppercase">
            <li><Link to="/" className="hover:underline">Katalog Utama</Link></li>
            <li><Link to="/seller" className="hover:underline">Dashboard Penjual</Link></li>
            <li><Link to="/user/dashboard" className="hover:underline">Riwayat Pesanan</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-xs uppercase mb-3 bg-black text-white px-2 py-1 inline-block">Newsletter</h4>
          <form onSubmit={(e) => { e.preventDefault(); alert('Terima kasih telah berlangganan!'); }} className="space-y-2">
            <input 
              type="email" 
              placeholder="Email Anda..." 
              className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs focus:outline-none" 
              required 
            />
            <button type="submit" className="w-full bg-yellow-300 font-black py-2 text-xs uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition">
              Langganan
            </button>
          </form>
        </div>
      </div>

      <div className="bg-black text-white py-4 text-center font-black text-[10px] uppercase tracking-widest border-t-2 border-black">
        © 2026 WARMART. Hak Cipta Dilindungi Undang-Undang.
      </div>
    </footer>
  );
}