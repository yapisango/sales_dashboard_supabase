import supabase from "./supabase-client.js";
import { useEffect, useState } from "react";
import { Chart } from "react-charts";
import Form from "./Form";

function Dashboard() {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
  fetchMetrics();

  const channel = supabase
  .channel('deal-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'sales_deals' },
    (payload) => {
      console.log('INSERT - New row:', payload.new);
      fetchMetrics();
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'sales_deals' },
    (payload) => {
      console.log('UPDATE - Updated row:', payload.new);
      fetchMetrics();
    }
  )
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'sales_deals' },
    (payload) => {
      console.log('DELETE - Deleted row:', payload.old);
      fetchMetrics();
    }
  )
  .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  async function fetchMetrics() {
    try {
      const { data, error } = await supabase
        .from('sales_deals')
        .select('name, value, created_at');

      if (error) throw error;

      console.log("Fetched data:", data);

      // Filter by current quarter
      const currentQuarter = Math.floor(new Date().getMonth() / 3); 
      const currentYear = new Date().getFullYear();

      const filtered = data.filter(({ created_at }) => {
        const date = new Date(created_at);
        return (
          date.getFullYear() === currentYear &&
          Math.floor(date.getMonth() / 3) === currentQuarter
        );
      });

      setMetrics(filtered);

      // Group and sum sales by name
      const salesByName = filtered.reduce((acc, { name, value }) => {
        acc[name] = (acc[name] || 0) + value;
        return acc;
      }, {});

      const result = Object.entries(salesByName)
        .map(([name, total_sales]) => ({ name, total_sales }))
        .sort((a, b) => b.total_sales - a.total_sales);

      setMetrics(result);
    } catch (error) {
      console.error("Error fetching sales data:", error.message);
    }
  }

  function y_max() {
  if (metrics.length > 0) {
    const maxSum = Math.max(...metrics.map((m) => m.total_sales));
    return maxSum + 2000;
  }
  return 1000; 
}

const maxValue = y_max();

const chartData = [
  {
    data: metrics.map((m) => ({
      primary: m.name,
      secondary: m.total_sales,
    })),
  },
];

const primaryAxis = {
  getValue: (d) => d.primary,
  scaleType: 'band',
  padding: 0.2,
  position: 'bottom',
};

const secondaryAxes = [
  {
    getValue: (d) => d.secondary,
    scaleType: 'linear',
    min: 0,
    max: maxValue,
    padding: {
      top: 20,
      bottom: 40,
    },
  },
];


  return (
    <div className="dashboard-wrapper">
      <div className="chart-container">
        <h2>Total Sales This Quarter - Test PR(R)</h2>
        <div style={{ flex: 1 }}>
          <Chart
            options={{
              data: chartData,
              primaryAxis,
              secondaryAxes,
              type: 'bar',
              defaultColors: ['#58d675'],
              tooltip: {
                show: true,
              },
            }}
          />
        </div>
      </div>
      <Form metrics={metrics} />
    </div>
  );
}

export default Dashboard;

