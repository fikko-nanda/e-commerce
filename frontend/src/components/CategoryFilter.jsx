export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const categories = [
    { id: 'all', label: '🔥 Semua Produk' },
    { id: 'tshirt', label: '👕 T-Shirt' },
    { id: 'hoodie', label: '🧥 Hoodie & Jacket' },
    { id: 'pants', label: '👖 Pants' },
    { id: 'accessories', label: '🧢 Aksesoris' },
  ];

  return (
    <div className="flex flex-wrap gap-3 my-6">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`font-black text-xs uppercase px-4 py-2.5 border-2 border-black transition shadow-brutal active:translate-x-0.5 active:translate-y-0.5 ${
            selectedCategory === cat.id
              ? 'bg-yellow-300 text-black'
              : 'bg-white text-black hover:bg-black hover:text-white'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}