import { useState, useEffect } from 'react';
import API from '../services/api';

const DUMMY_SELLER_PRODUCTS = [
  { id: 1, name: 'OVERSIZED T-SHIRT BLACK VOL. 01', price: 189000, stock: 12, category: 'tshirt', description: 'Sample product' },
  { id: 2, name: 'HEAVYWEIGHT HOODIE RED NEON', price: 349000, stock: 3, category: 'hoodie', description: 'Sample product' },
];

export default function SellerDashboard() {
  const [products, setProducts] = useState(DUMMY_SELLER_PRODUCTS);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('tshirt');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = () => {
    API.get('/products/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (data.length > 0) setProducts(data);
      })
      .catch((err) => {
        console.warn('Backend offline, menggunakan data lokal:', err);
      });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      description,
    };

    // Upaya simpan ke API (jika backend aktif)
    API.post('/products/', newProduct).catch(() => {});

    // Update tampilan lokal secara langsung
    setProducts([newProduct, ...products]);
    alert('Produk berhasil ditambahkan!');
    setName(''); setPrice(''); setStock(''); setDescription('');
  };

  const handleDelete = (id) => {
    if (confirm('Hapus produk ini?')) {
      API.delete(`/products/${id}/`).catch(() => {});
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-8">
        Dashboard Penjual
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Produk */}
        <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg h-fit">
          <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">
            + Tambah Produk Baru
          </h3>
          <form onSubmit={handleAddProduct} className="space-y-4">
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
            <div>
              <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-black text-white font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-red-600 transition">
              Rilis Produk 🚀
            </button>
          </form>
        </div>

        {/* Daftar Produk Penjual */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black uppercase mb-4">Katalog Saya ({products.length})</h3>
          {products.map((p) => (
            <div key={p.id} className="bg-white border-4 border-black p-4 flex justify-between items-center shadow-brutal">
              <div>
                <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{p.category}</span>
                <h4 className="font-black text-base uppercase mt-1">{p.name}</h4>
                <p className="text-xs font-bold text-gray-600">
                  Rp {Number(p.price).toLocaleString('id-ID')} | Stok: {p.stock} pcs
                </p>
              </div>
              <button 
                onClick={() => handleDelete(p.id)}
                className="bg-red-500 text-white font-black px-3 py-2 text-xs uppercase border-2 border-black shadow-brutal hover:bg-black transition"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}