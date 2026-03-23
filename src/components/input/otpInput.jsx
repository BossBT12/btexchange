import * as React from 'react';
import PropTypes from 'prop-types';
import { Box, styled } from '@mui/material';
import { AppColors } from '../../constant/appColors';

const InputElement = styled('input')(({ theme }) => ({
    width: '40px',
    lineHeight: 1.5,
    height: '40px',
    borderRadius: 2,
    textAlign: 'center',
    color: AppColors.TXT_MAIN,
    background: AppColors.BG_SECONDARY,
    border: `1px solid ${AppColors.HLT_NONE}`,
    transition: "all 0.2s ease",

    [theme.breakpoints.up('sm')]: {
        width: '44px',
        height: '44px',
    },

    '&:hover': {
        borderColor: AppColors.GOLD_PRIMARY,
    },

    '&:focus': {
        borderColor: AppColors.GOLD_PRIMARY,
    },

    '&:focus-visible': {
        outline: 0,
    },
}));

function OTP({ separator, length, value, onChange }) {
    const inputRefs = React.useRef(new Array(length).fill(null));

    const focusInput = (targetIndex) => {
        const targetInput = inputRefs.current[targetIndex];
        if (targetInput) {
            targetInput.focus();
        }
    };

    const selectInput = (targetIndex) => {
        const targetInput = inputRefs.current[targetIndex];
        if (targetInput) {
            targetInput.select();
        }
    };

    const handleKeyDown = (event, currentIndex) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case ' ':
                event.preventDefault();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (currentIndex > 0) {
                    focusInput(currentIndex - 1);
                    selectInput(currentIndex - 1);
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (currentIndex < length - 1) {
                    focusInput(currentIndex + 1);
                    selectInput(currentIndex + 1);
                }
                break;
            case 'Delete':
                event.preventDefault();
                if (typeof onChange === 'function') {
                    const newValue = value.slice(0, currentIndex) + value.slice(currentIndex + 1);
                    onChange(newValue);
                }
                break;
            case 'Backspace':
                event.preventDefault();
                if (typeof onChange === 'function') {
                    const newValue = value.slice(0, currentIndex) + value.slice(currentIndex + 1);
                    onChange(newValue);
                }
                if (currentIndex > 0) {
                    focusInput(currentIndex - 1);
                    selectInput(currentIndex - 1);
                }
                break;
            default:
                if (event.key.length === 1 && !/[\d]/.test(event.key)) {
                    event.preventDefault();
                }
                break;
        }
    };

    const handleChange = (event, currentIndex) => {
        const currentValue = event.target.value;
        const numericValue = currentValue.replace(/\D/g, '').slice(-1);

        if (!numericValue && currentValue === '') {
            if (typeof onChange === 'function') {
                const newValue = value.slice(0, currentIndex) + value.slice(currentIndex + 1);
                onChange(newValue);
            }
            return;
        }

        if (numericValue) {
            if (typeof onChange === 'function') {
                const currentOtpArray = value.split('');
                while (currentOtpArray.length < length) {
                    currentOtpArray.push('');
                }
                currentOtpArray[currentIndex] = numericValue;
                onChange(currentOtpArray.join(''));
            }

            if (currentIndex < length - 1) {
                focusInput(currentIndex + 1);
            }
        }
    };

    const handleClick = (event, currentIndex) => {
        selectInput(currentIndex);
    };

    const handlePaste = (event, currentIndex) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;

        if (clipboardData && clipboardData.types.includes('text/plain')) {
            let pastedText = clipboardData.getData('text/plain');
            pastedText = pastedText.replace(/\D/g, '').substring(0, length);

            if (pastedText) {
                const currentOtpArray = value.split('');
                while (currentOtpArray.length < length) {
                    currentOtpArray.push('');
                }

                let startIndex = currentIndex;
                for (let i = 0; i < currentIndex; i++) {
                    if (!currentOtpArray[i] || currentOtpArray[i] === '') {
                        startIndex = i;
                        break;
                    }
                }

                for (let i = 0; i < pastedText.length && (startIndex + i) < length; i++) {
                    currentOtpArray[startIndex + i] = pastedText[i];
                }

                if (typeof onChange === 'function') {
                    onChange(currentOtpArray.join(''));
                }

                const nextEmptyIndex = Math.min(startIndex + pastedText.length, length - 1);
                focusInput(nextEmptyIndex);
            }
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center', justifyContent: 'center' }}>
            {new Array(length).fill(null).map((_, index) => (
                <React.Fragment key={index}>
                    <InputElement
                        ref={(ele) => {
                            inputRefs.current[index] = ele;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        aria-label={`Digit ${index + 1} of OTP`}
                        value={value[index] || ''}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onChange={(event) => handleChange(event, index)}
                        onClick={(event) => handleClick(event, index)}
                        onPaste={(event) => handlePaste(event, index)}
                    />
                    {index < length - 1 && separator}
                </React.Fragment>
            ))}
        </Box>
    );
}

OTP.propTypes = {
    length: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    separator: PropTypes.node,
    value: PropTypes.string.isRequired,
};

export default function OTPInput({ value = '', onChange, length = 4, separator = null, name = 'otp', ...props }) {
    const handleChange = (newValue) => {
        if (onChange) {
            const syntheticEvent = {
                target: {
                    name,
                    value: newValue,
                },
            };
            onChange(syntheticEvent);
        }
    };

    return (
        <OTP
            separator={separator !== null ? separator : <span style={{ margin: '0 4px', fontSize: '0.875rem', color: AppColors.TXT_MAIN }}>-</span>}
            value={value || ''}
            onChange={handleChange}
            length={length}
            {...props}
        />
    );
}

OTPInput.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    length: PropTypes.number,
    separator: PropTypes.node,
    name: PropTypes.string,
};