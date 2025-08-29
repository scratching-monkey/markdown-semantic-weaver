# Phase Workflow

This is the high level workflow for completing a phase in this project:

## Steps

1. Review the `docs/03_phased_implementation_plan.md` and review the phase.
2. Review the `docs/DS_*` files to review any details that are required to complete the phase.
3. Create an implementation plan for the phase.
4. For each task:
   - Implement the task, including tests.
   - Ensure it compiles.
   - Ensure the tests pass.
   - Check for opportunities to refactor using line number counts as a quick heuristic: `find src/ -type f -exec wc -l {} + | head -n -1 | awk '$1 > 100' | sort -nr`
   - Perform any refactorings
