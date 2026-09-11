"When transitioning data layers to cloud databases (e.g. Supabase), always implement smart TTL caching with explicit mutation-driven invalidation to maintain seamless responsiveness across all device tiers."
"Always perform a live table row count audit and full production build verification before marking cloud integration tasks complete."

Strict Responsive Viewport Rule:
"All platform grids and tables must implement fallback horizontal scrolling or multi-row collapse for viewports under 640px to ensure zero clipping on mobile screens."

Deterministic State Invalidation:
"Whenever grading or panel assignments are mutated, invalidate stale cache immediately via targeted API re-fetch."

Audit Trail Logging:
"Every score override or panel reassignment made by the Administrator must log an immutable audit remark with timestamp."

Viewport Scroll Ergonomics: "Whenever accordions, dropdown detail views, or large cards expand, automatically scroll the expanded container to the center of the available viewport (accounting for fixed navbars) with smooth scrolling."

Network & Cache Strategy: "Do not use continuous background setInterval polling for data fetching. Use client-side caching (clientCache) for 0ms initial renders and trigger network fetches strictly on page load, user gestures, or explicit BroadcastChannel events."

PostgREST Query Strategy: "Always use explicit column projections in Supabase queries (avoid raw select('*')) and handle real-time data flow using Supabase Realtime WebSocket channels rather than client-side polling intervals."

