'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnrichedTransaction, ProductSummary } from '../types';

export interface GlobalFilters {
    year: string;
    month: string;
    timePeriod: 'All' | 'Morning' | 'Afternoon' | 'Evening';
}

interface DataContextProps {
    serviceData: EnrichedTransaction[];
    setServiceData: (data: EnrichedTransaction[]) => void;
    productData: ProductSummary[];
    setProductData: (data: ProductSummary[]) => void;
    filters: GlobalFilters;
    setFilters: (filters: GlobalFilters) => void;
    isDataLoaded: boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [serviceData, setServiceData] = useState<EnrichedTransaction[]>([]);
    const [productData, setProductData] = useState<ProductSummary[]>([]);
    const [filters, setFilters] = useState<GlobalFilters>({
        year: 'All',
        month: 'All',
        timePeriod: 'All',
    });

    const isDataLoaded = serviceData.length > 0 || productData.length > 0;

    return (
        <DataContext.Provider
            value={{
                serviceData,
                setServiceData,
                productData,
                setProductData,
                filters,
                setFilters,
                isDataLoaded,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
