import React from 'react';

export default function AdminTerms() {
  return (
    <div className="admin-animate-fade" style={{ maxWidth: '900px' }}>
      <div className="admin-glass" style={{ padding: '32px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: '#000' }}>Administrative Terms & Conditions</h2>
        <p style={{ color: 'var(--admin-text-secondary)', marginBottom: '32px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
          Please read these terms carefully. By accessing the admin panel, you agree to these operational guidelines.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#000' }}>1. Confidentiality and Data Privacy</h3>
            <p style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
              As an administrator of NexRide, you have access to sensitive user data, system logs, and operational information. You are strictly prohibited from sharing, exporting, or disclosing any platform data to third parties without explicit authorization.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#000' }}>2. System Integrity and Privilege Usage</h3>
            <p style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
              Admin privileges are granted solely for managing the NexRide platform. Misuse of these privileges—including unauthorized data modification, approving fraudulent schedules, or attempting to circumvent security measures—will result in immediate termination of access.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#000' }}>3. Accountability and Audit Logging</h3>
            <p style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
              Every action performed within the admin panel is logged and monitored for security and compliance purposes. You are responsible for all actions taken under your administrative account. Do not share your login credentials with anyone.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#000' }}>4. Content Moderation</h3>
            <p style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
              When reviewing and approving bus schedules or managing places, ensure all information adheres to the platform's accuracy standards. Administrators must act impartially and must maintain the high quality of data provided to our users.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#000' }}>5. Location Information</h3>
            <p style={{ color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
              Location data collected during the reporting of buses or managing of routes must only be used to verify the accuracy of the platform's data. You are strictly prohibited from using this location information to track users or for any purpose outside of verifying transit schedules.
            </p>
          </section>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>Effective Date: June 6, 2026</p>
        </div>
      </div>
    </div>
  );
}
