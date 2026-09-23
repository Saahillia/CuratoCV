/**
 * Tests for CuratoCV email rendering and sending functionality.
 */
import { describe, it, expect } from 'vitest';
import { renderEmail, escapeHtml } from '../platform/backend/src/emails/emailRenderer.js';
import emailService from '../platform/backend/src/services/emailService.js';
import { EMAIL_TYPES } from "../platform/backend/src/constants/email.js";

describe('Email renderer utilities', () => {
    describe('escapeHtml', () => {
        it('should escape HTML special characters', () => {
            const input = '<script>alert("xss")</script>';
            const output = escapeHtml(input);
            expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        it('should handle null and undefined', () => {
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(undefined)).toBe('');
        });

        it('should escape quotes and apostrophes', () => {
            const input = 'Test "quote" and \'apostrophe\'';
            const output = escapeHtml(input);
            expect(output).toBe('Test &quot;quote&quot; and &#039;apostrophe&#039;');
        });
    });
});

describe('Email rendering', () => {
    describe('renderEmail function', () => {
        it('should render account welcome email', () => {
            const data = {
                userName: 'John Doe',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.WELCOME, data);

            if (!result.success) console.log('ERROR:', result.error);

            expect(result.success).toBe(true);
            expect(result.html).toContain('John Doe');
            expect(result.html).toContain('https://curatocv.com/dashboard');
            expect(result.subject).toBe('Welcome to CuratoCV!');
            expect(result.text).toBeDefined();
            expect(result.text).toContain('John Doe');
        });

        it('should render email verification email', () => {
            const data = {
                userName: 'Jane Smith',
                verifyUrl: 'https://curatocv.com/verify/456',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.VERIFY_EMAIL, data);

            expect(result.success).toBe(true);
            expect(result.html).toContain('Jane Smith');
            expect(result.html).toContain('https://curatocv.com/verify/456');
            expect(result.subject).toContain('Verify');
        });

        it('should render password reset email', () => {
            const data = {
                userName: 'Bob Johnson',
                resetUrl: 'https://curatocv.com/reset/789',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.PASSWORD_RESET, data);

            expect(result.success).toBe(true);
            expect(result.html).toContain('Bob Johnson');
            expect(result.html).toContain('https://curatocv.com/reset/789');
            expect(result.subject).toContain('Reset');
        });

        it('should render email with HTML escaping', () => {
            const data = {
                userName: 'Alice <script>alert("xss")</script>',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.WELCOME, data);

            expect(result.success).toBe(true);
            expect(result.html).toContain('Alice &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        it('should render billing order confirmation', () => {
            const data = {
                userEmail: 'user@example.com',
                orderId: 'ORD-12345',
                planName: 'Pro Plan',
                billingPeriod: 'monthly',
                amountMinor: 2999,
                currency: 'INR',
                renewalDate: '2024-12-01',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.ORDER_CONFIRMATION, data);

            expect(result.success).toBe(true);
            expect(result.html).toContain('ORD-12345');
            expect(result.html).toContain('Pro Plan');
            expect(result.subject).toContain('Order Confirmation');
        });

        it('should render subscription active email', () => {
            const data = {
                userEmail: 'user@example.com',
                planName: 'PRO_PLUS',
                resumeLimit: 100,
                aiCredits: 5000,
                startDate: '2024-08-01',
                endDate: '2025-08-01',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.SUBSCRIPTION_ACTIVE, data);

            expect(result.success).toBe(true);
            expect(result.html).toContain('PRO_PLUS');
            expect(result.subject).toContain('Subscription is Active');
        });

        it('should render payment failed email', () => {
            const data = {
                userEmail: 'user@example.com',
                orderId: 'ORD-67890',
                reason: 'Card declined',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.PAYMENT_FAILED, data);

            expect(result.success).toBe(true);
            expect(result.html).toContain('ORD-67890');
            expect(result.html).toContain('Card declined');
            expect(result.subject).toContain('Payment Failed');
        });

        it('should render resume related emails', () => {
            const data = {
                userName: 'Tom Wilson',
                resumeName: 'Software Engineer Resume',
                publicUrl: 'https://curatocv.com/resume/abc123',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.RESUME_PUBLISHED, data);
            expect(result.success).toBe(true);
            expect(result.html).toContain('Tom Wilson');
            expect(result.html).toContain('Software Engineer Resume');

            const unpublishedData = { ...data };
            const unpublishedResult = renderEmail(EMAIL_TYPES.RESUME_UNPUBLISHED, unpublishedData);
            expect(unpublishedResult.success).toBe(true);
            expect(unpublishedResult.html).toContain('unpublished');

            const sharedData = {
                userName: 'Tom Wilson',
                resumeName: 'Software Engineer Resume',
                recipientEmail: 'recruiter@company.com',
                shareUrl: 'abc123',
                appUrl: 'https://curatocv.com',
            };
            const sharedResult = renderEmail(EMAIL_TYPES.RESUME_SHARED, sharedData);
            expect(sharedResult.success).toBe(true);
            expect(sharedResult.html).toContain('recruiter@company.com');

            const deletedData = { userName: 'Tom Wilson', resumeName: 'Software Engineer Resume' };
            const deletedResult = renderEmail(EMAIL_TYPES.RESUME_DELETED, deletedData);
            expect(deletedResult.success).toBe(true);
            expect(deletedResult.html).toContain('permanently deleted');
        });

        it('should handle unsupported email type', () => {
            const result = renderEmail('UNSUPPORTED_TYPE', {});
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unsupported email type');
        });

        it('should wrap content in base template for simple component templates', () => {
            const data = {
                userName: 'Test User',
                appUrl: 'https://curatocv.com',
            };

            const result = renderEmail(EMAIL_TYPES.WELCOME, data);
            expect(result.success).toBe(true);
            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.html).toContain('<head>');
            expect(result.html).toContain('CuratoCV');
        });
    });
});

describe('Email masking', () => {
    it('should mask email addresses correctly', () => {
        expect(emailService.maskEmail('john.doe@example.com')).toBe('jo***@example.com');
        expect(emailService.maskEmail('a@example.com')).toBe('a@example.com');
        expect(emailService.maskEmail('ab@example.com')).toBe('ab@example.com');
        expect(emailService.maskEmail('abc@example.com')).toBe('ab***@example.com');
        expect(emailService.maskEmail('')).toBe('[unknown]');
        expect(emailService.maskEmail(null)).toBe('[unknown]');
        expect(emailService.maskEmail(undefined)).toBe('[unknown]');
        expect(emailService.maskEmail('invalid-email')).toBe('[invalid]');
        expect(emailService.maskEmail('@example.com')).toBe('[invalid]');
        expect(emailService.maskEmail('user@')).toBe('[invalid]');
    });
});

describe('Email type coverage', () => {
    const testEmailTypes = Object.values(EMAIL_TYPES);

    testEmailTypes.forEach(emailType => {
        it(`should render ${emailType} email without error`, () => {
            const result = renderEmail(emailType, { userName: 'Test User' });
            expect(result.success).toBe(true);
            expect(result.html).toBeDefined();
            expect(result.subject).toBeDefined();
        });
    });
});
