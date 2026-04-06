import { getApiUrl } from "../config/api";

const REPORTS_ENDPOINTS = {
  MONTHLY: "/api/reports/monthly",
};

export const getMonthlyReport = async (year, month) => {
  try {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);

    const url = `${getApiUrl(REPORTS_ENDPOINTS.MONTHLY)}?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error al obtener reporte: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data; // { totalIncome, totalExpense, expensesByCategory }
  } catch (error) {
    console.error("Error en getMonthlyReport:", error);
    throw error;
  }
};
