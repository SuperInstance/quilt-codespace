# TASKS.md — oracle claim board (git-agent convention)

Claim a row by appending a `claimed` line with your handle + lease timestamp.
The lease is the soft-joint version of quilt-in-git's FREEZE dial (dial 15):
while your lease is unexpired, siblings treat the row as frozen and pick
another. Stale leases (30 min) may be re-claimed by appending `re-claimed`.
Never delete rows — append-only, the board is the history.

| id  | task                                                | status   | owner           | lease until | notes |
|-----|-----------------------------------------------------|----------|-----------------|-------------|-------|
| T1  | ports doc drift in README (fixture, proof-of-loop)  | open     | —               | —           | safe first task for any new agent |
| T2  | wire oracle /ask into quilt-http-server /meta       | open     | —               | —           | sibling discovery gets a brain |
| T3  | swap oracle receipt emitter for quilt-in-git hooks  | open     | —               | —           | upgrade path documented in ORACLE.md |
