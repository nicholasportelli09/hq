"use client";

import { uid } from "@/lib/room/ids";
import { LIMITS, type Action, type Idea, type Member } from "@/lib/room/types";
import { AddInput, SectionHead } from "./SectionHead";

export const IDEA_INPUT_ID = "new-idea";

interface IdeaListProps {
  ideas: readonly Idea[];
  lockedIdeaId: string | null;
  members: Readonly<Record<string, Member>>;
  me: Member;
  dispatch: (action: Action) => void;
}

const byVotes = (a: Idea, b: Idea) =>
  b.voterIds.length - a.voterIds.length || a.createdAt - b.createdAt;

export function IdeaList({ ideas, lockedIdeaId, members, me, dispatch }: IdeaListProps) {
  const locked = ideas.find((i) => i.id === lockedIdeaId);

  if (locked) {
    const author = members[locked.authorId]?.name;
    return (
      <section aria-labelledby="ideas-title">
        <SectionHead
          id="ideas-title"
          title="We're building"
          meta={
            <button
              type="button"
              onClick={() => dispatch({ type: "idea/lock", id: null })}
              className="hover:text-ink hover:underline underline-offset-4"
            >
              Reopen vote
            </button>
          }
        />
        <p className="animate-rise pt-5 text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-balance">
          {locked.text}
        </p>
        <p className="mt-3 text-sm text-mute">
          {locked.voterIds.length} {locked.voterIds.length === 1 ? "vote" : "votes"}
          {author ? ` · pitched by ${author}` : ""}
        </p>
      </section>
    );
  }

  const sorted = [...ideas].sort(byVotes);
  return (
    <section aria-labelledby="ideas-title">
      <SectionHead id="ideas-title" title="Ideas" meta={ideas.length > 1 ? "Vote, then lock one in" : null} />
      <AddInput
        id={IDEA_INPUT_ID}
        label="New idea"
        placeholder="Pitch an idea"
        maxLength={LIMITS.ideaText}
        onSubmit={(text) =>
          dispatch({ type: "idea/add", id: uid(), text, authorId: me.id, at: Date.now() })
        }
      />
      {sorted.length === 0 ? (
        <p className="py-6 text-sm text-mute">
          Everyone pitches. Everyone votes once per idea. Lock in the winner.
        </p>
      ) : (
        <ul>
          {sorted.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} me={me} dispatch={dispatch} />
          ))}
        </ul>
      )}
    </section>
  );
}

interface IdeaRowProps {
  idea: Idea;
  me: Member;
  dispatch: (action: Action) => void;
}

function IdeaRow({ idea, me, dispatch }: IdeaRowProps) {
  const voted = idea.voterIds.includes(me.id);
  const count = idea.voterIds.length;
  return (
    <li className="row animate-rise group flex items-start gap-3 py-2.5">
      <button
        type="button"
        aria-pressed={voted}
        aria-label={`${voted ? "Remove vote" : "Vote"} for ${idea.text}, ${count} ${count === 1 ? "vote" : "votes"}`}
        onClick={() => dispatch({ type: "idea/vote", id: idea.id, memberId: me.id, on: !voted })}
        className={`mt-px h-6 min-w-9 shrink-0 rounded-full border px-2 text-xs font-semibold tabular-nums transition-colors ${voted ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}
      >
        {count}
      </button>
      <span className="min-w-0 flex-1 break-words pt-0.5 text-[15px]">{idea.text}</span>
      <div className="flex shrink-0 gap-3 pt-0.5 text-xs">
        <button
          type="button"
          aria-label={`Delete idea: ${idea.text}`}
          onClick={() => dispatch({ type: "idea/remove", id: idea.id })}
          className="reveal text-mute opacity-0 transition-opacity hover:text-signal focus-visible:opacity-100 group-hover:opacity-100"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "idea/lock", id: idea.id })}
          className="reveal text-mute opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          Lock in
        </button>
      </div>
    </li>
  );
}
