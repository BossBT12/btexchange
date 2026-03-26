import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  ClickAwayListener,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import { KeyboardArrowDown, Search as SearchIcon } from "@mui/icons-material";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { AppColors } from "../constant/appColors";
import { FONT_SIZE } from "../constant/lookUpConstant";

function normalizeSearch(s) {
  return (s || "").toLowerCase().trim();
}

function getFlagUrl(iso2, size = 20) {
  if (!iso2) return "";
  // Use static CDN-hosted PNG flags to avoid OS emoji rendering issues.
  return `https://flagcdn.com/w${size}/${String(iso2).toLowerCase()}.png`;
}

function FlagIcon({ iso2, size = 20 }) {
  const [failed, setFailed] = useState(false);

  if (!iso2 || failed) {
    return (
      <Box
        component="span"
        sx={{
          width: size,
          height: Math.round((size * 3) / 4),
          borderRadius: 0.5,
          bgcolor: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: AppColors.TXT_SUB,
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {String(iso2 || "").slice(0, 2)}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={getFlagUrl(iso2, size)}
      alt={`${iso2} flag`}
      loading="lazy"
      onError={() => setFailed(true)}
      sx={{
        width: size,
        height: Math.round((size * 3) / 4),
        objectFit: "cover",
        borderRadius: 0.5,
        border: "1px solid rgba(255,255,255,0.12)",
        display: "block",
      }}
    />
  );
}

export default function CountryCodePicker({
  valueIso2,
  onChange,
  disabled = false,
  size = "md",
}) {
  const anchorRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      return null;
    }
  }, []);

  const options = useMemo(() => {
    const list = getCountries().map((iso2) => {
      const name = displayNames?.of(iso2) || iso2;
      const dialCode = `+${getCountryCallingCode(iso2)}`;
      return {
        iso2,
        name,
        dialCode,
      };
    });
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [displayNames]);

  const selected = useMemo(() => {
    const found = options.find((o) => o.iso2 === valueIso2);
    return (
      found || {
        iso2: "IN",
        name: displayNames?.of("IN") || "India",
        dialCode: "+91",
      }
    );
  }, [displayNames, options, valueIso2]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return options;
    return options.filter((o) => {
      const name = normalizeSearch(o.name);
      const iso = normalizeSearch(o.iso2);
      const dial = normalizeSearch(o.dialCode);
      return name.includes(q) || iso.includes(q) || dial.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((s) => !s);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };


  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <Box
        ref={anchorRef}
        component="button"
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label="Select country code"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        style={{
          appearance: "none",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          color: "inherit",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <FlagIcon iso2={selected.iso2} size={20} />
          <Typography
            component="span"
            sx={{
              fontSize: FONT_SIZE.BODY2,
              color: AppColors.TXT_MAIN,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            {selected.dialCode}
          </Typography>
          <KeyboardArrowDown sx={{ color: AppColors.TXT_SUB, fontSize: 16 }} />
        </Box>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 2000 }}
        modifiers={[
          { name: "offset", options: { offset: [0, 8] } },
          { name: "preventOverflow", options: { padding: 8 } },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={12}
            sx={{
              width: 340,
              maxWidth: "calc(100vw - 24px)",
              bgcolor: AppColors.BG_SECONDARY,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 1, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  bgcolor: "rgba(255,255,255,0.06)",
                }}
              >
                <SearchIcon sx={{ color: AppColors.TXT_SUB, fontSize: 18 }} />
                <InputBase
                  inputRef={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code"
                  sx={{
                    flex: 1,
                    color: AppColors.TXT_MAIN,
                    "& input": { fontSize: FONT_SIZE.BODY2, py: 0.25 },
                    "& input::placeholder": { color: AppColors.TXT_SUB, opacity: 1 },
                  }}
                />
                {query ? (
                  <IconButton
                    size="small"
                    onClick={() => setQuery("")}
                    sx={{ color: AppColors.TXT_SUB, "&:hover": { color: AppColors.TXT_MAIN } }}
                    aria-label="Clear search"
                  >
                    ×
                  </IconButton>
                ) : null}
              </Box>
            </Box>

            <List
              role="listbox"
              dense
              sx={{
                maxHeight: 320,
                overflowY: "auto",
                py: 0.5,
              }}
            >
              {filtered.slice(0, 200).map((o) => {
                const isSelected = o.iso2 === selected.iso2;
                return (
                  <ListItemButton
                    key={o.iso2}
                    selected={isSelected}
                    onClick={() => {
                      onChange?.(o);
                      handleClose();
                    }}
                    sx={{
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.08)" },
                      "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,0.10)" },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                  >
                    <Box sx={{ width: 24, display: "flex", justifyContent: "center" }}>
                      <FlagIcon iso2={o.iso2} size={20} />
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        flex: 1,
                        color: AppColors.TXT_MAIN,
                        fontSize: FONT_SIZE.BODY2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={o.name}
                    >
                      {o.name}
                    </Typography>
                    <Typography component="span" sx={{ color: AppColors.TXT_SUB, fontSize: FONT_SIZE.BODY2, fontWeight: 600 }}>
                      {o.dialCode}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}

