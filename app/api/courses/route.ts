import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('API courses called')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20))

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .order('title')

    console.log('Supabase response:', { data: data?.length, error: error?.message })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류'
    console.error('API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
