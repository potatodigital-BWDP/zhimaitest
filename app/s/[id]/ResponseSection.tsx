'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Response } from '@/lib/types'

type Props = {
  sentenceId: string
  user: User | null
  responses: Response[]
}

const TYPES = [
  { value: 'echo', label: '共鳴', desc: '這句話也擊中了我' },
  { value: 'extend', label: '延伸', desc: '從這裡繼續想下去' },
  { value: 'challenge', label: '反駁', desc: '我有不同的看法' },
]

const TYPE_LABELS = { extend: '延伸', challenge: '反駁', echo: '共鳴' }
const TYPE_COLORS = {
  extend: 'text-blue-600 bg-blue-50',
  challenge: 'text-red-600 bg-red-50',
  echo: 'text-green-600 bg-green-50',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false, timeZoneName: 'short',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('year')}年${get('month')}月${get('day')}日 ${get('hour')}:${get('minute')} ${get('timeZoneName')}`
}

type ReplyFormProps = {
  sentenceId: string
  parentResponseId: string | null
  user: User
  onDone: () => void
}

function ReplyForm({ sentenceId, parentResponseId, user, onDone }: ReplyFormProps) {
  const [type, setType] = useState<'echo' | 'extend' | 'challenge'>('extend')
  const [quote, setQuote] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    await supabase.from('responses').insert({
      sentence_id: sentenceId,
      user_id: user.id,
      content: content.trim(),
      response_type: type,
      parent_response_id: parentResponseId,
      quote: quote.trim() || null,
    })
    setContent('')
    setQuote('')
    setLoading(false)
    onDone()
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="mt-3 pl-4 border-l-2 border-gray-200">
      <div className="flex gap-2 mb-2">
        {TYPES.map(t => (
          <button key={t.value} type="button"
            onClick={() => setType(t.value as typeof type)}
            className={`px-3 py-1 rounded-full text-xs transition ${
              type === t.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <input
        value={quote}
        onChange={e => setQuote(e.target.value)}
        placeholder="引用特定句子（選填，貼上你想回應的那句）"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-gray-400"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={TYPES.find(t => t.value === type)?.desc}
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
      />
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={loading || !content.trim()}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-full disabled:opacity-40 hover:bg-gray-700 transition">
          {loading ? '送出中…' : '送出'}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-700 transition">
          取消
        </button>
      </div>
    </form>
  )
}

type ResponseNodeProps = {
  r: Response
  sentenceId: string
  user: User | null
  depth: number
}

function ResponseNode({ r, sentenceId, user, depth }: ResponseNodeProps) {
  const [replying, setReplying] = useState(false)

  return (
    <div className={depth > 0 ? 'pl-4 border-l-2 border-gray-100' : ''}>
      <div className="py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.response_type]}`}>
              {TYPE_LABELS[r.response_type]}
            </span>
            <Link href={`/u/${r.profiles?.username}`} className="text-sm text-gray-400 hover:text-gray-700">
              {r.profiles?.display_name || r.profiles?.username}
            </Link>
            <span className="text-xs text-gray-300">{formatDate(r.created_at)}</span>
          </div>
          {user && !replying && (
            <button onClick={() => setReplying(true)}
              className="text-xs text-gray-300 hover:text-gray-500 transition">
              回覆
            </button>
          )}
        </div>

        {r.quote && (
          <div className="mb-2 pl-3 border-l-2 border-gray-300 text-sm text-gray-400 italic">
            {r.quote}
          </div>
        )}

        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{r.content}</p>

        {replying && user && (
          <ReplyForm
            sentenceId={sentenceId}
            parentResponseId={r.id}
            user={user}
            onDone={() => setReplying(false)}
          />
        )}
      </div>

      {(r.replies ?? []).map(child => (
        <ResponseNode key={child.id} r={child} sentenceId={sentenceId} user={user} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function ResponseSection({ sentenceId, user, responses }: Props) {
  const [replying, setReplying] = useState(false)

  return (
    <div>
      <div className="mb-6 divide-y divide-gray-100">
        {responses.map(r => (
          <ResponseNode key={r.id} r={r} sentenceId={sentenceId} user={user} depth={0} />
        ))}
      </div>

      {user ? (
        replying ? (
          <ReplyForm
            sentenceId={sentenceId}
            parentResponseId={null}
            user={user}
            onDone={() => setReplying(false)}
          />
        ) : (
          <button onClick={() => setReplying(true)}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-700 transition">
            + 回應這句話
          </button>
        )
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          <Link href="/login" className="underline hover:text-gray-700">登入</Link> 後可以回應這句話
        </p>
      )}
    </div>
  )
}
