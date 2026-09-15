# Security policy

Report suspected vulnerabilities privately to **support@cadencea.app** with `SECURITY` at the start of the subject. Do not open a public issue or include credentials, signed URLs, personal data, or private project files in the first message. Use only accounts and synthetic data you own.

Security fixes are supported for the current production deployment and the current `main` release line. Reproduce against that version before reporting an issue that may already be fixed.

Never commit service-role keys, database credentials, SMTP credentials, Sentry tokens, newsletter signing secrets, or copied production environment files. Use the deployment secret manager, redact logs and screenshots, and rotate a credential before cleaning repository history if exposure is suspected.

The system-wide reporting and incident procedure is maintained in the Cadencea documentation repository under `SECURITY.md` and `security/INCIDENT-RESPONSE-AND-KEY-ROTATION.md`.
