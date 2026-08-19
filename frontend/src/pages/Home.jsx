import { useEffect, useState } from 'react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import MarqueeBanner from '../components/MarqueeBanner';
import CategoryFilter from '../components/CategoryFilter';

// Data Dummy Contoh Produk jika API Kosong / Error
const DUMMY_PRODUCTS = [
  { id: 1, name: 'OVERSIZED T-SHIRT BLACK VOL. 01', price: 189000, stock: 12, store_name: 'WARMART IND', category: 'tshirt' },
  { id: 2, name: 'HEAVYWEIGHT HOODIE RED NEON', price: 349000, stock: 3, store_name: 'URBAN CORE', category: 'hoodie' },
  { id: 3, name: 'CARGO PANTS TACTICAL BLACK', price: 279000, stock: 8, store_name: 'STREET LAB', category: 'pants' },
  { id: 4, name: 'BUCKET HAT STREETWEAR LOGO', price: 99000, stock: 15, store_name: 'WARMART IND', category: 'accessories' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;

    let url = '/products/';
    if (selectedCategory !== 'all') {
      url += `?category=${selectedCategory}`;
    }

    // Ambil data produk
    API.get(url)
      .then((res) => {
        if (!isMounted) return;
        const rawData = res.data?.data || res.data;
        const dataList = Array.isArray(rawData) 
          ? rawData 
          : (Array.isArray(rawData?.results) ? rawData.results : []);

        setProducts(dataList.length > 0 ? dataList : DUMMY_PRODUCTS);
      })
      .catch(() => {
        if (!isMounted) return;
        setProducts(DUMMY_PRODUCTS);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      <MarqueeBanner />

      <div className="max-w-7xl mx-auto px-6 py-12">
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
            className="bg-black text-white font-black px-8 py-4 uppercase tracking-widest shadow-brutal hover:bg-red-600 transition"
          >
            Jelajahi Sekarang →
          </a>
        </div>

        <div id="katalog">
          <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-3">
            Katalog Produk
          </h2>

          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onSelectCategory={(cat) => {
              setLoading(true); // Pemicu loading dipindah ke aksi user saat ganti kategori
              setSelectedCategory(cat);
            }} 
          />

          {loading ? (
            <div className="text-center py-20 font-black text-gray-400 uppercase">Memuat Produk...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
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