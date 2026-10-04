import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render';

import en from '../../../../messages/en.json';
import { HELP_FIGURES, HELP_TOPICS } from '../topics';

import { HelpFigure } from './help-figure';

describe('HelpFigure', () => {
  it('has a caption for every figure and no unused ones', () => {
    expect(Object.keys(en.help.figures.captions).sort()).toEqual([...HELP_FIGURES].sort());
  });

  it('uses every figure somewhere in the help topics', () => {
    const used = HELP_TOPICS.flatMap((topic) =>
      topic.sections.flatMap((s) => [s.figure, ...Object.values(s.stepFigures ?? {})])
    );
    expect(new Set(used.filter(Boolean))).toEqual(new Set(HELP_FIGURES));
  });

  it.each(HELP_FIGURES)('renders %s as one image with a translated description', (id) => {
    renderWithIntl(<HelpFigure id={id} />, { locale: 'ms' });
    const enCaptions: Record<string, string> = en.help.figures.captions;
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName();
    // Malay text, not the English fallback.
    expect(img.getAttribute('aria-label')).not.toBe(enCaptions[id]);
  });

  it('draws the menu label the reader has to tap', () => {
    renderWithIntl(<HelpFigure id="iosAddToHome" />);
    expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
  });
});
