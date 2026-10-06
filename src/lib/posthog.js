import posthog from 'posthog-js'

const token = import.meta.env.VITE_POSTHOG_KEY?.trim()

if (token) {
  posthog.init(token, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    disable_session_recording: true,
    before_send: (event) => {
      if (!event) return null
      event.properties = { ...event.properties, app: 'vibe-check' }
      return event
    },
  })
}

export default posthog
