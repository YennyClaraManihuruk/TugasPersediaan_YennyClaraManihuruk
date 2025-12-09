import React, { useState } from 'react';
import { Transaction } from '../types';

interface SalesProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

const Sales: React.FC<SalesProps> = ({ transactions, setTransactions }) => {
    const [serialSearch, setSerialSearch] = useState('');
    const [warrantyStatus, setWarrantyStatus] = useState<null | { valid: boolean; message: string; expiry: string }>(null);
    
    // Manage Transactions State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [formData, setFormData] = useState<Partial<Transaction>>({});
    const [listeningField, setListeningField] = useState<string | null>(null);

    const handleWarrantyCheck = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock Logic
        if (serialSearch.length > 5) {
            const isValid = Math.random() > 0.3;
            setWarrantyStatus({
                valid: isValid,
                message: isValid ? 'Garansi Aktif' : 'Garansi Habis',
                expiry: isValid ? '31 Des 2025' : '01 Jan 2024'
            });
        }
    };

    const handleCreateSale = () => {
        // Quick add for POS simulation
        const newTx: Transaction = {
            id: `TX-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toISOString().split('T')[0],
            type: 'SALE',
            amount: Math.floor(Math.random() * 10000000) + 500000,
            status: 'COMPLETED',
            description: 'Penjualan Langsung POS'
        };
        setTransactions(prev => [newTx, ...prev]);
        alert("Transaksi berhasil dicatat!");
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Yakin ingin menghapus riwayat penjualan ini? Data akan hilang permanen.")) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setFormData(transaction);
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTransaction) {
            setTransactions(prev => prev.map(t => 
                t.id === editingTransaction.id ? { ...t, ...formData } as Transaction : t
            ));
            setIsModalOpen(false);
        }
    };

    const handleVoiceInput = (field: keyof Transaction) => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Fitur suara tidak didukung browser ini.");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setListeningField(field);
        recognition.onend = () => setListeningField(null);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            const cleanText = transcript.replace(/\.$/, '');
            
            if (field === 'amount') {
                const numeric = cleanText.replace(/[^0-9]/g, '');
                if (numeric) {
                     setFormData(prev => ({ ...prev, [field]: parseFloat(numeric) }));
                }
            } else {
                 setFormData(prev => ({ ...prev, [field]: cleanText }));
            }
        };
        recognition.start();
    };

    // Filter only SALES type transactions
    const salesHistory = transactions.filter(t => t.type === 'SALE');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Penjualan & CRM</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* POS Simulation */}
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Kasir (POS)</h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Scan SKU atau Barcode..." 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button className="bg-blue-600 px-4 py-2 rounded-lg text-white hover:bg-blue-700">Tambah</button>
                        </div>
                        
                        <div className="bg-slate-900 rounded-lg p-4 min-h-[200px] flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700">
                            Keranjang kosong. Scan barang untuk mulai.
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                            <span className="text-xl font-bold text-white">Total: Rp 0</span>
                            <button onClick={handleCreateSale} className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-900/50">
                                Bayar & Cetak
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warranty Checker */}
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Cek Garansi & Retur</h3>
                    <form onSubmit={handleWarrantyCheck} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nomor Seri Perangkat</label>
                            <input 
                                type="text" 
                                value={serialSearch}
                                onChange={(e) => setSerialSearch(e.target.value)}
                                placeholder="Cth: SN-GP9-XXXX" 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono uppercase"
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition">
                            Cek Status
                        </button>
                    </form>

                    {warrantyStatus && (
                        <div className={`mt-6 p-4 rounded-lg border ${warrantyStatus.valid ? 'bg-emerald-900/20 border-emerald-500' : 'bg-rose-900/20 border-rose-500'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${warrantyStatus.valid ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                                    {warrantyStatus.valid ? '✓' : '✕'}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${warrantyStatus.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {warrantyStatus.message}
                                    </h4>
                                    <p className="text-sm text-slate-400">Berlaku s/d: {warrantyStatus.expiry}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sales History List */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white">Riwayat Penjualan Terakhir</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                                <th className="p-4">Tanggal / ID</th>
                                <th className="p-4">Deskripsi Produk</th>
                                <th className="p-4 text-right">Nilai Transaksi</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {salesHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data penjualan.</td>
                                </tr>
                            ) : (
                                salesHistory.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="text-white font-medium">{tx.date}</div>
                                            <div className="text-xs text-slate-500 font-mono">{tx.id}</div>
                                        </td>
                                        <td className="p-4 text-slate-300">{tx.description}</td>
                                        <td className="p-4 text-right text-emerald-400 font-mono font-medium">
                                            {formatRupiah(tx.amount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300 border border-blue-800">
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-3">
                                            <button onClick={() => handleEdit(tx)} className="text-blue-400 hover:text-white transition">Edit</button>
                                            <button onClick={() => handleDelete(tx.id)} className="text-rose-400 hover:text-white transition">Hapus</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Edit Modal */}
             {isModalOpen && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Edit Data Penjualan</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400">Deskripsi Penjualan</label>
                                <div className="relative mt-1">
                                    <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    <button 
                                        type="button"
                                        onClick={() => handleVoiceInput('description')}
                                        className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'description' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                        title="Bicara untuk input"
                                    >
                                        🎤
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400">Tanggal</label>
                                    <input required type="date" className="w-full bg-slate-900 border border-slate-600 rounded p-2 mt-1 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Total (IDR)</label>
                                    <div className="relative mt-1">
                                        <input required type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={formData.amount || 0} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('amount')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'amount' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-400">Status</label>
                                <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 mt-1 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="FLAGGED">FLAGGED</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-lg">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;