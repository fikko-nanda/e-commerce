import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services';
import ProductCard from '../../components/ProductCard';

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
  },
];

export default function StoreProfile() {
  const { storeName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const decodedStoreName = decodeURIComponent(storeName || '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    productService
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const dataList = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        // Filter produk khusus nama toko yang diklik
        const storeProducts = dataList.filter(
          (p) => p.store_name?.toLowerCase() === decodedStoreName.toLowerCase()
        );

        if (storeProducts.length > 0) {
          setProducts(storeProducts);
        } else {
          // Fallback dummy data jika backend belum ada
          const dummyStoreProducts = DUMMY_PRODUCTS.filter(
            (p) => p.store_name?.toLowerCase() === decodedStoreName.toLowerCase()
          );
          setProducts(
            dummyStoreProducts.length > 0 ? dummyStoreProducts : DUMMY_PRODUCTS
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback dummy data saat error/offline
        const dummyStoreProducts = DUMMY_PRODUCTS.filter(
          (p) => p.store_name?.toLowerCase() === decodedStoreName.toLowerCase()
        );
        setProducts(
          dummyStoreProducts.length > 0 ? dummyStoreProducts : DUMMY_PRODUCTS
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [decodedStoreName]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header Profile Toko */}
      <div className="bg-yellow-300 border-4 border-black p-8 shadow-brutal-lg mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest inline-block mb-2">
            OFFICIAL STORE 🏪
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">
            {decodedStoreName}
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2">
            Koleksi lengkap produk autentik rilis dari toko {decodedStoreName}.
          </p>
        </div>
        <Link
          to="/"
          className="bg-black text-white font-black text-xs uppercase px-6 py-3 shadow-brutal hover:bg-white hover:text-black transition border-2 border-black"
        >
          ← Kembali ke Beranda
        </Link>
      </div>

      {/* Katalog Produk Toko */}
      <h2 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-black pb-3 mb-6">
        Katalog Toko ({products.length} Produk)
      </h2>

      {loading ? (
        <div className="text-center py-20 font-black text-gray-400 uppercase">
          Memuat Produk Toko...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-gray-100 border-4 border-black font-black text-gray-500 uppercase shadow-brutal">
          Toko ini belum memiliki produk.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}