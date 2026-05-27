export type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  created_at: string
}

export type Sentence = {
  id: string
  user_id: string
  content: string
  source_title: string | null
  source_url: string | null
  source_type: string
  created_at: string
  profiles?: Profile
  response_count?: number
  save_count?: number
}

export type Response = {
  id: string
  user_id: string
  sentence_id: string
  content: string
  response_type: 'extend' | 'challenge' | 'echo'
  created_at: string
  profiles?: Profile
  parent_response_id?: string | null
  quote?: string | null
  replies?: Response[]
}

export type Save = {
  id: string
  user_id: string
  sentence_id: string
  created_at: string
}
