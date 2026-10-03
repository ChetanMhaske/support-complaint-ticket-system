-- ====================================================================
-- Support / Complaint Ticket System - Initial Seed Data
-- ====================================================================

INSERT INTO tickets (title, category, description, priority, status, resolution_note, created_at, updated_at)
VALUES
(
    'Unable to process invoice payment for March',
    'Billing & Payments',
    'Payment gateway throws error 502 Bad Gateway whenever credit card details are submitted during checkout.',
    'High',
    'Open',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),
(
    'Dashboard analytics graph rendering error',
    'Technical Issue',
    'The monthly revenue chart on the analytics dashboard fails to display on Firefox browsers version 128+.',
    'Medium',
    'In Progress',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),
(
    'Two-factor authentication SMS delayed',
    'Account & Security',
    'OTP SMS verification codes are taking upwards of 15 minutes to arrive on Vodafone numbers.',
    'High',
    'In Progress',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '4 hours'
),
(
    'Export to CSV feature request for tickets',
    'Feature Request',
    'Would like to be able to export filtered support tickets to CSV format directly from the listing view.',
    'Low',
    'Open',
    NULL,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
),
(
    'Update company registered billing address',
    'Billing & Payments',
    'Need to change legal entity billing address from old office to new commercial center address.',
    'Low',
    'Resolved',
    'Updated billing profile in accounting database and verified on the customer invoice portal.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
);
