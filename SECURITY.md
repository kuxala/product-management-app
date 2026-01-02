# Security Documentation

This document outlines the security measures implemented in the Project Management System.

## Security Checklist

### Authentication & Authorization

- [x] **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
- [x] **JWT Authentication**: Access tokens expire in 15 minutes
- [x] **Refresh Tokens**: Refresh tokens expire in 7 days
- [x] **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
- [x] **Protected Routes**: Frontend routes require authentication
- [x] **API Guards**: All endpoints except auth are protected by default

### Authorization Checks

- [x] **Project Access**: Non-members receive 403 Forbidden
- [x] **Owner Privileges**: Only owners can edit/delete projects
- [x] **Member Privileges**: Members can view and create tasks
- [x] **Task Deletion**: Only project owners can delete tasks
- [x] **Member Management**: Only owners can add/remove members
- [x] **Owner Protection**: Project owner cannot be removed from members

### Data Validation

- [x] **Input Validation**: class-validator validates all DTOs
- [x] **Whitelist**: ValidationPipe with whitelist removes unknown properties
- [x] **Transform**: Auto-transform incoming data types
- [x] **Email Validation**: Email format validated on registration
- [x] **Password Requirements**: Minimum length enforced (update as needed)

### Database Security

- [x] **Parameterized Queries**: Prisma prevents SQL injection
- [x] **Cascade Deletes**: Proper cleanup of related records
- [x] **Unique Constraints**: Email uniqueness enforced
- [x] **Foreign Keys**: Referential integrity maintained

## Security Best Practices Implemented

### Backend

1. **Password Security**
   ```typescript
   // Hashing with bcrypt (12 rounds)
   await bcrypt.hash(password, 12)
   ```

2. **JWT Configuration**
   ```typescript
   // Access token: 15 minutes
   // Refresh token: 7 days
   ```

3. **CORS Configuration**
   ```typescript
   // Configured to allow frontend origin only
   app.enableCors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
   })
   ```

4. **Global Guards**
   ```typescript
   // JWT guard applied globally with @Public() decorator for exceptions
   { provide: APP_GUARD, useClass: JwtAuthGuard }
   ```

5. **Role-Based Guards**
   - `ProjectMemberGuard`: Ensures user is owner or member
   - `ProjectOwnerGuard`: Ensures user is the owner

### Frontend

1. **Token Management**
   - Automatic token refresh on 401
   - Tokens cleared on logout
   - Redirect to login when unauthorized

2. **Protected Routes**
   - Authentication check before rendering
   - Loading state during auth verification

3. **Error Handling**
   - Graceful error messages
   - No sensitive data in error responses

## Security Recommendations for Production

### Critical (Must Implement)

1. **Environment Variables**
   - Use strong, random JWT secrets (at least 32 characters)
   - Never commit `.env` files
   - Use different secrets for development/production

2. **HTTPS**
   - Always use HTTPS in production
   - Enable HSTS headers
   - Secure cookie flags

3. **Rate Limiting**
   ```bash
   npm install @nestjs/throttler
   ```
   - Implement rate limiting on auth endpoints
   - Prevent brute force attacks

4. **CORS**
   - Configure specific allowed origins
   - Don't use wildcard (*) in production

### Recommended

5. **HttpOnly Cookies**
   - Store tokens in httpOnly cookies instead of localStorage
   - Prevents XSS attacks from stealing tokens

6. **CSRF Protection**
   - Implement CSRF tokens for state-changing operations
   - Use SameSite cookie attribute

7. **Password Requirements**
   - Minimum 8 characters
   - Require mix of uppercase, lowercase, numbers, symbols
   - Implement password strength meter

8. **Account Security**
   - Email verification on registration
   - Password reset functionality
   - Account lockout after failed attempts
   - Two-factor authentication (2FA)

9. **Logging & Monitoring**
   - Log authentication attempts
   - Monitor suspicious activities
   - Set up alerts for security events

10. **Database**
    - Use database user with minimal permissions
    - Enable SSL connections
    - Regular backups
    - Encrypt sensitive data at rest

### Nice to Have

11. **Content Security Policy**
    ```typescript
    app.use(helmet())
    ```

12. **Security Headers**
    - X-Content-Type-Options
    - X-Frame-Options
    - X-XSS-Protection

13. **Input Sanitization**
    - Sanitize HTML input
    - Prevent XSS attacks

14. **Dependency Security**
    ```bash
    yarn audit
    npm audit fix
    ```

15. **Session Management**
    - Implement session timeout
    - Allow users to view/revoke active sessions
    - Logout from all devices

## Vulnerability Testing

### Manual Tests

1. **SQL Injection**: Verify Prisma prevents injection
2. **XSS**: Test script injection in inputs
3. **CSRF**: Test state-changing operations
4. **Broken Authentication**: Test with expired/invalid tokens
5. **Sensitive Data Exposure**: Check API responses for sensitive info
6. **Broken Access Control**: Test unauthorized access attempts

### Tools

```bash
# Security audit
yarn audit

# OWASP ZAP (for penetration testing)
# Burp Suite (for security testing)
# npm packages security scan
npm install -g snyk
snyk test
```

## Common Attack Vectors & Mitigations

| Attack | Current Mitigation | Additional Steps |
|--------|-------------------|------------------|
| SQL Injection | Prisma ORM | ✅ Implemented |
| XSS | React escapes by default | Add CSP headers |
| CSRF | SameSite cookies | Add CSRF tokens |
| Brute Force | None | Add rate limiting |
| Token Theft | Short expiry | HttpOnly cookies |
| Session Hijacking | JWT validation | IP binding (optional) |

## Security Update Policy

1. **Dependencies**: Update monthly or when vulnerabilities discovered
2. **Security Patches**: Apply immediately
3. **Node.js**: Keep on LTS version
4. **Database**: Follow PostgreSQL security advisories

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: security@yourcompany.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Compliance Considerations

For production deployment, consider:

- **GDPR**: User data privacy and right to deletion
- **CCPA**: California Consumer Privacy Act
- **SOC 2**: Security controls and compliance
- **HIPAA**: If handling health data
- **PCI DSS**: If handling payment data

## Security Checklist for Deployment

- [ ] Change all default secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up logging
- [ ] Enable database SSL
- [ ] Use environment variables
- [ ] Implement monitoring
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Use secret management service (AWS Secrets Manager, etc.)
- [ ] Enable security headers
- [ ] Implement WAF (Web Application Firewall)
- [ ] Set up intrusion detection

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
