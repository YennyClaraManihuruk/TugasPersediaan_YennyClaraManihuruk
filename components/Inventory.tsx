import React, { useState, useRef } from 'react';
import { Product, ProductCategory, AIForecastResult } from '../types';
import { getInventoryForecast } from '../services/geminiService';
import Papa from 'papaparse';

interface InventoryProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

const Inventory: React.FC<InventoryProps> = ({ products, setProducts }) => {
    const [forecasts, setForecasts] = useState<AIForecastResult[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [listeningField, setListeningField] = useState<string | null>(null);

    const handleRunForecast = async () => {
        setIsLoadingAI(true);
        const results = await getInventoryForecast(products);
        setForecasts(results);
        setIsLoadingAI(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData(product);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormData({
            category: ProductCategory.SMARTPHONE,
            imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=200&h=200',
            stockLevel: 0,
            reorderPoint: 5,
            price: 0,
            cost: 0
        });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            // Update
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
        } else {
            // Create
            const newProduct: Product = {
                ...formData as Product,
                id: Math.random().toString(36).substr(2, 9),
            };
            setProducts(prev => [...prev, newProduct]);
        }
        setIsModalOpen(false);
    };

    const handleVoiceInput = (field: keyof Product) => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Browser ini tidak mendukung fitur input suara.");
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
            
            if (['stockLevel', 'reorderPoint'].includes(field)) {
                const numeric = cleanText.replace(/[^0-9]/g, '');
                if (numeric) setFormData(prev => ({ ...prev, [field]: parseInt(numeric) }));
            } else if (['price', 'cost'].includes(field)) {
                 const numeric = cleanText.replace(/[^0-9]/g, '');
                 if (numeric) setFormData(prev => ({ ...prev, [field]: parseFloat(numeric) }));
            } else {
                setFormData(prev => ({ ...prev, [field]: cleanText }));
            }
        };

        recognition.start();
    };

    const handleDownloadCSV = () => {
        const csv = Papa.unparse(products);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "inventory_data.csv");
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
                const newProducts: Product[] = results.data.map((row: any) => ({
                    id: row.id || Math.random().toString(36).substr(2, 9),
                    name: row.name,
                    category: row.category as ProductCategory,
                    sku: row.sku,
                    stockLevel: parseInt(row.stockLevel) || 0,
                    reorderPoint: parseInt(row.reorderPoint) || 0,
                    price: parseFloat(row.price) || 0,
                    cost: parseFloat(row.cost) || 0,
                    serialPrefix: row.serialPrefix || 'SN',
                    imageUrl: row.imageUrl || 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=200&h=200'
                }));
                
                if (newProducts.length > 0) {
                    setProducts(prev => [...prev, ...newProducts]);
                    alert(`Berhasil mengimpor ${newProducts.length} produk!`);
                }
            }
        });
        
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Manajemen Inventaris</h2>
                    <p className="text-slate-400 text-sm">Pelacakan Stok, Nomor Seri & Prediksi AI</p>
                </div>
                <div className="flex gap-2">
                     <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">
                        📥 Import CSV
                    </button>
                    <button onClick={handleDownloadCSV} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">
                        📤 Export CSV
                    </button>
                    <button onClick={handleAddNew} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium">
                        + Tambah Produk
                    </button>
                    <button 
                        onClick={handleRunForecast}
                        disabled={isLoadingAI}
                        className={`flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg font-medium text-white shadow-lg transition-all hover:scale-105 ${isLoadingAI ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isLoadingAI ? 'Training Model...' : '✨ Prediksi Permintaan AI'}
                    </button>
                </div>
            </div>

            {/* AI Insights Panel */}
            {forecasts.length > 0 && (
                <div className="bg-slate-800/50 border border-violet-500/30 p-6 rounded-xl animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center">
                        <span className="bg-violet-500/20 p-2 rounded-full mr-2">🤖</span>
                        Prediksi Permintaan (Gemini-2.5-Flash)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {forecasts.map((f, i) => (
                            <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-white">{f.productName}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${f.confidenceScore > 80 ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                        {f.confidenceScore}% Akurasi
                                    </span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">+{f.predictedDemand} <span className="text-xs font-normal text-slate-400">unit</span></div>
                                <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700 pt-2 mt-2">
                                    {f.reasoning}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Table */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                                <th className="p-4">Produk</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Stok / Min</th>
                                <th className="p-4">Harga Jual</th>
                                <th className="p-4">Format Seri</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-700" />
                                            <div>
                                                <div className="font-medium text-white">{product.name}</div>
                                                <div className="text-xs text-slate-500">{product.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-slate-700 text-xs text-slate-300">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${product.stockLevel <= product.reorderPoint ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {product.stockLevel} unit
                                            </span>
                                            <span className="text-xs text-slate-500">Min: {product.reorderPoint}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300">{formatRupiah(product.price)}</td>
                                    <td className="p-4">
                                        <code className="bg-black/30 px-2 py-1 rounded text-xs font-mono text-blue-300">
                                            {product.serialPrefix}-XXXX
                                        </code>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(product)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="text-rose-400 hover:text-rose-300 text-sm">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400">Nama Produk</label>
                                    <div className="relative mt-1">
                                        <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                            value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} 
                                            placeholder="Bicara..."
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('name')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'name' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">SKU</label>
                                    <div className="relative mt-1">
                                        <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                            value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('sku')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'sku' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400">Kategori</label>
                                    <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 mt-1 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}>
                                        {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Serial Prefix</label>
                                    <div className="relative mt-1">
                                        <input required type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                            value={formData.serialPrefix || ''} onChange={e => setFormData({...formData, serialPrefix: e.target.value})} />
                                         <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('serialPrefix')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'serialPrefix' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400">Stok Saat Ini</label>
                                    <div className="relative mt-1">
                                        <input required type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={formData.stockLevel || 0} onChange={e => setFormData({...formData, stockLevel: parseInt(e.target.value)})} />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('stockLevel')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'stockLevel' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Reorder Point</label>
                                    <div className="relative mt-1">
                                        <input required type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={formData.reorderPoint || 0} onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value)})} />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('reorderPoint')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'reorderPoint' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400">Harga Jual (IDR)</label>
                                    <div className="relative mt-1">
                                        <input required type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={formData.price || 0} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('price')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'price' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Biaya (HPP)</label>
                                    <div className="relative mt-1">
                                        <input required type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 pr-10 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={formData.cost || 0} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} />
                                        <button 
                                            type="button"
                                            onClick={() => handleVoiceInput('cost')}
                                            className={`absolute right-1 top-1 bottom-1 px-2 rounded hover:bg-slate-700 transition ${listeningField === 'cost' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                                            title="Bicara untuk input"
                                        >
                                            🎤
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-lg shadow-blue-900/50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;