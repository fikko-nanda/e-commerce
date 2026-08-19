import { useState, useEffect } from 'react';
import API from '../services/api';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'OVERSIZED T-SHIRT BLACK VOL. 01', price: 189000, stock: 12, category: 'tshirt', image_url: null },
  { id: 2, name: 'HEAVYWEIGHT HOODIE RED NEON', price: 349000, stock: 3, category: 'hoodie', image_url: null },
];

const DUMMY_ORDERS = [
  { id: 'ORD-9901', customer: 'Budi Santoso', item: 'OVERSIZED T-SHIRT BLACK VOL. 01', qty: 2, total: 378000, status: 'PERLU DIKIRIM' },
  { id: 'ORD-9902', customer: 'Siti Rahma', item: 'HEAVYWEIGHT HOODIE RED NEON', qty: 1, total: 349000, status: 'SELESAI' },
];

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders'
  const [products, setProducts] = useState(DUMMY_PRODUCTS);
  const [orders, setOrders] = useState(DUMMY_ORDERS);
  
  // State Form Tambah
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('tshirt');
  const [imagePreview, setImagePreview] = useState(null);

  // State Edit Modal
  const [editProduct, setEditProduct] = useState(null);

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (isEdit) {
        setEditProduct({ ...editProduct, image_url: url });
      } else {
        setImagePreview(url);
      }
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const newProd = {
      id: Date.now(),
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      image_url: imagePreview,
    };
    setProducts([newProd, ...products]);
    setName(''); setPrice(''); setStock(''); setImagePreview(null);
    alert('Produk berhasil ditambahkan!');
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    setProducts(products.map((p) => (p.id === editProduct.id ? editProduct : p)));
    setEditProduct(null);
    alert('Data produk diperbarui!');
  };

  const handleDelete = (id) => {
    if (confirm('Hapus produk ini dari katalog?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleShipOrder = (orderId) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'SELESAI' } : o));
    alert(`Pesanan ${orderId} telah dikirim!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header & Stat Ringkasan Toko */}
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b-4 border-black pb-6 mb-8 gap-4">
        <div>
          <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
            OFFICIAL STORE
          </span>
          <h1 className="text-4xl font-black uppercase tracking-tighter mt-1">WARMART APPAREL</h1>
        </div>

        <div className="flex gap-3">
          <div className="bg-yellow-300 border-2 border-black p-3 shadow-brutal text-center min-w-[110px]">
            <span className="block text-[10px] font-black uppercase">Produk Aktif</span>
            <span className="text-xl font-black">{products.length}</span>
          </div>
          <div className="bg-green-400 border-2 border-black p-3 shadow-brutal text-center min-w-[110px]">
            <span className="block text-[10px] font-black uppercase">Pesanan Baru</span>
            <span className="text-xl font-black">
              {orders.filter((o) => o.status === 'PERLU DIKIRIM').length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`font-black text-xs uppercase px-5 py-3 border-2 border-black shadow-brutal transition ${
            activeTab === 'products' ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
          }`}
        >
          📦 Manajemen Katalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`font-black text-xs uppercase px-5 py-3 border-2 border-black shadow-brutal transition ${
            activeTab === 'orders' ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
          }`}
        >
          📋 Pesanan Masuk ({orders.length})
        </button>
      </div>

      {/* TAB 1: MANAJEMEN KATALOG & TAMBAH PRODUK */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Tambah Produk */}
          <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg h-fit">
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">
              + Rilis Produk Baru
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Foto Produk</label>
                <div className="bg-white border-2 border-black p-3 text-center">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover border-2 border-black shadow-brutal mb-2" />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} className="w-full text-xs font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Produk</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga (Rp)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Stok</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none">
                  <option value="tshirt">T-Shirt</option>
                  <option value="hoodie">Hoodie & Jacket</option>
                  <option value="pants">Pants</option>
                  <option value="accessories">Aksesoris</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-black text-white font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-red-600 transition">
                Simpan & Publikasikan 🚀
              </button>
            </form>
          </div>

          {/* Daftar Produk (CRUD List) */}
          <div className="lg:col-span-2 space-y-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white border-4 border-black p-4 flex justify-between items-center shadow-brutal gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-300 border-2 border-black flex items-center justify-center shrink-0 overflow-hidden shadow-brutal">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👕</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{p.category}</span>
                    <h4 className="font-black text-sm uppercase mt-1">{p.name}</h4>
                    <p className="text-xs font-bold text-gray-600">
                      Rp {Number(p.price).toLocaleString('id-ID')} | Stok: {p.stock}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setEditProduct(p)} className="bg-blue-400 font-black text-xs px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white font-black text-xs px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black transition">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PESANAN MASUK */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white border-4 border-black p-6 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-sm bg-yellow-300 px-2 py-0.5 border-2 border-black shadow-brutal">
                    {ord.id}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 border border-black ${
                    ord.status === 'PERLU DIKIRIM' ? 'bg-red-400 text-white' : 'bg-green-400 text-black'
                  }`}>
                    {ord.status}
                  </span>
                </div>
                <h4 className="font-black text-base uppercase">{ord.item} (x{ord.qty})</h4>
                <p className="text-xs font-bold text-gray-600">Pembeli: {ord.customer}</p>
                <p className="text-xs font-black mt-1">Total Transaksi: Rp {ord.total.toLocaleString('id-ID')}</p>
              </div>

              {ord.status === 'PERLU DIKIRIM' && (
                <button
                  onClick={() => handleShipOrder(ord.id)}
                  className="bg-green-400 font-black text-xs px-5 py-3 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
                >
                  🚚 Konfirmasi Pengiriman
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDIT PRODUK */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 shadow-brutal-lg max-w-md w-full relative">
            <button onClick={() => setEditProduct(null)} className="absolute top-3 right-3 bg-red-500 text-white font-black px-2.5 py-1 border-2 border-black">
              ✕
            </button>
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">
              Edit Produk #{editProduct.id}
            </h3>

            <form onSubmit={handleUpdateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                    className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Stok</label>
                  <input
                    type="number"
                    value={editProduct.stock}
                    onChange={(e) => setEditProduct({ ...editProduct, stock: Number(e.target.value) })}
                    className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Foto Baru (Opsional)</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} className="w-full text-xs font-bold" />
              </div>

              <button type="submit" className="w-full bg-yellow-300 font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition mt-4">
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}