# Security Configuration

This document describes the security measures implemented in this application.

## Security Headers

The application implements comprehensive HTTP security headers to protect against common web vulnerabilities and satisfy corporate security scanner requirements.

### Headers Implemented

#### 1. Content-Security-Policy (CSP)
**Purpose**: Prevents Cross-Site Scripting (XSS), clickjacking, and code injection attacks

**Configuration**:
- `default-src 'self'` - Only load resources from same origin by default
- `script-src 'self' 'unsafe-eval' 'unsafe-inline'` - Required for Next.js functionality
- `style-src 'self' 'unsafe-inline'` - Required for Tailwind CSS
- `img-src 'self' data: https:` - Allow images from same origin, data URLs, and HTTPS sources
- `font-src 'self' data:` - Allow fonts from same origin and data URLs
- `connect-src 'self' https://*.amazonaws.com` - Allow API calls to AWS services
- `frame-ancestors 'none'` - Prevent embedding in iframes (clickjacking protection)
- `base-uri 'self'` - Restrict base URL to prevent base tag injection
- `form-action 'self'` - Only allow form submissions to same origin
- `upgrade-insecure-requests` - Automatically upgrade HTTP requests to HTTPS

#### 2. X-Frame-Options
**Purpose**: Prevents clickjacking attacks

**Configuration**: `DENY` - Site cannot be embedded in any iframe

#### 3. X-Content-Type-Options
**Purpose**: Prevents MIME type sniffing

**Configuration**: `nosniff` - Browsers must respect declared content types

#### 4. Referrer-Policy
**Purpose**: Controls what referrer information is sent with requests

**Configuration**: `strict-origin-when-cross-origin` - Send full URL for same-origin, only origin for cross-origin HTTPS, nothing for HTTP

#### 5. Permissions-Policy
**Purpose**: Disables unnecessary browser features to reduce attack surface

**Configuration**:
- `camera=()` - Disable camera access
- `microphone=()` - Disable microphone access
- `geolocation=()` - Disable geolocation
- `interest-cohort=()` - Disable FLoC tracking

#### 6. Strict-Transport-Security (HSTS)
**Purpose**: Forces HTTPS connections for enhanced security

**Configuration**: `max-age=31536000; includeSubDomains; preload`
- Forces HTTPS for 1 year
- Applies to all subdomains
- Eligible for browser preload list

#### 7. X-XSS-Protection
**Purpose**: Legacy XSS protection (for older browsers)

**Configuration**: `1; mode=block` - Enable XSS filtering and block rendering if attack detected

## Security Audit Results

**Last Audit**: 2025-11-18

**Findings**:
- ✅ No malicious code patterns detected
- ✅ No npm vulnerabilities (all fixed)
- ✅ Clean git history
- ✅ No suspicious dependencies
- ✅ 96%+ test coverage
- ✅ No public security warnings for thrivecalc.com

**Tools Used**:
- npm audit
- ripgrep code scanning
- Manual code review
- Web security scanners

## Development Notes

### Testing Security Headers Locally

To test security headers locally:

```bash
npm run dev
# Visit http://localhost:3000
# Open DevTools → Network → Select any request → Headers tab
# Verify Response Headers section shows all security headers
```

### CSP Considerations

The current CSP allows `unsafe-inline` and `unsafe-eval` for compatibility with:
- Next.js dynamic imports and code splitting
- Tailwind CSS inline styles
- React hydration

**Future Enhancement**: Implement CSP with nonces for stricter inline script/style control.

### HSTS Considerations

HSTS is configured for production HTTPS environments. If testing locally with HTTP:
- Browser warnings about HSTS are expected
- HSTS only activates on HTTPS connections
- Clear browser HSTS cache if needed: `chrome://net-internals/#hsts`

## Compliance

These security headers help achieve compliance with:
- **OWASP Top 10** - Protection against XSS, clickjacking, injection attacks
- **PCI DSS** - Secure transmission and data protection requirements
- **SOC 2** - Information security controls
- **Corporate Security Policies** - Satisfies most enterprise security scanner requirements

## Reporting Security Issues

If you discover a security vulnerability, please email: [your-security-email]

**Do not** open public GitHub issues for security vulnerabilities.

## Additional Security Measures

Beyond HTTP headers, this application implements:
- **Authentication**: NextAuth.js with AWS Cognito
- **Authorization**: Server-side session validation
- **Input Validation**: Comprehensive validation on all API endpoints
- **SQL Injection Protection**: Parameterized queries via AWS SDK
- **XSS Protection**: React auto-escaping + CSP headers
- **CSRF Protection**: Built into NextAuth.js
- **Rate Limiting**: Implemented at AWS API Gateway level
- **Encryption**: TLS 1.2+ for all connections
- **Secrets Management**: AWS Secrets Manager for sensitive data

## Maintenance

Security headers should be reviewed and updated:
- **Quarterly**: Review CSP directives and tighten if possible
- **After major updates**: Verify headers still work with new Next.js/React versions
- **When adding new features**: Update CSP if new external resources are needed

Last Updated: 2025-11-18
