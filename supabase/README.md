# Database migrations

Cadencea API is the sole owner of the shared Supabase schema. Apply migrations only from `cadencea-api/supabase/migrations`, in filename order, using the protected deployment workflow.

This Web repository intentionally contains no executable migration chain. The former copy drifted from the canonical schema and could reintroduce broad profile reads and mutable `SECURITY DEFINER` search paths. Do not copy or recreate API migrations here.

For a clean-environment security check, apply the API chain and verify that:

- anonymous and authenticated roles cannot select another user's private profile columns;
- profile discovery returns only the narrow public search projection;
- every `SECURITY DEFINER` function has a fixed `search_path` and explicit grants;
- newsletter rate-limit and audit functions reject anonymous and authenticated RPC calls.
