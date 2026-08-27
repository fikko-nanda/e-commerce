export default function SettingsTab({ storeInfo, setStoreInfo, handleSaveStore, handleLogoUpload, savingStore }) {
  return (
    <form onSubmit={handleSaveStore} className="bg-white border-4 border-black p-6 shadow-brutal max-w-xl space-y-5">
      <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Profil Toko</h2>
      <div className="flex items-center gap-4 border-2 border-black p-4 bg-gray-50">
        <img src={storeInfo.logo} alt="Preview Toko" className="w-20 h-20 object-cover border-4 border-black shadow-brutal bg-white flex-shrink-0" />
        <div>
          <p className="text-xs font-black uppercase">Foto Profil Toko</p>
          <p className="text-[10px] font-bold text-gray-500 mt-0.5">Format: JPG, PNG, WEBP.</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase mb-1">Upload Foto Baru</label>
        <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" />
      </div>

      <div>
        <label className="block text-xs font-black uppercase mb-1">Nama Toko</label>
        <input type="text" value={storeInfo.name} onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
      </div>

      <div>
        <label className="block text-xs font-black uppercase mb-1">Nomor Telepon / WA</label>
        <input type="text" value={storeInfo.phone} onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })} placeholder="08123456789" className="w-full border-2 border-black p-2 font-bold text-xs" />
      </div>

      <div>
        <label className="block text-xs font-black uppercase mb-1">Deskripsi Toko</label>
        <textarea rows={3} value={storeInfo.description} onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
      </div>

      <button type="submit" disabled={savingStore} className="bg-black text-white font-black px-6 py-3 text-xs uppercase border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition cursor-pointer">
        {savingStore ? 'Menyimpan...' : 'Simpan Perubahan Toko'}
      </button>
    </form>
  );
}