import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();

  const imageUrl = product.image || product.image_url;

  const handleAddToCart = () => {
    // 1. Cek apakah user sudah login
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk menambah ke keranjang!', 'error');
      navigate('/login', { state: { from: '/' } });
      return;
    }

    // 2. Jika sudah login, tambahkan ke keranjang
    addToCart(product);
    showToast(`${product.name} masuk keranjang!`, 'success');
  };

  return (
    <div className="bg-white border-4 border-black p-4 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition duration-200">
      <div>
        {/* Kontainer Foto / Visual Produk */}
        <div className="bg-yellow-300 border-2 border-black aspect-square flex items-center justify-center mb-4 relative shadow-brutal overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👕</span>
          )}
          <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider">
            {product.category || 'Streetwear'}
          </span>
        </div>

        <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
          {product.store_name || 'WARMART IND'}
        </span>
        <h3 className="font-black text-sm uppercase leading-tight line-clamp-2 mb-2">
          {product.name}
        </h3>
      </div>

      <div>
        <div className="flex justify-between items-center my-3 border-t-2 border-b-2 border-black py-2">
          <span className="font-black text-base">
            Rp {Number(product.price).toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] font-black uppercase bg-gray-100 border border-black px-1.5 py-0.5">
            Stok: {product.stock}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/product/${product.id}`}
            className="flex-1 bg-gray-100 font-black text-[11px] text-center uppercase py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
          >
            Detail
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-yellow-300 font-black text-[11px] uppercase py-2 border-2 border-black shadow-brutal hover:bg-green-400 transition"
          >
            + Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}