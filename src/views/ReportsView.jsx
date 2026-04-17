import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getMonthlyReport } from "../services/reportService";
import "./ReportsView.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#ffc658",
  "#d0ed57",
  "#a4de6c",
];

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

function ReportsView() {
  const currentDate = new Date();
  
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
    expensesByCategory: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate an array of years from 2023 to current year + 1
  const years = Array.from(
    { length: currentDate.getFullYear() - 2023 + 2 },
    (_, i) => 2023 + i
  );

  useEffect(() => {
    loadReport();
  }, [year, month]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportData = await getMonthlyReport(year, month);
      setData(reportData);
    } catch (err) {
      setError(err.message || "Error al cargar reporte mensual");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const netBalance = data.totalIncome - data.totalExpense;

  // Pie chart custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="label">{`${payload[0].name}`}</p>
          <p className="desc">{`Total: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Prepare chart data format for recharts
  const chartData = data.expensesByCategory.map((category) => ({
    name: category.categoryName,
    value: category.total,
  }));

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2>📊 Reporte Mensual</h2>
        
        <div className="reports-filters">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando reporte...</div>
      ) : (
        <div className="reports-content">
          <div className="summary-cards">
            <div className="summary-card income-card">
              <div className="card-icon">📈</div>
              <div className="card-details">
                <h3>Ingresos Totales</h3>
                <p className="amount">{formatCurrency(data.totalIncome)}</p>
              </div>
            </div>

            <div className="summary-card expense-card">
              <div className="card-icon">📉</div>
              <div className="card-details">
                <h3>Gastos Totales</h3>
                <p className="amount">{formatCurrency(data.totalExpense)}</p>
              </div>
            </div>

            {data.totalSavings > 0 && (
              <div className="summary-card savings-card">
                <div className="card-icon">🏦</div>
                <div className="card-details">
                  <h3>Ahorros del Mes</h3>
                  <p className="amount">{formatCurrency(data.totalSavings)}</p>
                </div>
              </div>
            )}

            <div className={`summary-card balance-card ${netBalance >= 0 ? "positive" : "negative"}`}>
              <div className="card-icon">💰</div>
              <div className="card-details">
                <h3>Balance Neto</h3>
                <p className="amount">{formatCurrency(netBalance)}</p>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <h3 className="chart-title">Distribución de Gastos por Categoría</h3>
            
            {chartData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart">
                <p>No se registraron gastos (egresos) en este mes para generar el gráfico.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsView;
