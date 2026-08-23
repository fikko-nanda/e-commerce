import { createContext, useContext, useState } from 'react';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  // State Informasi Toko
  const [storeInfo, setStoreInfo] = useState({
    name: 'WARMART OFFICIAL',
    description: 'Penyedia streetwear & fashion lokal kualitas brutal.',
    logo: 'https://images.unsplash.com/photo-1560060141-7b9018741ced?w=400&auto=format&fit=crop&q=80',
  });

  // State Daftar Produk (Stok Tersimpan di Sini)
  const [products, setProducts] = useState([
    {
      id: 'prod-1',
      name: 'WARMART Heavyweight Graphic Tee',
      price: 189000,
      stock: 10,
      category: 'tshirt',
      description: 'Kaos bahan cotton 16s tebal.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    },
    {
      id: 'prod-2',
      name: 'Cyberpunk Black Pullover Hoodie',
      price: 349000,
      stock: 5,
      category: 'hoodie',
      description: 'Hoodie bahan fleece tebal premium.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80',
    },
  ]);

  // State Pesanan Masuk untuk Seller
  const [orders, setOrders] = useState([]);

  // FUNGSI UTAMA: Potong Stok & Buat Pesanan Saat Buyer Checkout
  const processCheckout = (cartItems, customerName) => {
    // 1. Kurangi Stok Produk secara Otomatis
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const boughtItem = cartItems.find((item) => item.id === product.id);
        if (boughtItem) {
          const updatedStock = product.stock - boughtItem.quantity;
          return {
            ...product,
            stock: updatedStock < 0 ? 0 : updatedStock,
          };
        }
        return product;
      })
    );

    // 2. Tambahkan Transaksi ke Dashboard Seller
    const newOrders = cartItems.map((item) => ({
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: customerName,
      items: `${item.name} (${item.quantity} pcs)`,
      total: item.price * item.quantity,
      status: 'Perlu Dikirim',
      date: new Date().toISOString().split('T')[0],
    }));

    setOrders((prevOrders) => [...newOrders, ...prevOrders]);
  };

  // Fungsi Pengelolaan Produk oleh Seller
  const addProduct = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <StoreContext.Provider
      value={{
        storeInfo,
        setStoreInfo,
        products,
        orders,
        processCheckout,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrderStatus,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useStore = () => useContext(StoreContext);