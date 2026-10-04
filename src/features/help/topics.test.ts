import { describe, expect, it } from 'vitest';

import en from '../../../messages/en.json';

import { adjacentHelpTopics, findHelpTopic, HELP_TOPICS } from './topics';

type Section = { title: string; body?: string; steps?: Record<string, string>; items?: Record<string, string> };
type Topic = { title: string; summary: string; sections: Record<string, Section> };
const topics = en.help.topics as Record<string, Topic>;

describe('HELP_TOPICS', () => {
  it('has unique slugs', () => {
    const slugs = HELP_TOPICS.map((topic) => topic.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(HELP_TOPICS.map((topic) => [topic.slug, topic] as const))(
    '%s matches its messages exactly (no missing or unused text)',
    (_, topic) => {
      const messages = topics[topic.key];
      expect(messages, `help.topics.${topic.key}`).toBeDefined();
      expect(Object.keys(messages.sections)).toEqual(topic.sections.map((s) => s.id));

      for (const { id, steps, items } of topic.sections) {
        const section = messages.sections[id];
        expect(section.title).toBeTruthy();
        expect(Object.keys(section.steps ?? {})).toEqual(steps ?? []);
        expect(Object.keys(section.items ?? {})).toEqual(items ?? []);
        // A section with no list must at least have a paragraph.
        if (!steps && !items) expect(section.body).toBeTruthy();
      }
    }
  );

  it('covers every topic in the messages', () => {
    expect(Object.keys(topics).sort()).toEqual(HELP_TOPICS.map((t) => t.key).sort());
  });

  it('links module topics to a nav label', () => {
    for (const topic of HELP_TOPICS.filter((t) => t.appHref)) {
      expect(en.nav).toHaveProperty(topic.key);
    }
  });
});

describe('findHelpTopic / adjacentHelpTopics', () => {
  it('finds topics by slug', () => {
    expect(findHelpTopic('install')?.key).toBe('install');
    expect(findHelpTopic('gettingStarted')).toBeUndefined();
    expect(findHelpTopic('nope')).toBeUndefined();
  });

  it('returns previous and next in reading order', () => {
    const first = HELP_TOPICS[0];
    const last = HELP_TOPICS[HELP_TOPICS.length - 1];
    expect(adjacentHelpTopics(first.slug)).toEqual({ previous: undefined, next: HELP_TOPICS[1] });
    expect(adjacentHelpTopics(last.slug).next).toBeUndefined();
    expect(adjacentHelpTopics('nope')).toEqual({});
  });
});
