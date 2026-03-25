import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const EXAMPLES = ['新海誠', '宮崎駿', '山田尚子', '庵野秀明', '長井龍雪', '水島精二', '吉松孝博', '梅津泰臣'];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const search = async (name) => {
    const q = name || query;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: q.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '検索に失敗しました');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const quickSearch = (name) => {
    setQuery(name);
    search(name);
  };

  return (
    <>
      <Head>
        <title>アニメスタッフ検索</title>
        <meta name="description" content="アニメスタッフの参加作品・制作会社を検索" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.bg}>
        <div className={styles.grid} />
        <main className={styles.main}>
          <header className={styles.header}>
            <span className={styles.tag}>// ANIME STAFF DATABASE</span>
            <h1 className={styles.title}>アニメ<span>スタッフ</span>検索</h1>
            <p className={styles.subtitle}>参加作品・制作会社をまとめて調査</p>
          </header>

          <div className={styles.searchWrap}>
            <input
              className={styles.input}
              type="text"
              placeholder="スタッフ名を入力（例：新海誠）"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              disabled={loading}
            />
            <button className={styles.btn} onClick={() => search()} disabled={loading || !query.trim()}>
              {loading ? '検索中' : 'SEARCH'}
            </button>
          </div>

          <div className={styles.examples}>
            {EXAMPLES.map(name => (
              <button key={name} className={styles.exTag} onClick={() => quickSearch(name)} disabled={loading}>
                {name}
              </button>
            ))}
          </div>

          {loading && (
            <div className={styles.statusWrap}>
              <div className={styles.spinner} />
              <p className={styles.statusText}>「{query}」を検索中...</p>
              <p className={styles.statusSub}>seesaawiki.jp を参照しています</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠</span> {error}
            </div>
          )}

          {result && !loading && (
            result.known === false ? (
              <div className={styles.notFound}>
                <p className={styles.notFoundTitle}>「{result.name}」の情報が見つかりませんでした</p>
                <p className={styles.notFoundSub}>別の表記や読み仮名でお試しください</p>
              </div>
            ) : (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>🎬</div>
                  <div>
                    <h2 className={styles.staffName}>{result.name}</h2>
                    {result.nameReading && <p className={styles.reading}>{result.nameReading}</p>}
                    <p className={styles.staffRole}>{result.role}</p>
                  </div>
                  <div className={styles.totalBadge}>
                    <span className={styles.totalNum}>{result.works?.length || 0}</span>
                    <span className={styles.totalLabel}>作品</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {/* Companies */}
                  {result.companies?.length > 0 && (
                    <section className={styles.section}>
                      <h3 className={styles.sectionTitle}>関わった制作会社</h3>
                      <div className={styles.companies}>
                        {result.companies.map((c, i) => (
                          <div key={i} className={styles.companyChip}>
                            <span className={styles.companyName}>{c.name}</span>
                            {c.count > 0 && <span className={styles.companyCount}>{c.count}</span>}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Works */}
                  {result.works?.length > 0 && (
                    <section className={styles.section}>
                      <h3 className={styles.sectionTitle}>参加作品一覧</h3>
                      <div className={styles.works}>
                        {result.works.map((w, i) => (
                          <div key={i} className={styles.workItem}>
                            <div className={styles.workLeft}>
                              <span className={styles.workNum}>{String(i + 1).padStart(2, '0')}</span>
                              <span className={styles.workTitle}>{w.title}</span>
                            </div>
                            <div className={styles.workRight}>
                              {w.role && <span className={styles.workRole}>{w.role}</span>}
                              {w.year && <span className={styles.workYear}>{w.year}</span>}
                              {w.company && <span className={styles.workCompany}>{w.company}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Summary */}
                  {result.summary && (
                    <section className={styles.section}>
                      <h3 className={styles.sectionTitle}>プロフィール</h3>
                      <p className={styles.summary}>{result.summary}</p>
                    </section>
                  )}

                  {/* Sources */}
                  {result.sources?.length > 0 && (
                    <p className={styles.sources}>参照: {result.sources.join(' / ')}</p>
                  )}
                </div>
              </div>
            )
          )}
        </main>
        <footer className={styles.footer}>
          データ参照元: <a href="https://seesaawiki.jp/w/radioi_34/" target="_blank" rel="noreferrer">アニメスタッフデータベース</a>　Powered by Claude AI
        </footer>
      </div>
    </>
  );
}
