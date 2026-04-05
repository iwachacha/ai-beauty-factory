'use client'

import { useEffect, useRef, useState } from 'react'
import { cardStyle, FactoryShell, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface JobItem {
  id: string
  flowId: string
  platform: string
  status: number
  scheduledAt: string
  workLink?: string
  errorMessage?: string
}

const statusLabel: Record<number, string> = {
  [-1]: 'エラー（失敗）',
  0: '送信待機中',
  1: '投稿完了',
  2: '送信処理中',
  3: '更新待機中',
  4: '更新処理中',
  5: '更新エラー',
}

const POLL_INTERVAL = 30_000

export default function QueuePage() {
  const { apiBase, session } = useFactory()
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function loadJobs(showSpinner = false) {
    if (!session) {
      return
    }
    if (showSpinner) {
      setLoading(true)
    }
    try {
      const data = await factoryFetch<JobItem[]>('/jobs', {}, session.token, apiBase)
      setJobs(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load jobs')
    }
    finally {
      setLoading(false)
    }
  }

  async function retryJob(jobId: string) {
    if (!session) {
      return
    }
    try {
      await factoryFetch(`/jobs/${jobId}/retry`, {
        method: 'POST',
        body: JSON.stringify({}),
      }, session.token, apiBase)
      setError('')
      await loadJobs()
    }
    catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Failed to retry job')
    }
  }

  useEffect(() => {
    void loadJobs(true)

    pollRef.current = setInterval(() => {
      void loadJobs(false)
    }, POLL_INTERVAL)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [session])

  return (
    <FactoryShell title="実行状況" subtitle="投稿タスクのステータス（待機中・処理中・成功・失敗）を監視します。30秒ごとに自動更新されます。">
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="実行タスクを読み込んでいます…" />
        : (
            <section style={{ display: 'grid', gap: 16 }}>
              {jobs.map(job => (
                <article key={job.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{job.platform}</div>
                      <h3 style={{ margin: '8px 0', fontFamily: 'var(--font-display), sans-serif' }}>タスク {job.id.slice(-6)}</h3>
                      <div style={{ color: 'var(--muted)' }}>フロー {job.flowId?.slice(-6)}</div>
                    </div>
                    <div style={softCardStyle}>{statusLabel[job.status] || `ステータス ${job.status}`}</div>
                  </div>
                  <div style={{ marginTop: 14, color: 'var(--muted)' }}>{new Date(job.scheduledAt).toLocaleString()}</div>
                  {job.workLink && <a href={job.workLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, color: 'var(--brand)' }}>投稿を開く</a>}
                  {job.errorMessage && <div style={{ marginTop: 12, color: 'var(--danger)' }}>{job.errorMessage}</div>}
                  <div style={{ marginTop: 16 }}>
                    <button onClick={() => void retryJob(job.id)} style={primaryButtonStyle}>再試行する</button>
                  </div>
                </article>
              ))}
              {jobs.length === 0 && <section style={cardStyle}>実行されたタスクはありません。</section>}
            </section>
          )}
    </FactoryShell>
  )
}

