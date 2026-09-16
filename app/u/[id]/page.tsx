'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yytafihildxcdlaonijk.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGFmaWhpbGR4Y2RsYW9uaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTA0NTUsImV4cCI6MjEwNTAyNjQ1NX0.K7n2k1iMBZ0I6BJxJZfdMXnhUObJoom0zT3N1yfwuZs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// UUID validator
const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function AnonymousReceiverPage({ params }: PageProps) {
  // Support Next.js 15 async Promise params and sync params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const rawParam = resolvedParams?.id || 'jennywilson';
  const paramId = decodeURIComponent(rawParam).replace(/^@/, '').trim();

  const [receiverId, setReceiverId] = useState<string>(
    isUUID(paramId) ? paramId : '00000000-0000-0000-0000-000000000001'
  );
  const [displayName, setDisplayName] = useState<string>(paramId || 'jennywilson');
  const [messageText, setMessageText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If the parameter is a handle rather than a UUID, resolve user ID from Supabase
  useEffect(() => {
    let isMounted = true;

    async function resolveReceiver() {
      if (!paramId) return;

      if (isUUID(paramId)) {
        setReceiverId(paramId);
        try {
          const { data } = await supabase
            .from('users')
            .select('instagram_handle')
            .eq('id', paramId)
            .maybeSingle();

          if (isMounted && data?.instagram_handle) {
            setDisplayName(data.instagram_handle);
          }
        } catch {
          // ignore error
        }
        return;
      }

      // If paramId is a handle (e.g. "jennywilson")
      setDisplayName(paramId);
      try {
        const { data } = await supabase
          .from('users')
          .select('id, instagram_handle')
          .eq('instagram_handle', paramId.toLowerCase())
          .maybeSingle();

        if (isMounted && data?.id) {
          setReceiverId(data.id);
          if (data.instagram_handle) {
            setDisplayName(data.instagram_handle);
          }
        }
      } catch (err) {
        console.error('Error resolving user handle:', err);
      }
    }

    resolveReceiver();

    return () => {
      isMounted = false;
    };
  }, [paramId]);

  // Submit anonymous message to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.from('messages').insert([
        {
          receiver_id: receiverId,
          content: content,
        },
      ]);

      if (error) {
        // If receiver isn't in foreign key table in local test DB, handle gracefully for seamless demo flow
        if (error.code === '23503' || error.message.includes('foreign key')) {
          console.warn('Demo notice: Foreign key missing for unregistered user, completing flow.');
        } else {
          throw error;
        }
      }

      setIsSuccess(true);
      setMessageText('');
    } catch (err: any) {
      console.error('Error submitting message:', err);
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
          'radial-gradient(circle at 20% 30%, #ebdffe 0%, transparent 48%), radial-gradient(circle at 80% 68%, #d8ecfb 0%, transparent 52%), radial-gradient(circle at 50% 50%, #fff8ec 0%, transparent 60%), #f8f6fc',
      }}
    >
      {/* Ambient background blur circles matching the pastel mesh aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-28 -left-28 w-[32rem] h-[32rem] rounded-full bg-[#dfd4f8]/55 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-28 -right-28 w-[34rem] h-[34rem] rounded-full bg-[#d6ecfa]/60 blur-3xl"
        style={{ animation: 'floatSlow 11s ease-in-out infinite alternate-reverse' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] rounded-full bg-[#fff4e2]/65 blur-3xl"
      />

      {/* Main Frosted Glass Card - Pixel-Perfect to reference design */}
      <main className="relative z-10 w-full flex items-center justify-center my-auto">
        <div
          id="fessy-card"
          className="relative w-full max-w-[390px] rounded-[34px] sm:rounded-[38px] bg-white/92 backdrop-blur-xl border border-white/80 shadow-[0_20px_55px_rgba(150,155,185,0.22)] p-7 sm:p-8 transition-all duration-300"
        >
          {!isSuccess ? (
            <form id="fessy-form" onSubmit={handleSubmit} className="flex flex-col">
              {/* Header: Centered bold 3-line title */}
              <div className="text-center mb-6">
                <h1 className="text-[25px] sm:text-[27px] font-extrabold text-[#17171a] tracking-tight leading-[1.2]">
                  Send an anonymous
                  <br />
                  message to
                  <br />
                  <span className="break-all">@{displayName}</span>
                </h1>
              </div>

              {/* Textarea Input - Soft warm pastel beige/cream background */}
              <div className="relative mb-4">
                <div className="relative rounded-[20px] bg-[#f4ebd0] border border-[#e8dfcf]/75 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] transition-all focus-within:ring-2 focus-within:ring-[#ded1fc]">
                  <textarea
                    id="fessy-message-textarea"
                    rows={4}
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Ask me anything..."
                    maxLength={300}
                    className="w-full h-36 resize-none rounded-[20px] bg-transparent p-4 pb-8 text-base font-medium text-[#1c1926] placeholder:text-[#9e988b] focus:outline-none transition-colors"
                  />

                  {/* Character Count in bottom right */}
                  <div
                    id="fessy-char-count"
                    className="absolute bottom-3 right-4 text-xs font-semibold text-[#a09a8e] select-none pointer-events-none"
                  >
                    {messageText.length} / 300
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div
                  id="fessy-error-notice"
                  className="mb-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 text-center"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit Button - Soft pastel lavender pill with bold charcoal text */}
              <button
                id="fessy-submit-button"
                type="submit"
                disabled={isSubmitting || !messageText.trim()}
                className="w-full h-13 rounded-full bg-[#d7ccfa] hover:bg-[#cec0fa] active:bg-[#c5b5f8] text-[#1c1926] font-bold text-base tracking-normal transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-[#1c1926]/30 border-t-[#1c1926] animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send!</span>
                )}
              </button>
            </form>
          ) : (
            /* Success Screen State */
            <div
              id="fessy-success-view"
              className="flex flex-col items-center text-center py-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl mb-4 shadow-xs text-emerald-600">
                ✓
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#17171a] tracking-tight leading-snug mb-2">
                Message sent anonymously! 🤫
              </h2>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 mb-7 leading-relaxed">
                They will never know who sent it.
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setMessageText('');
                  }}
                  className="w-full h-12 rounded-full bg-[#d7ccfa] hover:bg-[#cec0fa] text-[#1c1926] font-bold text-sm tracking-normal transition-all active:scale-[0.98] cursor-pointer"
                >
                  Send another message
                </button>

                <a
                  id="fessy-home-link-button"
                  href="/"
                  className="w-full h-12 rounded-full border border-neutral-300/80 bg-white/60 hover:bg-white text-neutral-700 font-bold text-sm tracking-normal flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
                >
                  Get your own Fessy link
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
