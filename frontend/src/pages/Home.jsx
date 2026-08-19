import { useEffect, useState } from 'react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/products/')
      .then((res) => {
        // Cek apakah response berupa array langsung atau dikemas di res.data.results (DRF Pagination)
        const dataList = Array.isArray(res.data) 
          ? res.data 
          : (Array.isArray(res.data?.results) ? res.data.results : []);

        setProducts(dataList);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal mengambil data produk:", err);
        setProducts([]); // Jaga-jaga agar tetap array jika API error
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <header className="bg-black text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative z-10 flex flex-col items-start">
          <span className="bg-red-600 text-white text-xs font-black px-3 py-1 uppercase tracking-widest mb-4">New Drop 🔥</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none mb-4 tracking-tighter">
            Urban Armory Vol. 02
          </h1>
          <p className="text-gray-400 max-w-md font-semibold mb-8">
            Koleksi streetwear terbaru. Siapkan dirimu sebelum kehabisan.
          </p>
          <a href="#products" className="bg-white text-black text-sm font-black px-8 py-4 uppercase tracking-widest hover:bg-gray-200 transition">
            Mulai Belanja
          </a>
        </div>
      </header>

      {/* Product List */}
      <main id="products" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-10 border-b-2 border-black pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Katalog Produk</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 font-bold text-gray-500">Memuat produk...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-bold">Belum ada produk tersedia.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}