"use client";

import React, { useState, useEffect } from 'react';
import './DaoPresalePage.css';

const DaoPresalePage: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  const totalRaised = 0;
  const cap = 1000000;
  const progress = (totalRaised / cap) * 100;
  const targetDate = new Date('2025-07-01T16:27:00-03:00'); // 24 hours from 04:27 PM -03, June 30, 2025

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value >= 0 ? value : 0); // Prevent negative values
  };

  return (
    <div className="dao-container">
      <header className="dao-header" role="banner">
        <h1 className="dao-title" aria-label="Crypto UFOs DAO Presale">Crypto UFOs DAO PRESALE</h1>
        <WalletConnectButton />
      </header>
      <main className="dao-main" role="main">
        <aside className="dao-sidebar" aria-label="Presale Statistics">
          <LogoSection />
          <StatCard title="Total Raised" value={`$${totalRaised.toFixed(2)}`} />
          <StatCard title="Cap" value="TBA" />
        </aside>
        <section className="dao-content" aria-label="Presale Actions">
          <ContributionForm
            amount={amount}
            onAmountChange={handleAmountChange}
            receiveText={`You will receive ${amount} UFO tokens`}
          />
          <ProgressBar progress={progress} label="Funding Progress" />
          <ClaimButton timeLeft={<CountdownTimer targetDate={targetDate} />} />
        </section>
        <aside className="dao-info-panel" aria-label="Presale Information">
          <PresaleInfo status="Pre-TGE" phase="EARLY ALIENS" timeLeft={<CountdownTimer targetDate={targetDate} />} />
          <a href="#" className="dao-contract-link" target="_blank" rel="noopener noreferrer">View Contract</a>
        </aside>
      </main>
      <footer className="dao-footer">
        <p>© 2024 Crypto UFOs. All rights reserved.</p>
      </footer>
    </div>
  );
};

const WalletConnectButton: React.FC = () => (
  <button className="connect-wallet">CONNECT WALLET</button>
);

const LogoSection: React.FC = () => (
  <div className="logo-section">
    <div className="logo">$UFOS</div>
    <p className="logo-description">
      Mindblaze protocol on Solana. Social retention layer.
    </p>
  </div>
);

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
  <div className="stat-card" role="region" aria-labelledby={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <h3 id={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</h3>
    <p className="stat-value">{value}</p>
  </div>
);

interface ContributionFormProps {
  amount: number;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  receiveText: string;
}

const ContributionForm: React.FC<ContributionFormProps> = ({ amount, onAmountChange, receiveText }) => (
  <div className="contribution-form">
    <h2>Contribute to Presale</h2>
    <input
      type="number"
      placeholder="Amount (ETH)"
      value={amount}
      onChange={onAmountChange}
      className="dao-input"
      aria-label="Contribution amount in ETH"
    />
    <p className="receive-text">{receiveText}</p>
    <button className="dao-submit">SUBMIT CONTRIBUTION</button>
  </div>
);

interface ProgressBarProps {
  progress: number;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => (
  <div className="progress-bar" role="progressbar" aria-label={label} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
    <div className="progress" style={{ width: `${progress}%` }} />
  </div>
);

interface ClaimButtonProps {
  timeLeft: React.ReactNode;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({ timeLeft }) => (
  <button className="dao-claim" aria-label="Claim tokens">CLAIM TOKENS HERE</button>
);

interface PresaleInfoProps {
  status: string;
  phase: string;
  timeLeft: React.ReactNode;
}

const PresaleInfo: React.FC<PresaleInfoProps> = ({ status, phase, timeLeft }) => (
  <div className="presale-info">
    <h2>Presale Details</h2>
    <p>Status: {status}</p>
    <p>Phase: {phase}</p>
    <p>Claiming starts in: TBA</p>
  </div>
);

// Embedded CountdownTimer component with accessibility
const CountdownTimer: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span aria-live="polite">{timeLeft}</span>;
};

export default DaoPresalePage;