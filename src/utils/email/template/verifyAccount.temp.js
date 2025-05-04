export const verifyAccountTempl = ({ otp, subject }) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #121212;
          margin: auto;
          padding: 2rem;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          color: #e0e0e0;
        }

        .auth-container {
          background: #1e1e1e;
          padding: 2.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0, 255, 136, 0.2);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .title {
          color: #00ff88;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .otp-code {
          font-size: 1.75rem;
          color: #121212;
          font-weight: bold;
          letter-spacing: 2px;
          margin: 1.5rem 0;
          padding: 0.75rem;
          background: #00ff88;
          border-radius: 6px;
          display: inline-block;
        }

        .note {
          color: #a0a0a0;
          font-size: 0.875rem;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <h2 class="title"> ${
          subject === "confirmEmail"
            ? "Your Confirm Email Code"
            : subject === "forgetPassword"
            ? "Forget Password Code"
            : subject === "twoStepVerification"
            ? "Two Step Verification Code"
            : ""
        }</h2>
        <div class="otp-code">${otp}</div>
        <p class="note">This code will expire in 2 minutes</p>
      </div>
    </body>
    </html>`;
};

export const ViewUsers = (lists) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f8f9fa;
          margin: 0;
          padding: 2rem;
          min-height: 100vh;
        }

        .auth-container {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          margin: 0 auto;
        }

        .title {
          color: #2d3748;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .user-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .user-item {
          padding: 1rem;
          margin: 0.5rem 0;
          background: #f7fafc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: background 0.2s ease;
        }

        .user-item:hover {
          background: #ebf8ff;
        }

        .user-name {
          color: #2d3748;
          font-weight: 500;
          margin-left: 1rem;
        }

        .visit-count {
          color: #718096;
          font-size: 0.875rem;
          margin-left: auto;
        }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <h2 class="title">Profile Visitors</h2>
        <ul class="user-list">
          ${lists}
        </ul>
      </div>
    </body>
    </html>`;
};
