import { useState } from 'react';
import './Analytics.css';

interface StatsData {
  shortCode: string;
  totalClicks: number;
  clicksByDay: Array<{ date: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}

export function Analytics() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async (): Promise<void> => {
    if (!code.trim()) {
      setError('Digite um short code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/stats/${code}`);
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Analytics — URL Shortener</h1>
      <div className="search">
        <input
          type="text"
          placeholder="Digite o short code (ex: aBc1234)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFetch();
          }}
        />
        <button onClick={handleFetch} disabled={loading}>
          {loading ? 'Carregando...' : 'Ver Analytics'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="stats">
          <h2>Resultados para: {stats.shortCode}</h2>

          <section>
            <h3>Total de Cliques</h3>
            <div className="total">{stats.totalClicks}</div>
          </section>

          <section>
            <h3>Cliques por Dia (últimos 30 dias)</h3>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliques</th>
                </tr>
              </thead>
              <tbody>
                {stats.clicksByDay.map((row) => (
                  <tr key={row.date}>
                    <td>{new Date(row.date).toLocaleDateString('pt-BR')}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3>Top Referrers</h3>
            <table>
              <thead>
                <tr>
                  <th>Origem</th>
                  <th>Cliques</th>
                </tr>
              </thead>
              <tbody>
                {stats.topReferrers.map((row) => (
                  <tr key={row.referrer}>
                    <td className="referrer">{row.referrer}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
