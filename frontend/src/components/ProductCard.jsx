export default function ProductCard({ product }) {
  return (
    <div className="group cursor-pointer flex flex-col h-full bg-white">
      <div className="relative bg-gray-100 aspect-square mb-4 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-black transition">
        <i className="fas fa-box-open text-6xl text-gray-300 group-hover:scale-110 transition duration-500"></i>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">
            Sisa {product.stock}!
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase">
            Habis
          </span>
        )}
      </div>
      <div className="flex justify-between items-start mb-1">
        <p className="text-xs font-bold text-gray-500 uppercase">
          <i className="fas fa-store mr-1"></i> {product.store_name || 'Official Store'}
        </p>
        {product.rating && (
          <p className="text-xs font-bold text-yellow-500">
            <i className="fas fa-star"></i> {product.rating}
          </p>
        )}
      </div>
      <h3 className="font-black text-lg leading-tight mb-2 group-hover:underline">{product.name}</h3>
      <div className="mt-auto flex items-center justify-between">
        <p className="font-black text-xl">
          Rp {Number(product.price).toLocaleString('id-ID')}
        </p>
        <button 
          disabled={product.stock === 0}
          className={`w-10 h-10 flex items-center justify-center transition rounded-none ${
            product.stock > 0 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <i className={product.stock > 0 ? "fas fa-plus" : "fas fa-times"}></i>
        </button>
      </div>
    </div>
  );
}