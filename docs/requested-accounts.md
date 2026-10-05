# Requested test accounts

These accounts were provisioned on the configured `ksitmcareers` Neon database on 4 October 2026. The provisioning is idempotent and updates only these exact email identities.

| Identity                             | Role          | Dashboard    |
| ------------------------------------ | ------------- | ------------ |
| `student1@ksitmcareers.org.ng`       | `STUDENT`     | `/dashboard` |
| `careerofficer1@ksitmcareers.org.ng` | `STAFF`       | `/staff`     |
| `superadmin@ksitmcareers.org.ng`     | `SUPER_ADMIN` | `/admin`     |

Development password: `12345678`.

The application stores only scrypt password hashes. These credentials are suitable for the requested development/demo workflow and should be changed before any public production launch. The seed command accepts `SEED_PASSWORD` and `ACCOUNT_DOMAIN` environment overrides.
