# Accessibility Guidelines

The governance framework mandates WCAG 2.2 AA compliance for all user-facing surfaces.

## Requirements

- **Semantic HTML/ARIA** – Use proper elements and roles.
- **Keyboard navigation** – All interactive elements must be keyboard accessible.
- **Focus order** – Consistent and logical focus sequence.
- **Minimum target size** – 44×44 CSS pixels for touch targets.
- **No color-only signalling** – Use text/icons in addition to color.

## CLI/TUI Requirements

- Provide `--plain` output mode for screen readers.
- Use clear, consistent command structure.
- Include help text for all commands.

## Testing

- Run axe/jest-axe for automated accessibility checks.
- Test with screen readers (NVDA, VoiceOver, JAWS).
- Verify keyboard-only navigation.

## Evidence

When UI is affected, attach accessibility reports:

- `tasks/<slug>/verification/wcag/*.json` – axe scan results
- `tasks/<slug>/evidence/a11y-review.md` – manual testing notes

## Resources

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core](https://github.com/dequelabs/axe-core)
