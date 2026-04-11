import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useTranslation } from 'react-i18next';
import { TRADE_NAMESPACE } from '../../i18n';
import { AppColors } from '../../constant/appColors';

function NumberSpinner({
  id: idProp,
  label = 'Amount',
  error = false,
  errorMessage,
  success = false,
  successMessage,
  size = 'medium',
  min,
  max,
  defaultValue = null,
  onChange,
  disabled = false,
  required = false,
  step = 1,
  /** When true, onChange is not called on blur (only on input change or +/-). */
  disableOnChangeOnBlur = false,
  ...other
}) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const id = React.useId();
  const [value, setValue] = React.useState(null);
  const [focused, setFocused] = React.useState(false);

  // Update internal value when defaultValue changes (e.g. currency switch), but not while user is typing
  React.useEffect(() => {
    if (!focused) {
      const next = defaultValue;
      setValue(next === '' ? '' : next);
    }
  }, [defaultValue, min, focused]);

  const handleIncrement = () => {
    const newValue = (parseFloat(value) || 0) + step;
    const finalValue = max !== undefined ? Math.min(newValue, max) : newValue;
    setValue(finalValue);
    if (onChange) {
      onChange(finalValue);
    }
  };

  const handleDecrement = () => {
    const newValue = (parseFloat(value) || 0) - step;
    const finalValue = min !== undefined ? Math.max(newValue, min) : newValue;
    setValue(finalValue);
    if (onChange) {
      onChange(finalValue);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;

    // Allow empty string for user typing (e.g. backspace to clear)
    if (inputValue === '') {
      setValue('');
      if (onChange) {
        onChange('');
      }
      return;
    }

    // Parse as float
    const numValue = parseFloat(inputValue);

    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      let finalValue = numValue;

      // Apply min constraint
      if (min !== undefined && finalValue < min) {
        finalValue = min;
      }

      // Apply max constraint
      if (max !== undefined && finalValue > max) {
        finalValue = max;
      }

      // Keep the string as typed so backspace/editing works (e.g. "10.0" stays visible)
      setValue(inputValue);
      if (onChange) {
        onChange(finalValue);
      }
    } else {
      // If invalid, keep the input as is (user might be typing ".", "-", etc.)
      setValue(inputValue);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const numValue = parseFloat(value);
    if (numValue) {
      let finalValue = numValue;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      setValue(finalValue);
      if (!disableOnChangeOnBlur && onChange) onChange(finalValue);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent arrow keys from changing input value directly
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const numValue = parseFloat(value) || 0;
  const isMinDisabled = min !== undefined && numValue <= min;
  const isMaxDisabled = max !== undefined && numValue >= max;

  const showError = error;
  const showSuccess = success;

  return (
    <FormControl
      size={size}
      disabled={disabled}
      required={required}
      variant="outlined"
      fullWidth
      sx={{
        maxWidth: '100%',
        '& .MuiButton-root': {
          borderColor: AppColors.HLT_NONE,
          minWidth: 0,
          bgcolor: AppColors.BG_CARD,
          color: AppColors.TXT_MAIN,
          '&:hover': {
            bgcolor: `${AppColors.GOLD_PRIMARY}20`,
            borderColor: AppColors.GOLD_PRIMARY,
          },
          '&.Mui-disabled': {
            borderColor: AppColors.HLT_NONE,
            color: AppColors.TXT_SUB,
            opacity: 0.5,
          },
        },
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        border: '1px solid',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: AppColors.BG_CARD,
        borderColor: showError
          ? AppColors.ERROR
          : showSuccess
            ? AppColors.SUCCESS
            : AppColors.HLT_NONE,
      }}>
        <OutlinedInput
          id={id}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={label}
          inputProps={{
            ...other,
            type: 'number',
            min: min,
            max: max,
            step: step,
            style: {
              textAlign: 'left',
            },
          }}
          sx={{
            flex: 1,
            borderRadius: 0,
            px: 0,
            py: 0.25,
            bgcolor: "transparent",
            color: AppColors.TXT_MAIN,
            '& fieldset': {
              border: 'none !important',
            },
            '&:hover fieldset': {
              border: 'none !important',
            },
            '&.Mui-focused fieldset': {
              border: 'none !important',
            },
            '&.Mui-disabled': {
              bgcolor: "transparent",
            },
            '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
          }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <Button
            variant="text"
            aria-label={t("common.decreaseAriaLabel")}
            size={size}
            onClick={handleDecrement}
            disabled={disabled || isMinDisabled}
            sx={{
              borderRadius: 0,
              minWidth: 32,
              px: 1,
              bgcolor: 'transparent',
            }}
          >
            <RemoveIcon fontSize={size === 'small' ? 'small' : 'medium'} />
          </Button>
          <Button
            variant="text"
            aria-label={t("common.increaseAriaLabel")}
            size={size}
            onClick={handleIncrement}
            disabled={disabled || isMaxDisabled}
            sx={{
              borderLeft: '1px solid',
              borderColor: AppColors.HLT_NONE,
              borderRadius: 0,
              minWidth: 32,
              px: 1,
              bgcolor: 'transparent',
            }}
          >
            <AddIcon fontSize={size === 'small' ? 'small' : 'medium'} />
          </Button>
        </Box>
      </Box>
    </FormControl >
  );
}

export default NumberSpinner;
