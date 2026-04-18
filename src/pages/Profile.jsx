import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const plans = [
  {
    name: 'Starter',
    price: '$1',
    period: '/month',
    features: ['Up to 25 tasks', 'Basic progress tracking', 'Email support'],
    recommended: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    features: ['Unlimited tasks', 'Advanced filters', 'Priority support'],
    recommended: true,
  },
  {
    name: 'Team',
    price: '$19',
    period: '/month',
    features: ['Everything in Pro', 'Team collaboration', 'Shared dashboards'],
    recommended: false,
  },
];

const Profile = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [place, setPlace] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setProfileMessage(`🎉 ${plan.name} plan selected successfully!`);
  };

  const handleSaveAccount = () => {
    const message = `📍 Account details saved${place ? ` for ${place}` : ''}!`;
    setProfileMessage(message);
    window.alert(message);
  };

  return (
    <section className="profile-page">
      <div className="profile-card">
        <h1>Profile</h1>
        <p className="profile-subtitle">Your account details</p>

        <div className="profile-row">
          <span className="profile-label">Name</span>
          <span className="profile-value">{user?.name || 'N/A'}</span>
        </div>

        <div className="profile-row">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user?.email || 'N/A'}</span>
        </div>
      </div>

      <div className="plans-section">
        <h2>Plans</h2>
        <p className="plans-subtitle">Choose the right plan for your workflow.</p>
        {profileMessage && <div className="plan-notice">{profileMessage}</div>}

        <div className="plans-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan-card ${plan.recommended ? 'recommended' : ''}`}>
              {plan.recommended && <div className="plan-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <p className="plan-price">
                {plan.price}
                <span>{plan.period}</span>
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>✨ {feature}</li>
                ))}
              </ul>
              <button type="button" className="plan-btn" onClick={() => handleChoosePlan(plan)}>
                Choose {plan.name}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="account-place-section">
        <h2>Account & Place</h2>
        <div className="account-grid">
          <div className="account-item">
            <span className="account-label">Account Name</span>
            <strong>{user?.name || 'N/A'}</strong>
          </div>
          <div className="account-item">
            <span className="account-label">Account Email</span>
            <strong>{user?.email || 'N/A'}</strong>
          </div>
          <div className="account-item">
            <span className="account-label">Selected Plan</span>
            <strong>{selectedPlan?.name || 'No plan selected yet'}</strong>
          </div>
        </div>

        <div className="place-row">
          <label htmlFor="place">Place</label>
          <input
            id="place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Enter your city/place"
          />
          <button type="button" className="plan-btn" onClick={handleSaveAccount}>
            Save Account
          </button>
        </div>
      </div>
    </section>
  );
};

export default Profile;
