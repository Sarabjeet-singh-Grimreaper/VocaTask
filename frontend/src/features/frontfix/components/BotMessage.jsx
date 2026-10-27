import StreamLine from './StreamLine.jsx';
import EvidenceBox from './EvidenceBox.jsx';
import DiffBlock from './DiffBlock.jsx';
import FeedbackBar from './FeedbackBar.jsx';
import InteractiveOptions from './InteractiveOptions.jsx';
import VerificationActions from './VerificationActions.jsx';

function getStateBadgeInfo(state) {
  switch (state) {
    case 'UNDERSTAND_PROBLEM':
      return { label: '🔍 Clarifying Issue', className: 'state-understand' };
    case 'COLLECT_CONTEXT':
      return { label: '📋 Gathering Context', className: 'state-collect' };
    case 'SEARCH_KNOWLEDGE_BASE':
    case 'EVALUATE_EVIDENCE':
      return { label: '📚 Knowledge Match', className: 'state-search' };
    case 'AI_DIAGNOSIS':
      return { label: '🤖 AI Diagnostic', className: 'state-ai' };
    case 'PRESENT_SOLUTION':
      return { label: '💡 Solution Proposed', className: 'state-solution' };
    case 'VERIFY_SOLUTION':
      return { label: '🧪 Awaiting Verification', className: 'state-verify' };
    case 'RESOLVED':
      return { label: '✅ Issue Resolved', className: 'state-resolved' };
    case 'ESCALATE_OR_FALLBACK':
      return { label: '⚠️ Escalated / Fallback', className: 'state-escalate' };
    default:
      return null;
  }
}

export default function BotMessage({
  data,
  onToast,
  onReveal,
  onSelectOption,
  onSkipQuestions,
  onVerifySolution,
  onGoBack,
  onRestart,
  diagnosticState,
  onUpdateDiagnosticState,
  onSetActiveQuestion,
  onSubmitDiagnosticQuestion,
  restartConfirming,
  onRequestRestart,
  onCancelRestart,
  onConfirmRestart,
  isSending,
}) {
  if (data.conversational) {
    return (
      <div className="chat-bubble-bot conversational-reply">
        <div className="conversation-avatar" aria-hidden="true">✦</div>
        <div className="conversation-copy">
          <div className="conversation-title">{data.title}</div>
          <p>{data.problem}</p>
          {Array.isArray(data.interactive_options) && data.interactive_options.length > 0 && (
            <InteractiveOptions
              options={data.interactive_options}
              stepLabel={data.step_label}
              canSkip={data.can_skip ?? true}
              onSelectOption={onSelectOption}
              onSkip={onSkipQuestions}
              onGoBack={onGoBack}
              onRestart={onRequestRestart || onRestart}
              diagnosticState={diagnosticState}
              onUpdateDiagnosticState={onUpdateDiagnosticState}
              activeQuestion={diagnosticState?.activeQuestion}
              onSetActiveQuestion={onSetActiveQuestion}
              onSubmitDiagnosticQuestion={onSubmitDiagnosticQuestion}
              restartConfirming={restartConfirming}
              onRequestRestart={onRequestRestart}
              onCancelRestart={onCancelRestart}
              onConfirmRestart={onConfirmRestart}
              isSending={isSending}
            />
          )}
          {Array.isArray(data.verification_actions) && data.verification_actions.length > 0 && (
            <VerificationActions
              actions={data.verification_actions}
              onVerify={onVerifySolution}
            />
          )}
        </div>
      </div>
    );
  }

  const isResolved = data.response_type === 'resolved' || data.state === 'RESOLVED';
  const isQuestionTurn =
    !isResolved &&
    (data.response_type === 'follow_up_question' ||
      data.response_type === 'request_error_details' ||
      data.response_type === 'request_code_or_logs' ||
      data.state === 'COLLECT_CONTEXT' ||
      data.state === 'UNDERSTAND_PROBLEM');

  // 1. Render Interactive Question / Troubleshooting Support Turn
  if (isQuestionTurn) {
    return (
      <div className="chat-bubble-bot support-agent-bubble">
        <div className="support-agent-header">
          <div className="support-agent-avatar" aria-hidden="true">
            ✦
          </div>
          <div className="support-agent-meta">
            <span className="support-agent-name">FrontFix Support Assistant</span>
            {data.step_label && <span className="step-count-badge">{data.step_label}</span>}
            <span className="state-badge state-collect">Troubleshooting</span>
          </div>
        </div>

        <div className="support-agent-content">
          {data.greeting && (
            <p className="support-agent-greeting">{data.greeting}</p>
          )}

          <div className="support-agent-prompt">
            <p style={{ whiteSpace: 'pre-line' }}>
              {data.follow_up_question || data.follow_up_prompt || data.message || data.problem}
            </p>
          </div>

          {data.extra_tips && (
            <div className="support-agent-tip">
              <span className="tip-icon">💡</span>
              <span style={{ whiteSpace: 'pre-line' }}>{data.extra_tips}</span>
            </div>
          )}

          {Array.isArray(data.interactive_options) && data.interactive_options.length > 0 && (
            <InteractiveOptions
              options={data.interactive_options}
              stepLabel={data.step_label}
              canSkip={data.can_skip ?? true}
              onSelectOption={onSelectOption}
              onSkip={onSkipQuestions}
              onGoBack={onGoBack}
              onRestart={onRequestRestart || onRestart}
              diagnosticState={diagnosticState}
              onUpdateDiagnosticState={onUpdateDiagnosticState}
              activeQuestion={diagnosticState?.activeQuestion}
              onSetActiveQuestion={onSetActiveQuestion}
              onSubmitDiagnosticQuestion={onSubmitDiagnosticQuestion}
              restartConfirming={restartConfirming}
              onRequestRestart={onRequestRestart}
              onCancelRestart={onCancelRestart}
              onConfirmRestart={onConfirmRestart}
              isSending={isSending}
            />
          )}

          {data.source && data.source.url && (
            <div className="support-agent-source">
              <span>Reference: </span>
              <a href={data.source.url} target="_blank" rel="noopener noreferrer">
                {data.source.title || 'Official Documentation'} →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Render Resolved State
  if (isResolved) {
    return (
      <div className="chat-bubble-bot resolved-card">
        <div className="support-agent-header">
          <div className="support-agent-avatar" style={{ background: '#10b981' }} aria-hidden="true">
            ✓
          </div>
          <div className="support-agent-meta">
            <span className="support-agent-name">FrontFix Support Assistant</span>
            <span className="state-badge state-resolved">✅ Issue Resolved</span>
          </div>
        </div>

        <div className="support-agent-content">
          <p className="support-agent-greeting">🎉 Glad we could solve this together!</p>
          <p className="support-agent-prompt">{data.problem}</p>

          <div className="section-block" style={{ marginTop: '10px' }}>
            <div className="section-label">✅ Resolution Summary</div>
            <div className="section-content">{data.likely_cause}</div>
          </div>

          {Array.isArray(data.fix_steps) && data.fix_steps.length > 0 && (
            <div className="fix-steps-list" style={{ marginTop: '8px' }}>
              {data.fix_steps.map((step, idx) => (
                <div className="fix-step-item" key={idx}>
                  <span className="fix-step-num">Step {idx + 1}</span>
                  <span>{typeof step === 'string' ? step.replace(/^\d+\.\s*/, '') : step}</span>
                </div>
              ))}
            </div>
          )}

          {data.extra_tips && (
            <div className="support-agent-tip" style={{ marginTop: '10px' }}>
              <span className="tip-icon">💡</span>
              <span>{data.extra_tips}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Render Solution / Diagnostic Card (PRESENT_SOLUTION, AI_DIAGNOSIS, ESCALATE_OR_FALLBACK)
  const badgeInfo = data.state ? getStateBadgeInfo(data.state) : null;
  const rows = [];

  rows.push(
    <div className="bot-header">
      <span className="category-tag">{data.category || 'Frontend Diagnostic'}</span>
      {data.step_label && <span className="step-count-badge">{data.step_label}</span>}
      {badgeInfo && (
        <span className={`state-badge ${badgeInfo.className}`}>{badgeInfo.label}</span>
      )}
      {data.confidence_level && (
        <span className="confidence-pill" title={`Confidence: ${data.confidence_level}`}>
          🎯 {data.confidence_level}
        </span>
      )}
      <span className="provenance-tag ai-gen">✨ Verified Frontend Diagnostic</span>
    </div>
  );

  if (data.evidence_summary) rows.push(<EvidenceBox evidence={data.evidence_summary} />);

  rows.push(<div className="bot-title">{data.title}</div>);

  rows.push(
    <div className="section-block">
      <div className="section-label">🔍 Problem</div>
      <div className="section-content">{data.problem || ''}</div>
    </div>
  );

  rows.push(
    <div className="section-block">
      <div className="section-label">⚡ Likely Cause</div>
      <div className="section-content">{data.likely_cause || ''}</div>
    </div>
  );

  if (data.why_it_occurs) {
    rows.push(
      <div className="section-block">
        <div className="section-label">🧠 Why This Occurs</div>
        <div className="section-content" style={{ whiteSpace: 'pre-line' }}>{data.why_it_occurs}</div>
      </div>
    );
  }

  if (Array.isArray(data.assumptions) && data.assumptions.length > 0) {
    rows.push(
      <div className="assumptions-card">
        <div className="assumptions-header">📋 Diagnostic Assumptions (Best Guess)</div>
        <ul className="assumptions-list">
          {data.assumptions.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (Array.isArray(data.fix_steps) && data.fix_steps.length > 0) {
    rows.push(
      <div className="section-block">
        <div className="section-label">🛠️ Fix Steps</div>
        <div className="fix-steps-list">
          {data.fix_steps.map((step, idx) => (
            <div className="fix-step-item" key={idx}>
              <span className="fix-step-num">Step {idx + 1}</span>
              <span>{typeof step === 'string' ? step.replace(/^\d+\.\s*/, '') : step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.code_before && data.code_after) {
    rows.push(
      <DiffBlock
        fileHint={data.file_hint}
        note={data.code_context_note}
        before={data.code_before}
        after={data.code_after}
        onCopy={onToast}
      />
    );
  }

  if (Array.isArray(data.commands) && data.commands.length > 0) {
    rows.push(
      <div className="section-block commands-block">
        <div className="section-label">💻 Terminal Commands</div>
        <div className="commands-list">
          {data.commands.map((cmd, idx) => (
            <div key={idx} className="command-terminal-item">
              <code className="command-code">{cmd}</code>
              <button
                className="copy-cmd-btn"
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(cmd);
                    onToast?.('Command copied to clipboard!');
                  }
                }}
                title="Copy command"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(data.verification_steps) && data.verification_steps.length > 0) {
    rows.push(
      <div className="section-block">
        <div className="section-label">🧪 How to Verify the Fix</div>
        <div className="verification-steps-list">
          {data.verification_steps.map((vstep, idx) => (
            <div key={idx} className="verification-step-item">
              <span className="vstep-check">✓</span>
              <span>{typeof vstep === 'string' ? vstep.replace(/^\d+\.\s*/, '') : vstep}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(data.alternative_causes) && data.alternative_causes.length > 0) {
    rows.push(
      <div className="section-block alternative-causes-block">
        <div className="section-label">🔄 If This Doesn't Fix It (Alternative Causes)</div>
        <ul className="alternative-causes-list">
          {data.alternative_causes.map((cause, idx) => (
            <li key={idx}>{cause}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (Array.isArray(data.missing_information) && data.missing_information.length > 0) {
    rows.push(
      <div className="missing-info-card">
        <div className="missing-info-header">ℹ️ For a more exact diagnosis, you can provide:</div>
        <ul className="missing-info-list">
          {data.missing_information.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (Array.isArray(data.verification_actions) && data.verification_actions.length > 0) {
    rows.push(
      <VerificationActions
        actions={data.verification_actions}
        onVerify={onVerifySolution}
      />
    );
  } else if (data.confirmation_prompt) {
    rows.push(
      <FeedbackBar
        prompt={data.confirmation_prompt}
        onSubmit={() => onToast('Feedback submitted. Thank you!')}
      />
    );
  }

  if (data.extra_tips) {
    rows.push(
      <div className="extra-tips-card">
        <strong>💡 Pro Tip:</strong> {data.extra_tips}
      </div>
    );
  }

  if (data.source) {
    rows.push(
      <div className="bot-source">
        <span>Documentation Source:</span>
        <a href={data.source.url} target="_blank" rel="noopener noreferrer">
          {data.source.title} →
        </a>
      </div>
    );
  }

  return (
    <div className="chat-bubble-bot">
      {rows.map((row, i) => (
        <StreamLine key={i} index={i} onReveal={onReveal}>
          {row}
        </StreamLine>
      ))}
    </div>
  );
}
