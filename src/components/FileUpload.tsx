'use client';

import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { parseCSV } from '@/utils/csvParser';
import { enrichTransactions, aggregateProducts } from '@/utils/dataEnricher';
import { RawTransaction, RawProductSales, ProductSummary } from '@/types';

export default function FileUpload() {
    const { setServiceData, setProductData } = useData();
    const [mainCsv, setMainCsv] = useState<File | null>(null);
    const [productCsv, setProductCsv] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!mainCsv || !productCsv) {
            setError('Please upload both the DaraAroma.csv and ยอดขายสินค้า-Table 1.csv files.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Parse Raw Data
            const rawMain = await parseCSV<RawTransaction>(mainCsv);
            const rawProducts = await parseCSV<RawProductSales>(productCsv);

            // Enrich Data
            const enriched = enrichTransactions(rawMain);

            // Distribute to States
            const services = enriched.filter((e) => e.itemType === 'Service');

            // Map RawProductSales to ProductSummary
            const productsSummary: ProductSummary[] = rawProducts
                .filter(p => p['สินค้า'] && p['สินค้า'].trim() !== '') // Filter out empty rows
                .map(p => ({
                    productName: p['สินค้า']?.trim() || 'Unknown',
                    quantitySold: parseInt(p['จำนวน']?.replace(/,/g, '') || '0', 10),
                    totalRevenue: parseFloat(p['ราคาขาย']?.replace(/,/g, '') || '0')
                }));

            setServiceData(services);
            setProductData(productsSummary);

        } catch (err) {
            console.error(err);
            setError('Failed to process data. Check console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-2xl mx-auto mt-10 transition-colors duration-200">
            <UploadCloud className="w-16 h-16 text-blue-500 dark:text-blue-400 mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Upload Data Sources</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
                Please provide the primary CSV file to bootstrap the dashboard.
            </p>

            <div className="w-full space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Main Transactions (DaraAroma.csv)
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setMainCsv(e.target.files?.[0] || null)}
                        className="w-full text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Product Sales (ยอดขายสินค้า-Table 1.csv)
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setProductCsv(e.target.files?.[0] || null)}
                        className="w-full text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                </div>
            </div>

            {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

            <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="mt-8 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow disabled:opacity-50 transition w-full"
            >
                {isProcessing ? 'Processing Data...' : 'Generate Dashboard'}
            </button>
        </div>
    );
}
