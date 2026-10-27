import { useState } from 'react';

const FRAMEWORK_OPTIONS = [
  { name: 'React', defaultVersion: '19', versions: ['19', '18', '17'] },
  { name: 'Next.js', defaultVersion: '15', versions: ['15', '14', '13'] },
  { name: 'Vite', defaultVersion: '6', versions: ['6', '5', '4'] },
  { name: 'Vanilla JavaScript', defaultVersion: 'ES2024', versions: ['ES2024', 'ES6', 'Legacy'] },
  { name: 'Vue.js', defaultVersion: '3', versions: ['3', '2'] },
  { name: 'Angular', defaultVersion: '18', versions: ['18', '17', '16'] },
  { name: 'Node.js / Express', defaultVersion: '22', versions: ['22', '20', '18'] },
  { name: 'Other', defaultVersion: '', versions: [] },
];

const BUILD_TOOL_OPTIONS = [
  'Vite',
  'Turbopack',
  'Webpack / CRA',
  'esbuild / Rollup',
  'Next.js Built-in',
  'None / Plain HTML',
  'Other',
];

const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript (.js)' },
  { value: 'jsx', label: 'React JSX (.jsx)' },
  { value: 'typescript', label: 'TypeScript (.ts)' },
  { value: 'tsx', label: 'TypeScript JSX (.tsx)' },
  { value: 'html', label: 'HTML (.html)' },
  { value: 'css', label: 'CSS / SCSS (.css)' },
  { value: 'vue', label: 'Vue (.vue)' },
  { value: 'json', label: 'JSON (.json)' },
];

function inferLanguageFromFilename(filename) {
  if (!filename) return null;
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
      return 'tsx';
    case 'ts':
      return 'typescript';
    case 'jsx':
      return 'jsx';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'vue':
      return 'vue';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
      return 'css';
    case 'json':
      return 'json';
    default:
      return null;
  }
}

export default function InteractiveOptions({
  options,
  stepLabel,
  canSkip,
  onSelectOption,
  onSkip,
  onGoBack,
  onRestart,
  diagnosticState,
  onUpdateDiagnosticState,
  activeQuestion,
  onSetActiveQuestion,
  onSubmitDiagnosticQuestion,
  restartConfirming,
  onRequestRestart,
  onCancelRestart,
  onConfirmRestart,
  isSending,
}) {
  const [localError, setLocalError] = useState(diagnosticState?.errorMessage || '');
  const [errorValidation, setErrorValidation] = useState('');

  const [selectedFramework, setSelectedFramework] = useState(
    diagnosticState?.framework?.name || 'React'
  );
  const [customFramework, setCustomFramework] = useState(
    diagnosticState?.framework?.name &&
      !FRAMEWORK_OPTIONS.some((f) => f.name === diagnosticState.framework.name)
      ? diagnosticState.framework.name
      : ''
  );
  const [frameworkVersion, setFrameworkVersion] = useState(
    diagnosticState?.framework?.version || '19'
  );
  const [buildTool, setBuildTool] = useState(diagnosticState?.buildTool || 'Vite');

  const [localCode, setLocalCode] = useState(diagnosticState?.codeSnippet || '');
  const [localFilename, setLocalFilename] = useState(diagnosticState?.filename || '');
  const [localLanguage, setLocalLanguage] = useState(
    diagnosticState?.codeLanguage || 'javascript'
  );
  const [codeValidation, setCodeValidation] = useState('');

  if (!Array.isArray(options) || options.length === 0) return null;

  // Determine option category
  const isErrorOption = (opt) =>
    /error|stack\s*trace|f12|console/i.test(opt);
  const isFrameworkOption = (opt) =>
    /framework|react|vite|next\.?js|vanilla/i.test(opt);
  const isCodeOption = (opt) =>
    /component\s*code|code\s*snippet|share\s*the\s*code/i.test(opt);

  // Handle clicking an option chip
  const handleChipClick = (opt) => {
    if (isErrorOption(opt)) {
      const next = activeQuestion === 'error' ? null : 'error';
      if (next === 'error') {
        setLocalError(diagnosticState?.errorMessage || '');
        setErrorValidation('');
      }
      onSetActiveQuestion?.(next);
    } else if (isFrameworkOption(opt)) {
      const next = activeQuestion === 'framework' ? null : 'framework';
      if (next === 'framework') {
        setSelectedFramework(diagnosticState?.framework?.name || 'React');
        setFrameworkVersion(diagnosticState?.framework?.version || '19');
        setBuildTool(diagnosticState?.buildTool || 'Vite');
      }
      onSetActiveQuestion?.(next);
    } else if (isCodeOption(opt)) {
      const next = activeQuestion === 'code' ? null : 'code';
      if (next === 'code') {
        setLocalCode(diagnosticState?.codeSnippet || '');
        setLocalFilename(diagnosticState?.filename || '');
        setLocalLanguage(diagnosticState?.codeLanguage || 'javascript');
        setCodeValidation('');
      }
      onSetActiveQuestion?.(next);
    } else {
      onSetActiveQuestion?.(null);
      onSelectOption?.(opt);
    }
  };

  // Submit Question A: Error Message
  const handleSubmitError = (e) => {
    e?.preventDefault();
    const trimmed = localError.trim();
    if (!trimmed) {
      setErrorValidation('Please enter or paste your error message from the browser console.');
      return;
    }
    setErrorValidation('');
    onUpdateDiagnosticState?.({ errorMessage: trimmed });
    onSubmitDiagnosticQuestion?.('error', { errorMessage: trimmed });
  };

  // Submit Question B: Framework
  const handleSubmitFramework = (e) => {
    e?.preventDefault();
    const finalName =
      selectedFramework === 'Other'
        ? customFramework.trim() || 'Other'
        : selectedFramework;
    const fwPayload = {
      framework: { name: finalName, version: frameworkVersion.trim() },
      buildTool: buildTool.trim(),
    };
    onUpdateDiagnosticState?.(fwPayload);
    onSubmitDiagnosticQuestion?.('framework', fwPayload);
  };

  // Submit Question C: Code Snippet
  const handleSubmitCode = (e) => {
    e?.preventDefault();
    const trimmed = localCode.trim();
    if (!trimmed) {
      setCodeValidation('Please paste your component code snippet.');
      return;
    }
    if (trimmed.length > 10000) {
      setCodeValidation(
        `Code snippet is too long (${trimmed.length} chars). Please keep it under 10,000 characters.`
      );
      return;
    }
    setCodeValidation('');
    const codePayload = {
      codeSnippet: localCode,
      filename: localFilename.trim(),
      codeLanguage: localLanguage,
    };
    onUpdateDiagnosticState?.(codePayload);
    onSubmitDiagnosticQuestion?.('code', codePayload);
  };

  // Handle Tab key inside code textarea for natural indentation
  const handleCodeKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = localCode;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      setLocalCode(newVal);
      onUpdateDiagnosticState?.({ codeSnippet: newVal });
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleFilenameChange = (e) => {
    const val = e.target.value;
    setLocalFilename(val);
    onUpdateDiagnosticState?.({ filename: val });
    const inferred = inferLanguageFromFilename(val);
    if (inferred) {
      setLocalLanguage(inferred);
      onUpdateDiagnosticState?.({ codeLanguage: inferred });
    }
  };

  return (
    <div className="interactive-options-container" role="group" aria-label="Quick Select Diagnostic Options">
      {/* Restart Confirmation Dialog */}
      {restartConfirming && (
        <div className="restart-confirm-dialog" role="alertdialog" aria-modal="true">
          <div className="restart-dialog-content">
            <div className="restart-dialog-icon">⚠️</div>
            <div className="restart-dialog-text">
              <strong>Restart Diagnostic Session?</strong>
              <p>This will reset your diagnostic progress and clear the troubleshooting context.</p>
            </div>
          </div>
          <div className="restart-dialog-actions">
            <button
              type="button"
              className="restart-dialog-btn confirm-btn"
              onClick={() => onConfirmRestart?.()}
            >
              Yes, Restart
            </button>
            <button
              type="button"
              className="restart-dialog-btn cancel-btn"
              onClick={() => onCancelRestart?.()}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="interactive-options-header">
        <span className="interactive-options-label">Select one of these to continue:</span>
        {stepLabel && <span className="interactive-step-pill">{stepLabel}</span>}
      </div>

      {/* Options Grid */}
      <div className="interactive-options-grid">
        {options.map((opt, idx) => {
          const isErr = isErrorOption(opt);
          const isFw = isFrameworkOption(opt);
          const isCode = isCodeOption(opt);

          const hasErrorSaved = Boolean(diagnosticState?.errorMessage?.trim());
          const hasFwSaved = Boolean(diagnosticState?.framework?.name);
          const hasCodeSaved = Boolean(diagnosticState?.codeSnippet?.trim());

          let isActive = false;
          let label = opt;
          let hasSavedValue = false;

          if (isErr) {
            isActive = activeQuestion === 'error';
            hasSavedValue = hasErrorSaved;
            if (hasErrorSaved) {
              const snippet = diagnosticState.errorMessage.split('\n')[0].slice(0, 32);
              label = `✓ Error added: "${snippet}..."`;
            }
          } else if (isFw) {
            isActive = activeQuestion === 'framework';
            hasSavedValue = hasFwSaved;
            if (hasFwSaved) {
              const fName = diagnosticState.framework?.name || 'React';
              const fVer = diagnosticState.framework?.version ? ` v${diagnosticState.framework.version}` : '';
              const bt = diagnosticState.buildTool ? ` (${diagnosticState.buildTool})` : '';
              label = `✓ Framework: ${fName}${fVer}${bt}`;
            }
          } else if (isCode) {
            isActive = activeQuestion === 'code';
            hasSavedValue = hasCodeSaved;
            if (hasCodeSaved) {
              const file = diagnosticState.filename ? ` (${diagnosticState.filename})` : '';
              label = `✓ Code snippet added${file}`;
            }
          }

          return (
            <button
              key={idx}
              type="button"
              className={`interactive-option-chip ${isActive ? 'chip-active' : ''} ${
                hasSavedValue ? 'chip-saved' : ''
              }`}
              onClick={() => handleChipClick(opt)}
              title={hasSavedValue ? 'Click to view or edit details' : `Select: ${opt}`}
            >
              <span className="chip-bullet">{hasSavedValue ? '✓' : '•'}</span>
              <span className="chip-text">{label}</span>
              {hasSavedValue && <span className="chip-edit-hint">✎</span>}
            </button>
          );
        })}
      </div>

      {/* QUESTION A: Exact Error Message Panel */}
      {activeQuestion === 'error' && (
        <div className="diagnostic-inline-panel error-panel" role="region" aria-label="Error Message Input">
          <div className="devtools-guide-banner">
            <span className="guide-icon">💡</span>
            <div className="guide-text">
              <strong>How to find your exact error:</strong> Press{' '}
              <kbd>F12</kbd> or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd> (Mac: <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>J</kbd>) in your browser, switch to the <strong>Console</strong> tab, and paste the red error message or stack trace below.
            </div>
          </div>

          <label htmlFor="diagnostic-error-textarea" className="diagnostic-input-label">
            Paste your error message here <span className="required-star">*</span>
          </label>

          <textarea
            id="diagnostic-error-textarea"
            className="diagnostic-textarea diagnostic-error-input"
            rows={5}
            value={localError}
            onChange={(e) => {
              setLocalError(e.target.value);
              onUpdateDiagnosticState?.({ errorMessage: e.target.value });
              if (errorValidation) setErrorValidation('');
            }}
            placeholder="e.g.&#10;Uncaught TypeError: Cannot read properties of undefined (reading 'map')&#10;    at TaskList (TaskList.jsx:24:18)&#10;    at renderWithHooks (react-dom.development.js:15486)..."
            disabled={isSending}
            autoFocus
          />

          <div className="diagnostic-input-footer">
            <span className="diagnostic-char-counter">
              {localError.length > 0 ? `${localError.length} characters entered` : 'No error pasted yet'}
            </span>
            {errorValidation && <span className="diagnostic-validation-error">{errorValidation}</span>}
          </div>

          <div className="diagnostic-panel-actions">
            <button
              type="button"
              className="diagnostic-submit-btn"
              onClick={handleSubmitError}
              disabled={isSending || !localError.trim()}
            >
              {isSending ? '⚡ Analyzing Error...' : 'Submit Error & Diagnose →'}
            </button>
            <button
              type="button"
              className="diagnostic-clear-btn"
              onClick={() => {
                setLocalError('');
                onUpdateDiagnosticState?.({ errorMessage: '' });
                setErrorValidation('');
              }}
              disabled={isSending || !localError}
            >
              Clear
            </button>
            <button
              type="button"
              className="diagnostic-cancel-btn"
              onClick={() => onSetActiveQuestion?.(null)}
              disabled={isSending}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QUESTION B: Framework Selector Panel */}
      {activeQuestion === 'framework' && (
        <div className="diagnostic-inline-panel framework-panel" role="region" aria-label="Framework Selector">
          <div className="diagnostic-input-label">Select your Project Framework:</div>
          <div className="framework-chips-grid">
            {FRAMEWORK_OPTIONS.map((fw) => {
              const isSelected = selectedFramework === fw.name;
              return (
                <button
                  key={fw.name}
                  type="button"
                  className={`framework-pill ${isSelected ? 'pill-active' : ''}`}
                  onClick={() => {
                    setSelectedFramework(fw.name);
                    if (fw.name === 'React') {
                      setFrameworkVersion('19');
                      setBuildTool('Vite');
                    } else if (fw.name === 'Next.js') {
                      setFrameworkVersion('15');
                      setBuildTool('Turbopack');
                    } else if (fw.name === 'Vite') {
                      setFrameworkVersion('6');
                      setBuildTool('Vite');
                    } else if (fw.defaultVersion) {
                      setFrameworkVersion(fw.defaultVersion);
                    }
                  }}
                >
                  {fw.name}
                </button>
              );
            })}
          </div>

          {selectedFramework === 'Other' && (
            <div className="custom-framework-field">
              <label htmlFor="custom-fw-input" className="diagnostic-sublabel">
                Custom Framework Name:
              </label>
              <input
                id="custom-fw-input"
                type="text"
                className="diagnostic-text-input"
                placeholder="e.g. Svelte, SolidJS, Remix, Astro"
                value={customFramework}
                onChange={(e) => setCustomFramework(e.target.value)}
              />
            </div>
          )}

          <div className="framework-detail-row">
            <div className="framework-detail-col">
              <label htmlFor="fw-version-input" className="diagnostic-sublabel">
                Framework Version:
              </label>
              <div className="version-input-group">
                <input
                  id="fw-version-input"
                  type="text"
                  className="diagnostic-text-input version-input"
                  placeholder="e.g. 19, 18.3, 15"
                  value={frameworkVersion}
                  onChange={(e) => setFrameworkVersion(e.target.value)}
                />
                {FRAMEWORK_OPTIONS.find((f) => f.name === selectedFramework)?.versions.map((ver) => (
                  <button
                    key={ver}
                    type="button"
                    className={`version-quick-chip ${frameworkVersion === ver ? 'active' : ''}`}
                    onClick={() => setFrameworkVersion(ver)}
                  >
                    v{ver}
                  </button>
                ))}
              </div>
            </div>

            <div className="framework-detail-col">
              <label htmlFor="build-tool-select" className="diagnostic-sublabel">
                Build Tool / Bundler:
              </label>
              <select
                id="build-tool-select"
                className="diagnostic-select-input"
                value={buildTool}
                onChange={(e) => setBuildTool(e.target.value)}
              >
                {BUILD_TOOL_OPTIONS.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="diagnostic-panel-actions">
            <button
              type="button"
              className="diagnostic-submit-btn"
              onClick={handleSubmitFramework}
              disabled={isSending}
            >
              {isSending ? '⚡ Saving...' : 'Submit Framework & Continue →'}
            </button>
            <button
              type="button"
              className="diagnostic-cancel-btn"
              onClick={() => onSetActiveQuestion?.(null)}
              disabled={isSending}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QUESTION C: Share Component Code Panel */}
      {activeQuestion === 'code' && (
        <div className="diagnostic-inline-panel code-panel" role="region" aria-label="Component Code Snippet">
          <div className="code-meta-row">
            <div className="code-meta-field">
              <label htmlFor="code-filename-input" className="diagnostic-sublabel">
                Component Filename (optional):
              </label>
              <input
                id="code-filename-input"
                type="text"
                className="diagnostic-text-input"
                placeholder="e.g. TaskList.jsx or App.tsx"
                value={localFilename}
                onChange={handleFilenameChange}
                disabled={isSending}
              />
            </div>

            <div className="code-meta-field">
              <label htmlFor="code-lang-select" className="diagnostic-sublabel">
                Programming Language:
              </label>
              <select
                id="code-lang-select"
                className="diagnostic-select-input"
                value={localLanguage}
                onChange={(e) => {
                  setLocalLanguage(e.target.value);
                  onUpdateDiagnosticState?.({ codeLanguage: e.target.value });
                }}
                disabled={isSending}
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="diagnostic-code-textarea" className="diagnostic-input-label">
            Paste component code snippet around the issue: <span className="required-star">*</span>
          </label>

          <textarea
            id="diagnostic-code-textarea"
            className="diagnostic-code-textarea"
            rows={8}
            value={localCode}
            onChange={(e) => {
              setLocalCode(e.target.value);
              onUpdateDiagnosticState?.({ codeSnippet: e.target.value });
              if (codeValidation) setCodeValidation('');
            }}
            onKeyDown={handleCodeKeyDown}
            placeholder={`// Paste the component JSX / TSX code around the line causing the error\nexport default function TaskList({ tasks }) {\n  return (\n    <div>\n      {tasks.map(t => <TaskItem key={t.id} task={t} />)}\n    </div>\n  );\n}`}
            disabled={isSending}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />

          <div className="diagnostic-input-footer">
            <span
              className={`diagnostic-char-counter ${
                localCode.length > 10000 ? 'counter-danger' : ''
              }`}
            >
              {localCode.length.toLocaleString()} / 10,000 characters
            </span>
            {codeValidation && <span className="diagnostic-validation-error">{codeValidation}</span>}
          </div>

          <div className="diagnostic-panel-actions">
            <button
              type="button"
              className="diagnostic-submit-btn"
              onClick={handleSubmitCode}
              disabled={isSending || !localCode.trim() || localCode.length > 10000}
            >
              {isSending ? '⚡ Analyzing Code...' : 'Submit Code & Diagnose →'}
            </button>
            <button
              type="button"
              className="diagnostic-clear-btn"
              onClick={() => {
                setLocalCode('');
                onUpdateDiagnosticState?.({ codeSnippet: '' });
                setCodeValidation('');
              }}
              disabled={isSending || !localCode}
            >
              Clear
            </button>
            <button
              type="button"
              className="diagnostic-cancel-btn"
              onClick={() => onSetActiveQuestion?.(null)}
              disabled={isSending}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation: Skip, Back, Restart */}
      <div className="interactive-footer-row">
        {canSkip && (
          <button
            type="button"
            className="interactive-skip-btn"
            onClick={() => onSkip?.()}
            title="Skip questions and request best guess solution"
            disabled={isSending}
          >
            Skip questions & show best guess →
          </button>
        )}
        <div className="interactive-nav-group">
          {onGoBack && (
            <button
              type="button"
              className="interactive-nav-btn"
              onClick={() => onGoBack?.()}
              title="Change your previous answer"
              disabled={isSending}
            >
              ← Change previous answer
            </button>
          )}
          {(onRequestRestart || onRestart) && (
            <button
              type="button"
              className="interactive-nav-btn restart-nav-btn"
              onClick={() => (onRequestRestart ? onRequestRestart() : onRestart?.())}
              title="Restart diagnosis from the beginning"
              disabled={isSending}
            >
              ↺ Restart diagnosis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
