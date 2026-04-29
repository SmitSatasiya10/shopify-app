export interface DashboardStats {
  totalProducts: number;
  avgRating: string;
  featuredCount: number;
  lowRatedCount: number;
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text>Total Products</s-text>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.totalProducts}</div>
      </s-box>
      
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text>Avg. Rating</s-text>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#f59e0b' }}>⭐ {stats.avgRating}</div>
      </s-box>

      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text>Featured Products</s-text>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#10b981' }}>{stats.featuredCount}</div>
      </s-box>

      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text>Low Rated (1-2)</s-text>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#ef4444' }}>{stats.lowRatedCount}</div>
      </s-box>
    </div>
  );
}
