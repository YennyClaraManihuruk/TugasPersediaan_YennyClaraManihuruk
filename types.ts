// Business Domain Types

export enum ProductCategory {
    SMARTPHONE = 'Smartphone',
    LAPTOP = 'Laptop',
    TABLET = 'Tablet',
    ACCESSORY = 'Accessory'
}

export interface Product {
    id: string;
    name: string;
    category: ProductCategory;
    sku: string;
    stockLevel: number;
    reorderPoint: number;
    price: number;
    cost: number;
    imageUrl: string;
    serialPrefix: string; // To demonstrate serial tracking
}

export interface Transaction {
    id: string;
    date: string;
    type: 'SALE' | 'PURCHASE' | 'REFUND' | 'EXPENSE';
    amount: number;
    status: 'COMPLETED' | 'PENDING' | 'FLAGGED';
    description: string;
}

export interface SalesRecord {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    date: string;
    serialNumbers: string[]; // Critical for warranty
}

export interface AIForecastResult {
    productId: string;
    productName: string;
    predictedDemand: number;
    confidenceScore: number;
    reasoning: string;
}

export interface AIAnomalyResult {
    transactionId: string;
    riskScore: number; // 0-100
    isAnomaly: boolean;
    explanation: string;
}
