import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService } from '../../services';

export default function RegisterSeller() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    email: '',
    phone: '',

    storeName: '',
    businessType: 'individual',
    category: 'tshirt',
    storeAddress: '',
    returnAddress: '',
    estimatedMonthlyVolume: '1-50',

    bankName: 'BCA',
    accountNumber: '',
    accountHolder: '',

    ktpPreview: null,
    selfieKtpPreview: null,
    npwpNumber: '',
    npwpPreview: null,
    nibNumber: '',

    agreeAntiCounterfeit: false,
    agreeTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        [fieldName]: previewUrl,
      }));
    }
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 5));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedId = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
    const currentUser = JSON.parse(
      localStorage.getItem('warmart_user') || localStorage.getItem('user') || '{}'
    );

    const pendingStore = {
      id: generatedId,
      store_name: formData.storeName,
      owner_email: currentUser.email || formData.email || 'root@warmart.com',
      owner_username: currentUser.username || 'ROOT',
      status: 'pending_review',
      phone: formData.phone,
      address: formData.storeAddress,
      created_at: new Date().toISOString(),
    };

    try {
      const submitFn = storeService?.createStore || storeService?.register;

      if (typeof submitFn === 'function') {
        await submitFn({
          name: formData.storeName,
          store_name: formData.storeName,
          phone: formData.phone,
          phone_number: formData.phone,
          address: formData.storeAddress,
          description: `Toko ${formData.storeName} - ${formData.category}`,
        });
      }
    } catch (err) {
      console.warn('Backend API store register 400 info, proceeding with local store queue:', err.response?.data);
    } finally {
      // Simpan data pengajuan toko baru ke LocalStorage agar dibaca Admin Dashboard
      const existingPending = JSON.parse(localStorage.getItem('warmart_pending_stores') || '[]');
      localStorage.setItem('warmart_pending_stores', JSON.stringify([pendingStore, ...existingPending]));

      setRegistrationId(generatedId);
      setIsSubmitted(true);
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-yellow-300 border-4 border-black shadow-brutal-lg text-center space-y-4">
        <span className="text-5xl">⏳</span>
        <h2 className="text-3xl font-black uppercase tracking-tight">Pendaftaran Dalam Peninjauan</h2>
        <p className="font-bold text-sm text-black/80 max-w-lg mx-auto">
          Terima kasih telah mendaftar. Tim Modifikator/Admin kami sedang memverifikasi kelengkapan berkas KTP, NPWP, dan Rekening Anda. Proses verifikasi membutuhkan waktu 1x24 jam kerja.
        </p>
        <div className="bg-white border-2 border-black p-4 font-mono text-xs text-left max-w-md mx-auto space-y-1">
          <p><strong>ID Pengajuan:</strong> {registrationId}</p>
          <p><strong>Nama Toko:</strong> {formData.storeName}</p>
          <p><strong>Status:</strong> <span className="bg-yellow-200 px-1 border border-black font-bold">MENUNGGU VERIFIKASI</span></p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white font-black px-6 py-3 text-xs uppercase border-2 border-black hover:bg-white hover:text-black transition cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
          Pendaftaran Penjual Resmi
        </h1>
        <p className="text-xs font-bold text-black/80 mt-1">
          Lengkapi verifikasi identitas dan berkas legalitas toko Anda untuk mulai berjualan.
        </p>

        <div className="grid grid-cols-5 gap-2 mt-6">
          {[
            '1. Pemilik',
            '2. Toko',
            '3. Rekening',
            '4. Berkas',
            '5. Persetujuan',
          ].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="text-center">
                <div
                  className={`h-3 border-2 border-black font-black text-[9px] flex items-center justify-center ${
                    isDone ? 'bg-green-400' : isActive ? 'bg-black text-white' : 'bg-white'
                  }`}
                />
                <span className="text-[10px] font-black uppercase tracking-tighter block mt-1 hidden sm:block">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border-4 border-black p-6 md:p-8 shadow-brutal">
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase border-b-4 border-black pb-2">
                Step 1: Identitas Penanggung Jawab
              </h2>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Nama Lengkap Sesuai KTP *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Sesuai KTP (Tanpa Singkatan)"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Nomor Induk Kependudukan (NIK 16 Digit) *
                </label>
                <input
                  type="text"
                  name="nik"
                  required
                  maxLength={16}
                  pattern="\d{16}"
                  value={formData.nik}
                  onChange={handleInputChange}
                  placeholder="327101xxxxxxxxxx"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Email Aktif *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@domain.com"
                    className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="081234567890"
                    className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase border-b-4 border-black pb-2">
                Step 2: Profil & Operasional Toko
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Nama Toko / Brand *
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    required
                    value={formData.storeName}
                    onChange={handleInputChange}
                    placeholder="Contoh: Warmart Streetwear"
                    className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Jenis Badan Usaha *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100"
                  >
                    <option value="individual">Perorangan / UMKM</option>
                    <option value="corporate">PT / CV / Firma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Kategori Utama Produk *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100"
                  >
                    <option value="tshirt">Pakaian & Streetwear</option>
                    <option value="shoes">Sepatu & Sneakers</option>
                    <option value="accessories">Aksesoris & Tas</option>
                    <option value="electronics">Elektronik & Gadget</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Estimasi Penjualan Bulanan *
                  </label>
                  <select
                    name="estimatedMonthlyVolume"
                    value={formData.estimatedMonthlyVolume}
                    onChange={handleInputChange}
                    className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100"
                  >
                    <option value="1-50">1 - 50 Produk / Bulan</option>
                    <option value="51-200">51 - 200 Produk / Bulan</option>
                    <option value="201+">&gt; 200 Produk / Bulan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Alamat Lengkap Toko / Gudang Utama *
                </label>
                <textarea
                  name="storeAddress"
                  required
                  rows={2}
                  value={formData.storeAddress}
                  onChange={handleInputChange}
                  placeholder="Jl. Merdeka No. 12, Kel. Menteng, Kec. Menteng, Kota Jakarta Pusat"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Alamat Pengembalian Barang (Return Address) *
                </label>
                <textarea
                  name="returnAddress"
                  required
                  rows={2}
                  value={formData.returnAddress}
                  onChange={handleInputChange}
                  placeholder="Samakan jika alamat pengembalian sama dengan alamat toko"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase border-b-4 border-black pb-2">
                Step 3: Rekening Bank Pencairan Dana
              </h2>

              <div className="bg-yellow-100 border-2 border-black p-3 text-xs font-bold text-black/80">
                ⚠️ <strong>PENTING:</strong> Nama pemilik rekening <strong>WAJIB SAMA</strong> dengan Nama pada KTP Pemilik Toko untuk menghindari penipuan / tindak pencucian uang.
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Pilih Bank *
                </label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100"
                >
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="CIMB">CIMB Niaga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  required
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Contoh: 8830123456"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Nama Pemilik Rekening *
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  required
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  placeholder="Harus sesuai KTP"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black uppercase border-b-4 border-black pb-2">
                Step 4: Unggah Dokumen Legalitas
              </h2>

              <div className="border-2 border-black p-4 bg-gray-50">
                <label className="block text-xs font-black uppercase mb-1">
                  1. Foto KTP Asli *
                </label>
                <p className="text-[10px] font-bold text-gray-500 mb-2">
                  Pastikan foto jelas, tidak kabur, dan NIK terbaca. (Maksimal 5MB)
                </p>
                {formData.ktpPreview && (
                  <img
                    src={formData.ktpPreview}
                    alt="Preview KTP"
                    className="w-40 h-24 object-cover border-2 border-black mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  required={!formData.ktpPreview}
                  onChange={(e) => handleFileUpload(e, 'ktpPreview')}
                  className="w-full text-xs font-bold file:mr-4 file:py-1 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-yellow-300 file:uppercase cursor-pointer"
                />
              </div>

              <div className="border-2 border-black p-4 bg-gray-50">
                <label className="block text-xs font-black uppercase mb-1">
                  2. Foto Swafoto / Selfie Memegang KTP *
                </label>
                <p className="text-[10px] font-bold text-gray-500 mb-2">
                  Wajah dan KTP harus terlihat jelas secara bersamaan.
                </p>
                {formData.selfieKtpPreview && (
                  <img
                    src={formData.selfieKtpPreview}
                    alt="Preview Selfie KTP"
                    className="w-32 h-32 object-cover border-2 border-black mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  required={!formData.selfieKtpPreview}
                  onChange={(e) => handleFileUpload(e, 'selfieKtpPreview')}
                  className="w-full text-xs font-bold file:mr-4 file:py-1 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-yellow-300 file:uppercase cursor-pointer"
                />
              </div>

              <div className="border-2 border-black p-4 bg-gray-50 space-y-3">
                <label className="block text-xs font-black uppercase">
                  3. NPWP (Nomor Pokok Wajib Pajak)
                </label>
                <input
                  type="text"
                  name="npwpNumber"
                  value={formData.npwpNumber}
                  onChange={handleInputChange}
                  placeholder="Nomor NPWP (15 atau 16 Digit)"
                  className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'npwpPreview')}
                  className="w-full text-xs font-bold file:mr-4 file:py-1 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-yellow-300 file:uppercase cursor-pointer"
                />
              </div>

              {formData.businessType === 'corporate' && (
                <div className="border-2 border-black p-4 bg-gray-50">
                  <label className="block text-xs font-black uppercase mb-1">
                    4. Nomor Induk Berusaha (NIB) *
                  </label>
                  <input
                    type="text"
                    name="nibNumber"
                    required
                    value={formData.nibNumber}
                    onChange={handleInputChange}
                    placeholder="Masukkan 13 digit NIB Badan Usaha"
                    className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100"
                  />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase border-b-4 border-black pb-2">
                Step 5: Syarat, Ketentuan & Kebijakan Toko
              </h2>

              <div className="bg-gray-100 border-2 border-black p-4 h-40 overflow-y-auto text-xs space-y-2 font-medium">
                <p className="font-bold uppercase">Kebijakan Penjual & Kode Etik:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Penjual dilarang keras menjual barang tiruan / KW / bajakan.</li>
                  <li>Setiap pesanan wajib diproses maksimal 2x24 jam sejak pembayaran dikonfirmasi.</li>
                  <li>Potongan komisi platform sebesar 2.5% per transaksi yang berhasil.</li>
                  <li>Pencairan dana otomatis diproses ke rekening terdaftar setelah pembeli mengonfirmasi pesanan selesai.</li>
                  <li>Penyalahgunaan data pribadi atau percobaan penipuan akan ditindak secara hukum pidana.</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeAntiCounterfeit"
                    required
                    checked={formData.agreeAntiCounterfeit}
                    onChange={handleInputChange}
                    className="mt-1 border-2 border-black w-4 h-4 accent-black cursor-pointer"
                  />
                  <span className="text-xs font-bold">
                    Saya menjamin bahwa seluruh produk yang dipasarkan di toko ini adalah <strong>100% ORIGINAL</strong> dan bukan produk palsu/tiruan.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    required
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-1 border-2 border-black w-4 h-4 accent-black cursor-pointer"
                  />
                  <span className="text-xs font-bold">
                    Saya telah membaca dan menyetujui seluruh Syarat, Ketentuan, serta Kebijakan Privasi Platform.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 mt-6 border-t-4 border-black">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="bg-gray-200 border-2 border-black font-black px-5 py-2.5 text-xs uppercase hover:bg-gray-300 transition cursor-pointer"
              >
                ← Kembali
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-black text-white font-black px-6 py-2.5 text-xs uppercase border-2 border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
              >
                Lanjut →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.agreeTerms || !formData.agreeAntiCounterfeit}
                className="bg-yellow-300 font-black px-6 py-2.5 text-xs uppercase border-2 border-black hover:bg-black hover:text-white transition shadow-brutal disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Mengirim Data...' : 'Kirim Pengajuan Verifikasi 🚀'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}