const fs = require('fs');

const content = fs.readFileSync('frontend/src/index.css', 'utf-8');
const lines = content.split('\n');

const goodLines = lines.slice(0, 778); // Keep up to line 777 (0-indexed 777 is line 778)
const newCss = `
/* Auth / Signup Page Styles */
.auth-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #09090b;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.auth-blob {
  position: absolute;
  filter: blur(100px);
  opacity: 0.5;
  animation: float 10s infinite ease-in-out alternate;
}

.blob-1 {
  background: #0284c7;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  top: -100px;
  left: -100px;
}

.blob-2 {
  background: #4f46e5;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  bottom: -150px;
  right: -100px;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 50px) scale(1.1); }
}

.auth-card {
  position: relative;
  z-index: 1;
  background: rgba(24, 24, 27, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo-bg {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #71717a;
  pointer-events: none;
}

.auth-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 16px 14px 44px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
}

.auth-input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.auth-input::placeholder {
  color: #71717a;
}

.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 8px 0;
  color: #52525b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-divider span {
  padding: 0 12px;
}

.auth-submit-btn {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
}

.auth-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5);
}

.auth-submit-btn:active {
  transform: translateY(0);
}

.auth-submit-btn.loading {
  opacity: 0.8;
  pointer-events: none;
}

.auth-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 14px;
  color: #a1a1aa;
}

.auth-link {
  color: #38bdf8;
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 500;
}

.auth-link:hover {
  color: #7dd3fc;
  text-decoration: underline;
}
`;

fs.writeFileSync('frontend/src/index.css', goodLines.join('\n') + newCss);
console.log('Fixed CSS successfully');
