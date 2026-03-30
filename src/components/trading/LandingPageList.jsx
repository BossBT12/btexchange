import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  TableHead,
} from "@mui/material";
import { AppColors } from "../../constant/appColors";
import { useNavigate } from "react-router-dom";
import useTradeSocket from "../../hooks/useTradeSocket";
import { createTradeSocket } from "../../services/tradingSocketService";
import BTLoader from "../Loader";
import { useAuth } from "../../hooks/useAuth";
import { formatPairForDisplay, formatCompact } from "../../utils/utils";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const PriceTableRow = memo(({ coin, onRowClick }) => {
  const price = coin?.price;
  const formattedPrice = useMemo(() => {
    return price?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [price]);

  const change = coin?.changePercent;

  const formattedChange = useMemo(() => {
    return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  }, [change]);

  return (
    <TableRow
      hover
      onClick={onRowClick}
      sx={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:last-child td": { borderBottom: "none" },
        "&:hover": {
          bgcolor: "rgba(212, 168, 95, 0.08)",
        },
      }}
    >
      <TableCell>
        <Typography
          variant="body1"
          sx={{ color: AppColors.TXT_MAIN, fontWeight: "bold", lineHeight: 1 }}
        >
          {formatPairForDisplay(coin.pair)}
        </Typography>
        <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
          {formatCompact(coin.volume24h)}
        </Typography>
      </TableCell>
      <TableCell align="left">
        <Typography
          variant="body1"
          sx={{ color: AppColors.TXT_MAIN, lineHeight: 1 }}
        >
          {formattedPrice}
        </Typography>
        <Typography variant="caption" sx={{ color: AppColors.TXT_MAIN }}>
          ${formattedPrice}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            px: 1.25,
            py: 0.25,
            borderRadius: 1,
            background: change < 0 ? AppColors.ERROR : AppColors.SUCCESS,
          }}
        >
          <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN }}>
            {formattedChange}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
});

PriceTableRow.displayName = "PriceTableRow";
const api = createTradeSocket();

const TOP_ROWS_LIMIT = 10;

const SORT_BY = {
  Btc: "BTC-USD",
  Eth: "ETH-USD",
  Sol: "SOL-USD",
  Bnb: "BNB-USD",
  Doge: "DOGE-USD",
  Shib: "SHIB-USD",
  Xrp: "XRP-USD",
  Trx: "TRX-USD",
  Ada: "ADA-USD",
  Pol: "POL-USD",
  Sui: "SUI-USD",
  Near: "NEAR-USD",
  Bch: "BCH-USD",
  Ltc: "LTC-USD",
  Icp: "ICP-USD",
  Link: "LINK-USD",
  Dash: "DASH-USD",
  Rlc: "RLC-USD",
  Etc: "ETC-USD",
  Dot: "DOT-USD",
};

// Pre-computed sort order for known trading pairs to ensure stable, predictable ordering
const SORT_ORDER = Object.values(SORT_BY);
const PAIR_POSITION_MAP = SORT_ORDER.reduce((acc, pair, index) => {
  // Use upper-case keys to be resilient to case differences in incoming data
  acc[pair.toUpperCase()] = index;
  return acc;
}, {});
const DEFAULT_PAIR_POSITION = Number.MAX_SAFE_INTEGER;

const sortByConfiguredPairOrder = (a, b) => {
  const pairA = (a?.pair ?? "").toUpperCase();
  const pairB = (b?.pair ?? "").toUpperCase();

  const posA = PAIR_POSITION_MAP[pairA] ?? DEFAULT_PAIR_POSITION;
  const posB = PAIR_POSITION_MAP[pairB] ?? DEFAULT_PAIR_POSITION;

  if (posA !== posB) {
    return posA - posB;
  }

  // Fallback: alphabetical order for pairs with the same or unknown position
  return pairA.localeCompare(pairB);
};

const LandingPageList = ({
  limit = TOP_ROWS_LIMIT,
  showAll = false,
  searchValue = "",
  activeTab = "",
}) => {
  const { favoritePairs } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [memoizedPrices, setMemoizedPrices] = useState([]);
  const { isConnected, joinPublic } = useTradeSocket();

  const displayPrices = useMemo(() => {
    const prices = memoizedPrices ?? [];
    if (!Array.isArray(prices) || prices.length === 0) return [];

    const normalizedSearch = (searchValue ?? "").trim().toLowerCase();
    const favoriteSet = new Set(favoritePairs ?? []);

    let result = prices;

    // 1. Apply search filter (independent of tab)
    // Match both raw pair (e.g. btc-usd) and display format (e.g. btcusdt) so search works like the UI
    if (normalizedSearch) {
      result = result.filter((p) => {
        const raw = (p?.pair ?? "").toLowerCase();
        const display = formatPairForDisplay(p?.pair ?? "")
          .toLowerCase()
          .replace(/\s/g, "");
        return (
          raw.includes(normalizedSearch) || display.includes(normalizedSearch)
        );
      });
    }

    // 2. Apply tab-specific filters/sorting
    if (activeTab === "Favorites") {
      result = [...result].sort(sortByConfiguredPairOrder);
      result = result.filter((p) => favoriteSet.has(p?.pair));
    } else if (activeTab === "Gainers") {
      result = [...result].sort(
        (a, b) => (b?.changePercent ?? 0) - (a?.changePercent ?? 0),
      );
    } else if (activeTab === "Volume") {
      result = [...result].sort(
        (a, b) => (b?.volume24h ?? 0) - (a?.volume24h ?? 0),
      );
    } else {
      result = [...result].sort(sortByConfiguredPairOrder);
    }

    // 4. Apply limit unless showAll is true
    if (!showAll && typeof limit === "number" && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [memoizedPrices, searchValue, activeTab, favoritePairs, showAll, limit]);

  useEffect(() => {
    const tradeChagne = async () => {
      joinPublic();
      await api.pairPrices((prices) => {
        setMemoizedPrices(
          prices?.map((price) => ({
            ...price,
            changePercent:
              price?.open24h > 0
                ? ((price?.price - price?.open24h) / price?.open24h) * 100
                : 0,
          })) || [],
        );
      });
    };
    if (isConnected) {
      tradeChagne();
    }
  }, [isConnected]);

  return (
    <Table
      size="small"
      sx={{
        width: "100%",
        px: 0.5,
        bgcolor: AppColors.BG_MAIN,
        "& .MuiTableCell-root": {
          borderBottom: `none`,
          padding: "10px 8px",
        },
        "& .MuiTableCell-head": {
          pb: 0,
        },
        "& .MuiTableRow-root": {
          willChange: "background-color",
        },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("landing.marketTable.tradingPairs", "Trading Pairs")}
            </Typography>
          </TableCell>
          <TableCell align="left">
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("landing.marketTable.lastPrice", "Last Price")}
            </Typography>
          </TableCell>
          <TableCell align="right" sx={{ width: "7em" }}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("landing.marketTable.change24h", "24H Change")}
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {memoizedPrices?.length === 0 ? (
          <TableRow sx={{ "& .MuiTableCell-root": { borderBottom: "none" } }}>
            <TableCell
              colSpan={3}
              align="center"
              sx={{ py: 4, color: AppColors.TXT_SUB }}
            >
              <BTLoader />
            </TableCell>
          </TableRow>
        ) : displayPrices?.length === 0 ? (
          <TableRow sx={{ "& .MuiTableCell-root": { borderBottom: "none" } }}>
            <TableCell
              colSpan={3}
              align="center"
              sx={{ py: 4, color: AppColors.TXT_SUB }}
            >
              {t("landing.marketTable.noResults", "No results found")}
            </TableCell>
          </TableRow>
        ) : (
          displayPrices?.map((coin) => (
            <PriceTableRow
              key={coin.pair}
              coin={coin}
              onRowClick={() =>
                navigate("/trade", { state: { selectedPair: coin.pair } })
              }
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default memo(LandingPageList);