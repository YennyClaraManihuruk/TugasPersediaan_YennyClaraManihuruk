import React, { useState, useRef } from 'react';
import { Transaction, AIAnomalyResult } from '../types';
import { analyzeFinancialAnomalies } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';

interface FinancialsProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

const Financials: React.FC<FinancialsProps> = ({ transactions, setTransactions }) => {
    const [anomalies, setAnomalies] = useState<AIAnomalyResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [formData, setFormData] = useState<Partial<Transaction>>({});
    
    const [listeningField, setListeningField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAudit = async () => {
        setIsAnalyzing(true);
        const results = await analyzeFinancialAnomalies(transactions);
        setAnomalies(results);
        setIsAnalyzing(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.")) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleAddNew = () => {
        setEditingTransaction(null); // Reset mode to Add
        setFormData({
            date: new Date().toISOString().split('T')[0],
            type: 'SALE',
            status: 'COMPLETED',
            amount: 0,
            description: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction); // Set mode to Edit
        setFormData(transaction);
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingTransaction) {
            // Update Existing Logic
            setTransactions(prev => prev.map(t => 
                t.id === editingTransaction.id ? { ...t, ...formData } as Transaction : t
            ));
        } else {
            // Create New Logic
            const newTx: Transaction = {
                ...formData as Transaction,
                id: `TX-${Math.floor(Math.random() * 10000)}`
            };
            setTransactions(prev => [newTx, ...prev]);
        }
        
        setIsModalOpen(false);
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
                // Try to parse numbers from speech (basic)
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

     const handleDownloadCSV = () => {
        const csv = Papa.unparse(transactions);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "financial_ledger.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            complete: (results: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newTx: Transaction[] = results.data.map((row: any) => ({
                    id: row.id || `TX-${Math.floor(Math.random() * 10000)}`,
                    date: row.date || new Date().toISOString().split('T')[0],
                    type: row.type,
                    amount: parseFloat(row.amount) || 0,
                    status: row.status,
                    description: row.description
                }));
                if(newTx.length > 0) setTransactions(prev => [...prev, ...newTx]);
            }
        });
        
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Buku Besar Keuangan</h2>
                    <p className="text-slate-400 text-sm">General Ledger Otomatis & Deteksi Fraud AI</p>
                </div>
                <div className="flex gap-2">
                     <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">📥 Import</button>
                    <button onClick={handleDownloadCSV} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">📤 Export</button>
                    <button onClick={handleAddNew} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium">+ Transaksi Baru</button>
                    <button 
                        onClick={handleAudit}
                        disabled={isAnalyzing}
                        className="flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-lg shadow-rose-900/20"
                    >
                        {isAnalyzing ? 'Scanning...' : '🔍 Scan Anomali AI'}
                    </button>
                </div>
            </div>

            {/* AI Analysis Result */}
            {anomalies.length > 0 && (
                <div className="bg-slate-800 border-l-4 border-rose-500 rounded-r-xl p-6 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4">Laporan Forensik AI</h3>
                    <div className="space-y-3">
                        {anomalies.filter(a => a.isAnomaly).map((a) => (
                            <div key={a.transactionId} className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-rose-400 font-mono text-sm">{a.transactionId}</span>
                                        <span className="text-xs bg-rose-900 text-rose-200 px-2 py-0.5 rounded">Risiko: {a.riskScore}/100</span>
                                    </div>
                                    <p className="text-slate-300 text-sm">{a.explanation}</p>
                                </div>
                            </div>
                        ))}
                        {anomalies.filter(a => a.isAnomaly).length === 0 && (
                            <p className="text-emerald-400">Tidak ada anomali signifikan yang terdeteksi.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Transaction List */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                            <th className="p-4">Tanggal / ID</th>
                            <th className="p-4">Deskripsi</th>
                            <th className="p-4">Tipe</th>
                            <th className="p-4 text-right">Jumlah (IDR)</th>
                            <th className="p-4 text-right">Status / Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {transactions.map((tx) => {
                            const isFlagged = anomalies.find(a => a.transactionId === tx.id && a.isAnomaly);
                            return (
                                <tr key={tx.id} className={`hover:bg-slate-700/30 transition-colors ${isFlagged ? 'bg-rose-900/10' : ''}`}>
                                    <td className="p-4">
                                        <div className="text-white font-medium">{tx.date}</div>
                                        <div className="text-xs text-slate-500 font-mono">{tx.id}</div>
                                    </td>
                                    <td className="p-4 text-slate-300">{tx.description}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            tx.type === 'SALE' ? 'bg-emerald-900 text-emerald-300' :
                                            tx.type === 'REFUND' ? 'bg-amber-900 text-amber-300' :
                                            'bg-slate-700 text-slate-300'
                                        }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-white font-mono">
                                        {formatRupiah(tx.amount)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isFlagged ? (
                                                <span className="text-rose-400 font-bold text-xs mr-2">⚠️ FLAGGED</span>
                                            ) : (
                                                <span className="text-slate-500 text-xs mr-2">{tx.status}</span>
                                            )}
                                            <button 
                                                onClick={() => handleEdit(tx)} 
                                                className="text-blue-400 hover:text-white text-sm transition-colors"
                                                title="Edit Transaksi"
                                            >
                                                ✎
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(tx.id)} 
                                                className="text-rose-500 hover:text-white text-sm transition-colors ml-2"
                                                title="Hapus Transaksi"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

             {/* Quick Chart */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                 <h3 className="text-lg font-semibold text-white mb-4">Volume Transaksi</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactions.slice(0, 10)}>
                            <XAxis dataKey="id" hide />
                            <YAxis stroke="#64748b" tickFormatter={(val) => `Rp${val/1000}k`} />
                            <Tooltip 
                                cursor={{fill: '#334155'}} 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} 
                                formatter={(val:number) => formatRupiah(val)}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {transactions.slice(0, 10).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.type === 'EXPENSE' || entry.type === 'REFUND' ? '#f43f5e' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400">Deskripsi</label>
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
                                    <label className="text-sm text-slate-400">Tipe</label>
                                    <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 mt-1 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                        <option value="SALE">PENJUALAN</option>
                                        <option value="PURCHASE">PEMBELIAN</option>
                                        <option value="EXPENSE">PENGELUARAN</option>
                                        <option value="REFUND">REFUND</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Jumlah (IDR)</label>
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
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-lg shadow-emerald-900/50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Financials;