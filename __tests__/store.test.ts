import type {
  ConversationApi,
  SendMessageInput,
} from '../src/features/conversation/api/conversationApi';
import { createConversationStore } from '../src/features/conversation/model/store';
import type {
  AiMessage,
  Message,
  UserMessage,
} from '../src/features/conversation/model/types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Hand-rolled fake: every call parks a deferred the test settles explicitly. */
class FakeApi implements ConversationApi {
  fetches: Deferred<Message[]>[] = [];
  sends: { input: SendMessageInput; d: Deferred<AiMessage> }[] = [];

  fetchConversation(): Promise<Message[]> {
    const d = deferred<Message[]>();
    this.fetches.push(d);
    return d.promise;
  }

  sendMessage(input: SendMessageInput): Promise<AiMessage> {
    const d = deferred<AiMessage>();
    this.sends.push({ input, d });
    return d.promise;
  }

  get lastSend() {
    return this.sends[this.sends.length - 1];
  }
}

const SEED: Message[] = [
  { id: '1', type: 'system', text: 'started', createdAt: 1 },
  { id: '2', type: 'user', text: 'q', createdAt: 2, status: 'sent' },
  { id: '3', type: 'ai', text: 'a', createdAt: 3 },
];

const aiReply = (id: string, replyToId?: string): AiMessage => ({
  id,
  type: 'ai',
  text: `reply ${id}`,
  createdAt: Date.now(),
  replyToId,
});

let api: FakeApi;
let store: ReturnType<typeof createConversationStore>;

beforeEach(() => {
  api = new FakeApi();
  store = createConversationStore(api);
});

const s = () => store.getState();
const user = (id: string) => s().byId[id] as UserMessage;

async function loadSeed() {
  const p = s().load();
  api.fetches[0].resolve(SEED);
  await p;
}

/** Starts a send and returns the pending promise plus the optimistic message id. */
function startSend(text: string) {
  const p = s().send(text);
  const id = s().order[s().order.length - 1];
  return { p, id };
}

describe('load', () => {
  it('sets loading, then ready with byId/order/lastAppendedId populated', async () => {
    const p = s().load();
    expect(s().status).toBe('loading');
    expect(s().errorMessage).toBeNull();

    api.fetches[0].resolve(SEED);
    await p;

    expect(s().status).toBe('ready');
    expect(s().order).toEqual(['1', '2', '3']);
    expect(Object.keys(s().byId).sort()).toEqual(['1', '2', '3']);
    expect(s().byId['3']).toBe(SEED[2]);
    expect(s().lastAppendedId).toBe('3');
  });

  it('ready with an empty conversation leaves lastAppendedId null', async () => {
    const p = s().load();
    api.fetches[0].resolve([]);
    await p;
    expect(s().status).toBe('ready');
    expect(s().order).toEqual([]);
    expect(s().lastAppendedId).toBeNull();
  });

  it('sets error with the error message on failure', async () => {
    const p = s().load();
    api.fetches[0].reject(new Error('Network request failed'));
    await p;
    expect(s().status).toBe('error');
    expect(s().errorMessage).toBe('Network request failed');
  });

  it('uses a generic message when the rejection is not an Error', async () => {
    const p = s().load();
    api.fetches[0].reject('boom');
    await p;
    expect(s().status).toBe('error');
    expect(s().errorMessage).toBe('Unable to load conversation.');
  });

  it('a retry after an error clears errorMessage', async () => {
    const p1 = s().load();
    api.fetches[0].reject(new Error('x'));
    await p1;
    const p2 = s().load();
    expect(s().status).toBe('loading');
    expect(s().errorMessage).toBeNull();
    api.fetches[1].resolve(SEED);
    await p2;
    expect(s().status).toBe('ready');
  });
});

describe('send', () => {
  beforeEach(loadSeed);

  it('optimistically inserts a trimmed user message with status "sending"', () => {
    const { id } = startSend('  hello  ');
    const m = user(id);
    expect(m).toMatchObject({ type: 'user', text: 'hello', status: 'sending' });
    expect(s().order).toEqual(['1', '2', '3', id]);
    expect(s().lastAppendedId).toBe(id);
    expect(api.sends).toHaveLength(1);
    expect(api.lastSend.input).toEqual({ clientId: id, text: 'hello', replyToId: undefined });
  });

  it('takes replyToId from state, then clears it', () => {
    s().setReplyTo('3');
    const { id } = startSend('re: that');
    expect(user(id).replyToId).toBe('3');
    expect(api.lastSend.input.replyToId).toBe('3');
    expect(s().replyToId).toBeNull();
  });

  it('on resolve: marks sent and appends the AI reply', async () => {
    const { p, id } = startSend('hello');
    expect(s().isAssistantTyping).toBe(true);

    const reply = aiReply('ai_1', id);
    api.lastSend.d.resolve(reply);
    await p;

    expect(user(id).status).toBe('sent');
    expect(s().byId.ai_1).toBe(reply);
    expect(s().order).toEqual(['1', '2', '3', id, 'ai_1']);
    expect(s().lastAppendedId).toBe('ai_1');
    expect(s().isAssistantTyping).toBe(false);
  });

  it('on reject: marks failed, appends nothing, stops typing', async () => {
    const { p, id } = startSend('hello');
    expect(s().isAssistantTyping).toBe(true);

    api.lastSend.d.reject(new Error('nope'));
    await p;

    expect(user(id).status).toBe('failed');
    expect(s().order).toEqual(['1', '2', '3', id]);
    expect(s().isAssistantTyping).toBe(false);
  });

  it('keeps the typing indicator on until the last overlapping send settles', async () => {
    const first = startSend('one');
    const second = startSend('two');
    expect(s().isAssistantTyping).toBe(true);

    api.sends[0].d.resolve(aiReply('ai_1', first.id));
    await first.p;
    expect(s().isAssistantTyping).toBe(true); // second still in flight

    api.sends[1].d.reject(new Error('nope'));
    await second.p;
    expect(s().isAssistantTyping).toBe(false);
  });

  it('load() clears stale replyToId and feedback from the previous conversation', async () => {
    s().setReplyTo('3');
    s().setVote('3', 'like');
    const p = s().load();
    api.fetches[api.fetches.length - 1].resolve(SEED);
    await p;
    expect(s().replyToId).toBeNull();
    expect(s().feedback).toEqual({});
  });

  it.each(['', '   ', '\n\t '])('is a no-op for empty/whitespace text %j', async text => {
    const before = s();
    await s().send(text);
    expect(api.sends).toHaveLength(0);
    expect(s().order).toEqual(['1', '2', '3']);
    expect(s()).toBe(before);
  });
});

describe('retry', () => {
  beforeEach(loadSeed);

  it('re-sends a failed user message with the same id and succeeds the second time', async () => {
    const first = startSend('hello');
    api.lastSend.d.reject(new Error('down'));
    await first.p;
    expect(user(first.id).status).toBe('failed');

    const p = s().retry(first.id);
    expect(user(first.id).status).toBe('sending');
    expect(s().isAssistantTyping).toBe(true);
    expect(api.sends).toHaveLength(2);
    expect(api.lastSend.input.clientId).toBe(first.id);
    expect(api.lastSend.input.text).toBe('hello');

    api.lastSend.d.resolve(aiReply('ai_r', first.id));
    await p;

    expect(user(first.id).status).toBe('sent');
    // same id, same slot in order: no duplicate optimistic message
    expect(s().order).toEqual(['1', '2', '3', first.id, 'ai_r']);
    expect(s().isAssistantTyping).toBe(false);
  });

  it('keeps the original replyToId on retry', async () => {
    s().setReplyTo('3');
    const first = startSend('hello');
    api.lastSend.d.reject(new Error('down'));
    await first.p;

    const p = s().retry(first.id);
    expect(api.lastSend.input.replyToId).toBe('3');
    api.lastSend.d.resolve(aiReply('ai_r'));
    await p;
  });

  it('ignores non-failed, non-user and missing messages', async () => {
    const pending = startSend('hello'); // status 'sending'
    await s().retry(pending.id);
    await s().retry('2'); // user, status 'sent'
    await s().retry('3'); // ai
    await s().retry('does-not-exist');
    expect(api.sends).toHaveLength(1);

    api.lastSend.d.resolve(aiReply('ai_x'));
    await pending.p;
  });
});

describe('remove', () => {
  beforeEach(loadSeed);

  it('drops the message from byId, order and feedback', () => {
    s().setVote('3', 'like');
    s().remove('3');
    expect(s().byId['3']).toBeUndefined();
    expect(s().order).toEqual(['1', '2']);
    expect(s().feedback['3']).toBeUndefined();
  });

  it('clears replyToId if it pointed at the removed message', () => {
    s().setReplyTo('3');
    s().remove('3');
    expect(s().replyToId).toBeNull();
  });

  it('keeps replyToId if it pointed elsewhere', () => {
    s().setReplyTo('2');
    s().remove('3');
    expect(s().replyToId).toBe('2');
  });

  it('is a no-op for an unknown id', () => {
    const before = s();
    s().remove('nope');
    expect(s()).toBe(before);
  });

  it('removing the question while its send is in flight suppresses the reply', async () => {
    const { p, id } = startSend('hello');
    s().remove(id);
    expect(s().order).toEqual(['1', '2', '3']);

    api.lastSend.d.resolve(aiReply('ai_late', id));
    await p;

    expect(s().byId.ai_late).toBeUndefined();
    expect(s().byId[id]).toBeUndefined(); // patch must not resurrect it
    expect(s().order).toEqual(['1', '2', '3']);
    expect(s().isAssistantTyping).toBe(false);
  });

  it('removing the question while its send is in flight and then failing does not resurrect it', async () => {
    const { p, id } = startSend('hello');
    s().remove(id);
    api.lastSend.d.reject(new Error('x'));
    await p;
    expect(s().byId[id]).toBeUndefined();
    expect(s().order).toEqual(['1', '2', '3']);
  });
});

describe('feedback', () => {
  it('like sets the vote and clears reasons', () => {
    s().toggleReason('3', 'inaccurate');
    s().setVote('3', 'like');
    expect(s().feedback['3']).toEqual({ vote: 'like', reasons: [] });
  });

  it('dislike keeps existing reasons', () => {
    s().toggleReason('3', 'inaccurate');
    s().toggleReason('3', 'too_long');
    s().setVote('3', 'dislike');
    expect(s().feedback['3']).toEqual({
      vote: 'dislike',
      reasons: ['inaccurate', 'too_long'],
    });
  });

  it('toggleReason adds then removes, and forces vote to dislike', () => {
    s().setVote('3', 'like');
    s().toggleReason('3', 'too_generic');
    expect(s().feedback['3']).toEqual({ vote: 'dislike', reasons: ['too_generic'] });
    s().toggleReason('3', 'didnt_help');
    expect(s().feedback['3'].reasons).toEqual(['too_generic', 'didnt_help']);
    s().toggleReason('3', 'too_generic');
    expect(s().feedback['3']).toEqual({ vote: 'dislike', reasons: ['didnt_help'] });
  });

  it('setVote(null) clears the vote and reasons', () => {
    s().toggleReason('3', 'inaccurate');
    s().setVote('3', null);
    expect(s().feedback['3']).toEqual({ vote: null, reasons: [] });
  });

  it('feedback is per message', () => {
    s().setVote('3', 'like');
    s().toggleReason('5', 'too_long');
    expect(s().feedback['3']).toEqual({ vote: 'like', reasons: [] });
    expect(s().feedback['5']).toEqual({ vote: 'dislike', reasons: ['too_long'] });
  });
});

describe('reset', () => {
  it('returns to the initial data', async () => {
    await loadSeed();
    s().setReplyTo('3');
    s().setVote('3', 'like');
    s().reset();
    expect(s()).toMatchObject({
      status: 'idle',
      errorMessage: null,
      byId: {},
      order: [],
      replyToId: null,
      feedback: {},
      isAssistantTyping: false,
      lastAppendedId: null,
    });
  });
});
