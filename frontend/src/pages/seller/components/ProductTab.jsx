export default function ProductTab({ loadingProducts, products, handleOpenAddModal, handleOpenEditModal, handleDeleteProduct }) {
  if (loadingProducts) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center shadow-brutal">
        <p className="font-black text-sm uppercase text-gray-400">Memuat produk...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-8 text-center shadow-brutal">
        <p className="font-black text-sm uppercase">Belum ada produk yang ditambahkan.</p>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="mt-4 bg-yellow-300 border-2 border-black font-black px-4 py-2 text-xs uppercase shadow-brutal cursor-pointer"
        >
          + Tambah Produk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((item) => (
        <div key={item.id} className="bg-white border-4 border-black p-4 shadow-brutal flex flex-col justify-between space-y-4">
          <div className="flex gap-4">
            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover border-2 border-black flex-shrink-0 bg-gray-100" />
            <div>
              <span className="bg-yellow-300 border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
                {item.category}
              </span>
              <h3 className="font-black text-sm uppercase line-clamp-2 mt-1">{item.name}</h3>
              <p className="font-black text-xs text-gray-700 mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
              <div className="flex gap-2 text-[10px] font-bold text-gray-500 mt-1">
                <span>Stok: {item.stock}</span>
                <span>•</span>
                <span className="text-black font-black">Terjual: {item.sold}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t-2 border-black">
            <button
              type="button"
              onClick={() => handleOpenEditModal(item)}
              className="flex-1 bg-yellow-300 border-2 border-black py-1.5 text-xs font-black uppercase shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDeleteProduct(item.id)}
              className="flex-1 bg-red-500 text-white border-2 border-black py-1.5 text-xs font-black uppercase shadow-brutal hover:bg-black transition cursor-pointer"
            >
              Hapus
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}