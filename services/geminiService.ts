import { GoogleGenAI } from "@google/genai";
import { Product, Transaction, AIForecastResult, AIAnomalyResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const modelId = "gemini-2.5-flash";

/**
 * Uses Gemini to forecast inventory demand.
 */
export const getInventoryForecast = async (products: Product[]): Promise<AIForecastResult[]> => {
    if (!apiKey) {
        console.warn("API Key missing");
        return [];
    }

    try {
        const productContext = JSON.stringify(products.map(p => ({
            name: p.name,
            currentStock: p.stockLevel,
            category: p.category,
            reorderPoint: p.reorderPoint
        })));

        const prompt = `
            Bertindaklah sebagai Analis Rantai Pasokan Ahli untuk pengecer elektronik di Indonesia.
            Analisis data inventaris produk berikut: ${productContext}
            
            Tugas: Prediksi permintaan untuk bulan depan.
            Ingat bahwa Laptop dan HP memiliki perputaran cepat di pasar Indonesia.
            
            Kembalikan HANYA array JSON yang valid (tanpa format markdown):
            [
                {
                    "productId": "string (gunakan nama sebagai ID)",
                    "productName": "string",
                    "predictedDemand": number,
                    "confidenceScore": number (0-100),
                    "reasoning": "string (penjelasan singkat dalam Bahasa Indonesia)"
                }
            ]
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
        });

        const text = response.text || "[]";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr) as AIForecastResult[];

    } catch (error) {
        console.error("AI Forecast Error:", error);
        return [];
    }
};

/**
 * Uses Gemini to detect anomalies in financial transactions.
 */
export const analyzeFinancialAnomalies = async (transactions: Transaction[]): Promise<AIAnomalyResult[]> => {
    if (!apiKey) return [];

    try {
        const txContext = JSON.stringify(transactions.slice(0, 30)); 

        const prompt = `
            Bertindaklah sebagai AI Akuntan Forensik.
            Analisis transaksi keuangan ini untuk potensi penipuan atau anomali data: ${txContext}
            
            Cari:
            - Jumlah yang sangat tinggi untuk jenisnya (Dalam Rupiah).
            - Angka bulat yang mencurigakan.
            - Pengembalian dana (Refund) tanpa konteks jelas atau bernilai besar.

            Kembalikan HANYA array JSON yang valid (tanpa format markdown):
            [
                {
                    "transactionId": "string",
                    "riskScore": number (0-100),
                    "isAnomaly": boolean,
                    "explanation": "string (penjelasan singkat dalam Bahasa Indonesia)"
                }
            ]
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
        });

        const text = response.text || "[]";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr) as AIAnomalyResult[];

    } catch (error) {
        console.error("AI Anomaly Error:", error);
        return [];
    }
};

/**
 * General Chat Assistant for ERP
 */
export const askAssistant = async (query: string, context: string): Promise<string> => {
    if (!apiKey) return "Maaf, API Key belum dikonfigurasi. Saya tidak dapat memproses data Anda.";

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Sistem: Anda adalah 'NexAI', asisten suara cerdas untuk manajer toko elektronik 'NexRetail'.
            Gaya Bicara: Profesional, singkat, dan sangat membantu. Seperti asisten pribadi Jarvis.
            
            Konteks Data Real-time (JANGAN HALUSINASI, GUNAKAN DATA INI): 
            ${context}
            
            Pertanyaan Pengguna (lisan/tulis): "${query}"
            
            Instruksi: 
            1. Jawab langsung ke intinya. Jangan bertele-tele.
            2. Jika pengguna bertanya tentang data yang ada di konteks, jawab dengan angka spesifik.
            3. Gunakan format Rupiah (Juta/Miliar) untuk uang.
            4. Berikan saran singkat jika relevan (misal: "Stok X rendah, segera pesan").
            `,
        });
        return response.text || "Saya tidak mengerti pertanyaan tersebut.";
    } catch (error) {
        return "Maaf, layanan sedang sibuk.";
    }
};