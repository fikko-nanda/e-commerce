import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { CartContext } from '../context/CartContext';
import CheckoutModal from '../components/CheckoutModal';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'OVERSIZED T-SHIRT BLACK VOL. 01', price: 189000, stock: 12, store_name: 'WARMART IND', category: 'tshirt', description: 'T-Shirt berbahan 100% Cotton Combed 24s Heavyweight dengan potongan oversized modern. Tahan lama dan nyaman dipakai sehari-hari.' },
  { id: 2, name: 'HEAVYWEIGHT HOODIE RED NEON', price: 349000, stock: 3, store_name: 'URBAN CORE', category: 'hoodie', description: 'Hoodie Fleece 330gsm tebal dengan aksen warna merah neon. Dilengkapi sablon plastisol tahan pecah.' },
  { id: 3, name: 'CARGO PANTS TACTICAL BLACK', price: 279000, stock: 8, store_name: 'STREET LAB', category: 'pants', description: 'Celana cargo taktis berbahan Ripstop water-resistant. Dilengkapi 6 kantong fungsional.' },
  { id: 4, name: 'BUCKET HAT STREETWEAR LOGO', price: 99000, stock: 15, store_name: 'WARMART IND', category: 'accessories', description: 'Topi bucket berbahan kanvas tebal dengan bordir logo timbul.' }
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    API.get(`/products/${id}/`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback ke dummy data jika backend offline
        const found = DUMMY_PRODUCTS.find((p) => p.id === Number(id)) || DUMMY_PRODUCTS[0];
        setProduct(found);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 font-black text-gray-400 uppercase">Memuat Produk...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="bg-black text-white font-black text-xs px-4 py-2 uppercase border-2 border-black shadow-brutal mb-8 hover:bg-yellow-300 hover:text-black transition"
      >
        ← Kembali
      </button>

      <div className="bg-white border-4 border-black p-6 md:p-10 shadow-brutal-lg grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual Produk */}
        <div className="bg-yellow-300 border-4 border-black aspect-square flex flex-col items-center justify-center p-6 shadow-brutal">
          <span className="text-6xl mb-4">👕</span>
          <span className="font-black text-xs uppercase bg-black text-white px-3 py-1">
            {product.category || 'Streetwear'}
          </span>
        </div>

        {/* Detail Informasi */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest inline-block mb-2">
              {product.store_name || 'WARMART IND'}
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">
              {product.name}
            </h1>
            <p className="text-2xl font-black bg-green-300 border-2 border-black px-3 py-1 inline-block mb-6 shadow-brutal">
              Rp {Number(product.price).toLocaleString('id-ID')}
            </p>

            <div className="border-t-2 border-b-2 border-black py-4 mb-6 space-y-2">
              <p className="text-xs font-bold text-gray-700 leading-relaxed">
                {product.description || 'Tidak ada deskripsi produk.'}
              </p>
              <p className="text-xs font-black uppercase">
                Stok Tersedia: <span className="text-red-600">{product.stock} pcs</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => addToCart(product)}
              className="flex-1 bg-yellow-300 font-black py-3.5 px-4 text-xs uppercase border-2 border-black shadow-brutal hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 transition"
            >
              + Keranjang
            </button>
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="flex-1 bg-black text-white font-black py-3.5 px-4 text-xs uppercase border-2 border-black shadow-brutal hover:bg-red-600 active:translate-x-0.5 active:translate-y-0.5 transition"
            >
              Beli Sekarang 🚀
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal 
        product={product} 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        onSuccess={() => alert('Pesanan Anda berhasil dibuat!')}
      />
    </div>
  );
}