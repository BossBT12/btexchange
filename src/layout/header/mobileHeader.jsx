import React, { useState, useRef, useCallback, useEffect } from "react";
import { AppBar, Container, IconButton, InputAdornment, Menu, MenuItem, TextField } from "@mui/material";
import { Language, Search as SearchIcon } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { CgMenuGridO } from "react-icons/cg";
import { SlEarphonesAlt } from "react-icons/sl";
import { FaRegBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setHomePageSearchValue } from "../../store/slices/commanSlice";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const MobileHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const homePageSearchValue = useSelector((state) => state.comman.homePageSearchValue);
  const [inputValue, setInputValue] = useState(homePageSearchValue);
  const debounceRef = useRef(null);


  const { t, i18n } = useTranslation(TRADE_NAMESPACE);

  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  const handleOpenLanguageMenu = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleCloseLanguageMenu = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    handleCloseLanguageMenu();
  };

  useEffect(() => {
    setInputValue(homePageSearchValue);
  }, [homePageSearchValue]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (event) => {
      const value = event.target.value;
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatch(setHomePageSearchValue(value));
        debounceRef.current = null;
      }, 500);
    },
    [dispatch]
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        py: 1,
        minHeight: 48,
        backgroundColor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
      }}
    >
      <Container maxWidth="md" sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 0.2 }}>
        <IconButton
          size="small"
          sx={{ color: AppColors.TXT_MAIN }}
          onClick={() => navigate("/menu")}
        >
          <CgMenuGridO size={24} />
        </IconButton>

        <TextField
          variant="outlined"
          placeholder="🔥 Search"
          value={inputValue}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: AppColors.TXT_SUB, fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: 1,
            mx: 0.5,
            "& .MuiOutlinedInput-root": {
              borderRadius: 20,
              px: 1.25,
              py: 0.25,
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              "& .MuiInputBase-input": {
                py: 0.75,
              },
              "& fieldset": {
                border: "none",
              },
            },
          }}
        />
        <IconButton size="small" sx={{ color: AppColors.TXT_MAIN }} onClick={() => navigate("/agent-service")}>
          <SlEarphonesAlt size={20} />
        </IconButton>
        <IconButton size="small" sx={{ color: AppColors.TXT_MAIN }} onClick={handleOpenLanguageMenu}>
          <Language size={20} />
        </IconButton>
      </Container>
      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={handleCloseLanguageMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <MenuItem
            key={lng.code}
            selected={i18n.language === lng.code}
            onClick={() => handleLanguageChange(lng.code)}
          >
            {lng.label}
          </MenuItem>
        ))}
      </Menu>
    </AppBar>
  );
};

export default MobileHeader;
