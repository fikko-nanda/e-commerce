export default function AdminTabs({
  activeTab,
  onTabSwitch,
  totalStores,
  totalUsers,
  totalReviews,
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b-4 border-black pb-4">
      <button
        onClick={() => onTabSwitch('stores')}
        className={`px-4 py-2 border-4 border-black font-black text-xs uppercase transition shadow-brutal ${
          activeTab === 'stores'
            ? 'bg-yellow-300 text-black'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        🏬 Toko ({totalStores})
      </button>
      <button
        onClick={() => onTabSwitch('users')}
        className={`px-4 py-2 border-4 border-black font-black text-xs uppercase transition shadow-brutal ${
          activeTab === 'users'
            ? 'bg-purple-400 text-black'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        👥 Pengguna ({totalUsers})
      </button>
      <button
        onClick={() => onTabSwitch('reviews')}
        className={`px-4 py-2 border-4 border-black font-black text-xs uppercase transition shadow-brutal ${
          activeTab === 'reviews'
            ? 'bg-blue-300 text-black'
            : 'bg-white hover:bg-gray-100'
        }`}
      >
        ⭐ Ulasan ({totalReviews})
      </button>
    </div>
  );
}