// The shared kernel: the backend contract (copied from ward-worker) and the pure helpers every
// part of Ward Monitor builds on. Plain TypeScript, no Angular.
export * from './lib/contract';
export type {
  GameNotice,
  GameQueue,
  GameRpcContract,
  ParticipantId,
  ResolvedEvent,
  Role,
} from './lib/game-contract';
export * from './lib/links';
export * from './lib/participants';
export * from './lib/ward';
