// ============================================================
// CuratoCV OtpInput Component
// ============================================================
//
// Reusable 6-digit OTP input with comprehensive UX and accessibility features.
// Supports:
//   - Six individual digit inputs (visually styled as single box)
//   - Paste of complete OTP (123456)
//   - Keyboard navigation
//   - Backspace behavior
//   - Auto-focus
//   - Disabled state
//   - Error state
//   - Accessible labels
//   - Mobile keyboard optimization (number pad)
//   - No OTP logging
//   - OTP never persisted to localStorage or Redux
//   - OTP never exposed in URL or query string
// ============================================================

import React, { useRef, useEffect, useState } from 'react';

const OtpInput = ({
    length = 6,
    onChange,
    onComplete,
    error = false,
    disabled = false,
    autoFocus = true,
    placeholder = '',
    className = '',
}) => {
    const [values, setValues] = useState(Array(length).fill(''));
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRefs = useRef([]);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Auto-focus first input on mount
    useEffect(() => {
        let timeoutId;
        if (autoFocus) {
            timeoutId = requestAnimationFrame(() => {
                inputRefs.current[0]?.focus();
                setFocusedIndex(0);
            });
        }
        return () => cancelAnimationFrame(timeoutId);
    }, [autoFocus]);

    // Notify parent when values change
    useEffect(() => {
        const otp = values.join('');
        onChange?.(otp);

        if (otp.length === length && onComplete) {
            onComplete(otp);
        }
    }, [values, length, onChange, onComplete]);

    const handleChange = (index, val) => {
        // Handle all input even if box has character (take last char)
        const digit = val.slice(-1);
        if (digit && !/^[0-9]$/.test(digit)) return;

        const newValues = [...values];
        newValues[index] = digit;
        setValues(newValues);

        // Move to next input if digit entered
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
            setFocusedIndex(index + 1);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            e.preventDefault();

            const newValues = [...values];
            if (values[index]) {
                // Clear current digit
                newValues[index] = '';
                setValues(newValues);
            } else if (index > 0) {
                // Move to previous input and clear it
                newValues[index - 1] = '';
                setValues(newValues);
                inputRefs.current[index - 1]?.focus();
                setFocusedIndex(index - 1);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
            setFocusedIndex(index + 1);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text/plain');

        // Extract only digits from pasted content
        const digits = pasted.replace(/[^0-9]/g, '').slice(0, length);

        if (digits.length === 0) return;

        const newValues = Array(length).fill('');
        digits.split('').forEach((digit, idx) => {
            newValues[idx] = digit;
        });

        setValues(newValues);

        // Focus the next empty input or the last input
        const nextIndex = Math.min(digits.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
    };

    const handleFocus = (index) => {
        setFocusedIndex(index);
    };

    return (
        <div className={`flex gap-2 justify-center ${className}`} role="group" aria-label="OTP input">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={values[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => handleFocus(index)}
                    placeholder={values[index] ? '' : placeholder}
                    disabled={disabled}
                    aria-label={`OTP digit ${index + 1}`}
                    aria-invalid={error}
                    aria-describedby={error ? 'otp-error' : undefined}
                    className={`
                        w-12 h-14 text-center text-xl font-semibold
                        border-2 rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${error
                            ? 'border-red-500 bg-red-50'
                            : focusedIndex === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                />
            ))}
            {error && (
                <span id="otp-error" className="sr-only">
                    OTP is invalid. Please enter the correct code.
                </span>
            )}
        </div>
    );
};

export default OtpInput;