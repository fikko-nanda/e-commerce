import { useEffect, useState } from 'react';
import { productService } from '../services';
import ProductCard from '../components/ProductCard';
import MarqueeBanner from '../components/MarqueeBanner';
import CategoryFilter from '../components/CategoryFilter';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'low-to-high' | 'high-to-low'

  const handleCategoryChange = (cat) => {
    setLoading(true);
    setSelectedCategory(cat);
  };

  // Debounce pencarian: tunggu 300ms setelah user berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    productService.getAll(selectedCategory)
      .then((res) => {
        if (cancelled) return;
        const dataList = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.results) ? res.data.results : []));
        setProducts(dataList);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedCategory]);

  // Filter berdasarkan kata kunci pencarian (client-side, debounced) + sort
  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                   (p.store_name && p.store_name.toLowerCase().includes(debouncedSearch.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === 'low-to-high') return Number(a.price) - Number(b.price);
      if (sortBy === 'high-to-low') return Number(b.price) - Number(a.price);
      // Terbaru: urutkan berdasarkan created_at (bukan id — id adalah UUID string)
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="min-h-screen bg-white">
      <MarqueeBanner />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Banner Hero */}
        <div className="bg-yellow-300 border-4 border-black p-8 md:p-12 shadow-brutal-lg mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest inline-block mb-3">
              Koleksi Terbaru 2026
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
              PANGGUNG STREETWEAR LOKAL.
            </h1>
            <p className="text-sm font-bold leading-relaxed text-black/80">
              Dapatkan produk autentik langsung dari kreator independen terbaik.
            </p>
          </div>
          <a 
            href="#katalog" 
            className="bg-black text-white font-black px-8 py-4 uppercase tracking-widest shadow-brutal hover:bg-red-600 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            Jelajahi Sekarang →
          </a>
        </div>

        {/* Section Katalog */}
        <div id="katalog">
          <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-3">
            Katalog Produk
          </h2>

          {/* Baris Kontrol: Filter Kategori, Search Bar & Sort */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 my-6">
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              onSelectCategory={handleCategoryChange} 
            />

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Input Pencarian */}
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Produk / Toko..." 
                  className="w-full bg-gray-50 border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none shadow-brutal"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setDebouncedSearch(''); }}
                    className="absolute right-2 top-2 text-xs font-black text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown Sortir */}
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-white border-2 border-black px-3 py-2 text-xs font-black uppercase focus:outline-none shadow-brutal cursor-pointer"
              >
                <option value="newest">🔥 Rilisan Terbaru</option>
                <option value="low-to-high">💵 Harga: Murah ke Mahal</option>
                <option value="high-to-low">💎 Harga: Mahal ke Murah</option>
              </select>
            </div>
          </div>

          {/* Grid Produk */}
          {loading ? (
            <div className="text-center py-20 font-black text-gray-400 uppercase">Memuat Produk...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-gray-100 border-4 border-black font-black text-gray-500 uppercase shadow-brutal">
              Produk tidak ditemukan. Coba ubah kata kunci pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}