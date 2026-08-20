export default function AdminTabs({ activeTab, onTabSwitch, totalStores, totalUsers, totalReviews }) {
  const tabs = [
    { id: 'stores', label: `🏪 Manajemen Toko (${totalStores})` },
    { id: 'users', label: `👥 Manajemen User (${totalUsers})` },
    { id: 'reviews', label: `⭐ Moderasi Ulasan (${totalReviews})` },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabSwitch(tab.id)}
          className={`font-black text-xs uppercase px-5 py-3 border-2 border-black shadow-brutal transition ${
            activeTab === tab.id ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}