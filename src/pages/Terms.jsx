import React from "react";
import LegalPage from "@/features/shell/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="September 29, 2026">
      <p>Vibe Check helps you record personal reflections and explore patterns. By using the app, you agree to use it lawfully and to keep your account credentials secure. You must be 18 or older to create an account.</p>

      <h2>Reflection and entertainment only</h2>
      <p>Scores, patterns, tarot, astrology, numerology, and symbolic readings are provided for personal reflection and entertainment. They are not medical, psychological, legal, financial, or other professional advice. Do not use the app for emergency decisions. If you are in danger or crisis, contact local emergency services or one of the free services on the <a className="touch-link underline" href="/support-now">Support now</a> page.</p>

      <h2>Reflective material</h2>
      <p>Patterns and symbolic interpretations may be incomplete or may not fit your experience. You decide what is useful. Cosmic profile fields that require specialist chart calculations must be entered or verified by you; unknown placements remain open.</p>

      <h2>Your content</h2>
      <p>You keep ownership of the content you enter. You give Vibe Check permission to process and store it only as needed to provide the app. Avoid entering another person's sensitive information without their permission.</p>

      <h2>Availability</h2>
      <p>We work to keep the app reliable, but access may occasionally be interrupted. Features may change as the product develops. To the extent permitted by law, the service is provided without guarantees of a particular outcome.</p>

      <h2>Ending your account</h2>
      <p>You may stop using Vibe Check at any time and delete your account in Settings. These terms remain applicable to activity that occurred before deletion.</p>
    </LegalPage>
  );
}
