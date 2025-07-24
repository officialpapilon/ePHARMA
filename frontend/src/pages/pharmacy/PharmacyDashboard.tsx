import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { API_BASE_URL } from '../../../constants';
import { 
  NavigateNext,
  TimelapseRounded,
  MedicationRounded
} from '@mui/icons-material';
import { Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DispensingData {
  date: string;
  dispensed: number;
  pending: number;
  done: number;
}

interface MedicineData {
  id: number;
  product_name: string;
  expire_date: string;
  current_quantity: number;
}

const DispensingDashboard: React.FC = () => {
  const theme = useTheme();
  const [dispensingData, setDispensingData] = useState<DispensingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiredCount, setExpiredCount] = useState(0);
  const [nearExpiryCount, setNearExpiryCount] = useState(0);

  const currentDate = new Date();

  const getLastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  useEffect(() => {
    fetchDispensingData();
    fetchMedicineStatusCounts();
  }, []);

  const calculateMedicineStatus = (expireDate: string) => {
    const expiryDate = new Date(expireDate);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    if (expiryDate < today) {
      return 'expired';
    } else if (expiryDate <= threeMonthsFromNow) {
      return 'near_expiry';
    }
    return 'active';
  };

  const fetchMedicineStatusCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');

      const response = await fetch(
        `${API_BASE_URL}/api/medicines-cache?limit=100000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      
      let expired = 0;
      let nearExpiry = 0;
      
      data.data.forEach((medicine: MedicineData) => {
        const status = calculateMedicineStatus(medicine.expire_date);
        if (status === 'expired') {
          expired++;
        } else if (status === 'near_expiry') {
          nearExpiry++;
        }
      });

      setExpiredCount(expired);
      setNearExpiryCount(nearExpiry);
    } catch (err) {
      console.error('Error fetching medicine status counts:', err);
      setError('Failed to load medicine data');
    }
  };

  const fetchDispensingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');

      const response = await fetch(
        `${API_BASE_URL}/api/dispensed?start_date=${getLastSevenDays()[0]}&end_date=${getLastSevenDays()[6]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const dispenseData = await response.json();

      const processedData = getLastSevenDays().map(date => {
        const dayData = dispenseData.data.filter((d: any) => 
          new Date(d.created_at).toISOString().split('T')[0] === date
        );
        
        return {
          date,
          dispensed: dayData.length,
          pending: dayData.filter((d: any) => d.transaction_status === 'pending').length,
          done: dayData.filter((d: any) => d.transaction_status === 'completed').length,
        };
      });

      setDispensingData(processedData);
    } catch (err: any) {
      console.error('Fetch dispensing data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sevenDays = getLastSevenDays();
  const filteredData = dispensingData.filter((item) => sevenDays.includes(item.date));

  const chartData = {
    labels: sevenDays,
    datasets: [
      {
        label: 'Dispensed',
        data: filteredData.map((item) => item.dispensed),
        backgroundColor: theme.palette.success.light,
        borderColor: theme.palette.success.main,
        borderWidth: 1,
      },
      {
        label: 'Pending',
        data: filteredData.map((item) => item.pending),
        backgroundColor: theme.palette.info.light,
        borderColor: theme.palette.info.main,
        borderWidth: 1,
      },
      {
        label: 'Done',
        data: filteredData.map((item) => item.done),
        backgroundColor: theme.palette.warning.light,
        borderColor: theme.palette.warning.main,
        borderWidth: 1,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { 
        display: true, 
        text: 'Dispensing Trends (Last 7 Days)', 
        font: { size: 18 },
        padding: { bottom: 10 },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw}`,
        },
      },
    },
    scales: {
      x: { 
        title: { display: true, text: 'Date (YYYY-MM-DD)', font: { size: 14 } },
        ticks: { font: { size: 12 } },
      },
      y: { 
        title: { display: true, text: 'Number of Transactions', font: { size: 14 } }, 
        beginAtZero: true,
        ticks: { font: { size: 12 } },
      },
    },
  };

  const cardData = [
    {
      title: "Total Dispensed",
      value: filteredData.reduce((sum, item) => sum + item.dispensed, 0),
      icon: <MedicationRounded className="text-white" fontSize="medium" />,
      gradient: "from-indigo-400 to-indigo-600",
    },
    {
      title: "Nearly Expired",
      value: nearExpiryCount,
      icon: <TimelapseRounded className="text-white" fontSize="medium" />,
      gradient: "from-amber-400 to-amber-600",
    },
    {
      title: "Expired",
      value: expiredCount,
      icon: <Clock className="text-white" fontSize="medium" />,
      gradient: "from-red-400 to-red-600",
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: theme.palette.background.default, display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <NavigateNext style={{ color: theme.palette.text.secondary, width: 24, height: 24 }} />
          <h4 style={{ fontSize: 15, fontWeight: 600, color: theme.palette.text.secondary, marginRight: 8 }}>Pharmacy</h4>
          <NavigateNext style={{ color: theme.palette.text.secondary, width: 24, height: 24 }} />
          <h1 style={{ fontSize: 15, fontWeight: 600, color: theme.palette.text.secondary }}>Dashboard</h1>
        </div>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading && (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary }}>
              Loading...
            </div>
          )}
          {error && (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.error.main }}>
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              <div style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                {cardData.map((card, index) => (
                  <div key={index} style={{ background: theme.palette.primary.main, color: theme.palette.primary.contrastText, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>{card.title}</span>
                      <span style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: '50%' }}>
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ flexGrow: 1, background: theme.palette.background.paper, padding: 24, borderRadius: 16, boxShadow: theme.shadows[1], maxHeight: 600, overflowY: 'auto' }}>
                <Bar data={chartData} options={options} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispensingDashboard;