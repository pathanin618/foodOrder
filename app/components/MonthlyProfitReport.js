'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonthlyProfitReport({ purchases }) {
  // ---- คำนวณผลกำไรรายเดือน ----
  const monthlyData = useMemo(() => {
    const byMonth = {};
    
    for (const p of purchases) {
      const date = new Date(p.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const monthLabel = date.toLocaleString('th-TH', { month: 'long', year: 'numeric' });
      
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { monthKey, monthLabel, profit: 0, orders: 0 };
      }
      byMonth[monthKey].profit += Number(p.total);
      byMonth[monthKey].orders += 1;
    }
    
    return Object.values(byMonth).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [purchases]);

  // ---- ตัวกรอง ----
  const [filterType, setFilterType] = useState('all'); // all, last3, last6, custom, months
  const [customMonths, setCustomMonths] = useState(3);
  const [selectedMonths, setSelectedMonths] = useState(
    Array.from({ length: 12 }, (_, i) => true) // เลือกทั้งหมด 12 เดือนตั้งแต่แรก
  );

  // ---- ข้อมูลที่แสดงตามตัวกรอง ----
  const filteredData = useMemo(() => {
    let result = monthlyData;
    
    if (filterType === 'all') result = monthlyData;
    else if (filterType === 'last3') result = monthlyData.slice(-3);
    else if (filterType === 'last6') result = monthlyData.slice(-6);
    else if (filterType === 'custom') result = monthlyData.slice(-Math.max(1, customMonths));
    else if (filterType === 'months') {
      // กรองตามเดือนที่เลือก (1-12)
      result = monthlyData.filter(item => {
        const month = new Date(item.monthKey + '-01').getMonth(); // 0-11
        return selectedMonths[month];
      });
    }
    
    return result;
  }, [monthlyData, filterType, customMonths, selectedMonths]);

  // ---- สรุปรวม ----
  const totalProfit = filteredData.reduce((s, m) => s + m.profit, 0);
  const totalOrders = filteredData.reduce((s, m) => s + m.orders, 0);
  const avgProfit = filteredData.length > 0 ? totalProfit / filteredData.length : 0;

  return (
    <div className="panel">
      <h3 className="section-title">รายงานผลกำไรรายเดือน</h3>

      {/* ---- ตัวกรองและตัวเลือก ---- */}
      <div className="filter-section">
        <div className="filter-group">
          <label>ประเภทตัวกรอง:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">ทั้งหมด</option>
            <option value="last3">3 เดือนล่าสุด</option>
            <option value="last6">6 เดือนล่าสุด</option>
            <option value="custom">กำหนดเอง</option>
            <option value="months">เลือกเดือน (1-12)</option>
          </select>
        </div>

        {filterType === 'custom' && (
          <div className="filter-group">
            <label htmlFor="custom-months">จำนวนเดือน:</label>
            <input 
              id="custom-months"
              type="number" 
              min="1" 
              max={monthlyData.length}
              value={customMonths}
              onChange={(e) => setCustomMonths(Math.max(1, parseInt(e.target.value) || 1))}
              className="filter-input"
            />
          </div>
        )}
      </div>

      {/* ---- เลือกเดือน 1-12 ---- */}
      {filterType === 'months' && (
        <div className="months-selector">
          <p className="months-label">เลือกเดือนที่ต้องการ (1-12):</p>
          <div className="months-grid">
            {Array.from({ length: 12 }, (_, i) => {
              const monthNum = i + 1;
              const monthName = new Date(2026, i, 1).toLocaleString('th-TH', { month: 'short' });
              return (
                <label key={monthNum} className="month-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMonths[i]}
                    onChange={(e) => {
                      const newSelected = [...selectedMonths];
                      newSelected[i] = e.target.checked;
                      setSelectedMonths(newSelected);
                    }}
                  />
                  <span>{monthNum} ({monthName})</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- สรุปตัวเลข ---- */}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">ผลกำไรรวม</p>
          <p className="stat-value">{totalProfit.toLocaleString()} ฿</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">จำนวนรายการ</p>
          <p className="stat-value">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">ผลกำไรเฉลี่ยต่อเดือน</p>
          <p className="stat-value">{avgProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })} ฿</p>
        </div>
      </div>

      {/* ---- กราฟแนวตั้ง ---- */}
      <div className="chart-container">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="monthLabel" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={Math.max(0, Math.floor(filteredData.length / 5) - 1)}
              />
              <YAxis 
                label={{ value: 'ผลกำไร (บาท)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => `${value.toLocaleString()} ฿`}
                labelFormatter={(label) => `${label}`}
                contentStyle={{ backgroundColor: '#1E3A8A', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="profit" fill="#38BDF8" name="ผลกำไร" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-row">ยังไม่มีข้อมูล</p>
        )}
      </div>

      {/* ---- ตารางรายละเอียด ---- */}
      <div className="detail-table-section">
        <h4 className="subsection-title">รายละเอียดตามเดือน</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>เดือน</th>
              <th className="td-center">จำนวนรายการ</th>
              <th className="td-right">ผลกำไร</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((month) => (
              <tr key={month.monthKey}>
                <td>{month.monthLabel}</td>
                <td className="td-center">{month.orders.toLocaleString()}</td>
                <td className="td-right">{month.profit.toLocaleString()} ฿</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan={3} className="empty-row">ยังไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
