import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, reviewService } from '../../services';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CheckoutModal from '../../components/CheckoutModal';
import LoginModal from '../../components/LoginModal';

// --- DATA DUMMY UNTUK TAMPILAN HOMEPAGE / FALLBACK ---
const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'Sepatu Sneakers Neobrutalism Yellow',
    price: 350000,
    stock: 15,
    category: 'Fashion',
    store_name: 'Toko Keren Jaya',
    description: 'Sepatu sneakers gaya Neobrutalism kekinian dengan sol tebal anti-selip. Bahan kanvas premium super nyaman digunakan sehari-hari.',
    image: '',
  },
  {
    id: '2',
    name: 'Jaket Hoodie Streetwear Black',
    price: 275000,
    stock: 8,
    category: 'Fashion',
    store_name: 'Street Apparel',
    description: 'Hoodie katun fleece tebal hangat dan tidak panas. Jahitan kuat dengan gaya streetwear kasual.',
    image: '',
  },
  {
    id: '3',
    name: 'Tote Bag Canvas Neobrutal',
    price: 85000,
    stock: 25,
    category: 'Aksesoris',
    store_name: 'Toko Keren Jaya',
    description: 'Tote bag kanvas tebal tahan air dilengkapi sablon desain tebal bergaya neobrutalism. Muat laptop hingga 15 inch.',
    image: '',
  },
  {
    id: '4',
    name: 'Kacamata Hitam Cyberpunk',
    price: 120000,
    stock: 10,
    category: 'Aksesoris',
    store_name: 'Optik Futuristik',
    description: 'Kacamata hitam gaya cyberpunk dengan perlindungan UV400. Frame tebal dan kokoh.',
    image: '',
  },
];

const DUMMY_REVIEWS = [
  {
    id: 101,
    username: 'Budi_Santoso',
    rating: 5,
    comment: 'Barangnya mantap banget! Desain neobrutalism-nya mencolok & beda dari yang lain 🔥',
  },
  {
    id: 102,
    username: 'Siti_Anisa',
    rating: 4,
    comment: 'Pengiriman cepat, kualitas bahan tebal dan sesuai dengan foto produk.',
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
<<<<<<< HEAD
  const [isWishlisted, setIsWishlisted] = useState(false);
=======
  const [isLoginOpen, setIsLoginOpen] = useState(false);
>>>>>>> fitur-chat-lokal

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Coba ambil dari backend
        const res = await productService.getDetail(id);
        const data = res.data?.data || res.data;

        if (!cancelled && data && (data.id || data.name)) {
          setProduct(data);
          fetchReviews(id);
        } else {
          throw new Error('Data tidak valid');
        }
      } catch (err) {
        if (cancelled) return;
        // 2. Fallback ke Data Dummy jika API gagal/belum tersedia
        console.warn('API Produk gagal, menggunakan Data Dummy:', err);
        
        const dummyFound = DUMMY_PRODUCTS.find((p) => String(p.id) === String(id)) || {
          id: id || '1',
          name: `Produk Dummy #${id || '1'}`,
          price: 150000,
          stock: 10,
          category: 'Kategori Dummy',
          store_name: 'Toko Contoh',
          description: 'Ini adalah deskripsi produk dummy untuk pratinjau antarmuka pengguna.',
          image: '',
        };

        setProduct(dummyFound);
        setReviews(DUMMY_REVIEWS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchReviews = async (productId) => {
      try {
        const reviewRes = await reviewService.getByProduct(productId);
        if (!cancelled && reviewRes) {
          const list = Array.isArray(reviewRes.data)
            ? reviewRes.data
            : reviewRes.data?.results || reviewRes.data?.data || [];
          setReviews(list.length > 0 ? list : DUMMY_REVIEWS);
        }
      } catch {
        if (!cancelled) setReviews(DUMMY_REVIEWS);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Cek status Wishlist dari localStorage saat produk siap
  useEffect(() => {
    if (product?.id) {
      const savedWishlist = JSON.parse(localStorage.getItem('warmart_wishlist') || '[]');
      setIsWishlisted(savedWishlist.some((item) => String(item.id) === String(product.id)));
    }
  }, [product]);

  const toggleWishlist = () => {
    if (!user) {
      showToast('Silakan login untuk menyimpan produk favorit!', 'error');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    let savedWishlist = JSON.parse(localStorage.getItem('warmart_wishlist') || '[]');
    if (isWishlisted) {
      savedWishlist = savedWishlist.filter((item) => String(item.id) !== String(product.id));
      setIsWishlisted(false);
      showToast('Dihapus dari Wishlist', 'info');
    } else {
      savedWishlist.push(product);
      setIsWishlisted(true);
      showToast('Ditambahkan ke Wishlist! ❤️', 'success');
    }
    localStorage.setItem('warmart_wishlist', JSON.stringify(savedWishlist));
  };

  if (loading) {
    return <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Detail Produk...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-2xl font-black uppercase text-red-600 mb-4">Produk Tidak Ditemukan</p>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white font-black px-6 py-3 uppercase border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition"
        >
          ← Kembali ke Beranda
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk menambah ke keranjang!', 'error');
      setIsLoginOpen(true);
      return;
    }

    addToCart({ ...product, quantity });
    showToast(`${product.name} x${quantity} masuk keranjang!`, 'success');
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk membeli!', 'error');
      setIsLoginOpen(true);
      return;
    }

    setIsCheckoutOpen(true);
  };

  const handleChatSeller = () => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk chat dengan penjual!', 'error');
      setIsLoginOpen(true);
      return;
    }

    const storeParam = encodeURIComponent(product.store_name || 'Toko');
    const productParam = encodeURIComponent(product.name || '');
    navigate(`/user/chat?store=${storeParam}&productId=${product.id}&productName=${productParam}`);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
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
        {/* Gambar / Banner Produk */}
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

        {/* Informasi Produk */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link
                  to={`/store/${encodeURIComponent(product.store_name || '')}`}
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

              {/* Tombol Wishlist */}
              <button
                onClick={toggleWishlist}
                className={`font-black text-xs px-3 py-1 border-2 border-black shadow-brutal transition ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-red-100'
                }`}
              >
                {isWishlisted ? '❤️ Favorit Saya' : '🤍 Simpan Favorit'}
              </button>
            </div>

            <h1 className="text-3xl font-black uppercase leading-tight mb-3">{product.name}</h1>
            <p className="text-3xl font-black bg-yellow-300 inline-block px-3 py-1 border-2 border-black shadow-brutal mb-6">
              Rp {Number(product.price || 0).toLocaleString('id-ID')}
            </p>

            {avgRating && (
              <div className="mb-4 text-sm font-bold flex items-center gap-2">
                <span className="text-yellow-500">{'★'.repeat(Math.round(avgRating))}</span>
                <span className="text-gray-600 font-black">
                  {avgRating} ({reviews.length} ulasan)
                </span>
              </div>
            )}

            {/* Jumlah Pembelian */}
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
                  <span className="text-xs font-bold text-gray-500 ml-2">(Sisa Stok: {product.stock ?? 10})</span>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            {product.description && (
              <div>
                <h4 className="font-black text-xs uppercase mb-1">Deskripsi Produk:</h4>
                <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Tombol Aksi Belanja */}
          <div className="flex gap-4 pt-4 border-t-4 border-black">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-yellow-300 font-black text-xs uppercase py-3.5 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
            >
              + Tambah Ke Keranjang
            </button>
            <button
              onClick={handleBuyNow}
              disabled={(product.stock ?? 1) <= 0}
              className="flex-1 bg-black text-white font-black text-xs uppercase py-3.5 border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition disabled:bg-gray-300"
            >
              Beli Sekarang⚡
            </button>
          </div>
        </div>
      </div>

      {/* Bagian Ulasan Pembeli */}
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
        onSuccess={() => navigate('/user/orders')}
      />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}