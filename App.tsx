import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Financials from './components/Financials';
import { askAssistant } from './services/geminiService';
import { Product, ProductCategory, Transaction } from './types';

// INITIAL DATA (MOVED FROM COMPONENTS)
const INITIAL_PRODUCTS: Product[] = [
    {
        id: '1', name: 'Pixel 9 Pro', category: ProductCategory.SMARTPHONE, sku: 'GP-9P-128',
        stockLevel: 12, reorderPoint: 20, price: 16000000, cost: 13500000,
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=400&q=80', serialPrefix: 'SN-GP9'
    },
    {
        id: '2', name: 'MacBook Air M3', category: ProductCategory.LAPTOP, sku: 'AP-MBA-M3',
        stockLevel: 45, reorderPoint: 10, price: 21000000, cost: 18000000,
        imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=400&q=80', serialPrefix: 'SN-MBA'
    },
    {
        id: '3', name: 'Galaxy Tab S9', category: ProductCategory.TABLET, sku: 'SM-TS9-256',
        stockLevel: 5, reorderPoint: 15, price: 12500000, cost: 10000000,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80', serialPrefix: 'SN-GTS'
    },
    {
        id: '4', name: 'USB-C Dock Pro', category: ProductCategory.ACCESSORY, sku: 'ACC-DOCK-01',
        stockLevel: 120, reorderPoint: 50, price: 1500000, cost: 900000,
        imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=400&q=80', serialPrefix: 'SN-ACC'
    }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 'TX-001', date: '2023-10-01', type: 'SALE', amount: 21000000, status: 'COMPLETED', description: 'MacBook Air Sale' },
    { id: 'TX-002', date: '2023-10-01', type: 'SALE', amount: 16000000, status: 'COMPLETED', description: 'Pixel 9 Pro Sale' },
    { id: 'TX-003', date: '2023-10-02', type: 'REFUND', amount: 16000000, status: 'PENDING', description: 'Return: Pixel 9 Pro' },
    { id: 'TX-004', date: '2023-10-02', type: 'EXPENSE', amount: 15000000, status: 'COMPLETED', description: 'Sewa Toko Bulanan' },
    { id: 'TX-005', date: '2023-10-03', type: 'SALE', amount: 250000000, status: 'COMPLETED', description: 'Pesanan Grosir: 20x Tablet' },
    { id: 'TX-006', date: '2023-10-03', type: 'EXPENSE', amount: 750000, status: 'COMPLETED', description: 'Alat Tulis Kantor' },
];

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Global State lifted here so AI can access it
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
        window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Voice Recognition Setup
  const handleMicClick = () => {
    // If speaking, stop speaking
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
    }

    if (!('webkitSpeechRecognition' in window)) {
        alert("Browser ini tidak mendukung fitur suara (Gunakan Chrome/Edge).");
        return;
    }
    
    // Stop any current speech before listening
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Auto open drawer if closed
    if (!aiChatOpen) setAiChatOpen(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatQuery(transcript);
        // Automatically submit
        handleAiChat(null, transcript);
    };

    recognition.start();
  };

  const speakResponse = (text: string) => {
      // Cancel previous
      window.speechSynthesis.cancel();

      // Clean text from Markdown or special chars for better speech
      const cleanText = text.replace(/[*#]/g, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'id-ID'; // Force Indonesian
      
      // Try to find a specific Indonesian voice for better quality
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(v => v.lang.includes('id-ID') || v.name.includes('Indonesia'));
      if (indonesianVoice) {
          utterance.voice = indonesianVoice;
      }

      utterance.rate = 1.05; 
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
  };

  const renderModule = () => {
    switch(activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory products={products} setProducts={setProducts} />;
      case 'financials': return <Financials transactions={transactions} setTransactions={setTransactions} />;
      default: return <Dashboard />;
    }
  };

  const handleAiChat = async (e: React.FormEvent | null, manualQuery?: string) => {
    if (e) e.preventDefault();
    const query = manualQuery || chatQuery;
    if (!query.trim()) return;

    setIsChatting(true);
    
    // Build Dynamic Context from Global State
    const inventorySummary = products.map(p => `${p.name} (Stok: ${p.stockLevel}, Harga: ${p.price})`).join(', ');
    const txSummary = transactions.slice(0, 5).map(t => `${t.type} Rp${t.amount} ket: ${t.description}`).join(', ');
    
    // Calculate simple totals for context
    const totalRevenue = transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + t.amount, 0);
    const lowStockCount = products.filter(p => p.stockLevel <= p.reorderPoint).length;

    const context = `
        Modul Aktif Pengguna: ${activeModule}.
        Ringkasan Data Aplikasi Saat Ini:
        1. Total Pendapatan Tercatat: Rp ${totalRevenue}.
        2. Jumlah Produk Stok Menipis: ${lowStockCount} produk.
        3. Detail Produk: ${inventorySummary}.
        4. Transaksi Terakhir: ${txSummary}.
    `;

    const response = await askAssistant(query, context);
    setChatResponse(response);
    setIsChatting(false);
    
    // Automatically speak the response
    speakResponse(response);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      <main className="pl-20 lg:pl-64 min-h-screen transition-all duration-300">
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 px-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold capitalize text-white">{activeModule}</h1>
            <div className="flex items-center gap-4">
               {/* Header status indicator if needed */}
            </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {renderModule()}
        </div>
      </main>

      {/* Floating Microphone Button (FAB) */}
      <button 
        onClick={handleMicClick}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none ring-4 ring-slate-900 ${
            isListening ? 'bg-rose-500 animate-pulse scale-110' : 
            isSpeaking ? 'bg-emerald-500 animate-bounce' :
            'bg-gradient-to-r from-blue-600 to-indigo-600'
        }`}
        title={isSpeaking ? "Klik untuk berhenti bicara" : "Bicara dengan AI Assistant"}
      >
        <span className="text-3xl filter drop-shadow-md">
            {isListening ? '🛑' : isSpeaking ? '🔊' : '🎙️'}
        </span>
      </button>

      {/* AI Chat Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-40 transform transition-transform duration-300 ${aiChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                         <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-blue-500'}`}></div>
                         <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">NexAI Voice</h3>
                    </div>
                    <button onClick={() => setAiChatOpen(false)} className="text-slate-400 hover:text-white p-2">✕</button>
                </div>
                
                <div className="flex-1 overflow-y-auto mb-4 bg-slate-950/50 rounded-xl p-4 border border-slate-800 shadow-inner flex flex-col gap-4">
                    {/* Welcome Message */}
                    {!chatResponse && !chatQuery && (
                         <div className="text-center mt-10 opacity-60">
                            <div className="text-4xl mb-4">👋</div>
                            <p className="text-slate-300">Halo! Saya asisten ERP Anda.</p>
                            <p className="text-sm text-slate-500 mt-2">Klik mikrofon di pojok kanan bawah untuk bicara.</p>
                            <ul className="text-sm text-blue-400 mt-2 space-y-1">
                                <li>"Berapa total penjualan?"</li>
                                <li>"Cek stok Laptop"</li>
                            </ul>
                        </div>
                    )}

                    {/* User Query Bubble */}
                    {chatQuery && (
                        <div className="self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                            <p className="text-sm">"{chatQuery}"</p>
                        </div>
                    )}

                    {/* AI Loading State */}
                    {isChatting && (
                        <div className="self-start bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700 w-24">
                            <div className="flex gap-1 justify-center">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}

                    {/* AI Response Bubble */}
                    {chatResponse && !isChatting && (
                        <div className="self-start bg-slate-800 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700 shadow-md max-w-[95%]">
                            <div className="prose prose-invert prose-sm">
                                {chatResponse.split('\n').map((line, i) => (
                                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                                ))}
                            </div>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => speakResponse(chatResponse)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    🔊 Ulangi Suara
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={(e) => handleAiChat(e)} className="relative mt-auto">
                    <div className="flex gap-2 items-center">
                        <input 
                            type="text" 
                            value={chatQuery}
                            onChange={(e) => setChatQuery(e.target.value)}
                            placeholder="Ketik pesan..." 
                            className="w-full bg-slate-800 border border-slate-700 rounded-full pl-5 pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none text-white shadow-lg"
                        />
                        <button 
                            type="submit" 
                            disabled={isChatting || !chatQuery}
                            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
      </div>
    </div>
  );
}

export default App;