import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, reviewService } from '../../services';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CheckoutModal from '../../components/CheckoutModal';

// Data dummy cadangan agar sinkron dengan katalog Home
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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // 1. Coba ambil dari backend API
    productService.getDetail(id)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || res.data;

        if (data && (data.id || data.name)) {
          setProduct(data);
          setReviews([]);
          return reviewService.getByProduct(id);
        } else {
          throw new Error('Data API kosong');
        }
      })
      .then((res) => {
        if (cancelled || !res) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
        setReviews(list);
      })
      .catch(() => {
        if (cancelled) return;

        // 2. Fallback: Jika API gagal / ID tidak ditemukan di DB, cari di DUMMY_PRODUCTS
        const dummyItem = DUMMY_PRODUCTS.find((p) => String(p.id) === String(id));
        if (dummyItem) {
          setProduct(dummyItem);
          setReviews([]);
          setError(null);
        } else {
          setError('Produk tidak ditemukan.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Detail Produk...</div>;
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-2xl font-black uppercase text-red-600 mb-4">{error || 'Produk tidak ditemukan.'}</p>
        <button onClick={() => navigate('/')} className="bg-black text-white font-black px-6 py-3 uppercase border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition">
          ← Kembali ke Beranda
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk menambah ke keranjang!', 'error');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    addToCart({ ...product, quantity });
    showToast(`${product.name} x${quantity} masuk keranjang!`, 'success');
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk membeli!', 'error');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    setIsCheckoutOpen(true);
  };

  // Handler navigasi ke halaman chat pembeli & penjual dengan proteksi login
  const handleChatSeller = () => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk chat dengan penjual!', 'error');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    const storeParam = encodeURIComponent(product.store_name || 'WARMART Official');
    const productParam = encodeURIComponent(product.name || '');
    navigate(`/user/chat?store=${storeParam}&productId=${product.id}&productName=${productParam}`);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 font-black text-xs uppercase bg-white border-2 border-black px-4 py-2 shadow-brutal hover:bg-black hover:text-white transition"
      >
        ← Kembali
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-yellow-300 border-4 border-black aspect-square flex items-center justify-center p-8 shadow-brutal-lg relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover border-2 border-black" />
          ) : (
            <span className="text-8xl">🛍️</span>
          )}
          <span className="absolute top-4 left-4 bg-black text-white text-xs font-black px-3 py-1 uppercase tracking-widest">
            {product.category || 'Produk'}
          </span>
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div>
            {/* Area Info Toko + Tombol Chat Penjual */}
            <div className="flex items-center gap-2 mb-3">
              <Link
                to={`/store/${encodeURIComponent(product.store_name || 'WARMART Official')}`}
                className="bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-wider inline-block hover:bg-yellow-300 hover:text-black transition border border-black"
              >
                🏬 {product.store_name || 'Toko'}
              </Link>

              <button
                type="button"
                onClick={handleChatSeller}
                className="bg-white text-black text-[10px] font-black px-2.5 py-1 uppercase tracking-wider border border-black shadow-brutal hover:bg-yellow-300 transition flex items-center gap-1"
              >
                💬 Chat Penjual
              </button>
            </div>

            <h1 className="text-3xl font-black uppercase leading-tight mb-3">{product.name}</h1>
            <p className="text-3xl font-black bg-yellow-300 inline-block px-3 py-1 border-2 border-black shadow-brutal mb-6">
              Rp {Number(product.price).toLocaleString('id-ID')}
            </p>

            {avgRating && (
              <div className="mb-4 text-sm font-bold">
                <span className="text-yellow-500">{'★'.repeat(Math.round(avgRating))}</span>
                <span className="text-gray-300">{'★'.repeat(5 - Math.round(avgRating))}</span>
                <span className="ml-2 text-gray-600">{avgRating} ({reviews.length} ulasan)</span>
              </div>
            )}

            <div className="border-t-2 border-b-2 border-black py-4 my-4 space-y-4">
              <div>
                <label className="block font-black text-xs uppercase mb-2">Jumlah:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-white font-black px-3 py-1 border-2 border-black shadow-brutal hover:bg-black hover:text-white"
                  >
                    -
                  </button>
                  <span className="font-black text-sm px-2">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="bg-white font-black px-3 py-1 border-2 border-black shadow-brutal hover:bg-black hover:text-white"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-gray-500 ml-2">(Sisa Stok: {product.stock})</span>
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <h4 className="font-black text-xs uppercase mb-1">Deskripsi Produk:</h4>
                <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t-4 border-black">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-yellow-300 font-black text-xs uppercase py-3.5 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
            >
              + Tambah Ke Keranjang
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="flex-1 bg-black text-white font-black text-xs uppercase py-3.5 border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition disabled:bg-gray-300"
            >
              Beli Sekarang⚡
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t-4 border-black pt-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Ulasan Pembeli</h2>
        {reviews.length === 0 ? (
          <div className="bg-gray-50 border-2 border-black p-8 text-center font-black text-gray-400 uppercase text-sm">
            Belum ada ulasan untuk produk ini.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border-2 border-black p-4 shadow-brutal">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-xs uppercase">{review.username}</span>
                  <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}</span>
                </div>
                <p className="text-xs font-bold text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CheckoutModal
        product={product}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => navigate('/user/dashboard')}
      />
    </div>
  );
}