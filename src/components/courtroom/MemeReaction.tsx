import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FastForward, Film } from 'lucide-react';
import { MEME_REACTIONS, type MemeReactionDefinition, type MemeReactionId } from './memeReactions';
import './meme-reaction.css';

export type MemePlaybackResult = 'ended' | 'skipped' | 'failed';

export interface MemeReactionHandle {
  play(this: void, id: MemeReactionId): Promise<MemePlaybackResult>;
  prime(this: void): Promise<void>;
  skip(this: void): void;
}

interface MemeReactionProps {
  muted: boolean;
  reducedMotion: boolean;
  onActiveChange?(this: void, reaction: MemeReactionDefinition | null): void;
}

export const MemeReaction = forwardRef<MemeReactionHandle, MemeReactionProps>(function MemeReaction(
  { muted, reducedMotion, onActiveChange },
  forwardedRef,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishRef = useRef<((result: MemePlaybackResult) => void) | null>(null);
  const [reaction, setReaction] = useState<MemeReactionDefinition | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(
    () => () => {
      finishRef.current?.('skipped');
      finishRef.current = null;
    },
    [],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      async prime() {
        const video = videoRef.current;
        if (!video) return;
        video.src = MEME_REACTIONS['innocence-claim'].src;
        video.muted = true;
        try {
          await video.play();
          video.pause();
          video.currentTime = MEME_REACTIONS['innocence-claim'].start;
        } catch {
          // Playback is attempted again through the visible, user-initiated sequence.
        }
        video.muted = muted;
      },
      play(id) {
        const video = videoRef.current;
        const next = MEME_REACTIONS[id];
        if (!video) return Promise.resolve('failed');

        finishRef.current?.('skipped');
        setReaction(next);
        setPlaying(false);
        onActiveChange?.(next);

        return new Promise<MemePlaybackResult>((resolve) => {
          let settled = false;
          let watchdog = 0;
          const cleanups: Array<() => void> = [];
          const finish = (result: MemePlaybackResult) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(watchdog);
            cleanups.forEach((cleanup) => cleanup());
            video.pause();
            setPlaying(false);
            setReaction(null);
            onActiveChange?.(null);
            finishRef.current = null;
            resolve(result);
          };
          finishRef.current = finish;

          const listen = (event: string, handler: EventListener) => {
            video.addEventListener(event, handler);
            cleanups.push(() => video.removeEventListener(event, handler));
          };
          const playTrim = async () => {
            try {
              video.currentTime = next.start;
              if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                await new Promise<void>((ready, reject) => {
                  const onReady = () => ready();
                  const onError = () => reject(new Error('Meme media failed to load'));
                  video.addEventListener('loadeddata', onReady, { once: true });
                  video.addEventListener('error', onError, { once: true });
                  cleanups.push(() => {
                    video.removeEventListener('loadeddata', onReady);
                    video.removeEventListener('error', onError);
                  });
                });
              }
              video.currentTime = next.start;
              await new Promise<void>((ready) => {
                if (Math.abs(video.currentTime - next.start) < 0.08) ready();
                else video.addEventListener('seeked', () => ready(), { once: true });
              });
              if (settled) return;
              setPlaying(true);
              video.muted = muted;
              try {
                await video.play();
              } catch {
                video.muted = true;
                await video.play();
              }
            } catch {
              finish('failed');
            }
          };

          listen('timeupdate', () => {
            if (video.currentTime >= next.end) finish('ended');
          });
          listen('ended', () => finish('ended'));
          listen('error', () => finish('failed'));
          watchdog = window.setTimeout(
            () => finish('failed'),
            Math.max(9000, (next.end - next.start + 6) * 1000),
          );
          if (video.src !== new URL(next.src, window.location.href).href) video.src = next.src;
          video.load();
          void playTrim();
        });
      },
      skip() {
        finishRef.current?.('skipped');
      },
    }),
    [muted, onActiveChange],
  );

  return (
    <section
      className={`meme-reaction ${reaction ? 'is-active' : ''} ${playing ? 'is-playing' : ''} ${reducedMotion ? 'is-reduced' : ''}`}
      aria-label="Courtroom reaction cut"
      aria-hidden={!reaction}
      data-meme-reaction={reaction?.id ?? 'none'}
    >
      <div className="meme-reaction-frame">
        <video ref={videoRef} playsInline preload="metadata" disablePictureInPicture />
        {!playing && reaction ? (
          <div className="meme-reaction-loading">
            <Film aria-hidden="true" size={22} />
            Projecting Exhibit…
          </div>
        ) : null}
        {reaction ? (
          <div className="meme-reaction-caption">
            <span>{reaction.kicker}</span>
            <strong>{reaction.caption}</strong>
          </div>
        ) : null}
      </div>
      {reaction ? (
        <button type="button" onClick={() => finishRef.current?.('skipped')}>
          <FastForward aria-hidden="true" size={15} /> Skip reaction
        </button>
      ) : null}
    </section>
  );
});
