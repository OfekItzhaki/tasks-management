# Rules for Antigravity

## Setup Reminders

- **SMTP**: The project's registration flow depends on 6-digit OTPs sent via email. Check if `SMTP_HOST` is configured.
- **Storage**: Profile pictures currently use local storage. Remind the user that for production, they will need a Cloud Storage provider (S3/Cloudinary) for persistence.
- **Action**: If these are missing or using placeholders, **remind the user** at the start of a session using the [SMTP_SETUP.md](../../todo-backend/SMTP_SETUP.md) guide.
