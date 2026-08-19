import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const DUMMY_DETAIL = {
  id: 1,
  name: 'OVERSIZED T-SHIRT BLACK VOL. 01',
  price: 189000,
  stock: 12,
  store_name: 'WARMART IND',
  category: 'tshirt',
  description: 'T-shirt streetwear berpotongan oversized dengan material Heavy Cotton Combed 24s. Cetakan sablon plastisol tahan lama dengan detail grafis Neobrutalism.',
  sizes: ['S', 'M', 'L', 'XL'],
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/products/${id}/`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        setProduct({ ...DUMMY_DETAIL, id: Number(id) });
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Detail Produk...</div>;
  }

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart({ ...product, selectedSize, quantity });
    showToast(`${product.name} (${selectedSize}) x${quantity} masuk keranjang!`, 'success');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/user/dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 font-black text-xs uppercase bg-white border-2 border-black px-4 py-2 shadow-brutal hover:bg-black hover:text-white transition"
      >
        ← Kembali
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Visual Foto Produk */}
        <div className="bg-yellow-300 border-4 border-black aspect-square flex items-center justify-center p-8 shadow-brutal-lg relative">
          {product.image || product.image_url ? (
            <img src={product.image || product.image_url} alt={product.name} className="w-full h-full object-cover border-2 border-black" />
          ) : (
            <span className="text-8xl">👕</span>
          )}
          <span className="absolute top-4 left-4 bg-black text-white text-xs font-black px-3 py-1 uppercase tracking-widest">
            {product.category || 'Streetwear'}
          </span>
        </div>

        {/* Spesifikasi & Opsi Pembelian */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-wider inline-block mb-2">
              {product.store_name || 'WARMART IND'}
            </span>
            <h1 className="text-3xl font-black uppercase leading-tight mb-3">{product.name}</h1>
            <p className="text-3xl font-black bg-yellow-300 inline-block px-3 py-1 border-2 border-black shadow-brutal mb-6">
              Rp {Number(product.price).toLocaleString('id-ID')}
            </p>

            <div className="border-t-2 border-b-2 border-black py-4 my-4 space-y-4">
              {/* Sizing Selector */}
              <div>
                <label className="block font-black text-xs uppercase mb-2">Pilih Ukuran:</label>
                <div className="flex gap-2">
                  {(product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`font-black text-xs px-4 py-2 border-2 border-black shadow-brutal transition ${
                        selectedSize === sz ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Counter */}
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
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-white font-black px-3 py-1 border-2 border-black shadow-brutal hover:bg-black hover:text-white"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-gray-500 ml-2">(Sisa Stok: {product.stock})</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase mb-1">Deskripsi Produk:</h4>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t-4 border-black">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-yellow-300 font-black text-xs uppercase py-3.5 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
            >
              + Tambah Ke Keranjang
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-black text-white font-black text-xs uppercase py-3.5 border-2 border-black shadow-brutal hover:bg-green-400 hover:text-black transition"
            >
              Beli Sekarang⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}