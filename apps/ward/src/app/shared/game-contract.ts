import type { AlarmId, BedId, Command, CommandResult, DoctorId, NurseId } from './contract';
import { isBedId, isCommand, isFiniteNumber } from './contract';

export type ParticipantId = NurseId | DoctorId;
export type Role = 'nurse' | 'doctor';

export type GameQueue = `/queue/game.${ParticipantId}`;
export type GameNotice =
	| { kind: 'patient'; bed: BedId }     // "your phone is now the monitor for this bed"
	| { kind: 'released' };               // round over, back to normal

export interface GameRpcContract {
	'monitor.set': { req: Command & { bed: BedId; hr: number }; res: CommandResult };
}

// Emitted on the ward topic only when the room setting emitResolved is on (workshop exercise).
export type ResolvedEvent = { status: 'resolved'; alarmId: AlarmId; bed: BedId };

// ---------- Backend additions ----------
export type GameRpcName = keyof GameRpcContract;

type GameRequestGuards = { [K in GameRpcName]: (x: unknown) => x is GameRpcContract[K]['req'] };

export const GAME_REQUEST_GUARDS: GameRequestGuards = {
	'monitor.set': (x): x is GameRpcContract['monitor.set']['req'] =>
		isCommand(x) && typeof x.bed === 'string' && isBedId(x.bed) && isFiniteNumber(x.hr),
};

export const isGameRpcName = (v: string): v is GameRpcName => Object.hasOwn(GAME_REQUEST_GUARDS, v);
