# Design Decisions
- **Async queue, not inline grading:** avoids timeouts at deadline peaks.
- **Cron over a worker:** no extra server cost; 2-min latency is acceptable.
- **Two-step AI:** Flash-Lite gives structured JSON; Flash grades from it (consistency).
- **RLS:** students see only their own rows; faculty see the whole class.
- **Retries:** rate-limited jobs stay `pending`, so no student work is lost.
## Open questions
- [ ] Max file size / page limit?
- [ ] AI score override audit trail?