// MobileRatingScreen - Standalone page for QR code ratings
// This is what opens when someone scans the QR code on mobile
// Route: /rate/:serviceId
// Works WITHOUT login — anyone can rate anonymously

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function StarRating({ label, value, onChange, readonly = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '10px 0',
      borderBottom: '1px solid #F0F4F0'
    }}>
      <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => !readonly && onChange(star)}
            style={{
              background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer',
              fontSize: 24, padding: 2,
              color: star <= value ? '#f59e0b' : '#D1D5DB',
              transition: 'color 0.15s, transform 0.1s',
              transform: !readonly && star <= value ? 'scale(1.15)' : 'scale(1)'
            }}
          >★</button>
        ))}
      </div>
    </div>
  );
}

export default function MobileRatingScreen() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [subRatings, setSubRatings] = useState({
    cleanliness: 0,
    availability: 0,
    safety: 0,
    maintenance: 0
  });
  const [feedback, setFeedback] = useState('');

  // Category icons
  const categoryEmojis = {
    'Public Toilet': '🚻',
    'Water Supply': '💧',
    'Waste Collection': '🗑️',
    'Public Transport': '🚌',
    'Park & Garden': '🌳',
    'Street Light': '💡',
    'Govt Hospital': '🏥',
    'Govt Office': '🏛️'
  };

  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        const data = await response.json();
        
        if (data.success) {
          setService(data.data);
        } else {
          setError(data.message || 'Service not found');
        }
      } catch (err) {
        console.error('Failed to load service:', err);
        setError('Failed to load service. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/services/${serviceId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          subRatings,
          feedback,
          scannedViaQR: true,
          isAnonymous: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC, #E2E8F0)',
        fontFamily: "'Inter', 'Nunito', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, marginBottom: 16,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>⏳</div>
          <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>
            Loading service...
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Error state (service not found)
  if (error && !service) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFF5F5, #FED7D7)',
        padding: 24,
        fontFamily: "'Inter', 'Nunito', sans-serif"
      }}>
        <div style={{ 
          textAlign: 'center', maxWidth: 320,
          background: '#fff', borderRadius: 24,
          padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <div style={{ 
            fontWeight: 700, fontSize: 20, 
            color: '#DC2626', marginBottom: 12 
          }}>
            Service Not Found
          </div>
          <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
            The service ID "{serviceId}" is invalid or the service no longer exists.
          </div>
          <div style={{ 
            fontSize: 12, color: '#64748b',
            background: '#F8FAFC', padding: '12px 16px',
            borderRadius: 10
          }}>
            Please scan a valid QR code or contact the service administrator.
          </div>
        </div>
      </div>
    );
  }

  // Success state (rating submitted)
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0D4F44, #1a7a6e)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, color: '#fff', textAlign: 'center',
        fontFamily: "'Inter', 'Nunito', sans-serif"
      }}>
        <div style={{ 
          fontSize: 80, marginBottom: 24,
          animation: 'bounceIn 0.6s ease-out'
        }}>🎉</div>
        
        <div style={{
          fontWeight: 800, fontSize: 28,
          marginBottom: 12, letterSpacing: '-0.02em'
        }}>
          Thank You!
        </div>
        
        <div style={{ 
          fontSize: 16, opacity: 0.85, marginBottom: 28,
          maxWidth: 280, lineHeight: 1.5
        }}>
          Your feedback helps improve public services in your city
        </div>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '24px 32px',
          marginBottom: 32, backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
            You rated
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
            {service?.name}
          </div>
          <div style={{ fontSize: 32, letterSpacing: 4 }}>
            {'★'.repeat(overallRating)}{'☆'.repeat(5 - overallRating)}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(74,222,128,0.15)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: 14, padding: '14px 24px',
          fontSize: 13, color: '#4ade80', fontWeight: 600
        }}>
          🇮🇳 PRAJA — प्रजा · Citizen Grievance Portal
        </div>
        
        <style>{`
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Main rating form
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: "'Inter', 'Nunito', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0D4F44, #1a7a6e)',
        padding: '28px 20px 36px',
        color: '#fff'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(74,222,128,0.2)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 14
        }}>
          <div style={{ 
            width: 8, height: 8, borderRadius: '50%', 
            background: '#4ade80',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <span style={{ 
            fontSize: 11, fontWeight: 700, 
            letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>
            QR RATING
          </span>
        </div>
        
        <div style={{ fontSize: 28, marginBottom: 8, fontWeight: 700 }}>
          {categoryEmojis[service?.category] || '📍'} {service?.name}
        </div>
        
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          📍 {service?.address}, {service?.city}
        </div>
        
        {service?.totalRatings > 0 && (
          <div style={{
            marginTop: 14,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '8px 14px', fontSize: 13
          }}>
            <span>⭐ {service?.averageRating}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ opacity: 0.8 }}>{service?.totalRatings} ratings</span>
          </div>
        )}
        
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>

      {/* Rating Form */}
      <div style={{ padding: '24px 20px 120px' }}>

        {/* Overall Rating Card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          padding: 24, marginBottom: 18,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #F0F4F0', textAlign: 'center'
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#9ca3af',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 18
          }}>
            Overall Rating *
          </div>
          
          <div style={{ 
            display: 'flex', justifyContent: 'center', 
            gap: 10, marginBottom: 12 
          }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setOverallRating(star)}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 48, padding: 4,
                  color: star <= overallRating ? '#f59e0b' : '#E5E7EB',
                  transition: 'all 0.2s ease',
                  transform: star <= overallRating ? 'scale(1.15)' : 'scale(1)'
                }}
              >★</button>
            ))}
          </div>
          
          {overallRating > 0 && (
            <div style={{ 
              fontSize: 14, fontWeight: 600, color: '#0D4F44',
              animation: 'fadeIn 0.3s ease'
            }}>
              {['', '😞 Poor', '😐 Fair', '🙂 Good', '😊 Very Good', '🤩 Excellent'][overallRating]}
            </div>
          )}
        </div>

        {/* Sub Ratings Card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          padding: '18px 22px', marginBottom: 18,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #F0F4F0'
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#9ca3af',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 14
          }}>
            Rate Specific Aspects (Optional)
          </div>
          
          <StarRating
            label="🧹 Cleanliness"
            value={subRatings.cleanliness}
            onChange={v => setSubRatings(p => ({ ...p, cleanliness: v }))}
          />
          <StarRating
            label="✅ Availability"
            value={subRatings.availability}
            onChange={v => setSubRatings(p => ({ ...p, availability: v }))}
          />
          <StarRating
            label="🛡️ Safety"
            value={subRatings.safety}
            onChange={v => setSubRatings(p => ({ ...p, safety: v }))}
          />
          <StarRating
            label="🔧 Maintenance"
            value={subRatings.maintenance}
            onChange={v => setSubRatings(p => ({ ...p, maintenance: v }))}
          />
        </div>

        {/* Feedback Card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          padding: '18px 22px', marginBottom: 28,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #F0F4F0'
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#9ca3af',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 12
          }}>
            Additional Feedback (Optional)
          </div>
          
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Share your experience, suggestions, or concerns..."
            maxLength={500}
            style={{
              width: '100%', height: 110,
              border: '2px solid #E8EDF0', borderRadius: 12,
              padding: '12px 16px', fontSize: 15,
              fontFamily: "'Inter', 'Nunito', sans-serif",
              resize: 'none', outline: 'none',
              color: '#374151', boxSizing: 'border-box',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={e => e.target.style.borderColor = '#0D4F44'}
            onBlur={e => e.target.style.borderColor = '#E8EDF0'}
          />
          
          <div style={{ 
            textAlign: 'right', fontSize: 11, 
            color: '#9ca3af', marginTop: 6 
          }}>
            {feedback.length}/500
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#FFF5F5', border: '1px solid #FED7D7',
            borderRadius: 12, padding: '14px 18px',
            color: '#C53030', fontSize: 14, marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={overallRating === 0 || submitting}
          style={{
            width: '100%', padding: '18px',
            background: overallRating > 0
              ? 'linear-gradient(135deg, #0D4F44, #1a7a6e)'
              : '#E8EDF0',
            color: overallRating > 0 ? '#fff' : '#9ca3af',
            border: 'none', borderRadius: 16,
            fontSize: 17, fontWeight: 700,
            cursor: overallRating > 0 && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: overallRating > 0
              ? '0 8px 24px rgba(13,79,68,0.35)'
              : 'none',
            transition: 'all 0.25s ease',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? '⏳ Submitting...' : '⭐ Submit Rating'}
        </button>

        {/* PRAJA Branding */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            Powered by
          </div>
          <div style={{
            fontSize: 15, fontWeight: 800,
            color: '#0D4F44', marginBottom: 4
          }}>
            PRAJA — प्रजा
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            Citizen Grievance Portal · Digital India 🇮🇳
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
