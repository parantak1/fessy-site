'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client Setup
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yytafihildxcdlaonijk.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGFmaWhpbGR4Y2RsYW9uaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTA0NTUsImV4cCI6MjEwNTAyNjQ1NX0.K7n2k1iMBZ0I6BJxJZfdMXnhUObJoom0zT3N1yfwuZs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PageProps {
  params: Promise<{ username: string }> | { username: string };
}

export default function UserReceiverPage({ params }: PageProps) {
  // Unwrap Next.js 15 async Promise or sync params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const rawUsername = resolvedParams?.username || '';
  const username = decodeURIComponent(rawUsername).replace(/^@/, '').trim();

  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase User Lookup: SELECT id FROM users WHERE instagram_handle = [username]
  useEffect(() => {
    let isMounted = true;

    async function lookupUser() {
      if (!username) {
        if (isMounted) {
          setNotFound(true);
          setUserLoading(false);
        }
        return;
      }

      setUserLoading(true);
      setNotFound(false);
      setErrorMessage(null);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, instagram_handle')
          .eq('instagram_handle', username.toLowerCase())
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Supabase user lookup error:', error);
        }

        if (data?.id) {
          setReceiverId(data.id);
          setNotFound(false);
        } else {
          // If no user matches handle, check if username parameter itself is a valid UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
          if (isUuid) {
            const { data: uuidUser } = await supabase
              .from('users')
              .select('id, instagram_handle')
              .eq('id', username)
              .maybeSingle();

            if (!isMounted) return;

            if (uuidUser?.id) {
              setReceiverId(uuidUser.id);
              setNotFound(false);
            } else {
              setNotFound(true);
              setReceiverId(null);
            }
          } else {
            setNotFound(true);
            setReceiverId(null);
          }
        }
      } catch (err) {
        console.error('Error querying users:', err);
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setUserLoading(false);
        }
      }
    }

    lookupUser();

    return () => {
      isMounted = false;
    };
  }, [username]);

  // Form Submit: supabase.from('messages').insert([{ receiver_id: id, content: messageText }])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || isSubmitting || !receiverId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.from('messages').insert([
        {
          receiver_id: receiverId,
          content: content,
        },
      ]);

      if (error) throw error;

      setIsSuccess(true);
      setMessageText('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="fessy-page-wrapper"
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans"
      style={{
        background:
          'radial-gradient(circle at 15% 20%, #E8E0FF 0%, transparent 45%), ' +
          'radial-gradient(circle at 85% 75%, #E0F2FE 0%, transparent 45%), ' +
          'radial-gradient(circle at 50% 50%, #FFF8E6 0%, transparent 55%), ' +
          '#F6F3FB',
      }}
    >
      {/* Soft ambient background gradient blur aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 rounded-full bg-[#E8E0FF]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#E0F2FE]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-[#FFF8E6]/70 blur-3xl"
      />

      {/* Main Centered Frosted Glass Card */}
      <main className="relative z-10 w-full flex items-center justify-center my-auto">
        <div
          id="fessy-card"
          className="relative w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl p-6 sm:p-8 transition-all duration-300"
        >
          {userLoading ? (
            /* Loading Profile State */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-3 border-[#E8E0FF] border-t-[#6B4EFF] animate-spin mb-4" />
              <p className="text-sm font-medium text-neutral-500">Loading user profile...</p>
            </div>
          ) : notFound ? (
            /* 404 User Not Found State */
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mb-4 shadow-xs">
                🔍
              </div>
              <h2 className="text-2xl font-bold text-[#1C1C1E] tracking-tight mb-2">
                User not found
              </h2>
              <p className="text-sm font-medium text-neutral-600 mb-6 leading-relaxed">
                We couldn&apos;t find an account for{' '}
                <span className="font-semibold text-[#1C1C1E]">@{username}</span>.
              </p>
              <a
                href="/"
                className="w-full h-12 rounded-full bg-[#E8E0FF] hover:bg-[#DFD3FF] active:bg-[#D4C4FF] text-[#2A2738] font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98] shadow-xs"
              >
                Get your own Fessy link
              </a>
            </div>
          ) : !isSuccess ? (
            /* Main Form View */
            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* Dynamic Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#1C1C1E] tracking-tight leading-snug">
                  Send an anonymous message to{' '}
                  <span className="break-all font-extrabold text-[#111827]">@{username}</span>
                </h1>
              </div>

              {/* Textarea Input Container */}
              <div className="relative mb-4">
                <div className="relative rounded-xl bg-[#F5F0E6] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-[#DCD0FF] transition-all">
                  <textarea
                    id="fessy-message-textarea"
                    rows={4}
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Ask me anything..."
                    maxLength={300}
                    className="w-full h-36 resize-none rounded-xl bg-transparent p-4 pb-8 text-base font-medium text-[#1C1C1E] placeholder:text-[#9E988B] focus:outline-none border-none"
                  />

                  {/* Character Count */}
                  <div
                    id="fessy-char-count"
                    className="absolute bottom-3 right-3 text-xs font-semibold text-[#9E988B] select-none pointer-events-none"
                  >
                    {messageText.length} / 300
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div
                  id="fessy-error-notice"
                  className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 text-center"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                id="fessy-submit-button"
                type="submit"
                disabled={isSubmitting || !messageText.trim()}
                className="w-full h-12 sm:h-13 rounded-full bg-[#E8E0FF] hover:bg-[#DFD3FF] active:bg-[#D4C4FF] text-[#2A2738] font-bold text-base tracking-normal transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[#2A2738]/30 border-t-[#2A2738] animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send!</span>
                )}
              </button>
            </form>
          ) : (
            /* Success State View */
            <div
              id="fessy-success-view"
              className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight mb-6">
                Message sent anonymously! 🤫
              </h2>
              <a
                id="fessy-home-link-button"
                href="/"
                className="w-full h-12 rounded-full bg-[#E8E0FF] hover:bg-[#DFD3FF] active:bg-[#D4C4FF] text-[#2A2738] font-bold text-sm tracking-normal flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer shadow-xs"
              >
                Get your own Fessy link
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

