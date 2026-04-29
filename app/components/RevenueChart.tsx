export interface RevenueData {
  rating: number;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100);

  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <s-text><strong>Revenue by Product Rating (Last 50 Orders)</strong></s-text>
      
      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '150px' }}>
        {data.map((item) => (
          <div key={item.rating} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '15%' }}>
            <div style={{ fontSize: '10px', marginBottom: '5px' }}>${item.revenue.toFixed(0)}</div>
            <div 
              style={{ 
                width: '100%', 
                height: `${(item.revenue / maxRevenue) * 100}px`, 
                background: item.revenue > 0 ? '#6366f1' : '#eee', 
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease'
                }} 
            />
            <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>{item.rating}⭐</div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <s-text>
          <span style={{ fontSize: '13px' }}>
            💡 Insight: Products with higher ratings generally drive <strong>{(data[4].revenue / (data[0].revenue || 1) * 100).toFixed(0)}% more</strong> revenue.
          </span>
        </s-text>
      </div>
    </s-box>
  );
}
