import { createSupabaseServerClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }

    // Get profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role,
        name: profile?.full_name,
      },
      authenticated: true,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
  }
}