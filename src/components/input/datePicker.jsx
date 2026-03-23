import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE } from "../../constant/lookUpConstant";

/**
 * MUI DatePicker wrapper. Value and onChange use string format "YYYY-MM-DD" for compatibility.
 * @param {string} [label]
 * @param {string} [id]
 * @param {string} [value] - Date string "YYYY-MM-DD" or empty
 * @param {function(string): void} [onChange] - Called with "YYYY-MM-DD" or ""
 * @param {string} [placeholder]
 * @param {object} [sx] - MUI sx for the field container
 * @param {boolean} [disabled]
 * @param {object} [slotProps] - Passed to MUI DatePicker slotProps
 */
const DatePicker = ({
  label,
  id,
  value = "",
  onChange,
  placeholder = "Pick a date",
  sx = {},
  disabled = false,
  slotProps,
  ...rest
}) => {
  const dateValue = value && dayjs(value).isValid() ? dayjs(value) : null;

  const handleChange = (newValue) => {
    if (!onChange) return;
    onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        id={id}
        label={label}
        value={dateValue}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            placeholder,
            size: "small",
            fullWidth: true,
            sx: {
              bgcolor: AppColors.BG_SECONDARY,
              color: AppColors.TXT_MAIN,
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&.Mui-focused fieldset": { borderColor: AppColors.TXT_SUB, borderWidth: 1 },
                "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
              },
              "& .MuiPickersInputBase-root": {
                px: 1,
                fontSize: FONT_SIZE.BODY2
              },
              "& .MuiInputAdornment-root": {
                ml: 0
              },
              "& .MuiFormLabel-root": { fontSize: FONT_SIZE.BODY2 },
              "& .MuiInputBase-input": { py: 1.5 },
              "& .MuiInputBase-input::placeholder": { color: AppColors.TXT_SUB, opacity: 1 },
              "& .MuiFormHelperText-root": { color: AppColors.ERROR, fontSize: FONT_SIZE.CAPTION },
              "& .MuiSvgIcon-root": {
                fontSize: 16
              },
              ...sx,
            },
          },
          ...slotProps,
        }}
        {...rest}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;
