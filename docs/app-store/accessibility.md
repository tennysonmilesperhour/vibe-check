# Accessibility submission worksheet

Apple requires a label to apply across all common tasks, including first launch, sign-in, settings, and the product's primary workflow. Do not claim a label from code inspection alone.

## Common tasks to test on iPhone

1. Read the public introduction, privacy policy, and support page.
2. Create an account, sign in, recover a password, and sign out.
3. Start, save as a draft, resume, complete, and edit a check-in.
4. Review Patterns and its chart alternatives.
5. Add, edit, and remove a person.
6. Complete a tarot/oracle reading and read the result.
7. Enter Cosmos profile details, use the Loom detail list, and request a reflection.
8. Configure a reminder, export data, and reach account deletion.

## Candidate labels after physical-device verification

- **VoiceOver:** Candidate. Semantic labels, headings, form labels, status messages, chart tables, and a Loom alternative are implemented. Claim only after all tasks pass.
- **Voice Control:** Candidate. Controls have visible names and 44-point targets. Claim only after all tasks pass.
- **Differentiate Without Color Alone:** Candidate. Selected states use text, position, or ARIA state in addition to color. Confirm every common task.
- **Sufficient Contrast:** Candidate. Core surfaces use Golden Hour contrast tokens. Verify generated content and all error/disabled states.
- **Reduced Motion:** Candidate. CSS and Framer Motion respect the system preference. Confirm every animated flow.
- **Larger Text:** Do not claim for version 1.0 unless testing proves all common tasks work at 200% or an equivalent in-app control is added.
- **Dark Interface:** Do not claim. The intentional Golden Hour palette is light/atmospheric rather than a separate dark appearance.
- **Captions / Audio Descriptions:** Not applicable; the app has no required video or audio content.
