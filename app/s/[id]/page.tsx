import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ResponseSection from './ResponseSection'
import type { Response } from '@/lib/types'

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

function buildTree(flat: Response[]): Response[] {
  const map = new Map<string, Response>()
  flat.forEach(r => map.set(r.id, { ...r, replies: [] }))
  const roots: Response[] = []
  map.forEach(r => {
    if (r.parent_response_id) {
      map.get(r.parent_response_id)?.replies?.push(r)
    } else {
      roots.push(r)
    }
  })
  return roots
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

  const { data: flatResponses } = await supabase
    .from('responses')
    .select('*, profiles(id, username, display_name)')
    .eq('sentence_id', id)
    .order('created_at', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()

  const responses = buildTree((flatResponses ?? []) as Response[])

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

      <ResponseSection sentenceId={id} user={user} responses={responses} />
    </div>
  )
}
