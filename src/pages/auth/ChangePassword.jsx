import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    Container,
} from "@mui/material";
import { ChevronLeft, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import authService from "../../services/authService";
import useSnackbar from "../../hooks/useSnackbar";
import { FONT_SIZE } from "../../constant/lookUpConstant";
import userService from "../../services/secondGameServices/userService";

const changePasswordSchema = Yup.object({
    currentPassword: Yup.string()
        .required("Current password is required")
        .min(6, "Password must be at least 6 characters"),
    newPassword: Yup.string()
        .required("New password is required")
        .min(6, "Password must be at least 6 characters")
        .notOneOf(
            [Yup.ref("currentPassword")],
            "New password must be different from current password"
        ),
    confirmPassword: Yup.string()
        .required("Please confirm your new password")
        .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

export default function ChangePassword() {
    const navigate = useNavigate();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();

    const formik = useFormik({
        initialValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        validationSchema: changePasswordSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {

                const body = {
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                };

                const [authResponse, userResponse] = await Promise.all([authService.changePassword(body), userService.changePassword(body)]);

                if (authResponse?.success !== false && userResponse?.success !== false) {
                    showSnackbar(
                        authResponse?.message || userResponse?.message || "Password changed successfully.",
                        "success"
                    );
                    formik.resetForm();
                    navigate(-1);
                } else {
                    throw new Error(authResponse?.message || userResponse?.message || "Failed to change password");
                }
            } catch (err) {
                console.error("Change password failed:", err);
                showSnackbar(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to change password. Please try again.",
                    "error"
                );
            } finally {
                setLoading(false);
            }
        },
    });

    const inputSx = {
        "& .MuiOutlinedInput-root": {
            bgcolor: AppColors.BG_SECONDARY,
            color: AppColors.TXT_MAIN,
            borderRadius: 2,
            "& fieldset": {
                borderColor: "rgba(255,255,255,0.12)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(255,255,255,0.2)",
            },
            "&.Mui-focused fieldset": {
                borderColor: AppColors.TXT_SUB,
                borderWidth: 1,
            },
            "&.Mui-error fieldset": {
                borderColor: AppColors.ERROR,
            },
        },
        "& .MuiInputBase-input": {
            py: 1.5,
            fontSize: FONT_SIZE.BODY,
        },
        "& .MuiInputBase-input::placeholder": {
            color: AppColors.TXT_SUB,
            opacity: 1,
        },
        "& .MuiFormHelperText-root": {
            color: AppColors.ERROR,
            fontSize: FONT_SIZE.CAPTION,
        },
    };

    return (
        <Box
            sx={{
                backgroundColor: AppColors.BG_MAIN,
                color: AppColors.TXT_MAIN,
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 2,
                    px: 2,
                    borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
                }}
            >
                <IconButton
                    onClick={() => navigate(-1)}
                    sx={{ color: AppColors.TXT_MAIN }}
                    size="small"
                >
                    <ChevronLeft />
                </IconButton>
                <Typography sx={{ fontSize: FONT_SIZE.TITLE, fontWeight: 600 }}>
                    Change Password
                </Typography>
            </Box>

            <Container maxWidth="sm" sx={{ flex: 1, py: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <Lock sx={{ color: AppColors.GOLD_PRIMARY, fontSize: 28 }} />
                    <Typography sx={{ fontSize: FONT_SIZE.BODY, color: AppColors.TXT_SUB }}>
                        Enter your current password and choose a new one.
                    </Typography>
                </Box>

                <form onSubmit={formik.handleSubmit}>
                    <TextField
                        fullWidth
                        name="currentPassword"
                        label="Current password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={formik.values.currentPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                            formik.touched.currentPassword &&
                            Boolean(formik.errors.currentPassword)
                        }
                        helperText={
                            formik.touched.currentPassword && formik.errors.currentPassword
                        }
                        variant="outlined"
                        sx={{ ...inputSx, mb: 2 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowCurrentPassword((p) => !p)}
                                            edge="end"
                                            sx={{ color: AppColors.TXT_SUB }}
                                        >
                                            {showCurrentPassword ? (
                                                <VisibilityOff fontSize="small" />
                                            ) : (
                                                <Visibility fontSize="small" />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        name="newPassword"
                        label="New password"
                        type={showNewPassword ? "text" : "password"}
                        value={formik.values.newPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                            formik.touched.newPassword && Boolean(formik.errors.newPassword)
                        }
                        helperText={
                            formik.touched.newPassword && formik.errors.newPassword
                        }
                        variant="outlined"
                        sx={{ ...inputSx, mb: 2 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword((p) => !p)}
                                            edge="end"
                                            sx={{ color: AppColors.TXT_SUB }}
                                        >
                                            {showNewPassword ? (
                                                <VisibilityOff fontSize="small" />
                                            ) : (
                                                <Visibility fontSize="small" />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        name="confirmPassword"
                        label="Confirm new password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                            formik.touched.confirmPassword &&
                            Boolean(formik.errors.confirmPassword)
                        }
                        helperText={
                            formik.touched.confirmPassword &&
                            formik.errors.confirmPassword
                        }
                        variant="outlined"
                        sx={{ ...inputSx, mb: 2 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword((p) => !p)}
                                            edge="end"
                                            sx={{ color: AppColors.TXT_SUB }}
                                        >
                                            {showConfirmPassword ? (
                                                <VisibilityOff fontSize="small" />
                                            ) : (
                                                <Visibility fontSize="small" />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 1,
                            py: 1,
                            borderRadius: 20,
                            bgcolor: AppColors.BG_SECONDARY,
                            color: AppColors.TXT_MAIN,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: FONT_SIZE.BODY,
                            "&:hover": {
                                bgcolor: "#252525",
                            },
                            "&:disabled": {
                                color: AppColors.TXT_SUB,
                            },
                        }}
                    >
                        {loading ? "Updating..." : "Change Password"}
                    </Button>
                </form>
            </Container>
        </Box>
    );
}
