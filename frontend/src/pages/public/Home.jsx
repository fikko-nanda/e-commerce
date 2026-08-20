import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services';
import ProductCard from '../../components/ProductCard';
import MarqueeBanner from '../../components/MarqueeBanner';
import CategoryFilter from '../../components/CategoryFilter';

// Data dummy cadangan jika API backend belum ada / kosong
const DUMMY_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'WARMART Heavyweight Graphic Tee',
    price: 189000,
    stock: 45,
    category: 'tshirt',
    description: 'Bahan 100% Cotton Combed 24s tebal, potongan oversized brutalist aesthetic dengan sablon plastisol awet.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
    store_name: 'WARMART Official',
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Cyberpunk Black Pullover Hoodie',
    price: 349000,
    stock: 12,
    category: 'hoodie',
    description: 'Fleece tebal 330gsm dengan sablon grafis cyberpunk. Hangat, nyaman, dan berkarakter.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
    store_name: 'WARMART Official',
    created_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Tactical Cargo Pants Black',
    price: 279000,
    stock: 8,
    category: 'pants',
    description: 'Celana kargo streetwear banyak saku, jahitan rantai ganda, sangat durable untuk daily wear.',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=80',
    store_name: 'WARMART Official',
    created_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Brutalist Tactical Crossbody Bag',
    price: 149000,
    stock: 20,
    category: 'accessories',
    description: 'Tas selempang bahan Cordura waterproof, slot serbaguna untuk kebutuhan daily hangout.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    store_name: 'WARMART Official',
    created_at: new Date('2026-01-18').toISOString(),
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const handleCategoryChange = (cat) => {
    setLoading(true);
    setSelectedCategory(cat);
  };

  // Debounce pencarian
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch API + Fallback ke Data Dummy
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    productService
      .getAll(selectedCategory)
      .then((res) => {
        if (cancelled) return;

        const dataList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

        if (dataList && dataList.length > 0) {
          setProducts(dataList);
        } else {
          const filteredDummy =
            selectedCategory === 'all'
              ? DUMMY_PRODUCTS
              : DUMMY_PRODUCTS.filter((p) => p.category === selectedCategory);
          setProducts(filteredDummy);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const filteredDummy =
          selectedCategory === 'all'
            ? DUMMY_PRODUCTS
            : DUMMY_PRODUCTS.filter((p) => p.category === selectedCategory);
        setProducts(filteredDummy);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  // Filter kata kunci pencarian + Sorting
  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.store_name && p.store_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'low-to-high') return Number(a.price) - Number(b.price);
      if (sortBy === 'high-to-low') return Number(b.price) - Number(a.price);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="min-h-screen bg-white">
      <MarqueeBanner />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Banner Hero Utama */}
        <div className="bg-yellow-300 border-4 border-black p-8 md:p-12 shadow-brutal-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest inline-block mb-3">
              Koleksi Terbaru 2026
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
              PANGGUNG STREETWEAR LOKAL.
            </h1>
            <p className="text-sm font-bold leading-relaxed text-black/80">
              Dapatkan produk autentik langsung dari kreasor independen terbaik.
            </p>
          </div>
          <a
            href="#katalog"
            className="bg-black text-white font-black px-8 py-4 uppercase tracking-widest shadow-brutal hover:bg-red-600 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            Jelajahi Sekarang →
          </a>
        </div>

        {/* BANNER CTA: PENDAFTARAN SELLER BARU */}
        <div className="bg-black text-white border-4 border-black p-6 md:p-8 shadow-brutal mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-300 text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                Verifikasi Ketat
              </span>
              <span className="text-yellow-300 font-mono text-xs font-bold">
                ● Membuka Batch Registrasi Penjual
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Punya Brand / Produk Sendiri?
            </h2>
            <p className="text-xs text-gray-300 font-medium leading-relaxed">
              Bergabunglah menjadi seller terverifikasi di WARMART. Siapkan KTP, NPWP, dan data legalitas toko Anda untuk proses kurasi platform.
            </p>
          </div>
          <Link
            to="/seller/register"
            className="bg-yellow-300 text-black font-black px-6 py-3 text-xs uppercase tracking-wider border-2 border-white hover:bg-white transition whitespace-nowrap shadow-brutal"
          >
            Daftar Jadi Seller →
          </Link>
        </div>

        {/* Section Katalog */}
        <div id="katalog">
          <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-3">
            Katalog Produk
          </h2>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 my-6">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
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
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearch('');
                    }}
                    className="absolute right-2 top-2 text-xs font-black text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
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
            <div className="text-center py-20 font-black text-gray-400 uppercase">
              Memuat Produk...
            </div>
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