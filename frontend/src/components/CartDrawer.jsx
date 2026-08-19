import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useContext(CartContext);
  const [checkoutItem, setCheckoutItem] = useState(null);

  if (!isOpen) return null;

  const handleCheckoutItem = (item) => {
    setCheckoutItem(item);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50 flex justify-end" onClick={onClose}>
        <div
          className="bg-white border-l-4 border-black w-full max-w-md h-full flex flex-col shadow-brutal-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-black text-white p-4 border-b-4 border-black flex justify-between items-center">
            <span className="font-black text-sm uppercase tracking-wider">
              🛒 Keranjang ({totalItems})
            </span>
            <button onClick={onClose} className="text-white font-black text-lg hover:text-yellow-300">
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">🛒</p>
                <p className="font-black text-gray-400 uppercase text-sm">Keranjang masih kosong</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white border-2 border-black p-3 shadow-brutal">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-gray-500">{item.store_name || 'Official Store'}</p>
                        <h4 className="font-black text-sm uppercase leading-tight">{item.name}</h4>
                        <p className="text-xs font-bold text-gray-600 mt-1">
                          Rp {Number(item.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-500 text-white font-black px-2 py-1 text-[10px] uppercase border border-black hover:bg-black"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-yellow-300 border-2 border-black w-7 h-7 font-black text-sm hover:bg-yellow-400"
                        >
                          −
                        </button>
                        <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="bg-yellow-300 border-2 border-black w-7 h-7 font-black text-sm hover:bg-yellow-400 disabled:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-black text-sm">
                        Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCheckoutItem(item)}
                      disabled={item.stock === 0}
                      className="w-full mt-3 bg-black text-white font-black py-2 text-xs uppercase border-2 border-black shadow-brutal hover:bg-green-500 transition disabled:bg-gray-300"
                    >
                      Bayar Item Ini
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t-4 border-black p-4 bg-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-500">Total Bayar</span>
                <span className="text-2xl font-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <button
                onClick={clearCart}
                className="w-full bg-red-100 text-red-700 font-black py-2 text-xs uppercase border-2 border-black hover:bg-red-200"
              >
                Kosongkan Keranjang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout modal per item */}
      {checkoutItem && (
        <CheckoutModal
          product={checkoutItem}
          isOpen={true}
          onClose={() => setCheckoutItem(null)}
          onSuccess={() => {
            removeFromCart(checkoutItem.id);
            setCheckoutItem(null);
          }}
        />
      )}
    </>
  );
}