import React from 'react';
import '../style/Footer.css';
import { FaTwitter, FaDiscord } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-text">© Copyright 2025 AINIME</span>
        <div className="footer-socials">
          <a
            href="https://twitter.com" // Placeholder, ubah sesuai kebutuhan
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            aria-label="Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href="https://discord.com" // Placeholder, ubah sesuai kebutuhan
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            aria-label="Discord"
          >
            <FaDiscord />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;