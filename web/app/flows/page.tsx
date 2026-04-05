'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { cardStyle, FactoryShell, fieldStyle, LoadingSpinner, primaryButtonStyle, softCardStyle } from '../../components/factory-shell'
import { useFactory } from '../../components/factory-provider'
import { factoryFetch } from '../../lib/factory-api'

interface FlowItem {
  id: string
  name: string
  contentAssetId: string
  targetAccountIds: string[]
  scheduleAt?: string
  status: string
}

interface AccountItem {
  id: string
  nickname: string
  platform: string
}

interface ContentAsset {
  id: string
  title: string
}

export default function FlowsPage() {
  const { apiBase, session } = useFactory()
  const [flows, setFlows] = useState<FlowItem[]>([])
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [assets, setAssets] = useState<ContentAsset[]>([])
  const [name, setName] = useState('')
  const [contentAssetId, setContentAssetId] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadData() {
    if (!session) {
      return
    }
    setLoading(true)
    try {
      const [flowData, accountData, assetData] = await Promise.all([
        factoryFetch<FlowItem[]>('/flows', {}, session.token, apiBase),
        factoryFetch<AccountItem[]>('/accounts', {}, session.token, apiBase),
        factoryFetch<ContentAsset[]>('/content/assets', {}, session.token, apiBase),
      ])
      setFlows(flowData)
      setAccounts(accountData)
      setAssets(assetData)
      if (!contentAssetId && assetData[0]) {
        setContentAssetId(assetData[0].id)
      }
      setError('')
    }
    catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load flow data')
    }
    finally {
      setLoading(false)
    }
  }

  async function createFlow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }
    try {
      await factoryFetch('/flows', {
        method: 'POST',
        body: JSON.stringify({
          name,
          contentAssetId,
          targetAccountIds,
          scheduleAt: scheduleAt || undefined,
          platformOptions: {},
        }),
      }, session.token, apiBase)
      setName('')
      setScheduleAt('')
      setTargetAccountIds([])
      setError('')
      await loadData()
    }
    catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create flow')
    }
  }

  async function enqueueFlow(flowId: string) {
    if (!session) {
      return
    }
    try {
      await factoryFetch(`/flows/${flowId}/enqueue`, {
        method: 'POST',
        body: JSON.stringify({}),
      }, session.token, apiBase)
      setError('')
      await loadData()
    }
    catch (enqueueError) {
      setError(enqueueError instanceof Error ? enqueueError.message : 'Failed to enqueue flow')
    }
  }

  useEffect(() => {
    void loadData()
  }, [session])

  return (
    <FactoryShell title="配信フロー" subtitle="投稿用素材と複数のSNSアカウントを紐づけ、同時配信や予約投稿のルールを作成します。">
      <section style={cardStyle}>
        <form onSubmit={createFlow} style={{ display: 'grid', gap: 14 }}>
          <input placeholder="フロー名（例：新機能リリース動画）" value={name} onChange={event => setName(event.target.value)} style={fieldStyle} required />
          <select value={contentAssetId} onChange={event => setContentAssetId(event.target.value)} style={fieldStyle} required>
            <option value="">投稿する素材（アセット）を選択</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.title}</option>
            ))}
          </select>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, color: 'var(--muted)' }}>予約日時（任意）</div>
            <input type="datetime-local" value={scheduleAt} onChange={event => setScheduleAt(event.target.value)} style={fieldStyle} />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, color: 'var(--muted)' }}>配信先アカウント</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {accounts.map(account => {
                const checked = targetAccountIds.includes(account.id)
                return (
                  <label key={account.id} style={{ ...softCardStyle, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setTargetAccountIds(current => event.target.checked
                          ? [...current, account.id]
                          : current.filter(item => item !== account.id))
                      }}
                    />
                    <span>{account.platform} / {account.nickname}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <button type="submit" style={primaryButtonStyle}>フローを作成</button>
        </form>
      </section>

      {error && <section style={{ ...cardStyle, color: 'var(--danger)' }}>{error}</section>}

      {loading
        ? <LoadingSpinner label="配信フローを読み込んでいます…" />
        : (
            <section style={{ display: 'grid', gap: 16 }}>
              {flows.map(flow => (
                <article key={flow.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{flow.status === 'draft' ? '下書き' : flow.status === 'scheduled' ? '予約済み' : flow.status}</div>
                      <h3 style={{ margin: '8px 0', fontFamily: 'var(--font-display), sans-serif' }}>{flow.name}</h3>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>{flow.targetAccountIds.length} アカウントへ配信</p>
                    </div>
                    <button onClick={() => void enqueueFlow(flow.id)} style={primaryButtonStyle}>実行キューに追加</button>
                  </div>
                  <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 14 }}>
                    {flow.scheduleAt ? `予約日時: ${new Date(flow.scheduleAt).toLocaleString()}` : 'キュー追加後に即時配信されます'}
                  </div>
                </article>
              ))}
              {flows.length === 0 && <section style={cardStyle}>作成された配信フローがありません。フォームから新しいフローを作成してください。</section>}
            </section>
          )}
    </FactoryShell>
  )
}


