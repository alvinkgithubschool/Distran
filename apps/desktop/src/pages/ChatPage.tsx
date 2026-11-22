import { BuddyPanel } from '../components/BuddyPanel';
import { useState, useEffect, useRef } from 'react';
import { Search, ArrowUpRight, Send, MessageCircle, LockKeyhole } from 'lucide-react';
import { useStore } from '../lib/context';
import { uniqueId } from '../lib/store';
import { PageHeader, Avatar, Eyebrow } from '../components/ui';
export function ChatPage() {
  const { account, update, notify } = useStore();
  const [thread, setThread] = useState('buddy');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const contacts = [
    { id: 'ari0825', name: 'Ari', handle: 'ari0825', caption: 'A room for your next co-op night.' },
    { id: 'milo', name: 'Milo', handle: 'milo', caption: 'Films that deserve a second watch.' },
  ];
  const active = contacts.find((c) => c.id === thread)!;
  const messages = account?.messages.filter((m) => m.thread === thread) ?? [];
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);
  if (!account) return null;
  return (
    <div className="chat-page page-pad">
      <PageHeader eyebrow="THE PEOPLE IN YOUR ROOM" title="Buddy & friends" />
      <div className="chat-layout">
        <aside className="chat-contacts">
          <div className="contacts-search">
            <Search size={15} />
            <input
              aria-label="Search preview contacts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a conversation…"
            />
          </div>
          <button className="buddy-contact" onClick={() => setThread('buddy')}>
            <span className="buddy-orb">✧</span>
            <span>
              <strong>Buddy</strong>
              <small>FOLLOW A FEELING</small>
            </span>
            <span className="soon-tag">PREVIEW</span>
          </button>
          <Eyebrow>PREVIEW CONVERSATIONS</Eyebrow>
          {contacts
            .filter((c) => `${c.name} ${c.handle}`.toLowerCase().includes(query.toLowerCase()))
            .map((contact) => (
              <button
                key={contact.id}
                className={`contact-row ${thread === contact.id ? 'active' : ''}`}
                onClick={() => {
                  setThread(contact.id);
                  setDraft('');
                }}
              >
                <Avatar name={contact.name} />
                <span>
                  <strong>{contact.name}</strong>
                  <small>@{contact.handle}</small>
                </span>
                <ArrowUpRight size={13} />
              </button>
            ))}
          <div className="chat-local-note">
            <LockKeyhole size={15} />
            <p>
              A little room to try things.
              <span>Preview contacts are fictional. Messages stay on this device.</span>
            </p>
          </div>
        </aside>
        {thread === 'buddy' ? (
          <BuddyPanel key={account.id} />
        ) : (
          <section className="conversation">
            <header>
              <Avatar name={active.name} />
              <div>
                <h2>{active.name}</h2>
                <span>@{active.handle} · PREVIEW CONTACT</span>
              </div>
              <span className="outline-label">LOCAL DRAFTS</span>
            </header>
            <div className="message-scroll">
              <div className="conversation-start">
                <span className="conversation-symbol">
                  <MessageCircle size={27} />
                </span>
                <Eyebrow>EVERY CONVERSATION STARTS SOMEWHERE</Eyebrow>
                <h3>A little room for you and {active.name}.</h3>
                <p>{active.caption}</p>
                <span>Try the conversation flow. Live delivery is not connected.</span>
              </div>
              {messages.map((message) => (
                <div className="message-bubble" key={message.id}>
                  <p>{message.text}</p>
                  <span>
                    {new Date(message.date).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · SAVED LOCALLY
                  </span>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <form
              className="message-composer"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                try {
                  update({
                    ...account,
                    messages: [
                      ...account.messages,
                      {
                        id: uniqueId(),
                        thread,
                        text: draft.trim(),
                        date: new Date().toISOString(),
                      },
                    ],
                  });
                  setDraft('');
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`A thought for ${active.name}…`}
                aria-label="Message"
                maxLength={4000}
              />
              <button
                type="submit"
                className="icon-button"
                disabled={!draft.trim()}
                aria-label="Save message locally"
              >
                <Send size={19} />
              </button>
            </form>
            <p className="composer-note">
              A conversation preview. Nothing is sent to another person.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
