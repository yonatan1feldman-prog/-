
export interface CostItem {
  id: string;
  label: string;
  value: number;
  year?: number; // Optional year for one-time costs
}

export interface SolarInputs {
  cost: number;
  revenueY1: number;
  maintenance: number; 
  maintenanceItems: CostItem[];
  misc: number; 
  miscItems: CostItem[];
  years: number;
  isIndexed: boolean;
  inflationRate: number;
}

export interface StockInputs {
  initial: number;
  yield: number;
  managementFee: number;
  taxRate: number;
}

export interface YearData {
  year: number;
  solarNetYear: number;
  stockValueGross: number;
  hybridValueGross: number;
  solarCumulativeFlow: number;
}

export interface SummaryData {
  solarTotalValue: number;
  stockTotalValue: number;
  hybridTotalValue: number;
}
