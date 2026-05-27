import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ResponseSection from './ResponseSection'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('sentences').select('content, source_title').eq('id', id).single()
  if (!data) return { title: '智脈' }
  const title = data.content.length > 60 ? data.content.slice(0, 60) + '…' : data.content
  return {
    title: `「${title}」— 智脈`,
    description: data.source_title ? `來自《${data.source_title}》` : '智脈——以句子為單位的知識社群',
    openGraph: { title: `「${title}」`, description: data.source_title ?? '智脈' },
  }
}

const TYPE_LABELS = { extend: '延伸', challenge: '反駁', echo: '共鳴' }
const TYPE_COLORS = {
  extend: 'text-blue-600 bg-blue-50',
  challenge: 'text-red-600 bg-red-50',
  echo: 'text-green-600 bg-green-50',
}

export default async function SentencePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sentence } = await supabase
    .from('sentences')
    .select('*, profiles(id, username, display_name)')
    .eq('id', id)
    .single()

  if (!sentence) notFound()

  const { data: responses } = await supabase
    .from('responses')
    .select('*, profiles(id, username, display_name)')
    .eq('sentence_id', id)
    .order('created_at', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 mb-8 inline-block">← 回到所有句子</Link>

      <article className="mb-10">
        <blockquote className="text-2xl leading-relaxed font-medium text-gray-900 mb-4">
          {sentence.content}
        </blockquote>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {sentence.source_title && (
            sentence.source_url ? (
              <a href={sentence.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
                {sentence.source_title}
              </a>
            ) : <span>{sentence.source_title}</span>
          )}
          {sentence.source_title && <span>·</span>}
          {sentence.profiles && (
            <Link href={`/u/${sentence.profiles.username}`} className="hover:text-gray-700">
              {sentence.profiles.display_name || sentence.profiles.username}
            </Link>
          )}
        </div>
      </article>

      <div className="mb-8">
        {(responses ?? []).map((r) => (
          <div key={r.id} className="py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.response_type as keyof typeof TYPE_COLORS]}`}>
                {TYPE_LABELS[r.response_type as keyof typeof TYPE_LABELS]}
              </span>
              <Link href={`/u/${r.profiles?.username}`} className="text-sm text-gray-400 hover:text-gray-700">
                {r.profiles?.display_name || r.profiles?.username}
              </Link>
            </div>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{r.content}</p>
          </div>
        ))}
      </div>

      <ResponseSection sentenceId={id} user={user} />
    </div>
  )
}
