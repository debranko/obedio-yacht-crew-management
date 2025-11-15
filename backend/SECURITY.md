# Security Configuration for OBEDIO Backend

## Critical Security Notice

**NEVER commit the `.env` file to version control!**

## Environment Variables Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Generate a secure JWT_SECRET:
   ```bash
   # On Linux/Mac:
   openssl rand -base64 64
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String((1..64|ForEach{[byte](Get-Random -Max 256)}))
   ```

3. Update the `.env` file with your actual values:
   - `JWT_SECRET` - Use the generated secure key
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `OPENAI_API_KEY` - Your OpenAI API key for voice transcription

## Security Best Practices

1. **JWT Token Security**
   - JWT_SECRET is properly loaded from environment variables
   - Tokens expire after 7 days
   - Always verify tokens on protected routes

2. **Database Security**
   - Use strong passwords for database users
   - Limit database user permissions to minimum required
   - Use SSL/TLS for database connections in production

3. **API Security**
   - CORS is configured to only allow specific origins
   - All sensitive operations require authentication
   - Input validation on all endpoints

4. **Production Deployment**
   - Use HTTPS only
   - Set NODE_ENV=production
   - Use environment-specific .env files
   - Rotate JWT_SECRET periodically
   - Monitor for suspicious activity

## Exposed Credentials Notice

If you accidentally commit sensitive data:
1. Immediately rotate all exposed credentials
2. Generate new JWT_SECRET
3. Update all API keys
4. Change database passwords
5. Remove the commit from history using git filter-branch or BFG