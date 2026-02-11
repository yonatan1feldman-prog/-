
import { SolarInputs, StockInputs, YearData, SummaryData } from '../types';

export const calculateFinancials = (solar: SolarInputs, stock: StockInputs): { data: YearData[], summary: SummaryData } => {
  const data: YearData[] = [];
  let currentStockValue = stock.initial;
  let currentHybridValue = 0;
  let totalSolarNetIncome = 0;
  
  // Initial cost includes base cost + misc items that occur in year 1
  const initialMiscCost = solar.miscItems
    .filter(item => !item.year || item.year === 1)
    .reduce((sum, item) => sum + item.value, 0);
  
  const totalInitialCost = solar.cost + initialMiscCost;
  
  let remainingDebtHybrid = totalInitialCost;
  let remainingDebtSolarOnly = totalInitialCost;
  let cumulativeProfitSolarOnly = 0;

  for (let year = 1; year <= solar.years; year++) {
    // 1. Solar Production Degradation (0.4% annual)
    const degradationFactor = 1 - ((year - 1) * 0.004);
    
    // 2. Inflation Indexing
    const inflationFactor = solar.isIndexed ? Math.pow(1 + solar.inflationRate / 100, year - 1) : 1;
    
    // Revenue Calculation
    const revenueThisYear = solar.revenueY1 * degradationFactor * inflationFactor;
    
    // Annual maintenance costs
    let costsThisYear = solar.maintenance;
    
    // One-time misc costs for this specific year
    const extraMiscThisYear = solar.miscItems
      .filter(item => item.year === year && year > 1)
      .reduce((sum, item) => sum + item.value, 0);
    
    costsThisYear += extraMiscThisYear;
    
    const netSolarYearRaw = revenueThisYear - costsThisYear;
    totalSolarNetIncome += netSolarYearRaw;

    // --- Solar Only scenario: Payback logic ---
    // User only sees "Profit" after the initial cost is covered
    const solarIncomeAfterPayback = Math.max(0, netSolarYearRaw - remainingDebtSolarOnly);
    remainingDebtSolarOnly = Math.max(0, remainingDebtSolarOnly - Math.min(netSolarYearRaw, remainingDebtSolarOnly));
    cumulativeProfitSolarOnly += solarIncomeAfterPayback;

    // --- Stock Market Calculation ---
    currentStockValue *= (1 + stock.yield / 100);
    currentStockValue *= (1 - stock.managementFee / 100);

    // --- Hybrid Calculation ---
    currentHybridValue *= (1 + stock.yield / 100);
    currentHybridValue *= (1 - stock.managementFee / 100);

    // Reinvest income ONLY after initial payback is complete
    const amountToInvestHybrid = Math.max(0, netSolarYearRaw - remainingDebtHybrid);
    remainingDebtHybrid = Math.max(0, remainingDebtHybrid - Math.min(netSolarYearRaw, remainingDebtHybrid));
    currentHybridValue += amountToInvestHybrid;

    data.push({
      year,
      solarNetYear: Math.round(solarIncomeAfterPayback),
      stockValueGross: Math.round(currentStockValue),
      hybridValueGross: Math.round(currentHybridValue),
      solarCumulativeFlow: Math.round(cumulativeProfitSolarOnly)
    });
  }

  // Summary Logic
  // 1. Solar Only: Net Profit (Total Income - Total Initial Cost)
  const solarTotalValue = totalSolarNetIncome - totalInitialCost;

  // 2. Stock Only: Final value minus tax on gain
  const stockGain = currentStockValue - stock.initial;
  const stockTax = stockGain > 0 ? stockGain * (stock.taxRate / 100) : 0;
  const stockTotalValue = currentStockValue - stockTax;

  // 3. Hybrid: Terminal value after tax + original principal (to be fair in comparison)
  const hybridGain = currentHybridValue; 
  const hybridTax = hybridGain > 0 ? hybridGain * (stock.taxRate / 100) : 0;
  const hybridTotalValue = (currentHybridValue - hybridTax) + totalInitialCost;

  return {
    data,
    summary: {
      solarTotalValue,
      stockTotalValue,
      hybridTotalValue
    }
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);
};
