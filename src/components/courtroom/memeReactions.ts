import type { CourtroomSpeaker } from '@/audio';

export type MemeReactionId =
  | 'innocence-claim'
  | 'samosa-rebuttal'
  | 'girlfriend-evidence'
  | 'unexpected-witness'
  | 'girlfriend-breakup'
  | 'judge-bribe'
  | 'guilty-verdict'
  | 'failed-appeal';

export interface MemeReactionDefinition {
  id: MemeReactionId;
  src: string;
  start: number;
  end: number;
  caption: string;
  kicker: string;
  cameraSpeaker: CourtroomSpeaker;
  mainJourney: boolean;
}

const asset = (file: string) => `${import.meta.env.BASE_URL}memes/${file}`;

export const MEME_REACTIONS: Readonly<Record<MemeReactionId, MemeReactionDefinition>> = {
  'innocence-claim': {
    id: 'innocence-claim',
    src: asset('Video-85564.mp4'),
    start: 1,
    end: 3.5,
    kicker: 'DEFENDANT CONFIDENCE CAM',
    caption: 'Confidence detected. Evidence still loading.',
    cameraSpeaker: 'defendant',
    mainJourney: true,
  },
  'samosa-rebuttal': {
    id: 'samosa-rebuttal',
    src: asset('Video-32415.mp4'),
    start: 1,
    end: 3.7,
    kicker: 'PROSECUTION REACTION FEED',
    caption: 'The prosecution rests. The samosa does not.',
    cameraSpeaker: 'prosecutor',
    mainJourney: true,
  },
  'girlfriend-evidence': {
    id: 'girlfriend-evidence',
    src: asset('Video-65456.mp4'),
    start: 0.5,
    end: 2.8,
    kicker: 'WITNESS STAND · EXCLUSIVE',
    caption: 'When localhost finally enters production.',
    cameraSpeaker: 'girlfriend',
    mainJourney: true,
  },
  'unexpected-witness': {
    id: 'unexpected-witness',
    src: asset('Video-99420.mp4'),
    start: 0.4,
    end: 2.8,
    kicker: 'PERIPHERAL WITNESS REACTION',
    caption: 'The mouse has requested witness protection.',
    cameraSpeaker: 'mouse',
    mainJourney: false,
  },
  'girlfriend-breakup': {
    id: 'girlfriend-breakup',
    src: asset('Video-83871.mp4'),
    start: 0.4,
    end: 2.8,
    kicker: 'RELATIONSHIP BUILD FAILED',
    caption: 'Relationship status: garbage collected.',
    cameraSpeaker: 'girlfriend',
    mainJourney: true,
  },
  'judge-bribe': {
    id: 'judge-bribe',
    src: asset('Video-47714.mp4'),
    start: 0.3,
    end: 2.8,
    kicker: 'JUDICIAL ETHICS MONITOR',
    caption: 'Judicial ethics has left the server.',
    cameraSpeaker: 'judge',
    mainJourney: false,
  },
  'guilty-verdict': {
    id: 'guilty-verdict',
    src: asset('Video-58130.mp4'),
    start: 0.5,
    end: 3,
    kicker: 'LIVE FROM THE DEFENSE TABLE',
    caption: 'The verdict has entered the group chat.',
    cameraSpeaker: 'judge',
    mainJourney: true,
  },
  'failed-appeal': {
    id: 'failed-appeal',
    src: asset('Video-78497.mp4'),
    start: 3,
    end: 5.8,
    kicker: 'APPEAL OUTCOME · FINAL FINAL',
    caption: 'Your appeal has been emotionally processed.',
    cameraSpeaker: 'judge',
    mainJourney: false,
  },
};
