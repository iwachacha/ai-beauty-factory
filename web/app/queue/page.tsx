'use client'

import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
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
  [-1]: 'Failed',
  0: 'Waiting',
  1: 'Published',
  2: 'Publishing',
  3: 'Waiting update',
  4: 'Updating',
  5: 'Update failed',
}

export default function QueuePage() {
  const { apiBase, session } = useFactory()
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [error, setError] = useState('')

  async function loadJobs() {
    if (!session) {
      return
    }
    try {
      const data = await factoryFetch<JobItem[]>('/jobs', {}, session.token, apiBase)
      setJobs(data)
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load jobs')
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
    void loadJobs()
  }, [session])

  return (
    <FactoryShell title="Queue" subtitle="Track scheduled, publishing, completed, and failed jobs in one mobile-friendly list.">
      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}
      <section style={{ display: 'grid', gap: 16 }}>
        {jobs.map(job => (
          <article key={job.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{job.platform}</div>
                <h3 style={{ margin: '8px 0', fontFamily: 'var(--font-display), sans-serif' }}>Job {job.id.slice(-6)}</h3>
                <div style={{ color: 'var(--muted)' }}>Flow {job.flowId?.slice(-6)}</div>
              </div>
              <div style={softCardStyle}>{statusLabel[job.status] || `Status ${job.status}`}</div>
            </div>
            <div style={{ marginTop: 14, color: 'var(--muted)' }}>{new Date(job.scheduledAt).toLocaleString()}</div>
            {job.workLink && <a href={job.workLink} target="_blank" style={{ display: 'inline-block', marginTop: 12, color: 'var(--brand)' }}>Open post</a>}
            {job.errorMessage && <div style={{ marginTop: 12, color: 'var(--danger)' }}>{job.errorMessage}</div>}
            <div style={{ marginTop: 16 }}>
              <button onClick={() => void retryJob(job.id)} style={primaryButtonStyle}>Retry</button>
            </div>
          </article>
        ))}
        {jobs.length === 0 && <section style={cardStyle}>No jobs yet.</section>}
      </section>
    </FactoryShell>
  )
}
