# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email or through GitHub's private vulnerability reporting feature.

### How to Report

1. **Email**: Send details to [security@example.com](mailto:security@example.com)
2. **GitHub**: Use the [private vulnerability reporting](https://github.com/YOUR_USERNAME/gantt-chart-planner/security/advisories/new) feature

### What to Include

Please include the following information:

- Type of vulnerability (e.g., buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (depending on complexity)

### What to Expect

1. **Acknowledgment**: We'll confirm receipt of your report
2. **Assessment**: We'll evaluate the vulnerability and its impact
3. **Fix Development**: We'll work on a fix
4. **Disclosure**: We'll coordinate disclosure with you
5. **Credit**: We'll credit you in the security advisory (unless you prefer anonymity)

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Use Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as a template
   - Rotate keys regularly

3. **Supabase Security**
   - Enable Row Level Security (RLS)
   - Use strong passwords
   - Implement proper authentication
   - Regular security audits

4. **Browser Security**
   - Keep browser updated
   - Use HTTPS in production
   - Implement Content Security Policy (CSP)

### For Developers

1. **Code Review**
   - All PRs require review
   - Security-focused review for sensitive areas
   - Automated security scanning

2. **Dependencies**
   - Regular `npm audit` checks
   - Automated dependency updates (Dependabot)
   - Pin dependency versions

3. **Secrets Management**
   - Never hardcode secrets
   - Use environment variables
   - Use secret scanning tools
   - Rotate secrets regularly

4. **Testing**
   - Security test cases
   - Penetration testing (periodic)
   - OWASP Top 10 awareness

## Security Features

### Current Security Measures

- ✅ Environment variable protection
- ✅ TypeScript type safety
- ✅ Input validation
- ✅ XSS prevention (React's built-in protection)
- ✅ SQL injection prevention (Supabase parameterized queries)
- ✅ CORS configuration
- ✅ HTTPS enforcement (production)

### Planned Security Enhancements

- [ ] Content Security Policy (CSP) headers
- [ ] Rate limiting
- [ ] Two-factor authentication
- [ ] Audit logging
- [ ] Automated security scanning in CI/CD
- [ ] Dependency vulnerability scanning
- [ ] Security headers (X-Frame-Options, etc.)

## Third-Party Services

### Supabase

- SOC 2 Type 2 compliant
- GDPR compliant
- Data encryption at rest and in transit
- Regular security audits
- [Security documentation](https://supabase.com/docs/guides/security)

### GitHub

- Private vulnerability reporting
- Dependabot security updates
- Code scanning with CodeQL
- Secret scanning

## Compliance

- **GDPR**: Data processing in compliance with GDPR
- **CCPA**: California Consumer Privacy Act compliant
- **SOC 2**: Working towards SOC 2 compliance (via Supabase)

## Security Contacts

- **Primary**: security@example.com
- **Secondary**: [GitHub Security Advisories](https://github.com/YOUR_USERNAME/gantt-chart-planner/security)

## Responsible Disclosure

We follow responsible disclosure practices:

1. Report the vulnerability privately
2. Allow reasonable time for fix
3. Coordinate disclosure timeline
4. Credit researchers (with permission)

## Bug Bounty

Currently, we do not have a bug bounty program. However, we deeply appreciate responsible security research and will credit contributors in our security advisories.

## Security Updates

Security updates will be:

- Announced in release notes
- Tagged with `[SECURITY]` in commit messages
- Published as GitHub Security Advisories
- Sent to registered users (if applicable)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html)
- [Supabase Security Guide](https://supabase.com/docs/guides/security)
- [React Security](https://reactjs.org/docs/security.html)

---

Thank you for helping keep Gantt Chart Planner secure! 🔒
