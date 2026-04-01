export function PdfExportProgress({ isVisible, progress, isComplete }) {
  if (!isVisible && !isComplete) {
    return null;
  }

  return (
    <div 
      className="pdf-export-progress-overlay"
      style={{
        opacity: isComplete ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isComplete ? 'none' : 'auto',
      }}
    >
      <div className="pdf-export-progress-container">
        <div className="pdf-export-progress-header">
          <h3>Generando PDF</h3>
          <p>Per favore attendere...</p>
        </div>

        <div className="pdf-export-progress-bar-wrapper">
          <div 
            className="pdf-export-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="pdf-export-progress-text">
          <span>{progress}%</span>
        </div>

        {isComplete && (
          <div className="pdf-export-complete-message">
            ✓ PDF scaricato con successo
          </div>
        )}
      </div>

      <style jsx>{`
        .pdf-export-progress-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .pdf-export-progress-container {
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          min-width: 320px;
          max-width: 400px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pdf-export-progress-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .pdf-export-progress-header h3 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
          color: #0f1724;
        }

        .pdf-export-progress-header p {
          margin: 0;
          font-size: 14px;
          color: #405065;
        }

        .pdf-export-progress-bar-wrapper {
          background: #eef4fb;
          border-radius: 8px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .pdf-export-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #7ab5ff, #2f5fa7);
          transition: width 0.3s ease-out;
          border-radius: 8px;
        }

        .pdf-export-progress-text {
          text-align: center;
          font-size: 12px;
          color: #405065;
          font-weight: 500;
        }

        .pdf-export-complete-message {
          margin-top: 16px;
          padding: 12px;
          background: #e8f5e9;
          border-radius: 8px;
          color: #2e7d32;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
