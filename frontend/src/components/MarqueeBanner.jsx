export default function MarqueeBanner() {
  return (
    <div className="bg-black text-yellow-300 border-b-4 border-black py-2.5 overflow-hidden whitespace-nowrap flex font-black text-xs uppercase tracking-widest select-none">
      <div className="animate-marquee flex gap-8 shrink-0">
        <span>⚡ DISKON PENGGUNA BARU 20%</span>
        <span>•</span>
        <span>GRATIS ONGKIR SE-INDONESIA</span>
        <span>•</span>
        <span>STREETWEAR LOKAL ORIGINAL 100%</span>
        <span>•</span>
        <span>RILISAN TERBATAS KOLEKSI 2026</span>
        <span>•</span>
      </div>
      <div className="animate-marquee flex gap-8 shrink-0" aria-hidden="true">
        <span>⚡ DISKON PENGGUNA BARU 20%</span>
        <span>•</span>
        <span>GRATIS ONGKIR SE-INDONESIA</span>
        <span>•</span>
        <span>STREETWEAR LOKAL ORIGINAL 100%</span>
        <span>•</span>
        <span>RILISAN TERBATAS KOLEKSI 2026</span>
        <span>•</span>
      </div>
    </div>
  );
}