import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import CheckoutModal from './CheckoutModal';
import { CartContext } from '../context/CartContext';

export default function ProductCard({ product }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { addToCart } = useContext(CartContext);

  return (
    <>
      <div className="bg-white border-4 border-black p-4 flex flex-col justify-between shadow-brutal-hover transition-all">
        <div>
          {/* Box Gambar */}
          <Link to={`/product/${product.id}`} className="block relative bg-gray-100 border-2 border-black aspect-square mb-4 flex items-center justify-center overflow-hidden group">
            <i className="fas fa-box-open text-6xl text-black group-hover:scale-110 transition duration-300"></i>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 border border-black uppercase tracking-wider">
                Sisa {product.stock}!
              </span>
            )}
          </Link>

          {/* Info Toko & Judul */}
          <p className="text-[10px] font-black uppercase text-gray-500 mb-1">
            🏪 {product.store_name || 'Official Store'}
          </p>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-black text-base uppercase leading-tight mb-3 hover:underline line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          <p className="font-black text-lg mb-4 bg-yellow-300 w-fit px-2.5 py-1 border-2 border-black shadow-brutal">
            Rp {Number(product.price).toLocaleString('id-ID')}
          </p>

          {/* Tombol Aksi */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs py-2 uppercase border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 disabled:bg-gray-300 disabled:shadow-none"
            >
              + Keranjang
            </button>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={product.stock === 0}
              className="bg-black hover:bg-gray-800 text-white font-black text-xs py-2 uppercase border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 disabled:bg-gray-300 disabled:shadow-none"
            >
              Beli
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal 
        product={product} 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => alert('Pesanan berhasil dibuat!')}
      />
    </>
  );
}